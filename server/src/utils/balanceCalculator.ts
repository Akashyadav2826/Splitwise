import pool from '../db/pool';

export interface UserBalance {
  userId: number;
  userName: string;
  owes: { userId: number; userName: string; amount: number }[];
  owedBy: { userId: number; userName: string; amount: number }[];
}

export async function calculateGroupBalances(groupId: number): Promise<UserBalance[]> {
  const expenseResult = await pool.query(
    `SELECT es.user_id AS debtor_id, e.paid_by_user_id AS creditor_id, es.amount
     FROM expense_splits es
     JOIN expenses e ON es.expense_id = e.id
     WHERE e.group_id = $1 AND es.user_id != e.paid_by_user_id`,
    [groupId]
  );

  const settlementResult = await pool.query(
    `SELECT payer_id, payee_id, amount FROM settlements WHERE group_id = $1`,
    [groupId]
  );

  const membersResult = await pool.query(
    `SELECT u.id, u.name FROM users u
     JOIN group_members gm ON gm.user_id = u.id
     WHERE gm.group_id = $1`,
    [groupId]
  );

  const net: Record<string, number> = {};

  const key = (a: number, b: number) => `${Math.min(a, b)}_${Math.max(a, b)}`;

  for (const row of expenseResult.rows) {
    const k = key(row.debtor_id, row.creditor_id);
    if (!net[k]) net[k] = 0;
    if (row.debtor_id < row.creditor_id) {
      net[k] -= parseFloat(row.amount);
    } else {
      net[k] += parseFloat(row.amount);
    }
  }

  for (const row of settlementResult.rows) {
    const k = key(row.payer_id, row.payee_id);
    if (!net[k]) net[k] = 0;
    if (row.payer_id < row.payee_id) {
      net[k] += parseFloat(row.amount);
    } else {
      net[k] -= parseFloat(row.amount);
    }
  }

  const userMap: Record<number, string> = {};
  for (const m of membersResult.rows) userMap[m.id] = m.name;

  const balances: Record<number, UserBalance> = {};
  for (const m of membersResult.rows) {
    balances[m.id] = { userId: m.id, userName: m.name, owes: [], owedBy: [] };
  }

  for (const [k, amount] of Object.entries(net)) {
    if (Math.abs(amount) < 0.01) continue;
    const [aStr, bStr] = k.split('_');
    const a = parseInt(aStr);
    const b = parseInt(bStr);
    const rounded = Math.round(Math.abs(amount) * 100) / 100;
    if (amount < 0) {
      if (balances[a]) balances[a].owes.push({ userId: b, userName: userMap[b], amount: rounded });
      if (balances[b]) balances[b].owedBy.push({ userId: a, userName: userMap[a], amount: rounded });
    } else {
      if (balances[b]) balances[b].owes.push({ userId: a, userName: userMap[a], amount: rounded });
      if (balances[a]) balances[a].owedBy.push({ userId: b, userName: userMap[b], amount: rounded });
    }
  }

  return Object.values(balances);
}
