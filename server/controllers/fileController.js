const cloudinary = require("../config/cloudinary");
const transporter = require("../config/otp");
const File = require("../models/File");

// ── Helper ───────────────────────────────────────────────

// Generate a 6-character code following pattern: 2 numbers + 1 small letter + 2 numbers + 1 small letter (e.g. 12a34b)
const generateCode = () => {
  const digits = "0123456789";
  const letters = "abcdefghijklmnopqrstuvwxyz";

  const d1 = digits[Math.floor(Math.random() * digits.length)];
  const d2 = digits[Math.floor(Math.random() * digits.length)];
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const d3 = digits[Math.floor(Math.random() * digits.length)];
  const d4 = digits[Math.floor(Math.random() * digits.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];

  return `${d1}${d2}${l1}${d3}${d4}${l2}`;
};

// ── Controllers ─────────────────────────────────────────

// GET all files
const getAllFiles = async (req, res) => {
  try {
    const files = await File.find().sort({ uploadedAt: -1 });
    res.json({ success: true, files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch files" });
  }
};

// GET file by ID
const getFileById = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }
    res.json({ success: true, file });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch file" });
  }
};

// POST /api/upload — Upload file + email the access code
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    if (!req.body.email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // 1️⃣ Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto",
    });

    // 2️⃣ Generate access code + 3-hour expiry
    const code = generateCode();
    const expiryTime = new Date(Date.now() + 3 * 60 * 60 * 1000);

    // 3️⃣ Save file record to MongoDB
    const newFile = await File.create({
      fileName: req.file.originalname,
      fileUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      size: req.file.size,
      type: req.file.mimetype,
      email: req.body.email,
      code,
      expiryTime,
    });

    // 4️⃣ Send access code to recipient's email in the background (non-blocking)
    const senderMessage = req.body.message ? req.body.message.trim() : "";
    const senderFrom = process.env.EMAIL_USER
      ? `"FYLFLY" <${process.env.EMAIL_USER.trim()}>`
      : undefined;

    transporter.sendMail({
      from: senderFrom,
      to: req.body.email,
      subject: "Your File Access Code — FYLFLY",
      text: `Your file access code is: FYL-${code}\n\n${senderMessage ? `Your friend's message:\n"${senderMessage}"\n\n` : ""}Enter this code on the Retrieve page to download your file.\nThe code is valid for 3 hours (until ${expiryTime.toLocaleTimeString()}).`,
      html: `
        <p>Greetings..,</p>
        <p>A file has been shared by your friend with you, via <strong>FYLFLY</strong>.</p>
        ${senderMessage ? `
        <div style="margin: 16px 0; padding: 12px 16px; border-left: 4px solid #6c63ff; background: #f5f4ff; border-radius: 4px;">
          <p style="margin: 0; font-style: italic; color: #444;">“${senderMessage}”</p>
        </div>` : ""}
        <p>Your access code is:</p>
        <h2 style="letter-spacing: 8px; font-size: 32px; color: #4a4af4;">FYL-${code}</h2>
        <p>Enter this code on the <strong>Retrieve</strong> page to download your file.</p>
        <p><em>Valid until <strong>${expiryTime.toLocaleTimeString()}</strong> (3 hours).</em></p>
      `,
    }).then(() => {
      console.log(`✉  Access code email sent successfully to ${req.body.email}`);
    }).catch((mailErr) => {
      console.error("  Mailer failed to send access code:", mailErr.message);
      console.log(`💡  Generated code for fallback retrieval: FYL-${code}`);
    });

    // 5️⃣ Return code + expiry to frontend immediately
    res.status(201).json({
      success: true,
      message: "File uploaded & access code sent",
      code: newFile.code,
      expiryTime: newFile.expiryTime,
    });

  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
};

// POST /api/retrieve — Retrieve file using the access code
const retrieveFile = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: "Access code is required" });
    }

    // Strip "FYL", hyphens, spaces if user passed it (e.g. FYL-1234AB, fyl-1234ab, FYL 1234AB)
    const cleanCode = code.trim().replace(/^FYL[-_\s]*/i, "");

    // Case-insensitive exact match
    const escapedCode = cleanCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const file = await File.findOne({
      code: { $regex: new RegExp(`^${escapedCode}$`, "i") },
    });

    if (!file) {
      return res.status(404).json({ success: false, message: "Invalid code — no file found" });
    }

    if (new Date() > new Date(file.expiryTime)) {
      return res.status(410).json({ success: false, message: "This file has expired and is no longer available" });
    }

    res.json({
      success: true,
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      expiryTime: file.expiryTime,
      size: file.size,
      type: file.type,
    });

  } catch (err) {
    console.error("Retrieve Error:", err);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// DELETE file
const deleteFile = async (req, res) => {
  try {
    const file = await File.findByIdAndDelete(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }
    if (file.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(file.cloudinaryPublicId);
    }
    res.json({ success: true, message: "File deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};

// GET /api/email-diag — Verify email configuration and SMTP connection
const emailDiagnostics = async (req, res) => {
  const nodemailer = require("nodemailer");
  const emailUser = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : null;
  const rawPass = process.env.EMAIL_PASS || null;
  const cleanedPass = rawPass ? rawPass.replace(/\s+/g, "") : null;
  const brevoKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : null;
  const resendKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : null;

  const result = {
    brevoConfigured: !!brevoKey,
    resendConfigured: !!resendKey,
    envEmailUserPresent: !!emailUser,
    envEmailUserMasked: emailUser ? emailUser.replace(/(?<=.).(?=[^@]*?@)/g, '*') : null,
    envEmailPassPresent: !!rawPass,
    envEmailPassLength: cleanedPass ? cleanedPass.length : 0,
    hasSpacesInRawPass: rawPass ? /\s/.test(rawPass) : false,
    environment: process.env.NODE_ENV || 'development',
    renderSmtpNote: "Render Free Tier blocks outbound SMTP ports 25, 465, and 587. If using Render Free, configure BREVO_API_KEY for guaranteed email delivery over Port 443.",
  };

  // If Brevo is configured, test Brevo
  if (brevoKey) {
    result.activeProvider = "Brevo HTTP API (Port 443 HTTPS)";
    if (req.query.sendTo) {
      try {
        const sendRes = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "api-key": brevoKey,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            sender: { name: "FYLFLY Diagnostic", email: emailUser || "noreply@fylfly.com" },
            to: [{ email: req.query.sendTo }],
            subject: "FYLFLY Brevo Diagnostic Test",
            textContent: "If you received this message, Brevo HTTP API is working on Render!",
          }),
        });
        const sendData = await sendRes.json();
        result.testEmailSent = sendRes.ok;
        result.brevoResponse = sendData;
      } catch (err) {
        result.testEmailSent = false;
        result.brevoError = err.message;
      }
    }
    result.status = "ok";
    return res.status(200).json(result);
  }

  if (!emailUser || !cleanedPass) {
    result.status = "error";
    result.message = "No email provider configured. Please add BREVO_API_KEY (recommended for Render Free) or EMAIL_USER & EMAIL_PASS in Render Dashboard -> Environment.";
    return res.status(200).json(result);
  }

  try {
    const testTransporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: cleanedPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await testTransporter.verify();
    result.status = "ok";
    result.message = "Gmail SMTP connection and credentials verified successfully!";

    if (req.query.sendTo) {
      const info = await testTransporter.sendMail({
        from: `"FYLFLY Diagnostic" <${emailUser}>`,
        to: req.query.sendTo,
        subject: "FYLFLY Email Diagnostic Test",
        text: "If you received this message, Gmail SMTP is working properly from your deployed backend!",
      });
      result.testEmailSent = true;
      result.messageId = info.messageId;
    }

    return res.status(200).json(result);
  } catch (err) {
    result.status = "smtp_error";
    result.message = `Gmail SMTP verification failed: ${err.message}`;
    result.code = err.code;
    return res.status(200).json(result);
  }
};

module.exports = {
  getAllFiles,
  getFileById,
  uploadFile,
  retrieveFile,
  deleteFile,
  emailDiagnostics,
};
