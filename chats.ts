import { Router, Response } from 'express';
import pool from '../db/pool';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { getIO } from '../socket';

const router = Router({ mergeParams: true });

router.get('/', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  const expenseId = parseInt(req.params.expenseId);
  try {
    const result = await pool.query(
      `SELECT c.*, u.name AS user_name FROM chats c
       JOIN users u ON u.id = c.user_id
       WHERE c.expense_id=$1 ORDER BY c.created_at ASC LIMIT 100`,
      [expenseId]
    );
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Failed to fetch chats' }); }
});

router.post('/', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  const expenseId = parseInt(req.params.expenseId);
  const { message } = req.body;
  if (!message || !message.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }
  try {
    const result = await pool.query(
      'INSERT INTO chats (expense_id, user_id, message) VALUES ($1,$2,$3) RETURNING *',
      [expenseId, req.userId, message.trim()]
    );
    const chat = result.rows[0];
    const userResult = await pool.query('SELECT name FROM users WHERE id=$1', [req.userId]);
    const payload = { ...chat, user_name: userResult.rows[0]?.name };
    const io = getIO();
    io.to(`expense:${expenseId}`).emit('new_message', payload);
    res.status(201).json(payload);
  } catch { res.status(500).json({ error: 'Failed to send message' }); }
});

export default router;
