const nodemailer = require("nodemailer");

const createGmailTransporter = (port = 465, secure = true) => {
  const cleanedPass = (process.env.EMAIL_PASS || "").replace(/\s+/g, "");
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port,
    secure,
    auth: {
      user: (process.env.EMAIL_USER || "").trim(),
      pass: cleanedPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Universal email sender that supports:
 * 1. Brevo HTTP API (Port 443 HTTPS — works on Render Free Tier!)
 * 2. Resend HTTP API (Port 443 HTTPS — works on Render Free Tier!)
 * 3. Gmail SMTP (Ports 465 / 587 — for local dev or paid hosting)
 * 4. Ethereal Email (mock test fallback for dev)
 */
const sendMail = async ({ from, to, replyTo, subject, text, html }) => {
  const emailUser = (process.env.EMAIL_USER || "").trim();
  const brevoKey = (process.env.BREVO_API_KEY || "").trim();
  const resendKey = (process.env.RESEND_API_KEY || "").trim();

  // 1️⃣ Priority 1: Brevo HTTP REST API (Bypasses Render free tier SMTP blocks!)
  if (brevoKey) {
    try {
      const senderEmail = emailUser || "noreply@fylfly.com";
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": brevoKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "FYL-FLY", email: senderEmail },
          to: [{ email: to }],
          replyTo: replyTo ? { email: replyTo, name: "FYL-FLY" } : undefined,
          subject,
          textContent: text,
          htmlContent: html,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || JSON.stringify(data));
      }

      console.log(`✉  Access code email sent successfully via Brevo API to ${to} (MessageId: ${data.messageId})`);
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
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "FYLFLY <onboarding@resend.dev>",
          to: [to],
          subject,
          text,
          html,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || JSON.stringify(data));
      }

      console.log(`✉  Access code email sent successfully via Resend API to ${to}`);
      return { messageId: data.id };
    } catch (resendErr) {
      console.error(`❌ Resend API email failed:`, resendErr.message);
      if (process.env.NODE_ENV === "production") {
        throw resendErr;
      }
    }
  }

  // 3️⃣ Priority 3: Gmail SMTP (Ports 465 / 587)
  const emailPass = (process.env.EMAIL_PASS || "").replace(/\s+/g, "");
  if (emailUser && emailPass) {
    const sender = from || `"FYL-FLY" <${emailUser}>`;

    // Attempt 1: Port 465 (SSL)
    try {
      const transporter465 = createGmailTransporter(465, true);
      const info = await transporter465.sendMail({
        from: sender,
        to,
        replyTo,
        subject,
        text,
        html,
      });
      console.log(`✉  Access code email sent successfully via Gmail (port 465) to ${to}`);
      return info;
    } catch (err465) {
      console.warn(`⚠  Gmail port 465 failed (${err465.message}). Retrying on port 587...`);

      // Attempt 2: Port 587 (TLS)
      try {
        const transporter587 = createGmailTransporter(587, false);
        const info = await transporter587.sendMail({
          from: sender,
          to,
          replyTo,
          subject,
          text,
          html,
        });
        console.log(`✉  Access code email sent successfully via Gmail (port 587) to ${to}`);
        return info;
      } catch (err587) {
        console.error(`❌ Gmail SMTP sending failed on both ports 465 and 587:`, err587.message);
        if (process.env.NODE_ENV === "production") {
          throw new Error(`Gmail sending failed: ${err587.message} (Note: Render Free Tier blocks SMTP ports 25, 465, 587. Use BREVO_API_KEY instead.)`);
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
