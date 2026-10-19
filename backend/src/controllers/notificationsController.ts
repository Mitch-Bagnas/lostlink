import { Response } from 'express';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../types';

export async function markNotificationRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const notifId = req.params.id;

  try {
    // Verify notification belongs to an item owned by current user
    const checkSql = `
      SELECT n.id 
      FROM notifications n
      JOIN items i ON n.item_id = i.id
      WHERE n.id = $1 AND i.owner_id = $2
      LIMIT 1
    `;
    const checkResult = await query(checkSql, [notifId, userId]);

    if (checkResult.rowCount === 0) {
      res.status(404).json({ error: 'Notification not found or access denied.' });
      return;
    }

    await query('UPDATE notifications SET read = TRUE WHERE id = $1', [notifId]);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to update notification.' });
  }
}
