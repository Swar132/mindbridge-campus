import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
import httpx

EMAIL_OTP_HTML_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>MindBridge Campus Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0284c7 0%, #0d9488 50%, #4338ca 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">MindBridge Campus</h1>
              <p style="margin: 6px 0 0 0; color: #e0f2fe; font-size: 13px; font-weight: 500;">Confidential Student Sanctuary & Wellbeing Platform</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px; font-weight: 700;">Hello {full_name},</h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Thank you for creating your account on MindBridge Campus. To confirm your identity and complete registration, please enter the one-time verification code below:
              </p>
              
              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 14px; padding: 14px 28px;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #047857;">{otp}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b; line-height: 1.5; text-align: center;">
                ⏳ This code is valid for <strong>5 minutes</strong>. For your security, never share this code with anyone.
              </p>

              <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;">

              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                If you did not attempt to register on MindBridge Campus, please disregard this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 24px; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">
                <strong>Campus Counselling Room:</strong> SAC I, First Floor • <a href="mailto:nitusingh_b@dau.ac.in" style="color: #0284c7; text-decoration: none;">nitusingh_b@dau.ac.in</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                24/7 Confidential Mental Health Crisis Helpline: <strong>Tele-MANAS 14416</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

EMAIL_WELCOME_HTML_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to MindBridge Campus</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0284c7 0%, #0d9488 50%, #4338ca 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800;">Welcome to MindBridge Campus! 🌿</h1>
              <p style="margin: 6px 0 0 0; color: #e0f2fe; font-size: 13px; font-weight: 500;">Your Confidential Campus Wellbeing Sanctuary</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px; font-weight: 700;">Welcome aboard, {full_name}!</h2>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Your MindBridge Campus account has been successfully verified and activated. College life can be demanding, and this sanctuary was built to give you a private, guilt-free space to reflect, track daily wellbeing, and find support whenever you need it.
              </p>
              
              <div style="background-color: #f0fdf4; border-radius: 14px; padding: 16px 20px; margin: 20px 0; border: 1px solid #bbf7d0;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #166534; font-weight: 700;">What you can do right now:</h3>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #15803d; line-height: 1.7;">
                  <li>Log your first daily check-in (mood, energy, stress, and sleep).</li>
                  <li>Speak confidentially with <strong>Mindy</strong>, your 24/7 AI companion.</li>
                  <li>Write private reflections in your secure personal journal.</li>
                  <li>Book confidential 1-on-1 sessions with our college counsellor.</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 28px 0 10px 0;">
                <a href="https://mindbridge-campus-te1l.onrender.com" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #0d9488 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.3);">
                  Open MindBridge Sanctuary →
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 24px; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">
                <strong>College Counsellor:</strong> Nitu Singh Bhadouria • Counselling Room, SAC I, First Floor • <a href="mailto:nitusingh_b@dau.ac.in" style="color: #0284c7; text-decoration: none;">nitusingh_b@dau.ac.in</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                24/7 Government of India Mental Health Helpline: <strong>Tele-MANAS 14416</strong> (Toll-Free)
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


class EmailService:
    @staticmethod
    def get_provider_status() -> Dict[str, Any]:
        """Returns the configured email provider and readiness."""
        resend_key = os.getenv("RESEND_API_KEY", "").strip()
        sendgrid_key = os.getenv("SENDGRID_API_KEY", "").strip()
        smtp_host = os.getenv("SMTP_HOST", "").strip()

        if resend_key:
            return {
                "provider": "resend",
                "is_configured": True,
                "description": "Resend Cloud Mail API"
            }
        elif sendgrid_key:
            return {
                "provider": "sendgrid",
                "is_configured": True,
                "description": "SendGrid Mail API"
            }
        elif smtp_host:
            return {
                "provider": "smtp",
                "is_configured": True,
                "description": f"Custom SMTP ({smtp_host})"
            }
        else:
            return {
                "provider": "none",
                "is_configured": False,
                "description": "No email provider configured. Set RESEND_API_KEY or SMTP credentials in environment variables."
            }

    @staticmethod
    def _send_via_resend(to_email: str, subject: str, html_content: str, text_content: str) -> str:
        api_key = os.getenv("RESEND_API_KEY", "").strip()
        from_email = os.getenv("RESEND_FROM_EMAIL", "MindBridge Campus <onboarding@resend.dev>").strip()

        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "from": from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
            "text": text_content
        }

        with httpx.Client(timeout=12.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            if resp.status_code in (200, 201):
                data = resp.json()
                return data.get("id", "resend_ok")
            else:
                raise RuntimeError(f"Resend API error (HTTP {resp.status_code}): {resp.text}")

    @staticmethod
    def _send_via_sendgrid(to_email: str, subject: str, html_content: str, text_content: str) -> str:
        api_key = os.getenv("SENDGRID_API_KEY", "").strip()
        from_email = os.getenv("SENDGRID_FROM_EMAIL", "noreply@mindbridge.edu").strip()

        url = "https://api.sendgrid.com/v3/mail/send"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "personalizations": [{"to": [{"email": to_email}]}],
            "from": {"email": from_email, "name": "MindBridge Campus"},
            "subject": subject,
            "content": [
                {"type": "text/plain", "value": text_content},
                {"type": "text/html", "value": html_content}
            ]
        }

        with httpx.Client(timeout=12.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            if resp.status_code in (200, 202):
                return "sendgrid_ok"
            else:
                raise RuntimeError(f"SendGrid API error (HTTP {resp.status_code}): {resp.text}")

    @staticmethod
    def _send_via_smtp(to_email: str, subject: str, html_content: str, text_content: str) -> str:
        host = os.getenv("SMTP_HOST", "").strip()
        port = int(os.getenv("SMTP_PORT", "587"))
        user = os.getenv("SMTP_USER", "").strip()
        password = os.getenv("SMTP_PASSWORD", "").strip()
        from_email = os.getenv("SMTP_FROM_EMAIL", user or "noreply@mindbridge.edu").strip()
        use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = to_email

        part1 = MIMEText(text_content, "plain", "utf-8")
        part2 = MIMEText(html_content, "html", "utf-8")
        msg.attach(part1)
        msg.attach(part2)

        try:
            if port == 465:
                server = smtplib.SMTP_SSL(host, port, timeout=12)
            else:
                server = smtplib.SMTP(host, port, timeout=12)
                if use_tls:
                    server.starttls()

            if user and password:
                server.login(user, password)

            server.sendmail(from_email, [to_email], msg.as_string())
            server.quit()
            return "smtp_ok"
        except Exception as e:
            raise RuntimeError(f"SMTP error ({host}:{port}): {e}")

    @staticmethod
    def send_email(to_email: str, subject: str, html_content: str, text_content: str) -> Dict[str, Any]:
        """
        Dispatches email using configured provider (Resend / SendGrid / SMTP).
        Raises RuntimeError with explicit configuration instructions if no provider is configured.
        """
        status = EmailService.get_provider_status()
        provider = status["provider"]

        if not status["is_configured"]:
            raise RuntimeError(
                "Email delivery service is not configured. "
                "Please configure RESEND_API_KEY (recommended) or SMTP_HOST, SMTP_PORT, "
                "SMTP_USER, SMTP_PASSWORD in Render environment variables."
            )

        if provider == "resend":
            msg_id = EmailService._send_via_resend(to_email, subject, html_content, text_content)
        elif provider == "sendgrid":
            msg_id = EmailService._send_via_sendgrid(to_email, subject, html_content, text_content)
        elif provider == "smtp":
            msg_id = EmailService._send_via_smtp(to_email, subject, html_content, text_content)
        else:
            raise RuntimeError(f"Unsupported email provider: {provider}")

        return {
            "success": True,
            "provider": provider,
            "message_id": msg_id,
            "to": to_email
        }

    @staticmethod
    def send_otp_email(to_email: str, full_name: str, otp_code: str) -> Dict[str, Any]:
        """Sends a 5-minute cryptographic verification code to student's email."""
        subject = f"Your MindBridge Campus Verification Code: {otp_code}"
        html = EMAIL_OTP_HTML_TEMPLATE.format(full_name=full_name, otp=otp_code)
        text = (
            f"Hello {full_name},\n\n"
            f"Your MindBridge Campus verification code is: {otp_code}\n\n"
            f"This code is valid for 5 minutes. Never share this code with anyone.\n\n"
            f"Campus Counselling: Nitu Singh Bhadouria (SAC I, First Floor • nitusingh_b@dau.ac.in)\n"
            f"Tele-MANAS: 14416"
        )
        return EmailService.send_email(to_email, subject, html, text)

    @staticmethod
    def send_welcome_email(to_email: str, full_name: str) -> Dict[str, Any]:
        """Sends welcome email after successful account verification."""
        subject = "Welcome to MindBridge Campus Sanctuary 🌿"
        html = EMAIL_WELCOME_HTML_TEMPLATE.format(full_name=full_name)
        text = (
            f"Welcome to MindBridge Campus, {full_name}!\n\n"
            f"Your account and email address have been successfully verified.\n"
            f"You can now access your confidential student sanctuary, daily check-ins, "
            f"and speak with Mindy AI anytime:\n"
            f"https://mindbridge-campus-te1l.onrender.com\n\n"
            f"Campus Counsellor: Nitu Singh Bhadouria (Counselling Room, SAC I, First Floor • nitusingh_b@dau.ac.in)\n"
            f"Emergency 24/7 Helpline: Tele-MANAS 14416"
        )
        return EmailService.send_email(to_email, subject, html, text)
