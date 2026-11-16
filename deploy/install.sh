#!/usr/bin/env bash
# One-shot install on a fresh Ubuntu or Debian server, run as root:
#
#   curl -fsSL https://raw.githubusercontent.com/CHEDFOX/IPA-Web/main/deploy/install.sh | bash -s -- yourdomain.com
#
# or, after cloning:  bash deploy/install.sh yourdomain.com
#
# It installs Docker, fetches the site, writes .env with a password it generates for you,
# and starts the site on port 80/443. Safe to run again: it never overwrites an existing
# .env and never touches the data folder.
set -euo pipefail

DOMAIN="${1:-}"
BRANCH="${IPA_BRANCH:-main}"
DIR="${IPA_DIR:-/opt/ipa-web}"
REPO="${IPA_REPO:-https://github.com/CHEDFOX/IPA-Web.git}"

if [ -z "$DOMAIN" ]; then
  echo "Usage: bash deploy/install.sh yourdomain.com" >&2
  exit 1
fi
if [ "$(id -u)" -ne 0 ]; then
  echo "Run this as root (or with sudo)." >&2
  exit 1
fi

echo "==> Installing Docker if it is missing"
if ! command -v docker >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl git
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc 2>/dev/null \
    || curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/${ID} ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

echo "==> Fetching the site into $DIR (branch $BRANCH)"
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" fetch --depth 1 origin "$BRANCH"
  git -C "$DIR" checkout -B "$BRANCH" "origin/$BRANCH"
else
  git clone --depth 1 --branch "$BRANCH" "$REPO" "$DIR"
fi
cd "$DIR"

if [ ! -f .env ]; then
  echo "==> Writing .env with a freshly generated admin password"
  PASSWORD="$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 24)"
  cat > .env <<ENV
DOMAIN=$DOMAIN
SITE_URL=https://www.$DOMAIN
ADMIN_PASSWORD=$PASSWORD
IPA_DATA_DIR=/app/data
ENV
  chmod 600 .env
  NEW_PASSWORD=1
else
  echo "==> Keeping the .env that is already here"
  NEW_PASSWORD=0
fi

echo "==> Building and starting"
docker compose up -d --build

echo
echo "Started. The site is on this server now."
if [ "$NEW_PASSWORD" = "1" ]; then
  echo
  echo "  Admin password:  $(grep '^ADMIN_PASSWORD=' .env | cut -d= -f2-)"
  echo "  Sign in at:      https://www.$DOMAIN/admin"
  echo
  echo "  Write it down somewhere safe. To change it later, edit $DIR/.env"
  echo "  and run: docker compose up -d"
fi
echo
echo "Next: point $DOMAIN and www.$DOMAIN at this server's IP address."
echo "Until then Caddy cannot get the HTTPS certificate, which is normal."
echo "Check the site locally with:  curl -I http://127.0.0.1:3000"
