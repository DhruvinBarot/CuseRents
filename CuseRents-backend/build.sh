#!/usr/bin/env bash
# Render build: install, collect static files for the admin, apply migrations
set -o errexit
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate --noinput
# Free Render plans have no shell: create the first admin from env vars, once
if [ -n "$DJANGO_SUPERUSER_USERNAME" ]; then
  python manage.py createsuperuser --noinput || echo "Admin user already exists, skipping"
fi
