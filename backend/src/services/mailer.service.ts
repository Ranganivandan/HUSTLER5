import nodemailer from 'nodemailer';

export interface SendEmailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

// Create transporter (reuse connection)
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  // Check if email is configured
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️  Email not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD in .env');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  console.log('✅ Email transporter configured');
  return transporter;
}

export async function sendEmail(params: SendEmailParams) {
  const transport = getTransporter();

  // If email not configured, just log
  if (!transport) {
    console.log('📧 Email would be sent (not configured):');
    console.log(`To: ${params.to}`);
    console.log(`Subject: ${params.subject}`);
    console.log('---');
    return;
  }

  try {
    const info = await transport.sendMail({
      from: process.env.EMAIL_FROM || `"WorkZen HRMS" <${process.env.EMAIL_USER}>`,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    console.log(`✅ Email sent successfully to ${params.to}`);
    console.log(`Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
}

/**
 * Send employee credentials email
 */
export async function sendEmployeeCredentials(data: {
  to: string;
  name: string;
  email: string;
  password: string;
  role: string;
  department?: string;
}) {
  const subject = 'Welcome to WorkZen HRMS - Your Account Credentials';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .credential-item { margin: 10px 0; }
        .credential-label { font-weight: bold; color: #667eea; }
        .credential-value { background: #f3f4f6; padding: 8px 12px; border-radius: 4px; font-family: monospace; display: inline-block; margin-left: 10px; }
        .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to WorkZen HRMS!</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${data.name}</strong>,</p>
          
          <p>Your account has been created successfully! You can now access the WorkZen HRMS platform.</p>
          
          <div class="credentials">
            <h3>📋 Your Login Credentials</h3>
            <div class="credential-item">
              <span class="credential-label">Email:</span>
              <span class="credential-value">${data.email}</span>
            </div>
            <div class="credential-item">
              <span class="credential-label">Password:</span>
              <span class="credential-value">${data.password}</span>
            </div>
            <div class="credential-item">
              <span class="credential-label">Role:</span>
              <span class="credential-value">${data.role}</span>
            </div>
            ${data.department ? `
            <div class="credential-item">
              <span class="credential-label">Department:</span>
              <span class="credential-value">${data.department}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="warning">
            <strong>⚠️ Important Security Notice:</strong><br>
            Please change your password after your first login for security purposes.
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}" class="button">
              Login to WorkZen
            </a>
          </div>
          
          <p>If you have any questions or need assistance, please contact your HR department.</p>
          
          <p>Best regards,<br><strong>WorkZen HRMS Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} WorkZen HRMS. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Welcome to WorkZen HRMS!

Hi ${data.name},

Your account has been created successfully!

Your Login Credentials:
- Email: ${data.email}
- Password: ${data.password}
- Role: ${data.role}
${data.department ? `- Department: ${data.department}` : ''}

⚠️ Important: Please change your password after your first login.

Login at: ${process.env.FRONTEND_URL || 'http://localhost:8080'}

Best regards,
WorkZen HRMS Team
  `;
  
  await sendEmail({
    to: data.to,
    subject,
    html,
    text,
  });
}
