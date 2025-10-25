export function monthKey(d = new Date()) {
  const year = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${m}`;
}

export function ymFromDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return monthKey(d);
}

export function sumByMonth(items) {
  const map = new Map();
  for (const it of items) {
    const key = ymFromDate(it.date);
    if (!key) continue;
    const v = (map.get(key) || 0) + (Number(it.amount) || 0);
    map.set(key, v);
  }
  return map; // Map<YYYY-MM, number>
}

export function categorySumsThisMonth(expenses, current = monthKey()) {
  const sums = new Map();
  for (const e of expenses) {
    const k = ymFromDate(e.date);
    if (k !== current) continue;
    const cat = e.category || 'Other';
    sums.set(cat, (sums.get(cat) || 0) + (Number(e.amount) || 0));
  }
  return sums; // Map<Category, number>
}

export function totalExpensesThisMonth(expenses, current = monthKey()) {
  let total = 0;
  for (const e of expenses) {
    const k = ymFromDate(e.date);
    if (k !== current) continue;
    total += Number(e.amount) || 0;
  }
  return total;
}

