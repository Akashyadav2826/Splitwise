import { Router, Response } from 'express';
import pool from '../db/pool';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { calculateGroupBalances } from '../utils/balanceCalculator';

const router = Router();

router.get('/', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT g.id, g.name, g.created_by, g.created_at,
              COUNT(gm.user_id)::int AS member_count
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE g.id IN (
         SELECT group_id FROM group_members WHERE user_id = $1
       )
       GROUP BY g.id`,
      [req.userId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

router.post('/', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, memberIds } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const groupResult = await client.query(
      'INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING *',
      [name, req.userId]
    );
    const group = groupResult.rows[0];
    const allMembers: number[] = [req.userId!, ...((memberIds as number[]) || [])];
    const unique = [...new Set(allMembers)];
    for (const uid of unique) {
      await client.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [group.id, uid]);
    }
    await client.query('COMMIT');
    res.status(201).json(group);
  } catch {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to create group' });
  } finally {
    client.release();
  }
});

router.get('/:id', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = parseInt(req.params.id);
  try {
    const memberCheck = await pool.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.userId]
    );
    if (memberCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not a member of this group' });
      return;
    }
    const groupResult = await pool.query('SELECT * FROM groups WHERE id = $1', [groupId]);
    if (groupResult.rows.length === 0) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }
    const membersResult = await pool.query(
      `SELECT u.id, u.name, u.email FROM users u
       JOIN group_members gm ON gm.user_id = u.id
       WHERE gm.group_id = $1`,
      [groupId]
    );
    res.json({ ...groupResult.rows[0], members: membersResult.rows });
  } catch {
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

router.put('/:id', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = parseInt(req.params.id);
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  try {
    const result = await pool.query(
      'UPDATE groups SET name = $1 WHERE id = $2 AND created_by = $3 RETURNING *',
      [name, groupId, req.userId]
    );
    if (result.rows.length === 0) {
      res.status(403).json({ error: 'Not authorized or group not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update group' });
  }
});

router.delete('/:id', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = parseInt(req.params.id);
  try {
    const result = await pool.query(
      'DELETE FROM groups WHERE id = $1 AND created_by = $2 RETURNING id',
      [groupId, req.userId]
    );
    if (result.rows.length === 0) {
      res.status(403).json({ error: 'Not authorized or group not found' });
      return;
    }
    res.json({ message: 'Group deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

router.post('/:id/members', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = parseInt(req.params.id);
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }
  try {
    const memberCheck = await pool.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.userId]
    );
    if (memberCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not a member of this group' });
      return;
    }
    await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [groupId, userId]
    );
    res.status(201).json({ message: 'Member added' });
  } catch {
    res.status(500).json({ error: 'Failed to add member' });
  }
});

router.delete('/:id/members/:userId', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = parseInt(req.params.id);
  const targetUserId = parseInt(req.params.userId);
  try {
    const groupResult = await pool.query('SELECT created_by FROM groups WHERE id = $1', [groupId]);
    if (groupResult.rows.length === 0) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }
    const isCreator = groupResult.rows[0].created_by === req.userId;
    const isSelf = targetUserId === req.userId;
    if (!isCreator && !isSelf) {
      res.status(403).json({ error: 'Not authorized to remove this member' });
      return;
    }
    await pool.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, targetUserId]);
    res.json({ message: 'Member removed' });
  } catch {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

router.get('/:id/balances', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = parseInt(req.params.id);
  try {
    const memberCheck = await pool.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.userId]
    );
    if (memberCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not a member of this group' });
      return;
    }
    const balances = await calculateGroupBalances(groupId);
    res.json(balances);
  } catch {
    res.status(500).json({ error: 'Failed to calculate balances' });
  }
});

export default router;
