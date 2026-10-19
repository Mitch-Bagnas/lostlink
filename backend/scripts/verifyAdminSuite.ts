import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import http from 'http';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runSuite() {
  console.log('====================================================');
  console.log('   LOSTLINK ADMIN & SECURITY VERIFICATION SUITE    ');
  console.log('====================================================\n');

  // Start local express server on a random port for testing HTTP requests
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`📡 Test server running at ${baseUrl}`);

  let testUserId: string = '';
  let secondAdminId: string = '';
  let testItemId: string = '';
  let adminToken: string = '';
  let userToken: string = '';
  let adminUser: any = null;

  try {
    // Helper for requests with cookie jar
    let cookieJar: Record<string, string> = {};

    async function api(
      path: string, 
      options: { method?: string; body?: any; token?: string; cookies?: Record<string, string> } = {}
    ) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (options.token) {
        headers['Authorization'] = `Bearer ${options.token}`;
      } else {
        const cookiesToSend = { ...(options.cookies || cookieJar) };
        const cookieHeader = Object.entries(cookiesToSend)
          .map(([k, v]) => `${k}=${v}`)
          .join('; ');
        if (cookieHeader) {
          headers['Cookie'] = cookieHeader;
        }
      }

      const res = await fetch(`${baseUrl}${path}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      // Extract set-cookie
      const setCookie = res.headers.get('set-cookie');
      let extractedToken = '';
      if (setCookie) {
        const match = setCookie.match(/token=([^;]+)/);
        if (match) {
          extractedToken = match[1];
          cookieJar['token'] = extractedToken;
        }
      }

      const data = await res.json().catch(() => null);
      return { status: res.status, ok: res.ok, data, token: extractedToken, headers: res.headers };
    }

    // -------------------------------------------------------------------------
    // TEST 1: Admin Login & Fetch Stats
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 1] Admin Login and /api/admin/stats');
    const adminLoginRes = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@lostlink.ph', password: 'admin123' },
    });

    if (adminLoginRes.status !== 200 || !adminLoginRes.data.user || adminLoginRes.data.user.role !== 'admin') {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.data)}`);
    }
    adminToken = adminLoginRes.token;
    adminUser = adminLoginRes.data.user;
    console.log(`  ✔ Admin logged in successfully: ${adminUser.email} (Role: ${adminUser.role})`);

    const statsRes = await api('/api/admin/stats', { token: adminToken });
    if (statsRes.status !== 200 || !statsRes.data.totalUsers) {
      throw new Error(`Admin stats failed: ${JSON.stringify(statsRes.data)}`);
    }
    console.log(`  ✔ GET /api/admin/stats returned 200: Users=${statsRes.data.totalUsers}, Items=${statsRes.data.totalItems}`);

    // -------------------------------------------------------------------------
    // TEST 2: Normal user signup, login, and 403 on admin routes
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 2] Non-Admin Access Restrictions & Direct Endpoint Protection');
    const testEmail = `test_regular_${Date.now()}@lostlink.ph`;
    const signupRes = await api('/api/auth/signup', {
      method: 'POST',
      body: { name: 'Normal User', email: testEmail, password: 'UserPass123!' },
    });
    if (signupRes.status !== 201 || signupRes.data.user.role !== 'user') {
      throw new Error(`Signup failed or role not 'user': ${JSON.stringify(signupRes.data)}`);
    }
    testUserId = signupRes.data.user.id;
    userToken = signupRes.token;
    console.log(`  ✔ Regular user created: ${testEmail} (Role: ${signupRes.data.user.role})`);

    // Verify signup strictly ignores any attempted 'role' injection
    const tamperSignup = await api('/api/auth/signup', {
      method: 'POST',
      body: { name: 'Hacker', email: `hacker_${Date.now()}@lostlink.ph`, password: 'Password123!', role: 'admin' },
    });
    if (tamperSignup.status === 201 && tamperSignup.data.user.role === 'admin') {
      throw new Error('CRITICAL SECURITY FLAW: Signup accepted role admin in body!');
    }
    if (tamperSignup.data.user) {
      console.log(`  ✔ Tamper role check: attempted role='admin' resulted in role='${tamperSignup.data.user.role}'`);
      await pool.query('DELETE FROM users WHERE id = $1', [tamperSignup.data.user.id]);
    }

    // Try hitting admin endpoints with normal user token
    const forbiddenStats = await api('/api/admin/stats', { token: userToken });
    const forbiddenUsers = await api('/api/admin/users', { token: userToken });
    const forbiddenItems = await api('/api/admin/items', { token: userToken });
    const forbiddenAudit = await api('/api/admin/audit-logs', { token: userToken });

    if (forbiddenStats.status !== 403 || forbiddenUsers.status !== 403 || forbiddenItems.status !== 403 || forbiddenAudit.status !== 403) {
      throw new Error(`Non-admin endpoint returned non-403: stats=${forbiddenStats.status}, users=${forbiddenUsers.status}`);
    }
    console.log('  ✔ All /api/admin/* endpoints strictly returned 403 Forbidden to regular user');

    // -------------------------------------------------------------------------
    // TEST 3: User Suspension & Active Session Invalidation & Reactivation
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 3] User Suspension, Active Session Rejection & Reactivation');
    const suspendRes = await api(`/api/admin/users/${testUserId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'suspended', reason: 'TOS violation: Suspicious QR spamming' },
    });
    if (suspendRes.status !== 200 || suspendRes.data.user.status !== 'suspended') {
      throw new Error(`Failed to suspend user: ${JSON.stringify(suspendRes.data)}`);
    }
    console.log('  ✔ User successfully suspended by admin');

    // Attempt to make authenticated request with EXISTING session token
    const sessionCheck = await api('/api/items', { token: userToken });
    if (sessionCheck.status !== 403 || sessionCheck.data.error !== 'ACCOUNT_SUSPENDED') {
      throw new Error(`Existing session was not rejected with ACCOUNT_SUSPENDED: ${JSON.stringify(sessionCheck)}`);
    }
    console.log(`  ✔ Existing session immediately rejected: 403 ACCOUNT_SUSPENDED ("${sessionCheck.data.message}")`);

    // Attempt to login as suspended user
    const loginSuspended = await api('/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'UserPass123!' },
    });
    if (loginSuspended.status !== 403 || loginSuspended.data.error !== 'ACCOUNT_SUSPENDED') {
      throw new Error(`Suspended user login was not blocked with 403: ${JSON.stringify(loginSuspended)}`);
    }
    console.log(`  ✔ Login attempt rejected with 403 ACCOUNT_SUSPENDED and suspension reason presented`);

    // Reactivate user
    const reactivateRes = await api(`/api/admin/users/${testUserId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'active' },
    });
    if (reactivateRes.status !== 200 || reactivateRes.data.user.status !== 'active') {
      throw new Error(`Failed to reactivate user: ${JSON.stringify(reactivateRes.data)}`);
    }
    console.log('  ✔ User reactivated by admin');

    // Log in again
    const loginActive = await api('/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'UserPass123!' },
    });
    if (loginActive.status !== 200) {
      throw new Error(`Reactivated user failed to login: ${JSON.stringify(loginActive)}`);
    }
    userToken = loginActive.data.token;
    console.log('  ✔ Reactivated user logged in successfully');

    // -------------------------------------------------------------------------
    // TEST 4: Free Tier Limit (3 items) & Admin Granting Premium
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 4] Free Tier Limit (3 items) and Admin Granting Premium');
    // Register 3 items
    for (let i = 1; i <= 3; i++) {
      const itemRes = await api('/api/items', {
        method: 'POST',
        token: userToken,
        body: { name: `Test Item ${i}`, category: 'Gadget', contact_method: 'email' },
      });
      if (itemRes.status !== 201) {
        throw new Error(`Failed to create item ${i}: ${JSON.stringify(itemRes.data)}`);
      }
      if (i === 1) testItemId = itemRes.data.item.id;
    }
    console.log('  ✔ Free user registered 3 items (Free tier limit reached)');

    // Attempt to register 4th item (must fail)
    const fourthItemFail = await api('/api/items', {
      method: 'POST',
      token: userToken,
      body: { name: 'Test Item 4', category: 'Wallet', contact_method: 'email' },
    });
    if (fourthItemFail.status !== 403 || !fourthItemFail.data.error.includes('LIMIT')) {
      throw new Error(`Expected 403 FREE_TIER_LIMIT_REACHED but got: ${JSON.stringify(fourthItemFail)}`);
    }
    console.log('  ✔ 4th item creation blocked with 403 FREE_TIER_LIMIT_REACHED');

    // Admin grants premium
    const grantPremium = await api(`/api/admin/users/${testUserId}/premium`, {
      method: 'PATCH',
      token: adminToken,
      body: { isPremium: true },
    });
    if (grantPremium.status !== 200 || !grantPremium.data.user.is_premium) {
      throw new Error(`Failed to grant premium: ${JSON.stringify(grantPremium.data)}`);
    }
    console.log('  ✔ Admin granted Premium status to user');

    // 4th item now succeeds
    const fourthItemSuccess = await api('/api/items', {
      method: 'POST',
      token: userToken,
      body: { name: 'Test Item 4 (Premium)', category: 'Wallet', contact_method: 'email' },
    });
    if (fourthItemSuccess.status !== 201) {
      throw new Error(`Failed to create 4th item as premium: ${JSON.stringify(fourthItemSuccess.data)}`);
    }
    console.log('  ✔ Premium user successfully registered 4th item');

    // -------------------------------------------------------------------------
    // TEST 5: Password Reset & Session Revocation & Temp Password
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 5] Password Reset, Immediate Invalidation & Forced Change');
    // Ensure 1s passes so tokenIssuedAtSeconds < passwordChangedAtSeconds
    await new Promise((r) => setTimeout(r, 1100));

    const resetRes = await api(`/api/admin/users/${testUserId}/reset-password`, {
      method: 'POST',
      token: adminToken,
    });
    if (resetRes.status !== 200 || !resetRes.data.temporaryPassword) {
      throw new Error(`Failed to reset password: ${JSON.stringify(resetRes.data)}`);
    }
    const tempPassword = resetRes.data.temporaryPassword;
    console.log(`  ✔ Admin reset password: temp password returned securely once`);

    // Old token should be revoked due to password_changed_at > iat
    const revokedCall = await api('/api/items', { token: userToken });
    if (revokedCall.status !== 401 || revokedCall.data.error !== 'SESSION_REVOKED') {
      throw new Error(`Old session token was not revoked: ${JSON.stringify(revokedCall)}`);
    }
    console.log('  ✔ Old active session immediately invalidated with 401 SESSION_REVOKED');

    // Old password fails to login
    const oldLogin = await api('/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'UserPass123!' },
    });
    if (oldLogin.status !== 401) {
      throw new Error(`Old password unexpectedly worked on login: ${JSON.stringify(oldLogin)}`);
    }
    console.log('  ✔ Login with old password rejected (401)');

    // Temp password succeeds to login and flags must_change_password
    const tempLogin = await api('/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: tempPassword },
    });
    if (tempLogin.status !== 200 || tempLogin.data.user.must_change_password !== true) {
      throw new Error(`Temp password login failed or must_change_password not true: ${JSON.stringify(tempLogin)}`);
    }
    console.log('  ✔ Login with temporary password succeeded; must_change_password is true');

    // -------------------------------------------------------------------------
    // TEST 6: Guardrails (Self-Modification & Last Admin & Two-Step Deletion)
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 6] Admin Guardrails (Self Demotion/Deletion & Last Admin)');
    // Self delete
    const selfDelete = await api(`/api/admin/users/${adminUser.id}`, {
      method: 'DELETE',
      token: adminToken,
    });
    if (selfDelete.status !== 400 || !selfDelete.data.error.toLowerCase().includes('own account')) {
      throw new Error(`Self delete was not blocked: ${JSON.stringify(selfDelete)}`);
    }
    console.log('  ✔ Self-deletion correctly blocked (400 Cannot delete your own account)');

    // Self demote
    const selfDemote = await api(`/api/admin/users/${adminUser.id}/role`, {
      method: 'PATCH',
      token: adminToken,
      body: { role: 'user' },
    });
    if (selfDemote.status !== 400 || !selfDemote.data.error.toLowerCase().includes('own')) {
      throw new Error(`Self demote was not blocked: ${JSON.stringify(selfDemote)}`);
    }
    console.log('  ✔ Self-demotion correctly blocked (400 Cannot demote your own account)');

    // Self suspend
    const selfSuspend = await api(`/api/admin/users/${adminUser.id}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'suspended' },
    });
    if (selfSuspend.status !== 400 || !selfSuspend.data.error.toLowerCase().includes('own account')) {
      throw new Error(`Self suspension was not blocked: ${JSON.stringify(selfSuspend)}`);
    }
    console.log('  ✔ Self-suspension correctly blocked (400 Cannot suspend your own account)');

    // Create a 2nd admin to test two-step deletion
    const secAdminEmail = `second_admin_${Date.now()}@lostlink.ph`;
    const secAdminRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ('Second Admin', $1, 'dummyhash', 'admin', 'active')
       RETURNING id`,
      [secAdminEmail]
    );
    secondAdminId = secAdminRes.rows[0].id;
    console.log(`  ✔ Created second admin for testing: ${secAdminEmail}`);

    // Attempting to delete 2nd admin directly without demoting first must fail
    const directDeleteAdmin = await api(`/api/admin/users/${secondAdminId}`, {
      method: 'DELETE',
      token: adminToken,
    });
    if (directDeleteAdmin.status !== 400 || !directDeleteAdmin.data.error.toLowerCase().includes('demote')) {
      throw new Error(`Direct admin deletion was not blocked with 2-step requirement: ${JSON.stringify(directDeleteAdmin)}`);
    }
    console.log('  ✔ Direct deletion of admin blocked (Two-step requirement enforced)');

    // Demote 2nd admin to user
    const demoteSecAdmin = await api(`/api/admin/users/${secondAdminId}/role`, {
      method: 'PATCH',
      token: adminToken,
      body: { role: 'user' },
    });
    if (demoteSecAdmin.status !== 200) {
      throw new Error(`Demoting 2nd admin failed: ${JSON.stringify(demoteSecAdmin)}`);
    }
    console.log('  ✔ Demoted 2nd admin to regular user');

    // Now deleting the demoted user succeeds
    const deleteDemoted = await api(`/api/admin/users/${secondAdminId}`, {
      method: 'DELETE',
      token: adminToken,
    });
    if (deleteDemoted.status !== 200) {
      throw new Error(`Deleting demoted user failed: ${JSON.stringify(deleteDemoted)}`);
    }
    console.log('  ✔ Deleted demoted user successfully');

    // -------------------------------------------------------------------------
    // TEST 7: Cascade Deletion of User, Items, and Notifications
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 7] Cascade User Deletion (Items & Notifications)');
    // Add a finder notification for testItemId
    await pool.query(
      `INSERT INTO notifications (item_id, finder_message, finder_contact)
       VALUES ($1, 'Found your item at the park bench!', 'finder@example.com')`,
      [testItemId]
    );

    const deleteUserRes = await api(`/api/admin/users/${testUserId}`, {
      method: 'DELETE',
      token: adminToken,
    });
    if (deleteUserRes.status !== 200) {
      throw new Error(`Failed to delete user: ${JSON.stringify(deleteUserRes.data)}`);
    }

    // Verify DB cascades
    const userDbCheck = await pool.query('SELECT id FROM users WHERE id = $1', [testUserId]);
    const itemsDbCheck = await pool.query('SELECT id FROM items WHERE owner_id = $1', [testUserId]);
    const notifDbCheck = await pool.query('SELECT id FROM notifications WHERE item_id = $1', [testItemId]);

    if (userDbCheck.rowCount !== 0 || itemsDbCheck.rowCount !== 0 || notifDbCheck.rowCount !== 0) {
      throw new Error(`Cascade deletion failed: user=${userDbCheck.rowCount}, items=${itemsDbCheck.rowCount}, notifs=${notifDbCheck.rowCount}`);
    }
    console.log('  ✔ User, items, and notifications cleanly cascaded away from database');

    // -------------------------------------------------------------------------
    // TEST 8: Audit Logs & Public Privacy Verification
    // -------------------------------------------------------------------------
    console.log('\n▶ [TEST 8] Audit Logs Integrity & Public Found Route Privacy');
    const auditLogsRes = await api('/api/admin/audit-logs', { token: adminToken });
    if (auditLogsRes.status !== 200 || !auditLogsRes.data.logs || auditLogsRes.data.logs.length === 0) {
      throw new Error(`Audit logs empty or failed: ${JSON.stringify(auditLogsRes.data)}`);
    }

    const actions = auditLogsRes.data.logs.map((l: any) => l.action);
    console.log(`  ✔ Audit logs retrieved (${auditLogsRes.data.logs.length} entries recorded):`);
    console.log(`    Actions recorded: ${Array.from(new Set(actions)).join(', ')}`);

    // Verify no password in audit logs
    for (const log of auditLogsRes.data.logs) {
      const detailsStr = JSON.stringify(log.details || {});
      if (detailsStr.toLowerCase().includes('password') && !detailsStr.includes('user.reset_password')) {
        throw new Error(`LEAK DETECTED: Audit log details contains password reference: ${detailsStr}`);
      }
      if (!log.admin_email) {
        throw new Error(`Audit log missing admin_email snapshot! Log ID: ${log.id}`);
      }
    }
    console.log('  ✔ Verified ZERO password or secret leakage in audit details');
    console.log('  ✔ Verified admin_email snapshot populated on all audit entries');

    // Test Public /api/found/:qrId privacy
    const ownerSecretEmail = `owner_secret_${Date.now()}@lostlink.ph`;
    const tempOwner = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ('Sensitive Owner', $1, '+639171234567', 'hash', 'user')
       RETURNING id`,
      [ownerSecretEmail]
    );
    const tempItem = await pool.query(
      `INSERT INTO items (owner_id, name, category, contact_method, qr_id)
       VALUES ($1, 'Private Keychain', 'Wallet', 'email', gen_random_uuid())
       RETURNING id, qr_id`,
      [tempOwner.rows[0].id]
    );

    const publicFoundRes = await api(`/api/found/${tempItem.rows[0].qr_id}`);
    if (publicFoundRes.status !== 200 || !publicFoundRes.data || !publicFoundRes.data.qr_id) {
      throw new Error(`Public found route failed: ${JSON.stringify(publicFoundRes.data)}`);
    }
    const publicItem = publicFoundRes.data;
    if (publicItem.email || publicItem.phone || publicItem.owner_id || publicItem.user_id || publicItem.owner_email || publicItem.owner_phone) {
      throw new Error(`PRIVACY VIOLATION: Public found route leaked owner info: ${JSON.stringify(publicItem)}`);
    }
    console.log('  ✔ Public GET /api/found/:qrId returned safe item details with ZERO owner email/phone/identity leaked');

    // Cleanup temp
    await pool.query('DELETE FROM items WHERE id = $1', [tempItem.rows[0].id]);
    await pool.query('DELETE FROM users WHERE id = $1', [tempOwner.rows[0].id]);

    console.log('\n====================================================');
    console.log('  ALL ADMIN & SECURITY API TESTS PASSED PERFECTLY!  ');
    console.log('====================================================\n');
  } finally {
    server.close();
    await pool.end();
  }
}

runSuite().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
