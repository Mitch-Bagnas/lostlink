import { Response } from 'express';
import { pool, query } from '../config/db';
import { AuthenticatedRequest, Item, ItemWithNotificationStats, Notification } from '../types';

export async function listItems(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  try {
    const sql = `
      SELECT 
        i.*,
        COALESCE(COUNT(n.id), 0)::int AS total_notifications_count,
        COALESCE(SUM(CASE WHEN n.read = FALSE THEN 1 ELSE 0 END), 0)::int AS unread_notifications_count
      FROM items i
      LEFT JOIN notifications n ON i.id = n.item_id
      WHERE i.owner_id = $1
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `;

    const result = await query<ItemWithNotificationStats>(sql, [userId]);
    res.status(200).json({ items: result.rows });
  } catch (error) {
    console.error('List items error:', error);
    res.status(500).json({ error: 'Failed to retrieve registered items.' });
  }
}

export async function createItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { name, category, description, contact_method } = req.body;

  // Use a transaction to atomically lock user & count items, preventing race condition bypass
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock user row to get current subscription status
    const userResult = await client.query(
      'SELECT is_premium FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );

    if (userResult.rowCount === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    const isPremium = userResult.rows[0].is_premium;

    // 2. Count current active items
    const countResult = await client.query(
      'SELECT COUNT(*)::int AS count FROM items WHERE owner_id = $1',
      [userId]
    );
    const currentItemCount = countResult.rows[0].count;

    // 3. Enforce 3-item limit on Free accounts
    if (!isPremium && currentItemCount >= 3) {
      await client.query('ROLLBACK');
      res.status(403).json({
        error: 'FREE_TIER_LIMIT_REACHED',
        message: 'Free tier accounts are limited to 3 items. Please upgrade to LostLink Premium for unlimited items.',
      });
      return;
    }

    // 4. Enforce contact method restriction
    const finalContactMethod = contact_method || 'email';
    if (finalContactMethod === 'email+phone' && !isPremium) {
      await client.query('ROLLBACK');
      res.status(403).json({
        error: 'PREMIUM_FEATURE_REQUIRED',
        message: 'SMS and phone notifications require a LostLink Premium subscription.',
      });
      return;
    }

    // 5. Insert new item with automatic UUID for id and qr_id
    const insertSql = `
      INSERT INTO items (owner_id, name, category, description, contact_method, status)
      VALUES ($1, $2, $3, $4, $5, 'safe')
      RETURNING *
    `;
    const insertResult = await client.query<Item>(insertSql, [
      userId,
      name,
      category,
      description || null,
      finalContactMethod,
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Item registered successfully',
      item: insertResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Create item transaction error:', error);
    res.status(500).json({ error: 'Failed to register item.' });
  } finally {
    client.release();
  }
}

export async function getItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const itemId = req.params.id;

  try {
    const itemResult = await query<Item>(
      'SELECT * FROM items WHERE id = $1 AND owner_id = $2 LIMIT 1',
      [itemId, userId]
    );

    if (itemResult.rowCount === 0) {
      res.status(404).json({ error: 'Item not found or you do not have permission to view it.' });
      return;
    }

    const notifResult = await query<Notification>(
      'SELECT * FROM notifications WHERE item_id = $1 ORDER BY created_at DESC',
      [itemId]
    );

    res.status(200).json({
      item: itemResult.rows[0],
      notifications: notifResult.rows,
    });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Failed to retrieve item.' });
  }
}

export async function updateItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const itemId = req.params.id;
  const { name, category, description, contact_method } = req.body;

  try {
    // 1. Verify item ownership & retrieve current status
    const existing = await query<Item>(
      'SELECT id, owner_id FROM items WHERE id = $1 AND owner_id = $2 LIMIT 1',
      [itemId, userId]
    );

    if (existing.rowCount === 0) {
      res.status(404).json({ error: 'Item not found or you do not have permission to edit it.' });
      return;
    }

    // 2. Check premium requirement for email+phone
    if (contact_method === 'email+phone' && !req.user!.is_premium) {
      res.status(403).json({
        error: 'PREMIUM_FEATURE_REQUIRED',
        message: 'SMS and phone notifications require a LostLink Premium subscription.',
      });
      return;
    }

    // 3. Build dynamic update query
    const fields: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let idx = 1;

    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (category !== undefined) {
      fields.push(`category = $${idx++}`);
      values.push(category);
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(description);
    }
    if (contact_method !== undefined) {
      fields.push(`contact_method = $${idx++}`);
      values.push(contact_method);
    }

    values.push(itemId);
    values.push(userId);

    const updateSql = `
      UPDATE items
      SET ${fields.join(', ')}
      WHERE id = $${idx++} AND owner_id = $${idx}
      RETURNING *
    `;

    const result = await query<Item>(updateSql, values);
    res.status(200).json({
      message: 'Item updated successfully',
      item: result.rows[0],
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Failed to update item.' });
  }
}

export async function deleteItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const itemId = req.params.id;

  try {
    const result = await query(
      'DELETE FROM items WHERE id = $1 AND owner_id = $2 RETURNING id',
      [itemId, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Item not found or you do not have permission to delete it.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Item and associated notification history deleted successfully.',
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Failed to delete item.' });
  }
}

export async function updateItemStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const itemId = req.params.id;
  const { status } = req.body;

  try {
    const result = await query<Item>(
      'UPDATE items SET status = $1, updated_at = NOW() WHERE id = $2 AND owner_id = $3 RETURNING *',
      [status, itemId, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Item not found or you do not have permission to update it.' });
      return;
    }

    res.status(200).json({
      message: `Item status updated to ${status}.`,
      item: result.rows[0],
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update item status.' });
  }
}
