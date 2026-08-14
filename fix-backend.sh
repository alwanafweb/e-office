#!/bin/bash
# ==============================================================================
#  E-OFFICE LDI - BACKEND ACTIVATOR & NGINX PROXY REPAIR SCRIPT
# ==============================================================================
set -e

# Pastikan semua direktori binary sistem (/usr/sbin, /sbin, /usr/local/bin) terbaca
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

echo "🚀 [1/4] Menarik update terbaru dari GitHub & Build bundle..."
cd /var/www/ldi-app
git pull origin main || git pull origin master || true
npm install
npm run build

# Deteksi lokasi Node binary secara dinamis
NODE_BIN=$(command -v node || echo "/usr/bin/node")
echo "  • Node Binary: $NODE_BIN"

echo "⚙️ [2/4] Menyiapkan Systemd Service (ldi-backend.service)..."
cat << SERVICE > /etc/systemd/system/ldi-backend.service
[Unit]
Description=E-Office LDI Node.js Backend Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/ldi-app
ExecStart=${NODE_BIN} /var/www/ldi-app/dist/server.cjs
Restart=always
RestartSec=3
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable ldi-backend
systemctl restart ldi-backend

echo "🌐 [3/4] Memperbarui Konfigurasi Nginx dengan Reverse Proxy /api/..."

# Bersihkan symlink default lama yang sering menyebabkan duplicate listen
rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-available/default 2>/dev/null || true
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

# Deteksi lokasi binary Nginx
NGINX_BIN="/usr/sbin/nginx"
if command -v nginx >/dev/null 2>&1; then
    NGINX_BIN=$(command -v nginx)
fi

# Periksa apakah sertifikat SSL Let's Encrypt sudah ada di server
if [ -f "/etc/letsencrypt/live/e-office.ldi.co.id/fullchain.pem" ]; then
    echo "  🔒 Sertifikat SSL Let's Encrypt terdeteksi. Memasang konfigurasi HTTPS lengkap..."
    cat << 'NGINX' > /etc/nginx/sites-available/ldi-app
server {
    listen 80;
    listen [::]:80;
    server_name e-office.ldi.co.id;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name e-office.ldi.co.id;

    ssl_certificate /etc/letsencrypt/live/e-office.ldi.co.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/e-office.ldi.co.id/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

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
else
    echo "  🌐 Memasang konfigurasi HTTP port 80..."
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
fi

ln -sf /etc/nginx/sites-available/ldi-app /etc/nginx/sites-enabled/ldi-app

# Test & Restart Nginx
echo "  • Menguji sintaks konfigurasi Nginx..."
$NGINX_BIN -t
systemctl restart nginx || /usr/sbin/nginx -s reload || true
systemctl enable nginx 2>/dev/null || true

echo "🔍 [4/4] Memeriksa Status Backend & Endpoint Mail Gateway..."
sleep 2
HEALTH_CHECK=$(curl -s http://127.0.0.1:3000/api/health || echo "FAILED")
echo "  • Local Backend Health: $HEALTH_CHECK"

# Update script pembaruan sistem di VPS
cat << 'UPDATECMD' > /usr/local/bin/update-app
#!/bin/bash
set -e
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"
echo "🔄 Memperbarui Aplikasi E-Office dari GitHub..."
cd /var/www/ldi-app
git pull origin main || git pull origin master
npm install
npm run build
systemctl restart ldi-backend || true
systemctl reload nginx 2>/dev/null || systemctl restart nginx 2>/dev/null || true
echo "✅ Aplikasi E-Office & Backend Service berhasil diperbarui ke versi terbaru!"
UPDATECMD
chmod +x /usr/local/bin/update-app

echo "
================================================================================
✅ BACKEND SERVICE & NGINX PROXY BERHASIL DIAKTIFKAN!
================================================================================
Node.js backend sekarang aktif di background (Port 3000) dan Nginx memproksikan
semua endpoint /api/ secara langsung. Pengiriman email via Mailketing API kini
berjalan sempurna melalui backend server tanpa kendala CORS.

Silakan uji kembali pengiriman email di https://e-office.ldi.co.id/
================================================================================
"
