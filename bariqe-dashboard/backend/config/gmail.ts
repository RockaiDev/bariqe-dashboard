import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'http://localhost'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

const createMimeMessage = (to: string, subject: string, html: string, from: string) => {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    html,
  ].join('\n');
  return Buffer.from(message).toString('base64url');
};

export const gmailTransporter = {
  sendMail: async (options: { from: any, to: string, subject: string, html: string, text?: string }) => {
    const fromAddress = typeof options.from === 'object'
      ? `${options.from.name} <${options.from.address}>`
      : options.from;

    const raw = createMimeMessage(options.to, options.subject, options.html, fromAddress);

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });

    console.log('✅ Email sent via Gmail API:', res.data.id);
    return { messageId: res.data.id };
  },
  verify: async () => {
    const { token } = await oauth2Client.getAccessToken();
    if (!token) throw new Error('Failed to get access token');
    console.log('✅ Gmail API authentication successful');
    return true;
  }
};

export const testGmailConnection = async () => {
  try {
    await gmailTransporter.verify();
    return true;
  } catch (error) {
    console.error('❌ Gmail API authentication failed:', error);
    return false;
  }
};