export const formatIDR = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDateIndonesian = (dateString: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

export const generateDocNumber = (prefix: 'INV' | 'SPH' | 'PKS', sequence: number = 1): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const seqStr = String(sequence).padStart(3, '0');
  return `${prefix}/LDI/${year}/${month}/${seqStr}`;
};

export const getMonthName = (monthIndex: number): string => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[monthIndex] || '';
};

// Spell out numbers in Indonesian (Terbilang) for Invoice totals
export const terbilang = (n: number): string => {
  const angka = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan',
    'Sepuluh', 'Sebelas'
  ];

  if (n < 12) return angka[n];
  if (n < 20) return terbilang(n - 10) + ' Belas';
  if (n < 100) return terbilang(Math.floor(n / 10)) + ' Puluh ' + terbilang(n % 10);
  if (n < 200) return 'Seratus ' + terbilang(n - 100);
  if (n < 1000) return terbilang(Math.floor(n / 100)) + ' Ratus ' + terbilang(n % 100);
  if (n < 2000) return 'Seribu ' + terbilang(n - 1000);
  if (n < 1000000) return terbilang(Math.floor(n / 1000)) + ' Ribu ' + terbilang(n % 1000);
  if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + ' Juta ' + terbilang(n % 1000000);
  if (n < 1000000000000) return terbilang(Math.floor(n / 1000000000)) + ' Milyar ' + terbilang(n % 1000000000);
  return 'Sangat Besar';
};

export const terbilangRupiah = (amount: number): string => {
  if (amount === 0) return 'Nol Rupiah';
  const clean = Math.floor(Math.abs(amount));
  const text = terbilang(clean).replace(/\s+/g, ' ').trim();
  return text + ' Rupiah';
};
