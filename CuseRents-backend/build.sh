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
# Optional: list the demo items (with photos) under this username. Safe on every deploy; never overwrites edits.
if [ -n "$DEMO_ITEMS_OWNER" ]; then
  python manage.py seed_demo_items --owner "$DEMO_ITEMS_OWNER" || echo "Demo items skipped (see message above)"
fi
