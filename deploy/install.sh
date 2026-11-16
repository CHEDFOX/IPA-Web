#!/usr/bin/env bash
# One-shot install on Ubuntu or Debian, run as root:
#
#   curl -fsSL https://raw.githubusercontent.com/CHEDFOX/IPA-Web/main/deploy/install.sh | bash -s -- yourdomain.com
#
# or, after cloning:  bash deploy/install.sh yourdomain.com
#
# It copes with a server that already has things on it: if ports 80 and 443 are free it runs
# Caddy and gets the HTTPS certificate itself; if nginx or Apache already has them, it leaves
# them alone, puts the site on a free local port, and writes an nginx config for you to enable.
#
# Safe to run again: it never overwrites an existing .env and never touches the data folder.
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

# ss where it works; otherwise just try to connect, which needs no tools and no privileges.
port_busy() {
  if command -v ss >/dev/null 2>&1 && ss -ltn 2>/dev/null | grep -q LISTEN; then
    ss -ltn 2>/dev/null | awk '{print $4}' | grep -qE "[:.]${1}\$" && return 0 || return 1
  fi
  (exec 3<>/dev/tcp/127.0.0.1/"$1") 2>/dev/null && { exec 3<&-; return 0; }
  return 1
}

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
command -v git >/dev/null 2>&1 || apt-get install -y -qq git

echo "==> Fetching the site into $DIR (branch $BRANCH)"
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" fetch --depth 1 origin "$BRANCH"
  git -C "$DIR" checkout -B "$BRANCH" "origin/$BRANCH"
else
  git clone --depth 1 --branch "$BRANCH" "$REPO" "$DIR"
fi
cd "$DIR"

# A port for the site itself. 3000 unless something already has it.
PORT="${IPA_PORT:-}"
if [ -z "$PORT" ]; then
  for candidate in 3000 3001 3002 3003 3010 3100; do
    if ! port_busy "$candidate"; then PORT="$candidate"; break; fi
  done
fi
[ -n "$PORT" ] || { echo "No free port found between 3000 and 3100." >&2; exit 1; }

# Who serves HTTPS: us, or a web server this machine already runs.
if port_busy 80 || port_busy 443; then
  OWN_PROXY=0
  EXISTING="$(ss -ltnp 2>/dev/null | awk '/:80 |:443 /{print $NF}' | grep -oE '"[a-z0-9_-]+"' | tr -d '"' | sort -u | head -3 | tr '\n' ' ')"
else
  OWN_PROXY=1
  EXISTING=""
fi

if [ ! -f .env ]; then
  echo "==> Writing .env with a freshly generated admin password"
  PASSWORD="$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 24)"
  cat > .env <<ENV
DOMAIN=$DOMAIN
SITE_URL=https://www.$DOMAIN
ADMIN_PASSWORD=$PASSWORD
IPA_DATA_DIR=/app/data
IPA_PORT=$PORT
ENV
  chmod 600 .env
  NEW_PASSWORD=1
else
  echo "==> Keeping the .env that is already here"
  grep -q '^IPA_PORT=' .env || echo "IPA_PORT=$PORT" >> .env
  PORT="$(grep '^IPA_PORT=' .env | cut -d= -f2-)"
  NEW_PASSWORD=0
fi

echo "==> Building (first time takes a few minutes)"
if [ "$OWN_PROXY" = "1" ]; then
  docker compose --profile caddy up -d --build
else
  docker compose up -d --build
fi

echo
echo "==> Checking the site answers on 127.0.0.1:$PORT"
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:$PORT/robots.txt"; then
    echo "    it does."
    break
  fi
  [ "$i" = 30 ] && echo "    no answer yet — see: docker compose logs --tail 50 web"
  sleep 2
done

if [ "$NEW_PASSWORD" = "1" ]; then
  echo
  echo "  Admin password:  $(grep '^ADMIN_PASSWORD=' .env | cut -d= -f2-)"
  echo "  Write it down. To change it later, edit $DIR/.env and run: docker compose up -d"
fi

echo
if [ "$OWN_PROXY" = "1" ]; then
  cat <<DONE
==> HTTPS is handled here, by Caddy.
    Point $DOMAIN and www.$DOMAIN at this server's IP address, then:
      cd $DIR && docker compose restart caddy && docker compose logs -f caddy
    Sign in at https://www.$DOMAIN/admin
DONE
else
  SITE="/etc/nginx/sites-available/ipa-web.conf"
  sed -e "s/yourdomain\.com/$DOMAIN/g" -e "s/127\.0\.0\.1:3000/127.0.0.1:$PORT/g" deploy/nginx.conf > "$DIR/deploy/nginx-site.conf"
  cat <<DONE
==> This server already runs ${EXISTING:-another web server} on ports 80/443, so it stays in charge
    of HTTPS and the site sits behind it on 127.0.0.1:$PORT.

    A config file for it is ready at:
      $DIR/deploy/nginx-site.conf

    To put it live (nginx):
      cp $DIR/deploy/nginx-site.conf $SITE
      ln -sf $SITE /etc/nginx/sites-enabled/ipa-web.conf
      nginx -t && systemctl reload nginx

    Then point $DOMAIN and www.$DOMAIN at this server, and get the certificate:
      apt-get install -y certbot python3-certbot-nginx
      certbot --nginx -d $DOMAIN -d www.$DOMAIN

    Sign in at https://www.$DOMAIN/admin
DONE
fi
