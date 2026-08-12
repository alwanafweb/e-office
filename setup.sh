#!/bin/bash
# ==============================================================================
#  E-OFFICE LDI MANAGEMENT SYSTEM - AUTOMATED VPS INSTALLER (DEBIAN 12)
# ==============================================================================
set -e

# Trap error handler untuk laporan baris error jika terjadi kegagalan
trap 'echo "❌ [ERROR] Instalasi gagal pada baris $LINENO. Silakan periksa log di atas."; exit 1' ERR

# Non-interactive mode agar tidak muncul prompt dialog saat instalasi
export DEBIAN_FRONTEND=noninteractive

echo "🚀 [1/5] Memperbarui Repositori Paket & Memasang Dependency Debian 12..."

# Fungsi Pengecekan Lock APT / DPKG agar instalasi aman & tidak bentrok
wait_for_apt_lock() {
    echo "🔍 Memeriksa status lock APT/DPKG..."
    local MAX_RETRY=20
    local COUNT=0
    while pgrep -f "apt|dpkg" >/dev/null 2>&1 || [ -f /var/lib/dpkg/lock-frontend ] || [ -f /var/lib/apt/lists/lock ]; do
        if ! pgrep -f "apt-get|dpkg|apt" >/dev/null 2>&1; then
            echo "⚠️ Lock file lama (stale) terdeteksi tanpa proses aktif. Membersihkan lock..."
            rm -f /var/lib/apt/lists/lock /var/lib/dpkg/lock /var/lib/dpkg/lock-frontend /var/cache/apt/archives/lock
            dpkg --configure -a || true
            break
        fi
        COUNT=$((COUNT + 1))
        if [ "$COUNT" -gt "$MAX_RETRY" ]; then
            echo "⚠️ Lock APT berlangsung terlalu lama. Melepaskan lock secara otomatis..."
            killall apt apt-get dpkg 2>/dev/null || true
            rm -f /var/lib/apt/lists/lock /var/lib/dpkg/lock /var/lib/dpkg/lock-frontend /var/cache/apt/archives/lock
            dpkg --configure -a || true
            break
        fi
        echo "⏳ APT sedang digunakan oleh proses latar belakang. Menunggu 3 detik ($COUNT/$MAX_RETRY)..."
        sleep 3
    done
}

wait_for_apt_lock

# Perbaiki sources.list jika kosong, terpotong, atau menunjuk cdrom
mkdir -p /etc/apt
cat << 'SOURCES' > /etc/apt/sources.list
deb http://deb.debian.org/debian bookworm main contrib non-free non-free-firmware
deb http://deb.debian.org/debian-security bookworm-security main contrib non-free non-free-firmware
deb http://deb.debian.org/debian bookworm-updates main contrib non-free non-free-firmware
SOURCES

# 2. Explicit apt-get update with || true to avoid failure on initial runs
echo "🔄 Menjalankan apt-get update..."
wait_for_apt_lock
apt-get clean || true
apt-get update -y || true

# 3. Install required packages using apt-get install -y --no-install-recommends git curl nginx unzip build-essential
echo "📦 Memasang paket esensial (git, curl, nginx, unzip, build-essential)..."
wait_for_apt_lock
apt-get install -y --no-install-recommends git curl nginx unzip build-essential ufw || \
apt-get install -y --no-install-recommends git curl nginx unzip build-essential

# 4. Logic to verify installation of each tool
echo "🔍 Verifikasi instalasi alat yang dibutuhkan..."
REQUIRED_TOOLS=("git" "curl" "nginx" "unzip" "make" "gcc")
for tool in "${REQUIRED_TOOLS[@]}"; do
    if command -v "$tool" >/dev/null 2>&1; then
        echo "  ✅ $tool: Terinstall ($(command -v "$tool"))"
    else
        echo "  ❌ $tool: Gagal terinstall!"
        exit 1
    fi
done

echo "📦 [2/5] Memasang Node.js 20 LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y --no-install-recommends nodejs
fi

if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    echo "  ✅ Node.js: $(node -v) & NPM: $(npm -v)"
else
    echo "  ❌ Node.js / NPM gagal terinstall!"
    exit 1
fi

echo "📥 [3/5] Mengunduh Repository Aplikasi (alwanafweb/e-office)..."
rm -rf /var/www/ldi-app
mkdir -p /var/www/ldi-app
git clone https://github.com/alwanafweb/e-office.git /var/www/ldi-app

cd /var/www/ldi-app
echo "⚙️ [4/5] Memasang Dependency NPM & Membangun Proyek..."
npm install
npm run build

echo "🌐 [5/5] Mengonfigurasi Nginx Web Server..."
cat << 'NGINX' > /etc/nginx/sites-available/ldi-app
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
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

ln -sf /etc/nginx/sites-available/ldi-app /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx || systemctl reload nginx

# Menyiapkan perintah pembaruan otomatis di VPS
cat << 'UPDATECMD' > /usr/local/bin/update-app
#!/bin/bash
set -e
echo "🔄 Memperbarui Aplikasi E-Office dari GitHub..."
cd /var/www/ldi-app
git pull origin main || git pull origin master
npm install
npm run build
systemctl reload nginx
echo "✅ Aplikasi E-Office berhasil diperbarui ke versi terbaru!"
UPDATECMD
chmod +x /usr/local/bin/update-app

IP_ADDRESS=$(curl -s ifconfig.me || echo "IP_VPS_ANDA")

# 5. Instructions & Echo back completion status
echo "
==================================================
✅ INSTALASI VPS DEBIAN 12 SUKSES & AKTIF!
==================================================
📱 Portal Publik : http://${IP_ADDRESS}/
🔐 Portal Admin  : http://${IP_ADDRESS}/loginadmin

Status Komponen:
  • Git             : OK
  • Curl            : OK
  • Nginx           : Running
  • Unzip           : OK
  • Build Essential : OK
  • Node.js         : OK ($(node -v))

🔄 Cara Update Nanti (setelah push ke GitHub):
Ketik 'update-app' di terminal VPS Anda.
==================================================
"
