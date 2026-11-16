# Going live on indraprasthassociate.com

The site stores its listings in SQLite and its photos on disk, so it needs a server with a disk
that keeps its contents. **Vercel cannot run this version** — its filesystem is wiped between
requests, so uploads and the database would disappear. The domain is on Vercel today; the steps
below move it to a server of your own.

Roughly 20 minutes, most of it waiting for DNS.

---

## 1. Get a server

Any small Linux box will do. The site is light; the photos are what take room.

| | |
| --- | --- |
| Size | 2 vCPU, 2–4 GB RAM, 40–80 GB disk |
| System | Ubuntu 24.04 LTS |
| Where | A region near your visitors — Mumbai or Bangalore for an Indian audience |
| Cost | About $6–12 a month (DigitalOcean, Hetzner, Linode, Vultr all fine) |

Create it with your SSH key, and note its **IP address**. Nothing else to configure.

## 2. Install the site

SSH in as root and run one line:

```bash
curl -fsSL https://raw.githubusercontent.com/CHEDFOX/IPA-Web/claude/optimistic-hawking-2falf0/deploy/install.sh | IPA_BRANCH=claude/optimistic-hawking-2falf0 bash -s -- indraprasthassociate.com
```

(That is the branch this work lives on. Once it is merged into `main`, the shorter form works:
`curl -fsSL https://raw.githubusercontent.com/CHEDFOX/IPA-Web/main/deploy/install.sh | bash -s -- indraprasthassociate.com`)

It installs Docker, fetches the site, generates an admin password, and starts everything.
**Write down the password it prints at the end** — it is in `/opt/ipa-web/.env` too.

Check it is running, before the domain points anywhere:

```bash
curl -I http://127.0.0.1:3000
```

`HTTP/1.1 200 OK` means the site is up on the server. HTTPS will not work yet, which is expected:
Caddy cannot get a certificate until the domain resolves to this server.

## 3. Point the domain at it

At your domain registrar (wherever the DNS for indraprasthassociate.com is managed):

1. Lower the TTL on the existing records to **300 seconds** and wait for the old TTL to pass.
   This makes the switch quick instead of leaving visitors on the old site for hours.
2. Delete the records pointing at Vercel:
   - `A` on `@` → `216.198.79.1`
   - `A` on `www` → `216.198.79.65` and `64.29.17.65`
3. Add two records pointing at your server:

   | Type | Name | Value |
   | --- | --- | --- |
   | A | `@` | your server's IP |
   | A | `www` | your server's IP |

4. In the Vercel dashboard, remove the domain from the old project so it stops claiming it.

Watch the change land:

```bash
dig +short www.indraprasthassociate.com
```

When that prints your server's IP, carry on.

## 4. Turn on HTTPS

Nothing to do but let Caddy notice. On the server:

```bash
cd /opt/ipa-web && docker compose restart caddy && docker compose logs -f caddy
```

Within a minute the log says it obtained a certificate. Then
`https://www.indraprasthassociate.com` is live, and the bare domain redirects to it.

## 5. Sign in and set it up

Open `https://www.indraprasthassociate.com/admin` and sign in with the password from step 2.

Then, in this order:

1. **Settings** — your WhatsApp number, phone, email, the site text. The WhatsApp number is the
   one every property button uses.
2. **Regions** — the places you sell in (Palampet, Hyderabad, Deogarh…).
3. **Properties** — add your listings, upload photos, paste the Google Maps link for each.
4. Each property's page shows its **ten access codes**. Hand them out as people ask.

### Changing the password

Edit the file and restart:

```bash
nano /opt/ipa-web/.env
```

```bash
cd /opt/ipa-web && docker compose up -d
```

Use a long one. Anyone with it can edit every listing.

---

## Afterwards

Update to the latest code:

```bash
cd /opt/ipa-web && git pull && docker compose up -d --build
```

The first build takes a few minutes; later ones are quicker.

Back up — the database and every photo live in one Docker volume:

```bash
cd /opt/ipa-web && docker compose exec web npm run backup
```

```bash
docker run --rm -v ipa-web_ipa-data:/data -v /root:/backup alpine tar czf /backup/ipa-$(date +%F).tar.gz -C /data .
```

Copy that tarball off the server regularly — it is the whole site's content.

Watch the logs:

```bash
cd /opt/ipa-web && docker compose logs -f web
```

## If something is wrong

**The certificate will not issue.** DNS has not reached this server yet, or ports 80/443 are
blocked by the provider's firewall. Check with `dig +short www.indraprasthassociate.com` and your
provider's firewall rules.

**"This site can't be reached".** Check the containers are up: `docker compose ps`. Both `web` and
`caddy` should say `running`.

**The site is up but empty.** That is normal before you add listings. Add a region first, then a
property, and set it to "Public — listed".

**Photos will not upload.** Check disk space with `df -h`. Each photo keeps four sizes, so a few
hundred photos is a few GB.
