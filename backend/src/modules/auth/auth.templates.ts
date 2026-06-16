const baseHead = (title: string): string => `
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
`;

const baseLayout = (title: string, body: string): string => `<!DOCTYPE html>
<html>
  ${baseHead(title)}
  <body style="margin:0;padding:0;background:#000;font-family:Arial,sans-serif;">
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px;">
      <div style="background:#111;border-radius:16px;border:1px solid #222;padding:48px 40px;max-width:480px;width:100%;text-align:center;">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#ffafcc;">MovieCrush</h1>
        ${body}
      </div>
    </div>
  </body>
</html>`;

// Email verification result pages

export const verifySuccessPage = baseLayout('MovieCrush — Email Verified', `
  <div style="font-size:48px;margin:24px 0;">🎬</div>
  <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#00cc66;">Email verified!</h2>
  <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.6;">
    Your account is now active.<br/>You can close this tab and return to the app.
  </p>
`);

export const verifyErrorPage = baseLayout('MovieCrush — Verification Failed', `
  <div style="font-size:48px;margin:24px 0;">❌</div>
  <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#ff4d4d;">Invalid or expired link</h2>
  <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.6;">
    This link is invalid or has already been used.<br/>Please try again.
  </p>
`);

// Reset password pages

export const resetSuccessPage = baseLayout('MovieCrush — Password Updated', `
  <div style="font-size:48px;margin:24px 0;">✅</div>
  <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#00cc66;">Password updated!</h2>
  <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.6;">
    Your password has been changed.<br/>You can close this tab and log in to the app.
  </p>
`);

export const resetPasswordForm = (token: string, errorMessage?: string): string => `<!DOCTYPE html>
<html>
  ${baseHead('MovieCrush — Reset Password')}
  <body style="margin:0;padding:0;background:#000;font-family:Arial,sans-serif;">
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px;">
      <div style="background:#111;border-radius:16px;border:1px solid #222;padding:48px 40px;max-width:480px;width:100%;">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#ffafcc;text-align:center;">MovieCrush</h1>
        <h2 style="margin:24px 0 8px;font-size:20px;font-weight:700;color:#fff;text-align:center;">Create new password</h2>
        <p style="margin:0 0 ${errorMessage ? '16px' : '28px'};font-size:14px;color:rgba(255,255,255,0.5);text-align:center;">
          Min 8 characters, one uppercase, one number
        </p>
        ${errorMessage ? `
        <div style="background:rgba(255,77,77,0.12);border:1px solid rgba(255,77,77,0.4);border-radius:12px;padding:12px 16px;margin-bottom:20px;text-align:center;">
          <p style="margin:0;color:#ff4d4d;font-size:14px;">⚠ ${errorMessage}</p>
        </div>` : ''}
        <form method="POST" action="/api/auth/reset-password/${token}">
          <input type="password" name="password" placeholder="New password" required minlength="8"
            style="width:100%;box-sizing:border-box;background:transparent;border:2px solid #ffd700;border-radius:12px;padding:14px;color:#fff;font-size:16px;margin-bottom:12px;outline:none;"/>
          <input type="password" name="confirmPassword" placeholder="Confirm new password" required minlength="8"
            style="width:100%;box-sizing:border-box;background:transparent;border:2px solid #ffd700;border-radius:12px;padding:14px;color:#fff;font-size:16px;margin-bottom:24px;outline:none;"/>
          <button type="submit"
            style="width:100%;background:linear-gradient(135deg,#ffed4e,#ffd700);color:#000;font-size:16px;font-weight:700;border:none;padding:16px;border-radius:50px;cursor:pointer;letter-spacing:0.5px;">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  </body>
</html>`;