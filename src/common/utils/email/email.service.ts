import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { LoggerService } from 'src/logger/logger.service';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private logger: LoggerService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // Your email
        pass: process.env.SMTP_PASS, // App password (not regular password!)
      },
    });
  }

  async sendVerificationEmail(
    email: string,
    otp: string,
    name: string,
  ): Promise<void> {
    const mailOptions = {
      from: `"Linkee" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Linkee Account',
      html: this.getVerificationEmailTemplate(otp, name),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Failed to send email to ${email}: ${error.message}`);
      throw error;
    }
  }

  private getVerificationEmailTemplate(otp: string, name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f7fa;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            color: white;
            margin: 0;
            font-size: 32px;
          }
          .content {
            padding: 40px 30px;
          }
          .otp-box {
            background: #f0f9ff;
            border: 2px dashed #3B82F6;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-code {
            font-size: 42px;
            font-weight: bold;
            color: #1e40af;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
          }
          .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background: #3B82F6;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔗 Linkee</h1>
          </div>
          <div class="content">
            <h2>Welcome, ${name}! 👋</h2>
            <p>Thank you for signing up for Linkee. To complete your registration, please verify your email address using the code below:</p>
            
            <div class="otp-box">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Your verification code</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">This code expires in 10 minutes</p>
            </div>

            <p>If you didn't create a Linkee account, you can safely ignore this email.</p>
            
            <p style="margin-top: 30px;">
              <strong>Need help?</strong><br>
              Contact us at <a href="mailto:support@linkee.app">support@linkee.app</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2025 Linkee. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const mailOptions = {
      from: `"Linkee" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to Linkee! 🎉',
      html: `
        <h1>Welcome to Linkee, ${name}!</h1>
        <p>Your account has been successfully verified.</p>
        <p>You can now start creating short links and tracking analytics.</p>
        <a href="${process.env.DASHBOARD_URL}/dashboard">Go to Dashboard</a>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.logger.error(`Failed to send welcome email to ${email}`, error);
    }
  }
}
