const RESEND_API_URL = "https://api.resend.com/emails";

function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!emailConfigured()) {
    console.warn("Email is not configured. Skipping email to", to);
    return;
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email provider returned ${response.status}: ${body}`);
  }
}

export async function sendStudentWelcomeEmail(
  email: string,
  studentCode: string
): Promise<void> {
  await sendEmail(
    email,
    "Welcome to TalentBridge",
    `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
      <h2>Welcome to TalentBridge</h2>
      <p>Your TalentBridge student account has been created successfully.</p>
      <p><strong>Student ID:</strong> ${studentCode}</p>
      <p>Your profile is currently <strong>Pending</strong> and will be reviewed by your Training & Placement Officer after you complete your profile.</p>
      <p>You will receive another email when your profile is verified.</p>
      <p>Regards,<br/>TalentBridge Team</p>
    </div>`
  );
}

export async function sendProfileVerificationEmail(
  email: string,
  studentCode: string,
  studentName: string
): Promise<void> {
  await sendEmail(
    email,
    "Your TalentBridge profile has been verified",
    `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
      <h2>Profile Verified</h2>
      <p>Hello ${studentName || "Student"},</p>
      <p>Your TalentBridge profile has been successfully verified by your Training & Placement Officer.</p>
      <p><strong>Student ID:</strong> ${studentCode}</p>
      <p>Your verified profile is now available in your TalentBridge dashboard.</p>
      <p>Regards,<br/>TalentBridge Team</p>
    </div>`
  );
}

export async function sendProfileRejectionEmail(
  email: string,
  studentCode: string,
  studentName: string,
  note: string
): Promise<void> {
  await sendEmail(
    email,
    "Action required on your TalentBridge profile",
    `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
      <h2>Profile Review Update</h2>
      <p>Hello ${studentName || "Student"},</p>
      <p>Your TalentBridge profile needs changes before it can be verified.</p>
      <p><strong>Student ID:</strong> ${studentCode}</p>
      <p><strong>TPO note:</strong> ${note}</p>
      <p>Please update your profile and save the changes. It will return to Pending status for another review.</p>
      <p>Regards,<br/>TalentBridge Team</p>
    </div>`
  );
}
