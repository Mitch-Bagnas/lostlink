import { Request, Response } from 'express';
import { query } from '../config/db';
import { sendFoundNotificationEmail } from '../services/emailService';
import { ItemCategory, ItemStatus } from '../types';

interface PublicFoundItemResponse {
  qr_id: string;
  name: string;
  category: ItemCategory;
  status: ItemStatus;
}

export async function getFoundItem(req: Request, res: Response): Promise<void> {
  const qrId = req.params.qrId;

  try {
    // Strictly select ONLY public safe fields.
    // NEVER leak owner_id, email, phone, or internal database ID.
    const result = await query<PublicFoundItemResponse>(
      'SELECT qr_id, name, category, status FROM items WHERE qr_id = $1 LIMIT 1',
      [qrId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Item not found or QR code is invalid.' });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Get found item error:', error);
    res.status(500).json({ error: 'Failed to look up item details.' });
  }
}

export async function notifyOwner(req: Request, res: Response): Promise<void> {
  const qrId = req.params.qrId;
  const { message, finder_contact } = req.body;

  try {
    // 1. Look up item and owner information internally
    const querySql = `
      SELECT 
        i.id AS item_id,
        i.name AS item_name,
        i.category AS item_category,
        i.contact_method,
        u.email AS owner_email,
        u.name AS owner_name,
        u.phone AS owner_phone,
        u.status AS owner_status
      FROM items i
      JOIN users u ON i.owner_id = u.id
      WHERE i.qr_id = $1
      LIMIT 1
    `;

    const result = await query(querySql, [qrId]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Item not found or QR code is invalid.' });
      return;
    }

    const itemData = result.rows[0];

    // 2. Persist notification in database
    await query(
      'INSERT INTO notifications (item_id, finder_message, finder_contact) VALUES ($1, $2, $3)',
      [itemData.item_id, message || null, finder_contact || null]
    );

    // 3. Trigger email notification (skip if owner account is suspended)
    if (itemData.owner_status === 'suspended') {
      console.log(
        `[Found Notification] Owner of item "${itemData.item_name}" (${itemData.owner_email}) is suspended. Notification persisted to database, but email dispatch skipped.`
      );
    } else {
      await sendFoundNotificationEmail({
        ownerEmail: itemData.owner_email,
        ownerName: itemData.owner_name,
        itemName: itemData.item_name,
        itemCategory: itemData.item_category,
        finderMessage: message,
        finderContact: finder_contact,
        hasPhoneAlert: itemData.contact_method === 'email+phone',
        ownerPhone: itemData.owner_phone,
      });
    }

    res.status(200).json({
      success: true,
      message: 'The item owner has been notified securely.',
    });
  } catch (error) {
    console.error('Notify owner error:', error);
    res.status(500).json({ error: 'Failed to notify owner. Please try again later.' });
  }
}
