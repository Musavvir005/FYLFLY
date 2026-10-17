const cloudinary = require("../config/cloudinary");
const transporter = require("../config/otp");
const File = require("../models/File");
const { fetchJoke, buildEmailHTML, buildEmailText } = require("../utils/emailTemplate");

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
    const recipientEmail = (req.body.email || "").trim().toLowerCase();
    if (!recipientEmail) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // 1️⃣ Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto",
    });

    // 2️⃣ Generate access code + 24-hour expiry
    const code = generateCode();
    const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 3️⃣ Save file record to MongoDB
    const newFile = await File.create({
      fileName: req.file.originalname,
      fileUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      size: req.file.size,
      type: req.file.mimetype,
      email: recipientEmail,
      code,
      expiryTime,
    });

    // 4️⃣ Send OTP to recipient's email in the background (non-blocking)
    const senderMessage = req.body.message ? req.body.message.trim() : "";
    const senderFrom = process.env.EMAIL_USER
      ? `"FYL-FLY" <${process.env.EMAIL_USER.trim()}>`
      : undefined;

    // Fetch a joke & build the beautiful spam-safe email (async, non-blocking)
    (async () => {
      try {
        const joke = await fetchJoke();
        const html = buildEmailHTML({
          code,
          expiryTime,
          senderMessage,
          joke,
          fileName: req.file.originalname,
        });
        const text = buildEmailText({
          code,
          expiryTime,
          senderMessage,
          joke,
          fileName: req.file.originalname,
        });

        await transporter.sendMail({
          from: senderFrom,
          to: recipientEmail,
          replyTo: process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : undefined,
          subject: "Your friend shared a file with you via FYLFLY",
          text,
          html,
        });

        console.log(`✉  OTP email sent successfully to ${recipientEmail}`);
      } catch (mailErr) {
        console.error("  Mailer failed to send OTP:", mailErr.message);
        console.log(`💡  Generated OTP for fallback retrieval: FYL-${code}`);
      }
    })();

    // 5️⃣ Return code + expiry to frontend immediately
    res.status(201).json({
      success: true,
      message: "File uploaded & OTP sent",
      code: newFile.code,
      expiryTime: newFile.expiryTime,
    });

  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
};

// POST /api/retrieve — Retrieve file using the OTP
const retrieveFile = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: "OTP is required" });
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
    brevoKeyPrefix: brevoKey ? brevoKey.slice(0, 10) : null,
    brevoKeyValidFormat: brevoKey ? brevoKey.startsWith("xkeysib-") : false,
    resendConfigured: !!resendKey,
    envEmailUserPresent: !!emailUser,
    envEmailUserMasked: emailUser ? emailUser.replace(/(?<=.).(?=[^@]*?@)/g, '*') : null,
    envEmailPassPresent: !!rawPass,
    envEmailPassLength: cleanedPass ? cleanedPass.length : 0,
    hasSpacesInRawPass: rawPass ? /\s/.test(rawPass) : false,
    environment: process.env.NODE_ENV || 'development',
    renderSmtpNote: "Render Free Tier blocks outbound SMTP ports 25, 465, and 587. If using Render Free, configure BREVO_API_KEY for guaranteed email delivery over Port 443.",
  };

  // Diagnostic test via unified sendMail
  if (req.query.sendTo) {
    try {
      const info = await transporter.sendMail({
        to: req.query.sendTo,
        subject: "FYLFLY Live Delivery Test",
        text: "If you received this message, email delivery from your deployed backend is working!",
        html: "<p>If you received this message, email delivery from your deployed backend is working!</p>",
      });
      result.testEmailSent = true;
      result.sendResult = info;
    } catch (err) {
      result.testEmailSent = false;
      result.sendError = err.message;
    }
  }

  // Also check direct Gmail SMTP connectivity on port 465 and 587
  if (emailUser && cleanedPass) {
    result.gmailSmtp = {};
    try {
      const t465 = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: emailUser, pass: cleanedPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
      });
      await t465.verify();
      result.gmailSmtp.port465 = "connected_ok";
    } catch (err465) {
      result.gmailSmtp.port465 = `failed: ${err465.message}`;
    }

    try {
      const t587 = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: { user: emailUser, pass: cleanedPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
      });
      await t587.verify();
      result.gmailSmtp.port587 = "connected_ok";
    } catch (err587) {
      result.gmailSmtp.port587 = `failed: ${err587.message}`;
    }
  }

  result.status = result.testEmailSent ? "sent_ok" : "ready";
  return res.status(200).json(result);
};


module.exports = {
  getAllFiles,
  getFileById,
  uploadFile,
  retrieveFile,
  deleteFile,
  emailDiagnostics,
};
