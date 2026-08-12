#!/bin/bash
# ==============================================================================
#  E-OFFICE LDI MANAGEMENT SYSTEM - AUTOMATED SSL CERTBOT INSTALLER
# ==============================================================================
set -e

export DEBIAN_FRONTEND=noninteractive
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

echo "🔒 Memulai Instalasi & Konfigurasi Otomatis Certbot SSL untuk e-office.ldi.co.id..."

# 1. Update & Install certbot & python3-certbot-nginx
apt-get update -y || true
apt-get install -y --no-install-recommends certbot python3-certbot-nginx nginx

# 2. Pastikan file Nginx ldi-app ada & dikonfigurasi
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
cat << 'NGINX' > /etc/nginx/sites-available/ldi-app
server {
    listen 80;
    listen [::]:80;
    server_name e-office.ldi.co.id;
    root /var/www/ldi-app/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/ldi-app /etc/nginx/sites-enabled/ldi-app
nginx -t || /usr/sbin/nginx -t
systemctl reload nginx || systemctl restart nginx || true

# 3. Jalankan Certbot Non-Interactive Challenge Verification
echo "🔑 Menjalankan Verifikasi Challenge Certbot untuk e-office.ldi.co.id..."
if certbot --nginx -d e-office.ldi.co.id --non-interactive --agree-tos -m admin@ldi.co.id --redirect 2>/dev/null || \
   certbot --nginx -d e-office.ldi.co.id --non-interactive --agree-tos --register-unsafely-without-email --redirect; then
    echo "✅ [SUKSES] SSL HTTPS berhasil diaktifkan untuk https://e-office.ldi.co.id"
else
    echo "⚠️ [PERHATIAN] Certbot challenge belum berhasil. Pastikan A-Record e-office.ldi.co.id menunjuk ke IP VPS Anda."
fi
