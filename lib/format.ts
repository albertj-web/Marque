export function formatKES(amount: number | null | undefined): string {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatKESCompact(
  amount: number | null | undefined,
): string {
  const value = Number(amount) || 0;
  if (value >= 1_000_000) {
    return `KES ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `KES ${(value / 1_000).toFixed(0)}K`;
  }
  return formatKES(value);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateLong(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const ones = [
  'Zero',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];
const tens = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function twoDigits(n: number): string {
  if (n < 20) return ones[n];
  return `${tens[Math.floor(n / 10)]}${n % 10 ? `-${ones[n % 10]}` : ''}`;
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  let result = '';
  if (h > 0) result += `${ones[h]} Hundred`;
  if (r > 0) result += `${h > 0 ? ' and ' : ''}${twoDigits(r)}`;
  return result;
}

export function numberToWords(num: number): string {
  const n = Math.round(num);
  if (n === 0) return 'Zero';

  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const remainder = n % 1000;
  const cents = Math.round((num - n) * 100);

  let words = '';
  if (millions > 0) words += `${threeDigits(millions)} Million`;
  if (thousands > 0) words += `${words ? ' ' : ''}${threeDigits(thousands)} Thousand`;
  if (remainder > 0) words += `${words ? ' ' : ''}${threeDigits(remainder)}`;

  if (cents > 0) {
    words += ` and ${twoDigits(cents)} Cents`;
  }
  return words;
}

export function priceToWords(amount: number): string {
  return `${numberToWords(amount)} Kenya Shillings Only`;
}

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    import: 'Import',
    'private-sale': 'Private Sale',
    rental: 'Rental',
    motorbike: 'Motorbike',
  };
  return labels[category] || category;
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: 'Available',
    reserved: 'Reserved',
    sold: 'Sold',
    rented: 'Rented',
    active: 'Active',
    completed: 'Completed',
    defaulted: 'Defaulted',
  };
  return labels[status] || status;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    reserved: 'bg-amber-100 text-amber-700 border-amber-200',
    sold: 'bg-stone-200 text-stone-600 border-stone-300',
    rented: 'bg-blue-100 text-blue-700 border-blue-200',
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    completed: 'bg-stone-200 text-stone-600 border-stone-300',
    defaulted: 'bg-red-100 text-red-700 border-red-200',
  };
  return colors[status] || 'bg-stone-100 text-stone-600 border-stone-200';
}
