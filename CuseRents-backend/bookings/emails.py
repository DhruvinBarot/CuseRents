from django.conf import settings
from django.core.mail import send_mail

# event -> (send to renter?, subject, body); bodies get the booking via str.format
MESSAGES = {
    'requested': (False, 'New rental request for {b.item.title}',
                  '{b.renter.username} wants to rent {b.item.title} from {b.start_time:%b %d %I:%M %p}.\n'
                  'Accept or reject it on your profile: {url}'),
    'accepted': (True, 'Your rental of {b.item.title} was accepted',
                 'Booking {b.booking_code} is confirmed. Pickup: {b.item.address_text}, {b.start_time:%b %d %I:%M %p}.\n{url}'),
    'rejected': (True, 'Your rental request for {b.item.title} was declined',
                 'The owner declined booking {b.booking_code}. Your card hold has been released.\n{url}'),
    'cancelled': (False, 'Rental of {b.item.title} was cancelled',
                  '{b.renter.username} cancelled booking {b.booking_code}.\n{url}'),
    'completed': (True, 'Receipt for {b.item.title}',
                  'Thanks for returning {b.item.title}. You were charged ${charged} for booking {b.booking_code}.\n'
                  'Leave a review for bonus points: {url}'),
}


def notify(booking, event):
    to_renter, subject, body = MESSAGES[event]
    recipient = booking.renter if to_renter else booking.owner
    if not recipient.email:
        return
    charged = booking.total_price + (booking.deposit_amount if booking.damage_reported else 0)
    # Never let a mail outage break a booking action
    send_mail(subject.format(b=booking), body.format(b=booking, url=settings.FRONTEND_URL, charged=charged),
              settings.DEFAULT_FROM_EMAIL, [recipient.email], fail_silently=True)
