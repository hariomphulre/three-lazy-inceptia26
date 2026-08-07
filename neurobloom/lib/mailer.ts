// lib/mailer.ts
// Nodemailer transporter — configure via environment variables.
// Add to .env:
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=587
//   SMTP_USER=your@gmail.com
//   SMTP_PASS=your-app-password  (Gmail: use an App Password, not your main password)

import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/** Send a professional HTML referral invitation email to a student/parent. */
export async function sendReferralEmail({
  to,
  studentName,
  teacherName,
  assessmentType,
  referralLink,
}: {
  to: string;
  studentName: string;
  teacherName: string;
  assessmentType: string;
  referralLink: string;
}) {
  const assessmentLabel =
    assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>NeuroBloom Assessment Invitation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f0f4ff; font-family: 'Segoe UI', Arial, sans-serif; color: #111; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border: 3px solid #000; box-shadow: 8px 8px 0 #000; }
    .header { background: #5C94FC; padding: 40px 40px 32px; border-bottom: 3px solid #000; }
    .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .logo-icon { width: 48px; height: 48px; background: #fff; border: 2px solid #000; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 3px 3px 0 #000; }
    .logo-text { font-size: 22px; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 2px; }
    .header h1 { font-size: 28px; font-weight: 900; color: #fff; text-transform: uppercase; line-height: 1.2; }
    .header p { color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .body { padding: 40px; }
    .greeting { font-size: 16px; font-weight: 700; margin-bottom: 20px; }
    .info-box { border: 2px solid #000; padding: 20px; background: #f8f9ff; box-shadow: 4px 4px 0 #000; margin: 24px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; font-size: 13px; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #555; }
    .info-value { font-weight: 700; }
    .badge { display: inline-block; background: #5C94FC; color: #fff; padding: 4px 12px; border: 2px solid #000; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; box-shadow: 2px 2px 0 #000; }
    .cta-section { text-align: center; margin: 32px 0; }
    .cta-btn { display: inline-block; background: #5C94FC; color: #fff !important; font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; padding: 18px 40px; border: 3px solid #000; text-decoration: none; box-shadow: 6px 6px 0 #000; }
    .cta-note { font-size: 11px; color: #888; margin-top: 12px; font-weight: 700; text-transform: uppercase; }
    .steps { margin: 24px 0; }
    .step { display: flex; gap: 14px; padding: 12px 0; border-bottom: 1px solid #eee; }
    .step:last-child { border-bottom: none; }
    .step-num { width: 28px; height: 28px; background: #000; color: #fff; font-weight: 900; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .step-text { font-size: 13px; font-weight: 600; padding-top: 4px; }
    .footer { background: #f0f0f0; border-top: 3px solid #000; padding: 24px 40px; text-align: center; }
    .footer p { font-size: 11px; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .expires { background: #fff3cd; border: 2px solid #000; padding: 12px 16px; margin-top: 24px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">🧠</div>
        <span class="logo-text">NeuroBloom</span>
      </div>
      <h1>Assessment Invitation</h1>
      <p>Cognitive Diagnostic Platform</p>
    </div>

    <div class="body">
      <p class="greeting">Dear Parent / Guardian of <strong>${studentName}</strong>,</p>
      <p style="font-size:14px; line-height:1.7; margin-top:12px;">
        <strong>${teacherName}</strong> has invited <strong>${studentName}</strong> to complete a cognitive assessment on NeuroBloom. 
        This assessment helps identify learning needs and supports personalised educational planning.
      </p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Student</span>
          <span class="info-value">${studentName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Assigned By</span>
          <span class="info-value">${teacherName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Assessment Type</span>
          <span class="info-value"><span class="badge">${assessmentLabel}</span></span>
        </div>
        <div class="info-row">
          <span class="info-label">Platform</span>
          <span class="info-value">NeuroBloom Cognitive Suite</span>
        </div>
      </div>

      <div class="cta-section">
        <a href="${referralLink}" class="cta-btn">Start Assessment →</a>
        <p class="cta-note">Click the button above to create your account and begin</p>
      </div>

      <div class="steps">
        <p style="font-size:12px; font-weight:900; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; color:#555;">How it works:</p>
        <div class="step">
          <div class="step-num">1</div>
          <p class="step-text">Click the button above — your referral code is pre-applied automatically.</p>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <p class="step-text">Create a free parent account (or log in if you already have one).</p>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <p class="step-text">You'll be taken directly to the assigned assessment to begin.</p>
        </div>
        <div class="step">
          <div class="step-num">4</div>
          <p class="step-text">View results, teacher notes, and track your child's progress from your dashboard.</p>
        </div>
      </div>

      <div class="expires">
        ⏰ This invitation link expires in <strong>30 days</strong>. Please register before then.
      </div>

      <p style="font-size:12px; color:#aaa; margin-top:24px; word-break:break-all;">
        Or copy this link: ${referralLink}
      </p>
    </div>

    <div class="footer">
      <p>© 2026 NeuroBloom &nbsp;•&nbsp; Advanced Cognitive Diagnostics &nbsp;•&nbsp; Secure & Confidential</p>
      <p style="margin-top:6px;">This email was sent on behalf of ${teacherName}. If you believe this is an error, please ignore.</p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"NeuroBloom Platform" <${process.env.SMTP_USER}>`,
    to,
    subject: `📋 Assessment Invitation for ${studentName} — NeuroBloom`,
    html,
  });
}
