import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db';
import { AuthenticatedRequest, SafeUser, User } from '../types';

function toSafeUser(user: User): SafeUser {
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
    google_id: user.google_id || null,
    auth_provider: user.auth_provider || 'local',
    has_password: Boolean(user.password_hash),
  };
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { name, phone } = req.body;

  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (phone !== undefined) {
      fields.push(`phone = $${idx++}`);
      values.push(phone);
    }

    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields provided for update.' });
      return;
    }

    values.push(userId);
    const updateQuery = `
      UPDATE users 
      SET ${fields.join(', ')} 
      WHERE id = $${idx} 
      RETURNING id, name, email, password_hash, phone, is_premium, created_at
    `;

    const result = await query<User>(updateQuery, values);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: toSafeUser(result.rows[0]),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
}

export async function updatePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { currentPassword, newPassword } = req.body;

  try {
    const result = await query<User>(
      'SELECT id, password_hash FROM users WHERE id = $1 LIMIT 1',
      [userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = result.rows[0];

    // If account already has a password, verify currentPassword
    if (user.password_hash !== null) {
      if (!currentPassword) {
        res.status(400).json({ error: 'Current password is required.' });
        return;
      }
      const isCurrentValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentValid) {
        res.status(400).json({ error: 'Current password is incorrect.' });
        return;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await query(
      'UPDATE users SET password_hash = $1, password_changed_at = NOW(), must_change_password = FALSE WHERE id = $2',
      [newHash, userId]
    );

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Failed to update password.' });
  }
}

export async function upgradeToPremium(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { plan, paymentMethod } = req.body;

  try {
    // Simulated mock payment processing
    console.log(`💳 [MOCK PAYMENT PROCESSED] User: ${userId}, Plan: ${plan || 'monthly_50php'}, Method: ${paymentMethod || 'gcash'}`);

    const result = await query<User>(
      'UPDATE users SET is_premium = TRUE WHERE id = $1 RETURNING id, name, email, password_hash, phone, is_premium, created_at',
      [userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      message: 'Successfully upgraded to LostLink Premium! (Simulated)',
      user: toSafeUser(result.rows[0]),
    });
  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(500).json({ error: 'Failed to process upgrade.' });
  }
}

export async function downgradeToFree(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  try {
    // Downgrade user back to free tier.
    // Business rule: Existing items are preserved. Any future item creation is blocked if count >= 3.
    const result = await query<User>(
      'UPDATE users SET is_premium = FALSE WHERE id = $1 RETURNING id, name, email, password_hash, phone, is_premium, created_at',
      [userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      message: 'Subscription downgraded to Free tier. Your existing items remain active, but adding new items requires having fewer than 3 active items.',
      user: toSafeUser(result.rows[0]),
    });
  } catch (error) {
    console.error('Downgrade error:', error);
    res.status(500).json({ error: 'Failed to downgrade subscription.' });
  }
}
