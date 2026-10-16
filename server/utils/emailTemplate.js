/**
 * emailTemplate.js — Clean HTML email template for FYLFLY
 *
 * Anti-spam best practices applied:
 *  - Clean, descriptive subject line (no ALL CAPS, no exclamation marks)
 *  - Proper text/html ratio
 *  - Inline CSS only (no external stylesheets)
 *  - No spammy trigger words
 *  - Includes plain-text alternative
 *  - Valid "from" header
 *  - Footer with app info
 */

// ── Fetch a random joke from a free API ─────────────────────────────────────

const JOKE_APIS = [
  {
    url: "https://official-joke-api.appspot.com/random_joke",
    parse: (data) => ({ setup: data.setup, punchline: data.punchline }),
  },
  {
    url: "https://v2.jokeapi.dev/joke/Programming,Pun,Misc?blacklistFlags=nsfw,racist,sexist&type=twopart",
    parse: (data) => ({ setup: data.setup, punchline: data.delivery }),
  },
];

async function fetchJoke() {
  for (const api of JOKE_APIS) {
    try {
      const res = await fetch(api.url);
      if (!res.ok) continue;
      const data = await res.json();
      const joke = api.parse(data);
      if (joke.setup && joke.punchline) return joke;
    } catch {
      // silently try next
    }
  }

  // Secondary fallback: local give-me-a-joke library if available
  try {
    const giveMeAJoke = require("give-me-a-joke");
    const localJoke = await new Promise((resolve) => {
      giveMeAJoke.getRandomDadJoke((j) => resolve(j));
    });
    if (localJoke) {
      return { setup: "Here is a quick joke for you:", punchline: localJoke };
    }
  } catch {
    // continue to hardcoded fallbacks
  }

  // Hardcoded fallback if all APIs fail
  const fallbacks = [
    { setup: "Why do programmers prefer dark mode?", punchline: "Because light attracts bugs!" },
    { setup: "Why was the JavaScript developer sad?", punchline: "Because he didn't Node how to Express himself." },
    { setup: "What do you call a file that's always on time?", punchline: "A .doc-u-ment!" },
    { setup: "Why did the developer go broke?", punchline: "Because he used up all his cache." },
    { setup: "Why do programmers wear glasses?", punchline: "Because they don't C#!" },
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// ── Build the HTML email ────────────────────────────────────────────────────

function buildEmailHTML({ code, expiryTime, senderMessage, joke, fileName }) {
  const expiryDate = expiryTime ? new Date(expiryTime) : null;
  const expiryStr = expiryDate
    ? expiryDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    : null;

  const expiryLine = expiryStr
    ? `⏳ Expires on <strong style="color:#6b7280;">${expiryStr}</strong> (valid for 24 hours)`
    : `⏳ Valid for 24 hours`;

  const fileSection = fileName
    ? `<tr><td style="padding:0 40px 24px;">
        <div style="background:#f0f4ff;border-radius:12px;padding:14px 20px;display:inline-block;">
          <span style="font-size:16px;margin-right:8px;">📎</span>
          <span style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#4b5563;font-weight:600;">${fileName}</span>
        </div>
      </td></tr>`
    : "";

  const messageSection = senderMessage
    ? `<tr><td style="padding:0 40px 28px;">
        <div style="background:linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%);border-left:4px solid #7c3aed;border-radius:0 12px 12px 0;padding:16px 20px;">
          <p style="margin:0 0 4px;font-family:'Segoe UI',Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#7c3aed;">Message from your friend</p>
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#374151;font-style:italic;line-height:1.6;">"${senderMessage}"</p>
        </div>
      </td></tr>`
    : "";

  const jokeSection = joke
    ? `<tr><td style="padding:0 40px 32px;">
        <div style="background:linear-gradient(135deg,#fef9c3 0%,#fef3c7 100%);border-radius:14px;padding:18px 22px;border:1px solid #fde68a;">
          <p style="margin:0 0 4px;font-family:'Segoe UI',Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#b45309;">😄 Have this meanwhile you wait..</p>
          <p style="margin:0 0 8px;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#78350f;font-weight:600;line-height:1.5;">${joke.setup}</p>
          <p style="margin:0;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#92400e;font-style:italic;line-height:1.5;">— ${joke.punchline}</p>
        </div>
      </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#4338ca 100%);border-radius:20px 20px 0 0;padding:36px 40px 28px;text-align:center;">
              <h1 style="margin:0 0 6px;font-family:'Segoe UI',Arial,sans-serif;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:2px;">FYL<span style="color:#818cf8;">FLY</span></h1>
              <p style="margin:0;font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#c7d2fe;letter-spacing:0.5px;">Secure File Sharing</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

                <!-- Greeting -->
                <tr>
                  <td style="padding:32px 40px 12px;">
                    <p style="margin:0;font-family:'Segoe UI',Arial,sans-serif;font-size:16px;color:#374151;line-height:1.6;">
                      Hey..👋
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 40px 24px;">
                    <p style="margin:0;font-family:'Segoe UI',Arial,sans-serif;font-size:15px;color:#6b7280;line-height:1.7;">
                      <b>Your Macha</b> has just shared a file with you through <strong style="color:#4338ca;">FYL-FLY</strong>. Use the access code below to retrieve and download it — and don't miss the witty joke waiting for you below, because great minds always appreciate a sharp punchline! 🧠😄
                    </p>
                  </td>
                </tr>

                <!-- File name -->
                ${fileSection}

                <!-- Sender message -->
                ${messageSection}

                <!-- ACCESS CODE -->
                <tr>
                  <td style="padding:0 40px 8px;">
                    <p style="margin:0;font-family:'Segoe UI',Arial,sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;text-align:center;">Your Access Code</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 40px 8px;text-align:center;">
                    <div style="display:inline-block;background:linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%);border:2px dashed #818cf8;border-radius:16px;padding:18px 36px;">
                      <span style="font-family:'Courier New',Courier,monospace;font-size:34px;font-weight:900;letter-spacing:6px;color:#3730a3;">FYL-${code}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 40px 28px;text-align:center;">
                    <p style="margin:0;font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#9ca3af;">
                      ${expiryLine}
                    </p>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td style="padding:0 40px 32px;text-align:center;">
                    <a href="https://fyl-fly.vercel.app/" style="display:inline-block;background:linear-gradient(135deg,#4338ca 0%,#6366f1 100%);color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:12px;letter-spacing:0.5px;">
                      Open FYLFLY
                    </a>
                  </td>
                </tr>

                <!-- How to use steps -->
                <tr>
                  <td style="padding:0 40px 28px;">
                    <div style="background:#f9fafb;border-radius:12px;padding:18px 22px;">
                      <p style="margin:0 0 12px;font-family:'Segoe UI',Arial,sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;">How to retrieve your file</p>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding:4px 0;font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#6b7280;line-height:1.6;">
                            <span style="display:inline-block;width:22px;height:22px;background:#e0e7ff;color:#4338ca;font-weight:700;font-size:12px;text-align:center;line-height:22px;border-radius:50%;margin-right:10px;">1</span>
                            Open FYLFLY using the button above
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:4px 0;font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#6b7280;line-height:1.6;">
                            <span style="display:inline-block;width:22px;height:22px;background:#e0e7ff;color:#4338ca;font-weight:700;font-size:12px;text-align:center;line-height:22px;border-radius:50%;margin-right:10px;">2</span>
                            Click <strong>Retrieve</strong> in the navigation
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:4px 0;font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#6b7280;line-height:1.6;">
                            <span style="display:inline-block;width:22px;height:22px;background:#e0e7ff;color:#4338ca;font-weight:700;font-size:12px;text-align:center;line-height:22px;border-radius:50%;margin-right:10px;">3</span>
                            Enter the code <strong style="color:#4338ca;">FYL-${code}</strong> and download
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0 2px;font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#9ca3af;line-height:1.5;border-top:1px dashed #e5e7eb;">
                            💡 <em>If not received in your inbox, please check your spam box or junk folder.</em>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- Joke -->
                ${jokeSection}

              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f9fafb;border-radius:0 0 20px 20px;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 6px;font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#9ca3af;">
                Sent by <strong style="color:#6b7280;">FYLFLY</strong> — Secure, Fast, Private file sharing
              </p>
              <p style="margin:0 0 6px;font-family:'Segoe UI',Arial,sans-serif;font-size:11.5px;color:#9ca3af;">
                Tip: If not received in your inbox, please check your spam box or junk folder.
              </p>
              <p style="margin:0;font-family:'Segoe UI',Arial,sans-serif;font-size:11px;color:#d1d5db;">
                This is an automated notification. You received this because your friend shared a file with you.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Build the plain-text version ────────────────────────────────────────────

function buildEmailText({ code, expiryTime, senderMessage, joke, fileName }) {
  const expiryDate = expiryTime ? new Date(expiryTime) : null;
  const expiryStr = expiryDate
    ? expiryDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    : "24 hours";

  let text = `Hey.. 👋\n\nYour Macha has just shared a file with you through FYLFLY. Use the access code below to retrieve and download it — and don't miss the witty joke waiting for you below, because great minds always appreciate a sharp punchline! 🧠😄\n\n`;

  if (fileName) {
    text += `File: ${fileName}\n\n`;
  }

  if (senderMessage) {
    text += `Message from your friend:\n"${senderMessage}"\n\n`;
  }

  text += `Your Access Code: FYL-${code}\n`;
  text += `Valid until: ${expiryStr} (24 hours)\n\n`;
  text += `How to retrieve your file:\n`;
  text += `1. Open FYLFLY using the button above\n`;
  text += `2. Click "Retrieve" in the navigation\n`;
  text += `3. Enter the code FYL-${code} and download\n\n`;
  text += `💡 Tip: If not received in your inbox, please check your spam box or junk folder.\n\n`;

  if (joke) {
    text += `Have this meanwhile you wait.. 😄\n`;
    text += `${joke.setup}\n`;
    text += `— ${joke.punchline}\n\n`;
  }

  text += `---\nSent by FYLFLY — Secure, Fast, Private file sharing\n`;
  text += `This is an automated notification. You received this because your friend shared a file with you.\n`;

  return text;
}

module.exports = {
  fetchJoke,
  buildEmailHTML,
  buildEmailText,
};
