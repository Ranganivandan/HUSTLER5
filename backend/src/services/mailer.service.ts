// Mailer service stub - replace with actual provider integration (e.g., nodemailer, Resend, SES)
export interface SendEmailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export async function sendEmail(_params: SendEmailParams) {
  // TODO: implement
  // For now, just log
  // eslint-disable-next-line no-console
  console.log('sendEmail stub called');
}
