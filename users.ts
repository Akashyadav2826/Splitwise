import { Router, Response } from 'express';
import pool from '../db/pool';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { calculateGroupBalances } from '../utils/balanceCalculator';

const router = Router();

router.get('/search', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  const q = (req.query.q as string) || '';
  if (q.trim().length < 2) {
    res.json([]);
    return;
  }
  try {
    const result = await pool.query(
      `SELECT id, name, email FROM users WHERE name ILIKE $1 OR email ILIKE $1 LIMIT 20`,
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/me', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userResult = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.userId]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const groupsResult = await pool.query(
      'SELECT g.id FROM groups g JOIN group_members gm ON gm.group_id = g.id WHERE gm.user_id = $1',
      [req.userId]
    );
    const balanceSummary: { groupId: number; owes: unknown[]; owedBy: unknown[] }[] = [];
    for (const { id: groupId } of groupsResult.rows) {
      const groupBalances = await calculateGroupBalances(groupId);
      const mine = groupBalances.find((b) => b.userId === req.userId);
      if (mine) balanceSummary.push({ groupId, owes: mine.owes, owedBy: mine.owedBy });
    }
    res.json({ user: userResult.rows[0], balanceSummary });
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
