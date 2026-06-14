import { Router, Response } from 'express';
import pool from '../db/pool';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.post('/', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = parseInt(req.params.groupId);
  const { payerId, payeeId, amount } = req.body;
  if (!payerId || !payeeId || !amount) {
    res.status(400).json({ error: 'payerId, payeeId, amount required' });
    return;
  }
  try {
    const check = await pool.query('SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2', [groupId, req.userId]);
    if (check.rows.length === 0) { res.status(403).json({ error: 'Not a member' }); return; }
    const result = await pool.query(
      'INSERT INTO settlements (payer_id, payee_id, group_id, amount) VALUES ($1,$2,$3,$4) RETURNING *',
      [payerId, payeeId, groupId, amount]
    );
    res.status(201).json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Failed to record settlement' }); }
});

router.get('/', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = parseInt(req.params.groupId);
  try {
    const check = await pool.query('SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2', [groupId, req.userId]);
    if (check.rows.length === 0) { res.status(403).json({ error: 'Not a member' }); return; }
    const result = await pool.query(
      `SELECT s.*, p.name AS payer_name, pe.name AS payee_name
       FROM settlements s
       JOIN users p ON p.id = s.payer_id
       JOIN users pe ON pe.id = s.payee_id
       WHERE s.group_id=$1 ORDER BY s.created_at DESC`,
      [groupId]
    );
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Failed to fetch settlements' }); }
});

export default router;
