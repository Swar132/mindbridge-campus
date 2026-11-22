import json
import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models.monitoring import PushSubscription, NotificationLog

logger = logging.getLogger(__name__)

class PushService:
    @staticmethod
    def send_web_push(
        subscription: PushSubscription,
        title: str,
        body: str,
        url: str = "/",
        tag: str = "mindbridge-wellbeing"
    ) -> bool:
        """
        Delivers a standard Web Push notification to a student's registered browser endpoint.
        Uses VAPID identification over RFC 8291 / RFC 8292.
        """
        payload = json.dumps({
            "title": title,
            "body": body,
            "url": url,
            "tag": tag,
            "icon": "/logo192.png",
            "badge": "/favicon.ico"
        })

        sub_info = {
            "endpoint": subscription.endpoint,
            "keys": {
                "p256dh": subscription.p256dh,
                "auth": subscription.auth
            }
        }

        try:
            from pywebpush import webpush, WebPushException
            webpush(
                subscription_info=sub_info,
                data=payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": settings.VAPID_CLAIMS_EMAIL},
                ttl=86400
            )
            return True
        except Exception as ex:
            logger.warning(f"[PUSH] Failed sending to endpoint {subscription.endpoint[:40]}...: {ex}")
            # If 404/410, subscription is defunct
            err_str = str(ex).lower()
            if "410" in err_str or "404" in err_str or "unsubscribed" in err_str:
                logger.info(f"[PUSH] Expired subscription marked for cleanup.")
            return False

    @staticmethod
    def dispatch_to_user(
        db: Session,
        user_id: int,
        title: str,
        body: str,
        url: str = "/",
        notification_type: str = "system"
    ) -> int:
        """
        Delivers push notification to all active devices registered by the student.
        """
        subs = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
        if not subs:
            return 0

        success_count = 0
        defunct_subs = []

        for sub in subs:
            ok = PushService.send_web_push(sub, title, body, url, tag=notification_type)
            if ok:
                success_count += 1
            else:
                defunct_subs.append(sub.id)

        # Clean up defunct subscriptions
        if defunct_subs:
            db.query(PushSubscription).filter(PushSubscription.id.in_(defunct_subs)).delete(synchronize_session=False)
            db.commit()

        # Log push dispatch
        log_entry = NotificationLog(
            user_id=user_id,
            channel="browser_push",
            notification_type=notification_type,
            title=title,
            message_preview=body[:100],
            status="sent" if success_count > 0 else "failed",
            error_message=None if success_count > 0 else "Delivery failed to all registered push endpoints"
        )
        db.add(log_entry)
        db.commit()

        return success_count
