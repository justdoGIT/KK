#!/usr/bin/env bash
# Run as root on Lenovo after DNS-01 certificate issuance has completed.
set -euo pipefail

site_host=forgejo.kepr.dev
lan_addr=192.168.1.4
cert_root=/home/kk/.local/state/kk-forgejo-https/letsencrypt/live/forgejo.kepr.dev
config_path=/etc/caddy/forgejo-https.Caddyfile
service_dir=/etc/sv/forgejo-https

if [[ $(id -u) != 0 ]]; then
  echo 'Run this activation script with sudo on Lenovo.' >&2
  exit 1
fi
if [[ $(hostname) != lenovo ]]; then
  echo 'This installation is intended for the Lenovo Forgejo host.' >&2
  exit 1
fi
for file in cert.pem chain.pem fullchain.pem privkey.pem; do
  test -s "$cert_root/$file" || { echo 'Complete certificate issuance first.' >&2; exit 1; }
done
openssl x509 -in "$cert_root/cert.pem" -noout -checkhost "$site_host"
openssl x509 -in "$cert_root/cert.pem" -noout -checkend 86400
openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt \
  -untrusted "$cert_root/chain.pem" "$cert_root/cert.pem"

xbps-install -Sy caddy
install -d -m 700 /etc/caddy/forgejo-tls
install -m 644 "$cert_root/fullchain.pem" /etc/caddy/forgejo-tls/fullchain.pem
install -m 600 "$cert_root/privkey.pem" /etc/caddy/forgejo-tls/privkey.pem
cat > "$config_path" <<'CADDY'
{
  admin off
  auto_https disable_redirects
  default_bind 192.168.1.4
}
https://forgejo.kepr.dev {
  tls /etc/caddy/forgejo-tls/fullchain.pem /etc/caddy/forgejo-tls/privkey.pem
  reverse_proxy 127.0.0.1:3000
}
CADDY
chmod 644 "$config_path"
caddy validate --config "$config_path" --adapter caddyfile

install -d -m 755 "$service_dir"
cat > "$service_dir/run" <<'RUN'
#!/bin/sh
exec 2>&1
exec /usr/bin/caddy run --config /etc/caddy/forgejo-https.Caddyfile --adapter caddyfile
RUN
chmod 755 "$service_dir/run"
if [[ ! -e /var/service/forgejo-https ]]; then
  ln -s "$service_dir" /var/service/forgejo-https
fi
sv up /var/service/forgejo-https
curl --fail --silent --show-error --retry 5 --retry-connrefused \
  --resolve "$site_host:443:$lan_addr" "https://$site_host/user/login" -o /dev/null

# Change only public server settings; never display the credential-bearing INI.
python3 - <<'PY'
from pathlib import Path
import re

path = Path('/home/kk/.local/share/forgejo/custom/conf/app.ini')
text = path.read_text()
section = re.search(r'(?ms)^\[server\][^\n]*\n(.*?)(?=^\[|\Z)', text)
if not section:
    raise SystemExit('No server section found; review the Forgejo configuration.')
body = section.group(1)
for key, value in [('ROOT_URL', 'https://forgejo.kepr.dev/'), ('DOMAIN', 'forgejo.kepr.dev')]:
    pattern = r'(?m)^\s*' + key + r'\s*=.*$'
    body = re.sub(pattern, key + ' = ' + value, body) if re.search(pattern, body) else body + key + ' = ' + value + '\n'
path.write_text(text[:section.start(1)] + body + text[section.end(1):])
PY
sv restart /var/service/forgejo-local
curl --fail --silent --show-error --retry 10 --retry-connrefused \
  --resolve "$site_host:443:$lan_addr" "https://$site_host/user/login" -o /dev/null
echo 'Private HTTPS is available at https://forgejo.kepr.dev/ on the LAN.'
echo 'Keep local DNS pointing forgejo.kepr.dev to 192.168.1.4.'
echo 'Repeat activation after renewing the DNS-01 certificate.'
