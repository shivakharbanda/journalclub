import uuid
from django.utils.deprecation import MiddlewareMixin
from users.models import GuestUser

class AssignGuestIDMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.user.is_authenticated:
            return

        guest_id = request.COOKIES.get('guest_id')

        if not guest_id:
            guest_id = str(uuid.uuid4())
            guest_user = GuestUser.objects.create(device_id=guest_id)
            request._set_guest_cookie = True
        else:
            guest_user, _ = GuestUser.objects.get_or_create(device_id=guest_id)

        request.guest_id = guest_id
        request.guest_user = guest_user

    def process_response(self, request, response):
        if getattr(request, '_set_guest_cookie', False):
            response.set_cookie('guest_id', request.guest_id, max_age=365*24*60*60)
        return response
