import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const FROM_EMAIL = 'MovieCrush <onboarding@resend.dev>';

// Verification email

export const sendVerificationEmail = async (
  email: string,
  username: string,
  token: string
): Promise<void> => {
  const verifyUrl = `${APP_URL}/api/auth/verify/${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: '🎬 Verify your MovieCrush account',
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
        <body style="margin:0;padding:0;background-color:#000000;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 20px;">
            <tr><td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:16px;overflow:hidden;border:1px solid #222222;">
                <tr>
                  <td align="center" style="padding:40px 40px 24px;">
                    <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffafcc;letter-spacing:1px;">MovieCrush</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 40px 32px;">
                    <p style="margin:0 0 12px;font-size:22px;font-weight:700;color:#ffffff;">Welcome, ${username}! 🎬</p>
                    <p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.6;">
                      Thanks for joining MovieCrush! Please verify your email address to activate your account.
                    </p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr><td align="center">
                        <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#ffed4e,#ffd700);color:#000000;font-size:16px;font-weight:700;text-decoration:none;padding:16px 48px;border-radius:50px;letter-spacing:0.5px;">
                          Verify Email Address
                        </a>
                      </td></tr>
                    </table>
                    <p style="margin:28px 0 0;font-size:13px;color:rgba(255,255,255,0.35);text-align:center;line-height:1.6;">
                      This link expires in <strong style="color:rgba(255,255,255,0.55);">24 hours</strong>.<br/>
                      If you didn't create a MovieCrush account, you can ignore this email.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 40px;border-top:1px solid #222222;">
                    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);text-align:center;">© 2025 MovieCrush. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  });
};

// Reset password email

export const sendResetPasswordEmail = async (
  email: string,
  username: string,
  token: string
): Promise<void> => {
  const resetUrl = `${APP_URL}/api/auth/reset-password/${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: '🔐 Reset your MovieCrush password',
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
        <body style="margin:0;padding:0;background-color:#000000;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 20px;">
            <tr><td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:16px;overflow:hidden;border:1px solid #222222;">
                <tr>
                  <td align="center" style="padding:40px 40px 24px;">
                    <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffafcc;letter-spacing:1px;">MovieCrush</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 40px 32px;">
                    <p style="margin:0 0 12px;font-size:22px;font-weight:700;color:#ffffff;">Reset your password 🔐</p>
                    <p style="margin:0 0 8px;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.6;">
                      Hi ${username}, we received a request to reset your password.
                    </p>
                    <p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.6;">
                      Click the button below to create a new password:
                    </p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr><td align="center">
                        <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#ffed4e,#ffd700);color:#000000;font-size:16px;font-weight:700;text-decoration:none;padding:16px 48px;border-radius:50px;letter-spacing:0.5px;">
                          Reset Password
                        </a>
                      </td></tr>
                    </table>
                    <p style="margin:28px 0 0;font-size:13px;color:rgba(255,255,255,0.35);text-align:center;line-height:1.6;">
                      This link expires in <strong style="color:rgba(255,255,255,0.55);">1 hour</strong>.<br/>
                      If you didn't request a password reset, you can ignore this email.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 40px;border-top:1px solid #222222;">
                    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);text-align:center;">© 2025 MovieCrush. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  });
};