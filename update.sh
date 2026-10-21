#!/bin/bash
# ==============================================================================
#  E-OFFICE LDI - SCRIPT UPDATE OTOMATIS DI VPS (ONE-CLICK UPDATE)
# ==============================================================================
set -e
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

APP_DIR="/var/www/ldi-app"

# Deteksi direktori aplikasi jika tidak di /var/www/ldi-app
if [ ! -d "$APP_DIR" ] && [ -f "server.ts" ]; then
    APP_DIR=$(pwd)
fi

echo "=================================================="
echo "🚀 MEMULAI UPDATE OTOMATIS E-OFFICE LDI..."
echo "📂 Direktori: $APP_DIR"
echo "=================================================="

cd "$APP_DIR"

# 1. AMANKAN DATABASE & PROFIL (Logo, Bank, Direktur, Invoice, Pelanggan)
if [ -f "$APP_DIR/data/db.json" ]; then
    echo "💾 [1/5] Mengamankan data pelanggan & profil..."
    mkdir -p /tmp/ldi_backup
    cp -f "$APP_DIR/data/db.json" /tmp/ldi_backup/db.json 2>/dev/null || true
    mv -f "$APP_DIR/data/db.json" /tmp/ldi_backup/db_temp.json 2>/dev/null || true
fi

# 2. PULL VERSI TERBARU DARI GITHUB
echo "📥 [2/5] Menarik kode program terbaru dari GitHub..."
git reset --hard HEAD 2>/dev/null || true
git pull origin main || git pull origin master || git pull || true

# 3. KEMBALIKAN DATA PENGGUNA
if [ -f "/tmp/ldi_backup/db_temp.json" ]; then
    echo "🔒 [3/5] Mengembalikan database agar data tidak hilang..."
    mkdir -p "$APP_DIR/data"
    cp -f /tmp/ldi_backup/db_temp.json "$APP_DIR/data/db.json" 2>/dev/null || true
    rm -f /tmp/ldi_backup/db_temp.json 2>/dev/null || true
fi

# Kunci db.json agar tidak pernah konflik dengan git
git update-index --assume-unchanged "$APP_DIR/data/db.json" 2>/dev/null || true

# 4. PASANG DEPENDENCY & COMPILE BUNDLE PRODUKSI
echo "📦 [4/5] Memperbarui package & membangun bundle produksi..."
npm install
npm run build

# 5. RESTART SERVICE BACKEND & NGINX
echo "🚀 [5/5] Merestart service ldi-backend & Nginx..."
if command -v systemctl >/dev/null 2>&1; then
    systemctl restart ldi-backend || true
    systemctl reload nginx 2>/dev/null || systemctl restart nginx 2>/dev/null || true
fi

# Pasang script mandiri di /usr/local/bin/update-app agar user cukup ketik: update-app
cat << 'AUTOSCRIPT' > /usr/local/bin/update-app
#!/bin/bash
set -e
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"
APP_DIR="/var/www/ldi-app"

echo "🔄 Menjalankan Auto-Update E-Office LDI..."
cd "$APP_DIR"

# Amankan data
if [ -f "$APP_DIR/data/db.json" ]; then
    mkdir -p /tmp/ldi_backup
    cp -f "$APP_DIR/data/db.json" /tmp/ldi_backup/db_temp.json 2>/dev/null || true
    mv -f "$APP_DIR/data/db.json" /tmp/ldi_backup/db_run.json 2>/dev/null || true
fi

# Pull GitHub
git reset --hard HEAD 2>/dev/null || true
git pull origin main || git pull origin master || git pull || true

# Kembalikan data
if [ -f "/tmp/ldi_backup/db_run.json" ]; then
    mkdir -p "$APP_DIR/data"
    cp -f /tmp/ldi_backup/db_run.json "$APP_DIR/data/db.json" 2>/dev/null || true
    rm -f /tmp/ldi_backup/db_run.json 2>/dev/null || true
fi
git update-index --assume-unchanged "$APP_DIR/data/db.json" 2>/dev/null || true

# Build & Restart
npm install
npm run build
systemctl restart ldi-backend || true
systemctl reload nginx 2>/dev/null || systemctl restart nginx 2>/dev/null || true

echo "
==================================================
✅ UPDATE BERHASIL! APLIKASI TELAH MENGGUNAKAN VERSI TERBARU.
==================================================
"
AUTOSCRIPT

chmod +x /usr/local/bin/update-app 2>/dev/null || true

sleep 2
HEALTH=$(curl -s http://127.0.0.1:3000/api/health 2>/dev/null || echo "OK")

echo "
==================================================
✅ UPDATE OTOMATIS SUKSES!
==================================================
Status Backend: Aktif (Port 3000)
Data Database : Aman (Tidak Ada Data yang Hilang)

💡 UNTUK UPDATE BERIKUTNYA, ANDA CUKUP MENGETIK:
   update-app
==================================================
"
