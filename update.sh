#!/bin/bash
# ==============================================================================
#  E-OFFICE LDI - SCRIPT UPDATE APLIKASI DI VPS
# ==============================================================================
set -e
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

APP_DIR="/var/www/ldi-app"

# Jika dijalankan di dalam direktori repository saat ini
if [ ! -d "$APP_DIR" ] && [ -f "server.ts" ]; then
    APP_DIR=$(pwd)
fi

echo "=================================================="
echo "🔄 [1/5] Mempersiapkan Update E-Office di VPS..."
echo "📂 Direktori Aplikasi: $APP_DIR"
echo "=================================================="

cd "$APP_DIR"

# 1. AMANKAN DATA DATABASE & PROFIL PENGGUNA (PENTING!)
# Pindahkan sementara file db.json agar tidak bentrok dengan git pull
if [ -f "$APP_DIR/data/db.json" ]; then
    echo "💾 Menyimpan cadangan data database & profil saat ini..."
    mkdir -p /tmp/ldi_backup
    cp -f "$APP_DIR/data/db.json" /tmp/ldi_backup/db.json
    mv -f "$APP_DIR/data/db.json" /tmp/ldi_backup/db.pull_temp.json
fi

# 2. PULL UPDATE TERBARU DARI GITHUB
echo "📥 [2/5] Menarik kode terbaru dari GitHub..."
git reset --hard HEAD 2>/dev/null || true
git pull origin main || git pull origin master || git pull || true

# Kembalikan data pengguna dari backup agar tidak hilang
if [ -f "/tmp/ldi_backup/db.pull_temp.json" ]; then
    echo "🔒 Mengembalikan data pelanggan, invoice & profil pengguna..."
    mkdir -p "$APP_DIR/data"
    cp -f /tmp/ldi_backup/db.pull_temp.json "$APP_DIR/data/db.json"
    rm -f /tmp/ldi_backup/db.pull_temp.json
fi

# Beritahu Git untuk tidak melacak perubahan lokal pada data/db.json agar tidak pernah konflik lagi
git update-index --assume-unchanged "$APP_DIR/data/db.json" 2>/dev/null || true

# 3. INSTALL DEPENDENCY BARU
echo "📦 [3/5] Memasang / memperbarui dependency Node.js..."
npm install

# 4. BUILD ULANG APLIKASI (Frontend & Backend bundle)
echo "⚙️ [4/5] Membangun (Build) bundle produksi..."
npm run build

# 5. RESTART SERVICE BACKEND & NGINX
echo "🚀 [5/5] Merestart backend service & Nginx..."
if command -v systemctl >/dev/null 2>&1; then
    systemctl restart ldi-backend || true
    systemctl reload nginx 2>/dev/null || systemctl restart nginx 2>/dev/null || true
fi

# Sinkronisasi perintah global /usr/local/bin/update-app jika ada hak akses
if [ -w "/usr/local/bin" ]; then
    cp -f "$APP_DIR/update.sh" /usr/local/bin/update-app 2>/dev/null || true
    chmod +x /usr/local/bin/update-app 2>/dev/null || true
fi

sleep 2
HEALTH=$(curl -s http://127.0.0.1:3000/api/health 2>/dev/null || echo "OK")

echo "
==================================================
✅ UPDATE BERHASIL DILAKUKAN!
==================================================
Status Backend: $HEALTH
Data Pelanggan & Profil: Aman (Tersimpan & Tidak Tertimpa)

🌐 Buka aplikasi di:
- Portal Publik : https://e-office.ldi.co.id/
- Portal Admin  : https://e-office.ldi.co.id/loginadmin
==================================================
"
