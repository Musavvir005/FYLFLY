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
 * Robust email sender that attempts Gmail (port 465 SSL, then port 587 TLS),
 * and falls back to Ethereal Email only in development if Gmail is unconfigured.
 */
const sendMail = async ({ from, to, subject, text, html }) => {
  const emailUser = (process.env.EMAIL_USER || "").trim();
  const emailPass = (process.env.EMAIL_PASS || "").replace(/\s+/g, "");

  // 1️⃣ Attempt Gmail if credentials are provided
  if (emailUser && emailPass) {
    const sender = from || `"FYLFLY" <${emailUser}>`;

    // Attempt 1: Port 465 (SSL)
    try {
      const transporter465 = createGmailTransporter(465, true);
      const info = await transporter465.sendMail({
        from: sender,
        to,
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
          subject,
          text,
          html,
        });
        console.log(`✉  Access code email sent successfully via Gmail (port 587) to ${to}`);
        return info;
      } catch (err587) {
        console.error(`❌ Gmail SMTP sending failed on both ports 465 and 587:`, err587.message);
        if (process.env.NODE_ENV === "production") {
          throw new Error(`Gmail sending failed: ${err587.message}`);
        }
      }
    }
  } else {
    console.warn(`\n⚠  EMAIL_USER or EMAIL_PASS is missing in environment variables!`);
    if (process.env.NODE_ENV === "production") {
      throw new Error("EMAIL_USER or EMAIL_PASS environment variable is not configured on the production server.");
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