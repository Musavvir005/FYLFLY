const nodemailer = require("nodemailer");

// Transporter cache for connection pooling (reuses warm SMTP connections)
const transporterCache = new Map();
let preferredPort = 465;

const getGmailTransporter = (port = 465, secure = true) => {
  const cleanedPass = (process.env.EMAIL_PASS || "").replace(/\s+/g, "");
  const user = (process.env.EMAIL_USER || "").trim();
  const cacheKey = `${user}:${port}:${secure}`;

  if (transporterCache.has(cacheKey)) {
    return transporterCache.get(cacheKey);
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port,
    secure,
    pool: true,              // Reuse existing connection pool for instant sends
    maxConnections: 3,       // Max simultaneous connections
    maxMessages: 100,        // Messages per connection before recycling
    rateDelta: 1000,
    rateLimit: 5,
    auth: {
      user,
      pass: cleanedPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 4000, // 4s fast connect timeout (no hanging)
    greetingTimeout: 4000,   // 4s greeting timeout
    socketTimeout: 7000,     // 7s socket timeout
  });

  transporterCache.set(cacheKey, transporter);
  return transporter;
};

/**
 * Universal email sender that supports:
 * 1. Brevo HTTP API (Port 443 HTTPS — works on Render Free Tier!)
 * 2. Resend HTTP API (Port 443 HTTPS — works on Render Free Tier!)
 * 3. Gmail SMTP (Ports 465 / 587 — pooled for rapid delivery)
 * 4. Ethereal Email (mock test fallback for dev)
 */
const sendMail = async ({ from, to, replyTo, subject, text, html, priority = "high", headers = {} }) => {
  const emailUser = (process.env.EMAIL_USER || "").trim();
  const brevoKey = (process.env.BREVO_API_KEY || "").trim();
  const resendKey = (process.env.RESEND_API_KEY || "").trim();
  const targetEmail = (to || "").trim().toLowerCase();

  // Unified headers indicating urgent transactional delivery to bypass mailbox batching
  const mergedHeaders = {
    "X-Priority": "1 (Highest)",
    "X-MSMail-Priority": "High",
    "Importance": "High",
    "X-Mailer": "FYLFLY Fast File Sharing",
    ...headers,
  };

  // 1️⃣ Priority 1: Brevo HTTP REST API (Bypasses Render free tier SMTP blocks!)
  if (brevoKey) {
    try {
      const senderEmail = emailUser || "noreply@fylfly.com";
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "accept": "application/json",
          "api-key": brevoKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "FYL-FLY", email: senderEmail },
          to: [{ email: targetEmail }],
          replyTo: replyTo ? { email: replyTo, name: "FYL-FLY" } : undefined,
          subject,
          textContent: text,
          htmlContent: html,
          headers: mergedHeaders,
        }),
      });
      clearTimeout(timer);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || JSON.stringify(data));
      }

      console.log(`✉  Access code email sent successfully via Brevo API to ${targetEmail} (MessageId: ${data.messageId})`);
      return { messageId: data.messageId };
    } catch (brevoErr) {
      console.error(`❌ Brevo API email failed:`, brevoErr.message);
      if (process.env.NODE_ENV === "production") {
        throw brevoErr;
      }
    }
  }

  // 2️⃣ Priority 2: Resend HTTP REST API (Port 443 HTTPS)
  if (resendKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "FYLFLY <onboarding@resend.dev>",
          to: [targetEmail],
          subject,
          text,
          html,
          headers: mergedHeaders,
        }),
      });
      clearTimeout(timer);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || JSON.stringify(data));
      }

      console.log(`✉  Access code email sent successfully via Resend API to ${targetEmail}`);
      return { messageId: data.id };
    } catch (resendErr) {
      console.error(`❌ Resend API email failed:`, resendErr.message);
      if (process.env.NODE_ENV === "production") {
        throw resendErr;
      }
    }
  }

  // 3️⃣ Priority 3: Gmail SMTP (Ports 465 / 587 with Connection Pooling)
  const emailPass = (process.env.EMAIL_PASS || "").replace(/\s+/g, "");
  if (emailUser && emailPass) {
    const sender = from || `"FYL-FLY" <${emailUser}>`;
    const mailPayload = {
      from: sender,
      to: targetEmail,
      replyTo,
      subject,
      text,
      html,
      priority,
      headers: mergedHeaders,
    };

    // Use preferred port first to avoid unnecessary retry latency
    const primaryPort = preferredPort === 587 ? 587 : 465;
    const primarySecure = primaryPort === 465;
    const fallbackPort = primaryPort === 465 ? 587 : 465;
    const fallbackSecure = fallbackPort === 465;

    try {
      const transporterPrimary = getGmailTransporter(primaryPort, primarySecure);
      const info = await transporterPrimary.sendMail(mailPayload);
      preferredPort = primaryPort;
      console.log(`✉  Access code email sent successfully via Gmail (port ${primaryPort}) to ${targetEmail}`);
      return info;
    } catch (primaryErr) {
      console.warn(`⚠  Gmail port ${primaryPort} failed (${primaryErr.message}). Retrying on port ${fallbackPort}...`);

      try {
        const transporterFallback = getGmailTransporter(fallbackPort, fallbackSecure);
        const info = await transporterFallback.sendMail(mailPayload);
        preferredPort = fallbackPort; // Remember working port
        console.log(`✉  Access code email sent successfully via Gmail (port ${fallbackPort}) to ${targetEmail}`);
        return info;
      } catch (fallbackErr) {
        console.error(`❌ Gmail SMTP sending failed on ports ${primaryPort} and ${fallbackPort}:`, fallbackErr.message);
        if (process.env.NODE_ENV === "production") {
          throw new Error(`Gmail sending failed: ${fallbackErr.message} (Note: Render Free Tier blocks SMTP ports 25, 465, 587. Use BREVO_API_KEY instead.)`);
        }
      }
    }
  } else {
    console.warn(`\n⚠  No email provider configured! (Set BREVO_API_KEY or EMAIL_USER/EMAIL_PASS)`);
    if (process.env.NODE_ENV === "production") {
      throw new Error("No email provider configured on production server.");
    }
  }

  // 2️⃣ Fallback: Only for local development when credentials aren't set
  try {
    console.log(`ℹ  Using Ethereal Mail development fallback...`);
    const testAccount = await nodemailer.createTestAccount();
    const etherealTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await etherealTransporter.sendMail({
      from: `"FYLFLY (Test)" <${testAccount.user}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`✉  Access code email sent successfully via Ethereal fallback to ${to}`);
    console.log(`🔗  View Ethereal test email here: ${nodemailer.getTestMessageUrl(info)}\n`);
    return info;
  } catch (fallbackErr) {
    console.error("❌ Ethereal mailer fallback failed:", fallbackErr.message);
    throw fallbackErr;
  }
};

module.exports = {
  sendMail,
};
