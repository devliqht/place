import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { getVerificationEmailTemplate } from '../utils/emailTemplates.js';

let transporter: Transporter | null = null;

export function initializeEmailService() {
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  // const emailFrom = process.env.EMAIL_FROM || emailUser;

  if (!emailUser || !emailPass) {
    console.error(
      'Email service not configured: EMAIL_USER and EMAIL_PASS environment variables are required'
    );
    return false;
  }

  try {
    transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    console.log('Email service initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize email service:', error);
    return false;
  }
}

export async function sendVerificationEmail(
  email: string,
  verificationToken: string
): Promise<boolean> {
  if (!transporter) {
    console.error('Email service not initialized');
    return false;
  }

  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
  const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  const emailTemplate = getVerificationEmailTemplate({
    verificationUrl,
    userEmail: email,
  });

  try {
    await transporter.sendMail({
      from: `"DCISM place" <${emailFrom}>`,
      to: email,
      subject: 'Verify your USC email for DCISM place',
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send verification email to ${email}:`, error);
    return false;
  }
}

export async function testEmailConnection(): Promise<boolean> {
  if (!transporter) {
    return false;
  }

  try {
    await transporter.verify();
    console.log('Email server connection verified');
    return true;
  } catch (error) {
    console.error('Email server connection failed:', error);
    return false;
  }
}
