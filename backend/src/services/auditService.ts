import { PoolClient } from 'pg';
import { query } from '../config/db';

export interface AuditLogParams {
  adminId: string | null;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, any>;
}

export async function recordAuditLog(
  params: AuditLogParams,
  client?: PoolClient
): Promise<void> {
  const { adminId, adminEmail, action, targetType, targetId = null, details = {} } = params;

  // Sanitize details to never persist sensitive credentials
  const sanitizedDetails = { ...details };
  delete (sanitizedDetails as any).password;
  delete (sanitizedDetails as any).temporaryPassword;
  delete (sanitizedDetails as any).passwordHash;
  delete (sanitizedDetails as any).token;

  const sql = `
    INSERT INTO audit_logs (admin_id, admin_email, action, target_type, target_id, details)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;
  const values = [adminId, adminEmail, action, targetType, targetId, JSON.stringify(sanitizedDetails)];

  if (client) {
    await client.query(sql, values);
  } else {
    await query(sql, values);
  }
}
