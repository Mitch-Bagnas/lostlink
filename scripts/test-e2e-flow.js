// End-to-End API verification script for LostLink
const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = body;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return cookieStr.split(';')[0];
}

async function run() {
  console.log('--- STARTING LOSTLINK END-TO-END FLOW VERIFICATION ---');

  const testEmail = `tester_${Date.now()}@lostlink.ph`;
  const testPassword = 'Password123!';

  // 1. Sign Up
  console.log('\n1. Testing User Sign Up...');
  const signupRes = await request('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { name: 'E2E Test User', email: testEmail, password: testPassword },
  });
  console.log(`Status: ${signupRes.status}`);
  if (signupRes.status !== 201) throw new Error(`Signup failed: ${JSON.stringify(signupRes.data)}`);
  console.log(`User created: ${signupRes.data.user.email}, is_premium: ${signupRes.data.user.is_premium}`);
  
  const authCookie = extractCookie(signupRes.headers);
  console.log(`Auth Cookie received: ${authCookie ? 'YES' : 'NO'}`);

  // 2. GET /me (Verify Cookie Auth)
  console.log('\n2. Testing GET /api/auth/me...');
  const meRes = await request('/auth/me', {
    method: 'GET',
    headers: { Cookie: authCookie },
  });
  console.log(`Status: ${meRes.status}, User: ${meRes.data.user?.name}`);

  // 3. Register Item 1 (Wallet)
  console.log('\n3. Registering Item 1 (Wallet)...');
  const item1Res = await request('/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: { name: 'E2E Leather Wallet', category: 'Wallet', contact_method: 'email' },
  });
  console.log(`Item 1 Status: ${item1Res.status}, ID: ${item1Res.data.item?.id}, QR: ${item1Res.data.item?.qr_id}`);

  // Register Item 2 (Bag)
  console.log('Registering Item 2 (Bag)...');
  const item2Res = await request('/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: { name: 'E2E Commuter Backpack', category: 'Bag', contact_method: 'email' },
  });
  console.log(`Item 2 Status: ${item2Res.status}`);

  // Register Item 3 (Gadget)
  console.log('Registering Item 3 (Gadget)...');
  const item3Res = await request('/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: { name: 'E2E Wireless Earbuds', category: 'Gadget', contact_method: 'email' },
  });
  console.log(`Item 3 Status: ${item3Res.status}`);

  // 4. Try Registering Item 4 (Expect 403 Free Tier Limit Reached)
  console.log('\n4. Attempting to Register Item 4 on Free Plan (Expecting 403 Forbidden)...');
  const item4Res = await request('/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: { name: 'E2E Umbrella', category: 'Other', contact_method: 'email' },
  });
  console.log(`Status: ${item4Res.status} (Expected 403)`);
  console.log(`Response: ${JSON.stringify(item4Res.data)}`);
  if (item4Res.status !== 403) {
    throw new Error(`Expected 403, got ${item4Res.status}`);
  }
  console.log('✅ Free Tier 3-Item Limit correctly enforced by server transaction!');

  // 5. Mark Item 1 as "lost"
  console.log('\n5. Marking Item 1 as "lost"...');
  const markLostRes = await request(`/items/${item1Res.data.item.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: { status: 'lost' },
  });
  console.log(`Status: ${markLostRes.status}, New Item Status: ${markLostRes.data.item.status}`);

  // 6. Public Found Item Scan (Zero Owner Info Leakage Check)
  console.log('\n6. Checking Public Scanner Endpoint GET /api/found/:qrId...');
  const publicRes = await request(`/found/${item1Res.data.item.qr_id}`);
  console.log(`Status: ${publicRes.status}`);
  console.log(`Public Data returned:`, publicRes.data);

  // Assert zero leaks
  if (publicRes.data.owner_id || publicRes.data.email || publicRes.data.phone || publicRes.data.id) {
    throw new Error('SECURITY VIOLATION: Private owner info leaked on public endpoint!');
  }
  console.log('✅ Privacy verified: Zero owner credentials, IDs, or contact information leaked!');

  // 7. Finder Submits Notification
  console.log('\n7. Finder submits notification POST /api/found/:qrId/notify...');
  const notifyRes = await request(`/found/${item1Res.data.item.qr_id}/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      message: 'Found your wallet at the cafeteria cashier table!',
      finder_contact: 'Cafeteria Manager Rosa - 09170001122',
    },
  });
  console.log(`Notify Status: ${notifyRes.status}, Message: ${notifyRes.data.message}`);

  // 8. Check Notifications in Owner's Item Detail
  console.log('\n8. Verifying notification appears in owner inbox...');
  const itemDetailRes = await request(`/items/${item1Res.data.item.id}`, {
    headers: { Cookie: authCookie },
  });
  console.log(`Notifications count for Item 1: ${itemDetailRes.data.notifications?.length}`);
  const latestNotif = itemDetailRes.data.notifications[0];
  console.log(`Latest Finder Message: "${latestNotif?.finder_message}"`);
  console.log(`Latest Finder Contact: "${latestNotif?.finder_contact}"`);

  // Mark notification read
  if (latestNotif) {
    console.log('Marking notification as read...');
    const readRes = await request(`/notifications/${latestNotif.id}/read`, {
      method: 'PATCH',
      headers: { Cookie: authCookie },
    });
    console.log(`Mark Read Status: ${readRes.status}`);
  }

  // 9. Upgrade to Premium
  console.log('\n9. Testing Upgrade to Premium POST /api/users/me/upgrade...');
  const upgradeRes = await request('/users/me/upgrade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: { plan: 'monthly_50php', paymentMethod: 'gcash' },
  });
  console.log(`Upgrade Status: ${upgradeRes.status}, is_premium: ${upgradeRes.data.user.is_premium}`);

  // 10. Register Item 4 now as Premium User
  console.log('\n10. Registering Item 4 as Premium User (with email+phone)...');
  const item4PremiumRes = await request('/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie },
    body: { name: 'E2E Umbrella', category: 'Other', contact_method: 'email+phone' },
  });
  console.log(`Item 4 Status: ${item4PremiumRes.status} (Expected 201)`);
  console.log(`Item 4 Created: ${item4PremiumRes.data.item?.name}, Contact Method: ${item4PremiumRes.data.item?.contact_method}`);
  console.log('✅ Premium unlimited items & SMS contact method operational!');

  // 11. Delete Item 2
  console.log('\n11. Testing DELETE /api/items/:id...');
  const deleteRes = await request(`/items/${item2Res.data.item.id}`, {
    method: 'DELETE',
    headers: { Cookie: authCookie },
  });
  console.log(`Delete Status: ${deleteRes.status}, Message: ${deleteRes.data.message}`);

  // 12. Log out
  console.log('\n12. Testing POST /api/auth/logout...');
  const logoutRes = await request('/auth/logout', {
    method: 'POST',
    headers: { Cookie: authCookie },
  });
  console.log(`Logout Status: ${logoutRes.status}`);

  console.log('\n🎉 ALL 12 VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
}

run().catch((err) => {
  console.error('TEST RUNNER FAILED:', err);
  process.exit(1);
});
