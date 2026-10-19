import { Resend } from 'resend';
import { env } from '../config/env';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/**
 * Escapes unsafe HTML characters to prevent XSS / HTML injection in transactional emails.
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface NotifyOwnerEmailParams {
  ownerEmail: string;
  ownerName: string;
  itemName: string;
  itemCategory: string;
  finderMessage?: string | null;
  finderContact?: string | null;
  hasPhoneAlert: boolean;
  ownerPhone?: string | null;
}

/**
 * Sends a secure notification email to the owner when an item is found.
 * Also logs a mock SMS alert if the owner has selected email+phone contact method.
 */
export async function sendFoundNotificationEmail(params: NotifyOwnerEmailParams): Promise<boolean> {
  const {
    ownerEmail,
    ownerName,
    itemName,
    itemCategory,
    finderMessage,
    finderContact,
    hasPhoneAlert,
    ownerPhone,
  } = params;

  const escapedOwnerName = escapeHtml(ownerName || 'Valued User');
  const escapedItemName = escapeHtml(itemName);
  const escapedCategory = escapeHtml(itemCategory);
  const escapedMessage = finderMessage ? escapeHtml(finderMessage) : '<em>No message provided by finder.</em>';
  const escapedContact = finderContact ? escapeHtml(finderContact) : null;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your item was found!</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7FAFC; margin: 0; padding: 24px; color: #0A2540; }
    .card { background-color: #ffffff; max-width: 580px; margin: 0 auto; border-radius: 16px; border: 1px solid #E2E8F0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background-color: #00A8E8; color: #ffffff; text-transform: uppercase; letter-spacing: 0.05em; }
    .header { margin-top: 16px; font-size: 22px; font-weight: 700; color: #0A2540; }
    .message-box { background-color: #F7FAFC; border-left: 4px solid #00A8E8; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 15px; line-height: 1.5; }
    .contact-box { background-color: #ECFDF5; border: 1px solid #A7F3D0; padding: 14px; border-radius: 8px; margin: 16px 0; font-size: 14px; color: #065F46; }
    .footer { margin-top: 24px; font-size: 13px; color: #5B6B7C; border-top: 1px solid #E2E8F0; padding-top: 16px; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">LostLink Alert</span>
    <h1 class="header">Someone found your ${escapedItemName}!</h1>
    <p>Hi ${escapedOwnerName},</p>
    <p>A finder scanned the LostLink QR code attached to your <strong>${escapedItemName}</strong> (${escapedCategory}).</p>
    
    <div class="message-box">
      <strong>Finder's Message:</strong><br/>
      ${escapedMessage}
    </div>

    ${
      escapedContact
        ? `<div class="contact-box">
             <strong>Finder's Provided Contact Info:</strong><br/>
             ${escapedContact}
           </div>`
        : ''
    }

    <p style="font-size: 14px; color: #5B6B7C;">
      Your personal contact details remain completely confidential and were <strong>never disclosed</strong> to the finder.
    </p>

    <div class="footer">
      LostLink — Recover what matters, privately.<br/>
      <small>If you believe this was an error, you can safely disregard this email.</small>
    </div>
  </div>
</body>
</html>
  `;

  // 1. If owner chose email+phone (Premium feature), log mock SMS dispatch
  if (hasPhoneAlert) {
    console.log(
      `📱 [MOCK SMS DISPATCHED] To owner phone: ${ownerPhone || '[On File]'}\n` +
      `   Text: "LostLink Alert: Someone found your ${itemName}! Check your email (${ownerEmail}) for details."\n` +
      `   (Security check: Owner's phone is NEVER exposed to finders)`
    );
  }

  // 2. Send live email via Resend if API key is provided
  if (resend) {
    try {
      const response = await resend.emails.send({
        from: env.EMAIL_FROM,
        to: ownerEmail,
        subject: `🚨 LostLink Alert: Someone found your ${itemName}!`,
        html: htmlContent,
      });

      console.log(`✉️ Email successfully sent via Resend to ${ownerEmail}. ID:`, response.data?.id);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email via Resend:', error);
      console.warn(
        '⚠️ Note on Resend free-tier: Free tier only permits sending to your registered account email.'
      );
      // Do not crash the finder request if email provider fails
      return false;
    }
  } else {
    // 3. Fallback: log to console in development
    console.log('----------------------------------------------------');
    console.log('📧 [DEV EMAIL SIMULATION - RESEND_API_KEY not configured]');
    console.log(`To: ${ownerEmail}`);
    console.log(`Subject: 🚨 LostLink Alert: Someone found your ${itemName}!`);
    console.log(`Finder Message: ${finderMessage || '(None)'}`);
    if (finderContact) console.log(`Finder Contact: ${finderContact}`);
    console.log('----------------------------------------------------');
    return true;
  }
}
