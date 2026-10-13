from django.core.cache import cache
from rest_framework.test import APITestCase


class AuthHardeningTests(APITestCase):
    def setUp(self):
        cache.clear()  # throttle counters live in the cache
        self.addCleanup(cache.clear)

    def test_login_is_rate_limited(self):
        codes = [self.client.post('/api/users/auth/login/', {'username': 'x', 'password': 'wrong'}).status_code
                 for _ in range(11)]
        self.assertEqual(codes[:10], [400] * 10)
        self.assertEqual(codes[10], 429)

    def test_unthrottled_duplicate_auth_routes_are_gone(self):
        for url in ('/api/token/', '/api/auth/login/', '/api/auth/registration/', '/api-auth/login/'):
            self.assertEqual(self.client.post(url, {}).status_code, 404, url)
