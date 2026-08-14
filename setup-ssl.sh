#!/bin/bash
# ==============================================================================
#  E-OFFICE LDI MANAGEMENT SYSTEM - AUTOMATED SSL CERTBOT INSTALLER
# ==============================================================================
set -e

export DEBIAN_FRONTEND=noninteractive
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

echo "🔒 Memulai Perbaikan Konfigurasi Nginx & Instalasi SSL Certbot untuk e-office.ldi.co.id..."

# 1. Update & Install certbot & python3-certbot-nginx
apt-get update -y || true
apt-get install -y --no-install-recommends certbot python3-certbot-nginx nginx ufw || true

# 2. Hapus file default Nginx agar tidak ada konflik listen port 80 / 443
rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-available/default

# 3. Buat konfigurasi Nginx bersumber bersih untuk e-office.ldi.co.id
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

    # Proxy request API ke backend Node.js (Express) di port 3000
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

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

# Tes syntax Nginx
nginx -t || /usr/sbin/nginx -t
systemctl reload nginx || systemctl restart nginx || true

# 4. Pastikan Firewall (UFW) Mengizinkan Trafik Port 80 dan 443 (HTTP & HTTPS)
if command -v ufw >/dev/null 2>&1; then
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true
    ufw allow 'Nginx Full' || true
fi

# 5. Eksekusi Certbot untuk Generate & Install SSL HTTPS
echo "🔑 Menjalankan Certbot SSL Installer untuk e-office.ldi.co.id..."

if certbot --nginx -d e-office.ldi.co.id --non-interactive --agree-tos -m admin@ldi.co.id --redirect 2>/dev/null || \
   certbot --nginx -d e-office.ldi.co.id --non-interactive --agree-tos --register-unsafely-without-email --redirect 2>/dev/null || \
   certbot install --cert-name e-office.ldi.co.id --nginx --non-interactive 2>/dev/null; then
    echo "✅ [SUKSES] Sertifikat SSL HTTPS berhasil dipasang dan dikonfigurasi di Nginx!"
else
    echo "⚠️ Memproses pemasangan sertifikat Certbot secara interaktif..."
    certbot --nginx -d e-office.ldi.co.id --redirect || true
fi

# Reload Nginx untuk menerapkan sertifikat
nginx -t && systemctl reload nginx || systemctl restart nginx || true

echo "🚀 Selesai! Akses https://e-office.ldi.co.id"

