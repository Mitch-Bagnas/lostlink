import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

// Load environment variables from backend/.env if available
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function createAdmin() {
  const name = process.env.ADMIN_NAME || 'Platform Administrator';
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('❌ Error: Missing required environment variables.');
    console.error('Usage:');
    console.error('  ADMIN_NAME="Admin Name" ADMIN_EMAIL="admin@lostlink.ph" ADMIN_PASSWORD="SecurePassword123!" npx tsx scripts/createAdmin.ts');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL is not defined in environment or .env file.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log(`Connecting to database and provisioning admin: ${email}...`);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Check if user already exists
    const existing = await pool.query('SELECT id, role, status FROM users WHERE email = $1', [email]);

    let user;
    if (existing.rowCount && existing.rowCount > 0) {
      console.log(`User ${email} already exists. Promoting to admin and updating credentials...`);
      const updateResult = await pool.query(
        `UPDATE users 
         SET name = $1, 
             password_hash = $2, 
             role = 'admin', 
             status = 'active', 
             is_premium = TRUE, 
             password_changed_at = NOW(), 
             must_change_password = FALSE
         WHERE email = $3
         RETURNING id, name, email, role, status, is_premium`,
        [name, passwordHash, email]
      );
      user = updateResult.rows[0];
    } else {
      console.log(`Creating new administrator account for ${email}...`);
      const insertResult = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, status, is_premium, password_changed_at, must_change_password)
         VALUES ($1, $2, $3, 'admin', 'active', TRUE, NOW(), FALSE)
         RETURNING id, name, email, role, status, is_premium`,
        [name, email, passwordHash]
      );
      user = insertResult.rows[0];
    }

    console.log('✅ Administrator account successfully configured:');
    console.log({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      is_premium: user.is_premium,
    });
    console.log('\n🔒 IMPORTANT: Please remove ADMIN_PASSWORD from your environment or terminal history.');
  } catch (error) {
    console.error('❌ Failed to create administrator:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createAdmin();
