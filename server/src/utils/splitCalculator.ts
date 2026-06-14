export interface SplitInput {
  userId: number;
  value: number;
}

export interface SplitResult {
  userId: number;
  amount: number;
}

export function calculateSplits(
  total: number,
  splitType: 'equal' | 'exact' | 'percentage' | 'share',
  members: SplitInput[]
): SplitResult[] {
  if (members.length === 0) throw new Error('At least one member required');

  if (splitType === 'equal') {
    const base = Math.floor((total * 100) / members.length) / 100;
    const remainder = Math.round((total - base * members.length) * 100) / 100;
    return members.map((m, i) => ({
      userId: m.userId,
      amount: i === 0 ? Math.round((base + remainder) * 100) / 100 : base,
    }));
  }

  if (splitType === 'exact') {
    const sum = members.reduce((acc, m) => acc + m.value, 0);
    if (Math.abs(sum - total) > 0.01) throw new Error(`Exact amounts sum (${sum}) must equal total (${total})`);
    return members.map((m) => ({ userId: m.userId, amount: m.value }));
  }

  if (splitType === 'percentage') {
    const sum = members.reduce((acc, m) => acc + m.value, 0);
    if (Math.abs(sum - 100) > 0.01) throw new Error(`Percentages must sum to 100, got ${sum}`);
    const results = members.map((m) => ({
      userId: m.userId,
      amount: Math.round((m.value / 100) * total * 100) / 100,
    }));
    const computed = results.reduce((acc, r) => acc + r.amount, 0);
    const diff = Math.round((total - computed) * 100) / 100;
    results[0].amount = Math.round((results[0].amount + diff) * 100) / 100;
    return results;
  }

  if (splitType === 'share') {
    const totalShares = members.reduce((acc, m) => acc + m.value, 0);
    if (totalShares === 0) throw new Error('Total shares must be greater than 0');
    const results = members.map((m) => ({
      userId: m.userId,
      amount: Math.round(((m.value / totalShares) * total) * 100) / 100,
    }));
    const computed = results.reduce((acc, r) => acc + r.amount, 0);
    const diff = Math.round((total - computed) * 100) / 100;
    results[0].amount = Math.round((results[0].amount + diff) * 100) / 100;
    return results;
  }

  throw new Error('Invalid split_type');
}
