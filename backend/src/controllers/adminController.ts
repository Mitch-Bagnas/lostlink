import { Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { pool, query } from '../config/db';
import { AuthenticatedRequest, SafeUser, User } from '../types';
import { recordAuditLog } from '../services/auditService';

function escapeLikePattern(term: string): string {
  return term.replace(/[%_\\]/g, '\\$&');
}

function toSafeUser(user: any): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    is_premium: user.is_premium,
    role: user.role,
    status: user.status,
    suspended_reason: user.suspended_reason,
    must_change_password: user.must_change_password,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
    password_changed_at: user.password_changed_at,
  };
}

/**
 * GET /api/admin/stats
 * Aggregated analytics and 30-day signup trend.
 */
export async function getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const [
      usersCount,
      premiumCount,
      suspendedCount,
      itemsCount,
      lostCount,
      notifs7d,
      notifs30d,
      signupsTrend,
    ] = await Promise.all([
      query('SELECT COUNT(*)::int as count FROM users'),
      query('SELECT COUNT(*)::int as count FROM users WHERE is_premium = TRUE'),
      query("SELECT COUNT(*)::int as count FROM users WHERE status = 'suspended'"),
      query('SELECT COUNT(*)::int as count FROM items'),
      query("SELECT COUNT(*)::int as count FROM items WHERE status = 'lost'"),
      query("SELECT COUNT(*)::int as count FROM notifications WHERE created_at >= NOW() - INTERVAL '7 days'"),
      query("SELECT COUNT(*)::int as count FROM notifications WHERE created_at >= NOW() - INTERVAL '30 days'"),
      query(`
        SELECT 
          to_char(date_trunc('day', d), 'YYYY-MM-DD') as date,
          count(u.id)::int as count
        FROM generate_series(NOW() - INTERVAL '29 days', NOW(), '1 day'::interval) d
        LEFT JOIN users u ON date_trunc('day', u.created_at) = date_trunc('day', d)
        GROUP BY d
        ORDER BY d ASC
      `),
    ]);

    res.status(200).json({
      totalUsers: usersCount.rows[0].count,
      premiumUsers: premiumCount.rows[0].count,
      suspendedUsers: suspendedCount.rows[0].count,
      totalItems: itemsCount.rows[0].count,
      lostItems: lostCount.rows[0].count,
      notifications7d: notifs7d.rows[0].count,
      notifications30d: notifs30d.rows[0].count,
      signupsPerDay: signupsTrend.rows,
    });
  } catch (error) {
    console.error('Admin getStats error:', error);
    res.status(500).json({ error: 'Failed to retrieve administrative statistics.' });
  }
}

/**
 * GET /api/admin/users
 * Searchable, filterable, paginated user list.
 */
export async function getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const role = req.query.role as string | undefined;
    const premium = req.query.premium as string | undefined;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (search && search.trim()) {
      const escaped = escapeLikePattern(search.trim());
      conditions.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx})`);
      values.push(`%${escaped}%`);
      idx++;
    }

    if (status && (status === 'active' || status === 'suspended')) {
      conditions.push(`u.status = $${idx}`);
      values.push(status);
      idx++;
    }

    if (role && (role === 'user' || role === 'admin')) {
      conditions.push(`u.role = $${idx}`);
      values.push(role);
      idx++;
    }

    if (premium !== undefined && (premium === 'true' || premium === 'false')) {
      conditions.push(`u.is_premium = $${idx}`);
      values.push(premium === 'true');
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*)::int as total FROM users u ${whereClause}`,
      values
    );
    const total = countResult.rows[0].total;

    values.push(limit, offset);
    const usersResult = await query(
      `SELECT 
        u.id, u.name, u.email, u.phone, u.is_premium, u.role, u.status, 
        u.suspended_reason, u.must_change_password, u.last_login_at, u.created_at,
        (SELECT COUNT(*)::int FROM items WHERE owner_id = u.id) as items_count
       FROM users u
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );

    res.status(200).json({
      users: usersResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Admin getUsers error:', error);
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
}

/**
 * GET /api/admin/users/:id
 * Detailed user inspection including items and recent notifications.
 */
export async function getUserDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
  const targetId = req.params.id;

  try {
    const userResult = await query(
      `SELECT id, name, email, phone, is_premium, role, status, suspended_reason, must_change_password, last_login_at, created_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [targetId]
    );

    if (userResult.rowCount === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const [itemsResult, notifsResult] = await Promise.all([
      query(
        `SELECT id, qr_id, name, category, status, contact_method, created_at
         FROM items
         WHERE owner_id = $1
         ORDER BY created_at DESC`,
        [targetId]
      ),
      query(
        `SELECT n.id, n.finder_message, n.finder_contact, n.created_at, n.read, i.name as item_name, i.qr_id
         FROM notifications n
         JOIN items i ON n.item_id = i.id
         WHERE i.owner_id = $1
         ORDER BY n.created_at DESC
         LIMIT 20`,
        [targetId]
      ),
    ]);

    res.status(200).json({
      user: userResult.rows[0],
      items: itemsResult.rows,
      notifications: notifsResult.rows,
    });
  } catch (error) {
    console.error('Admin getUserDetail error:', error);
    res.status(500).json({ error: 'Failed to load user details.' });
  }
}

/**
 * PATCH /api/admin/users/:id/status
 * Suspend or reactivate user account.
 */
export async function updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const targetId = req.params.id;
  const adminId = req.user!.id;
  const adminEmail = req.user!.email;
  const { status, reason } = req.body;

  if (targetId === adminId) {
    res.status(400).json({ error: 'Administrators cannot change their own account status.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const targetUserRes = await client.query(
      'SELECT id, email, role, status FROM users WHERE id = $1 FOR UPDATE',
      [targetId]
    );

    if (targetUserRes.rowCount === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const targetUser = targetUserRes.rows[0];

    // If suspending an administrator, ensure they are not the last active admin
    if (status === 'suspended' && targetUser.role === 'admin') {
      const activeAdminsRes = await client.query(
        "SELECT id FROM users WHERE role = 'admin' AND status = 'active' FOR UPDATE"
      );

      if ((activeAdminsRes.rowCount ?? 0) <= 1) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: 'Cannot suspend the last remaining active administrator.' });
        return;
      }
    }

    const suspendedReason = status === 'suspended' ? (reason || 'Account suspended by administrator.') : null;

    const updateRes = await client.query(
      `UPDATE users 
       SET status = $1, suspended_reason = $2 
       WHERE id = $3 
       RETURNING id, name, email, role, status, suspended_reason`,
      [status, suspendedReason, targetId]
    );

    await recordAuditLog(
      {
        adminId,
        adminEmail,
        action: status === 'suspended' ? 'user.suspend' : 'user.reactivate',
        targetType: 'user',
        targetId,
        details: {
          targetEmail: targetUser.email,
          previousStatus: targetUser.status,
          newStatus: status,
          reason: suspendedReason,
        },
      },
      client
    );

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: `User account has been ${status === 'suspended' ? 'suspended' : 'reactivated'}.`,
      user: updateRes.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Admin updateUserStatus error:', error);
    res.status(500).json({ error: 'Failed to update user status.' });
  } finally {
    client.release();
  }
}

/**
 * PATCH /api/admin/users/:id/premium
 * Grant or revoke premium subscription status manually.
 */
export async function updateUserPremium(req: AuthenticatedRequest, res: Response): Promise<void> {
  const targetId = req.params.id;
  const adminId = req.user!.id;
  const adminEmail = req.user!.email;
  const { isPremium } = req.body;

  try {
    const updateRes = await query(
      `UPDATE users 
       SET is_premium = $1 
       WHERE id = $2 
       RETURNING id, name, email, is_premium, role, status`,
      [isPremium, targetId]
    );

    if (updateRes.rowCount === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    await recordAuditLog({
      adminId,
      adminEmail,
      action: isPremium ? 'user.grant_premium' : 'user.revoke_premium',
      targetType: 'user',
      targetId,
      details: {
        targetEmail: updateRes.rows[0].email,
        isPremium,
      },
    });

    res.status(200).json({
      success: true,
      message: `Premium subscription ${isPremium ? 'granted' : 'revoked'} successfully.`,
      user: updateRes.rows[0],
    });
  } catch (error) {
    console.error('Admin updateUserPremium error:', error);
    res.status(500).json({ error: 'Failed to update premium status.' });
  }
}

/**
 * PATCH /api/admin/users/:id/role
 * Promote user to administrator or demote administrator to user.
 */
export async function updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
  const targetId = req.params.id;
  const adminId = req.user!.id;
  const adminEmail = req.user!.email;
  const { role } = req.body;

  if (targetId === adminId) {
    res.status(400).json({ error: 'Administrators cannot modify their own administrator role.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const targetUserRes = await client.query(
      'SELECT id, email, role, status FROM users WHERE id = $1 FOR UPDATE',
      [targetId]
    );

    if (targetUserRes.rowCount === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const targetUser = targetUserRes.rows[0];

    // If demoting an admin, ensure they are not the last active admin
    if (role === 'user' && targetUser.role === 'admin') {
      const activeAdminsRes = await client.query(
        "SELECT id FROM users WHERE role = 'admin' AND status = 'active' FOR UPDATE"
      );

      if ((activeAdminsRes.rowCount ?? 0) <= 1) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: 'Cannot demote the last remaining active administrator.' });
        return;
      }
    }

    const updateRes = await client.query(
      `UPDATE users 
       SET role = $1 
       WHERE id = $2 
       RETURNING id, name, email, role, status`,
      [role, targetId]
    );

    await recordAuditLog(
      {
        adminId,
        adminEmail,
        action: role === 'admin' ? 'user.promote_admin' : 'user.demote_user',
        targetType: 'user',
        targetId,
        details: {
          targetEmail: targetUser.email,
          previousRole: targetUser.role,
          newRole: role,
        },
      },
      client
    );

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: `User role changed to ${role}.`,
      user: updateRes.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Admin updateUserRole error:', error);
    res.status(500).json({ error: 'Failed to update user role.' });
  } finally {
    client.release();
  }
}

/**
 * POST /api/admin/users/:id/reset-password
 * Generates a random temporary password, hashes it in DB, invalidates sessions,
 * sets must_change_password = TRUE, and returns the temporary password ONCE.
 */
export async function resetUserPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  const targetId = req.params.id;
  const adminId = req.user!.id;
  const adminEmail = req.user!.email;

  try {
    const userRes = await query('SELECT id, email, role FROM users WHERE id = $1', [targetId]);
    if (userRes.rowCount === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const targetUser = userRes.rows[0];

    // Generate readable 12-character alphanumeric temporary password
    const temporaryPassword = 'Tmp!' + crypto.randomBytes(6).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(temporaryPassword, salt);

    // Immediately kill existing sessions by setting password_changed_at = NOW()
    // and enforce change on next login by setting must_change_password = TRUE
    await query(
      `UPDATE users 
       SET password_hash = $1, 
           password_changed_at = NOW(), 
           must_change_password = TRUE 
       WHERE id = $2`,
      [passwordHash, targetId]
    );

    await recordAuditLog({
      adminId,
      adminEmail,
      action: 'user.reset_password',
      targetType: 'user',
      targetId,
      details: {
        targetEmail: targetUser.email,
      },
    });

    res.status(200).json({
      success: true,
      temporaryPassword,
      message: 'Temporary password generated successfully. It will only be displayed once.',
    });
  } catch (error) {
    console.error('Admin resetUserPassword error:', error);
    res.status(500).json({ error: 'Failed to reset user password.' });
  }
}

/**
 * DELETE /api/admin/users/:id
 * Permanently deletes user, cascading items and notifications.
 * Guardrails: Cannot delete self, cannot delete last admin, cannot delete admins directly without demoting first.
 */
export async function deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const targetId = req.params.id;
  const adminId = req.user!.id;
  const adminEmail = req.user!.email;

  if (targetId === adminId) {
    res.status(400).json({ error: 'Administrators cannot delete their own account.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const targetUserRes = await client.query(
      'SELECT id, email, name, role FROM users WHERE id = $1 FOR UPDATE',
      [targetId]
    );

    if (targetUserRes.rowCount === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const targetUser = targetUserRes.rows[0];

    // Two-step safety guard: Admins cannot be deleted directly without first being demoted
    if (targetUser.role === 'admin') {
      await client.query('ROLLBACK');
      res.status(400).json({
        error: 'Cannot delete an administrator account directly. You must demote the user to a regular user first.',
      });
      return;
    }

    // Delete user (items and notifications cascade via FOREIGN KEY constraints)
    await client.query('DELETE FROM users WHERE id = $1', [targetId]);

    await recordAuditLog(
      {
        adminId,
        adminEmail,
        action: 'user.delete',
        targetType: 'user',
        targetId,
        details: {
          deletedUserEmail: targetUser.email,
          deletedUserName: targetUser.name,
        },
      },
      client
    );

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: `User ${targetUser.email} and all associated items have been permanently deleted.`,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Admin deleteUser error:', error);
    res.status(500).json({ error: 'Failed to delete user.' });
  } finally {
    client.release();
  }
}

/**
 * GET /api/admin/items
 * Filterable items list across all users.
 */
export async function getItems(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const category = req.query.category as string | undefined;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (search && search.trim()) {
      const escaped = escapeLikePattern(search.trim());
      conditions.push(`(i.name ILIKE $${idx} OR i.description ILIKE $${idx} OR i.qr_id::text ILIKE $${idx})`);
      values.push(`%${escaped}%`);
      idx++;
    }

    if (status && (status === 'safe' || status === 'lost')) {
      conditions.push(`i.status = $${idx}`);
      values.push(status);
      idx++;
    }

    if (category && category.trim()) {
      conditions.push(`i.category = $${idx}`);
      values.push(category.trim());
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*)::int as total FROM items i ${whereClause}`,
      values
    );
    const total = countRes.rows[0].total;

    values.push(limit, offset);
    const itemsRes = await query(
      `SELECT 
        i.id, i.qr_id, i.owner_id, i.name, i.category, i.description, 
        i.contact_method, i.status, i.created_at, i.updated_at,
        u.email as owner_email, u.name as owner_name,
        (SELECT COUNT(*)::int FROM notifications WHERE item_id = i.id) as notifications_count
       FROM items i
       JOIN users u ON i.owner_id = u.id
       ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );

    res.status(200).json({
      items: itemsRes.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Admin getItems error:', error);
    res.status(500).json({ error: 'Failed to retrieve platform items.' });
  }
}

/**
 * DELETE /api/admin/items/:id
 * Removes abusive or invalid item (cascading notifications).
 */
export async function deleteItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  const itemId = req.params.id;
  const adminId = req.user!.id;
  const adminEmail = req.user!.email;

  try {
    const itemRes = await query(
      `SELECT i.id, i.name, i.qr_id, u.email as owner_email
       FROM items i
       JOIN users u ON i.owner_id = u.id
       WHERE i.id = $1`,
      [itemId]
    );

    if (itemRes.rowCount === 0) {
      res.status(404).json({ error: 'Item not found.' });
      return;
    }

    const item = itemRes.rows[0];

    await query('DELETE FROM items WHERE id = $1', [itemId]);

    await recordAuditLog({
      adminId,
      adminEmail,
      action: 'item.delete',
      targetType: 'item',
      targetId: itemId,
      details: {
        itemName: item.name,
        qrId: item.qr_id,
        ownerEmail: item.owner_email,
      },
    });

    res.status(200).json({
      success: true,
      message: `Item "${item.name}" has been removed.`,
    });
  } catch (error) {
    console.error('Admin deleteItem error:', error);
    res.status(500).json({ error: 'Failed to delete item.' });
  }
}

/**
 * GET /api/admin/notifications
 * Recent finder messages across the platform for abuse and spam review.
 */
export async function getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    const countRes = await query('SELECT COUNT(*)::int as total FROM notifications');
    const total = countRes.rows[0].total;

    const notifsRes = await query(
      `SELECT 
        n.id, n.item_id, n.finder_message, n.finder_contact, n.created_at, n.read,
        i.name as item_name, i.qr_id as item_qr_id,
        u.email as owner_email, u.name as owner_name
       FROM notifications n
       JOIN items i ON n.item_id = i.id
       JOIN users u ON i.owner_id = u.id
       ORDER BY n.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.status(200).json({
      notifications: notifsRes.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Admin getNotifications error:', error);
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
}

/**
 * GET /api/admin/audit-logs
 * Filterable administrative audit trail.
 */
export async function getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const action = req.query.action as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (action && action.trim()) {
      conditions.push(`action ILIKE $${idx}`);
      values.push(`%${escapeLikePattern(action.trim())}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*)::int as total FROM audit_logs ${whereClause}`,
      values
    );
    const total = countRes.rows[0].total;

    values.push(limit, offset);
    const logsRes = await query(
      `SELECT id, admin_id, admin_email, action, target_type, target_id, details, created_at
       FROM audit_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );

    res.status(200).json({
      logs: logsRes.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Admin getAuditLogs error:', error);
    res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
}
