import { Router, Response } from 'express';
import pool from '../db/pool';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { calculateSplits, SplitInput } from '../utils/splitCalculator';

const router = Router({ mergeParams: true });

router.get('/', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = parseInt(req.params.groupId);
  try {
    const check = await pool.query('SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2', [groupId, req.userId]);
    if (check.rows.length === 0) { res.status(403).json({ error: 'Not a member' }); return; }
    const result = await pool.query(
      `SELECT e.*, u.name AS paid_by_name FROM expenses e
       JOIN users u ON u.id = e.paid_by_user_id
       WHERE e.group_id = $1 ORDER BY e.created_at DESC`,
      [groupId]
    );
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Failed to fetch expenses' }); }
});

router.post('/', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = parseInt(req.params.groupId);
  const { paidByUserId, amount, description, splitType, members } = req.body;
  if (!paidByUserId || !amount || !description || !splitType || !members) {
    res.status(400).json({ error: 'paidByUserId, amount, description, splitType, members required' });
    return;
  }
  const check = await pool.query('SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2', [groupId, req.userId]);
  if (check.rows.length === 0) { res.status(403).json({ error: 'Not a member' }); return; }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const splits = calculateSplits(parseFloat(amount), splitType, members as SplitInput[]);
    const expResult = await client.query(
      'INSERT INTO expenses (group_id, paid_by_user_id, amount, description, split_type) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [groupId, paidByUserId, amount, description, splitType]
    );
    const expense = expResult.rows[0];
    for (const s of splits) {
      await client.query(
        'INSERT INTO expense_splits (expense_id, user_id, amount) VALUES ($1,$2,$3)',
        [expense.id, s.userId, s.amount]
      );
    }
    await client.query('COMMIT');
    res.status(201).json(expense);
  } catch (err) {
    await client.query('ROLLBACK');
    const msg = err instanceof Error ? err.message : 'Failed to create expense';
    res.status(400).json({ error: msg });
  } finally { client.release(); }
});

router.get('/:expenseId', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = parseInt(req.params.groupId);
  const expenseId = parseInt(req.params.expenseId);
  try {
    const check = await pool.query('SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2', [groupId, req.userId]);
    if (check.rows.length === 0) { res.status(403).json({ error: 'Not a member' }); return; }
    const expResult = await pool.query(
      `SELECT e.*, u.name AS paid_by_name FROM expenses e
       JOIN users u ON u.id = e.paid_by_user_id WHERE e.id=$1 AND e.group_id=$2`,
      [expenseId, groupId]
    );
    if (expResult.rows.length === 0) { res.status(404).json({ error: 'Expense not found' }); return; }
    const splitsResult = await pool.query(
      `SELECT es.*, u.name AS user_name FROM expense_splits es
       JOIN users u ON u.id = es.user_id WHERE es.expense_id=$1`,
      [expenseId]
    );
    res.json({ ...expResult.rows[0], splits: splitsResult.rows });
  } catch { res.status(500).json({ error: 'Failed to fetch expense' }); }
});

router.put('/:expenseId', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = parseInt(req.params.groupId);
  const expenseId = parseInt(req.params.expenseId);
  const { paidByUserId, amount, description, splitType, members } = req.body;
  if (!paidByUserId || !amount || !description || !splitType || !members) {
    res.status(400).json({ error: 'All fields required' });
    return;
  }
  const check = await pool.query('SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2', [groupId, req.userId]);
  if (check.rows.length === 0) { res.status(403).json({ error: 'Not a member' }); return; }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const splits = calculateSplits(parseFloat(amount), splitType, members as SplitInput[]);
    const expResult = await client.query(
      `UPDATE expenses SET paid_by_user_id=$1, amount=$2, description=$3, split_type=$4
       WHERE id=$5 AND group_id=$6 RETURNING *`,
      [paidByUserId, amount, description, splitType, expenseId, groupId]
    );
    if (expResult.rows.length === 0) { await client.query('ROLLBACK'); res.status(404).json({ error: 'Expense not found' }); return; }
    await client.query('DELETE FROM expense_splits WHERE expense_id=$1', [expenseId]);
    for (const s of splits) {
      await client.query('INSERT INTO expense_splits (expense_id, user_id, amount) VALUES ($1,$2,$3)', [expenseId, s.userId, s.amount]);
    }
    await client.query('COMMIT');
    res.json(expResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    const msg = err instanceof Error ? err.message : 'Failed to update expense';
    res.status(400).json({ error: msg });
  } finally { client.release(); }
});

router.delete('/:expenseId', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = parseInt(req.params.groupId);
  const expenseId = parseInt(req.params.expenseId);
  try {
    const check = await pool.query('SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2', [groupId, req.userId]);
    if (check.rows.length === 0) { res.status(403).json({ error: 'Not a member' }); return; }
    const result = await pool.query('DELETE FROM expenses WHERE id=$1 AND group_id=$2 RETURNING id', [expenseId, groupId]);
    if (result.rows.length === 0) { res.status(404).json({ error: 'Expense not found' }); return; }
    res.json({ message: 'Expense deleted' });
  } catch { res.status(500).json({ error: 'Failed to delete expense' }); }
});

export default router;
