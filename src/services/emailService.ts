import nodemailer from "nodemailer";
import { EmailLog as EmailLogModel } from "../database/models";

// Helper to generate IDs for logging
const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substring(2, 11)}`;

// Verify SMTP environment configuration on startup
export function verifySMTPSetup() {
  const host = process.env.SMTP_HOST;
  const portStr = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  const missing: string[] = [];
  if (!host) missing.push("SMTP_HOST");
  if (!portStr) missing.push("SMTP_PORT");
  if (!user) missing.push("SMTP_USER");
  if (!pass) missing.push("SMTP_PASS");
  if (!from) missing.push("SMTP_FROM");

  if (missing.length > 0) {
    throw new Error(
      `CRITICAL: Missing required SMTP environment variables for production email service: ${missing.join(", ")}. Please configure them in your environment or Secrets panel.`
    );
  }

  const port = parseInt(portStr!, 10);
  if (isNaN(port)) {
    throw new Error(
      `CRITICAL: Invalid SMTP_PORT environment variable: "${portStr}". Must be a valid number (e.g., 587 or 465).`
    );
  }

  return { host, port, user, pass, from };
}

// Lazy initialization of Nodemailer Transporter
let transporter: nodemailer.Transporter | null = null;

export function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const config = verifySMTPSetup();
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465, // True for 465, false for other ports (like 587)
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }
  return transporter;
}

// Base send email function
export async function sendEmail({
  recipientEmail,
  recipientName,
  subject,
  htmlContent,
  textContent,
  type,
}: {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  type: "status_change" | "notice";
}) {
  const emailId = generateId("em");
  const sentAt = new Date().toISOString();
  let status: "Success" | "Failed" = "Success";
  let errorMessage: string | undefined = undefined;

  try {
    const config = verifySMTPSetup();
    const mailTransporter = getTransporter();

    await mailTransporter.sendMail({
      from: `"${config.from}" <${config.user}>`,
      to: `"${recipientName}" <${recipientEmail}>`,
      subject: subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`Email successfully sent to ${recipientEmail} with subject: "${subject}"`);
  } catch (error: any) {
    status = "Failed";
    errorMessage = error.message || String(error);
    console.error(`Email delivery failed to ${recipientEmail}:`, errorMessage);
    // Email sending must never crash the application.
    // If email delivery fails: Log the error, continue the request, and return normal API response.
  }

  // Preserve existing EmailLog collection and log every email attempt
  try {
    await EmailLogModel.create({
      id: emailId,
      recipientEmail,
      recipientName,
      subject,
      body: textContent, // Store text-based body for compatibility with existing views
      sentAt,
      type,
      status,
      errorMessage,
    });
  } catch (logError) {
    console.error("Failed to log email in database:", logError);
  }
}

// Beautiful template for Complaint Status Updates
export function getComplaintStatusTemplate({
  residentName,
  complaintId,
  category,
  status,
  priority,
  adminNote,
  timestamp,
  description,
}: {
  residentName: string;
  complaintId: string;
  category: string;
  status: string;
  priority: string;
  adminNote?: string;
  timestamp: string;
  description: string;
}): string {
  const statusColors: Record<string, string> = {
    Open: "#ef4444",        // red
    "In Progress": "#f59e0b", // amber
    Resolved: "#10b981",    // emerald
  };
  const statusColor = statusColors[status] || "#3b82f6";

  const priorityColors: Record<string, string> = {
    High: "#ef4444",
    Medium: "#f59e0b",
    Low: "#3b82f6",
  };
  const priorityColor = priorityColors[priority] || "#64748b";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complaint Status Update</title>
  <style>
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 2px solid #0f172a;
      box-shadow: 4px 4px 0px 0px #0f172a;
      border-radius: 4px;
      overflow: hidden;
    }
    .header {
      background-color: #0f172a;
      color: #ffffff;
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 20px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 800;
    }
    .content {
      padding: 30px;
    }
    .greeting {
      font-size: 16px;
      font-weight: bold;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .status-card {
      background-color: #f1f5f9;
      border-left: 6px solid ${statusColor};
      padding: 20px;
      margin-bottom: 24px;
      border-radius: 4px;
    }
    .status-grid {
      display: table;
      width: 100%;
      margin-top: 15px;
    }
    .status-row {
      display: table-row;
    }
    .status-label {
      display: table-cell;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 11px;
      color: #64748b;
      padding-bottom: 10px;
      width: 35%;
    }
    .status-value {
      display: table-cell;
      font-size: 14px;
      font-weight: 700;
      padding-bottom: 10px;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      border-radius: 3px;
      color: #ffffff;
    }
    .badge-status {
      background-color: ${statusColor};
    }
    .badge-priority {
      background-color: ${priorityColor};
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    .text-block {
      font-size: 14px;
      line-height: 1.6;
      background-color: #fafafa;
      border: 1px dashed #cbd5e1;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .admin-note-block {
      font-size: 14px;
      line-height: 1.6;
      background-color: #fffbeb;
      border: 1px solid #fde68a;
      padding: 15px;
      border-radius: 4px;
      color: #78350f;
      margin-bottom: 20px;
    }
    .footer {
      background-color: #f1f5f9;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Complaint Update</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${residentName},</p>
      <p>Your maintenance complaint status has been updated. Please find the current ticket status details below:</p>
      
      <div class="status-card">
        <div style="font-size: 18px; font-weight: 800; color: #0f172a;">
          Complaint #${complaintId}
        </div>
        <div class="status-grid">
          <div class="status-row">
            <span class="status-label">Category</span>
            <span class="status-value">${category}</span>
          </div>
          <div class="status-row">
            <span class="status-label">Status</span>
            <span class="status-value">
              <span class="badge badge-status">${status}</span>
            </span>
          </div>
          <div class="status-row">
            <span class="status-label">Priority</span>
            <span class="status-value">
              <span class="badge badge-priority">${priority}</span>
            </span>
          </div>
          <div class="status-row">
            <span class="status-label">Last Updated</span>
            <span class="status-value">${new Date(timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div class="section-title">Description of Concern</div>
      <div class="text-block">
        ${description}
      </div>

      ${adminNote ? `
        <div class="section-title">Admin Update Note</div>
        <div class="admin-note-block">
          <strong>Message from Helpdesk:</strong><br/>
          ${adminNote}
        </div>
      ` : ''}

      <p style="font-size: 14px; margin-top: 30px;">
        You can view full status updates and tracking logs at any time on the Society Portal.
      </p>
    </div>
    <div class="footer">
      <p>This is an automated message from the Society Management Committee.</p>
      <p>&copy; 2026 Society Maintenance Helpdesk. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Beautiful template for Important notices posted by Admin
export function getImportantNoticeTemplate({
  title,
  content,
  postedBy,
  timestamp,
}: {
  title: string;
  content: string;
  postedBy: string;
  timestamp: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Urgent Society Notice</title>
  <style>
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 3px solid #ef4444; /* Alert red border */
      box-shadow: 4px 4px 0px 0px #ef4444;
      border-radius: 4px;
      overflow: hidden;
    }
    .header {
      background-color: #ef4444;
      color: #ffffff;
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 20px;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 900;
    }
    .content {
      padding: 30px;
    }
    .notice-card {
      background-color: #fff5f5;
      border: 1px solid #fee2e2;
      padding: 20px;
      margin-bottom: 24px;
      border-radius: 4px;
    }
    .notice-meta {
      font-size: 12px;
      color: #dc2626;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 15px;
      letter-spacing: 0.5px;
    }
    .notice-title {
      font-size: 18px;
      font-weight: 800;
      color: #991b1b;
      margin: 0 0 15px 0;
      line-height: 1.4;
    }
    .notice-content {
      font-size: 14px;
      line-height: 1.6;
      color: #1f2937;
      background-color: #ffffff;
      border: 1px solid #f3f4f6;
      padding: 20px;
      border-radius: 4px;
      white-space: pre-line;
    }
    .footer {
      background-color: #f1f5f9;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Urgent Notice Board Update</h1>
    </div>
    <div class="content">
      <p style="font-size: 15px; margin-top: 0; font-weight: bold;">Dear Resident,</p>
      <p>A new critical notice has been pinned on the Society Notice Board by the management committee. Please read carefully:</p>
      
      <div class="notice-card">
        <div class="notice-meta">
          🚨 Critical Announcement &bull; ${new Date(timestamp).toLocaleDateString()}
        </div>
        <h2 class="notice-title">${title}</h2>
        <div class="notice-content">
          ${content}
        </div>
        <div style="margin-top: 15px; font-size: 12px; color: #4b5563; text-align: right;">
          <strong>Posted By:</strong> ${postedBy}
        </div>
      </div>

      <p style="font-size: 14px;">
        You can log in to the Society Maintenance Portal to view comments or join discussions regarding this announcement.
      </p>
    </div>
    <div class="footer">
      <p>This is a high-priority broadcast sent to all residents of the society.</p>
      <p>&copy; 2026 Society Management Committee. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}
