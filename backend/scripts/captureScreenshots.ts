import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import http from 'http';
import puppeteer from 'puppeteer-core';
import { app } from '../src/app';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const artifactDir = 'C:\\Users\\danie\\.gemini\\antigravity\\brain\\9f4bb3bb-f2b4-471d-8204-492a77bcb6e8';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  console.log('🚀 Starting integrated server (API + Frontend SPA)...');

  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  const serverApp = express();

  // Forward only /api requests to Express app
  serverApp.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return (app as any)(req, res, next);
    }
    next();
  });

  // Serve frontend build from frontend/dist
  serverApp.use(express.static(frontendDist));
  serverApp.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });

  const server = http.createServer(serverApp);
  await new Promise<void>((resolve) => server.listen(5090, resolve));
  const baseUrl = 'http://localhost:5090';
  console.log(`Server listening at ${baseUrl}`);

  console.log('🌐 Launching headless Chrome...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();

    // 1. Log in as admin
    console.log('🔑 Logging in as Administrator...');
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle0' });

    // Fill login form
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'admin@lostlink.ph');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for redirection to dashboard or admin
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('Logged in successfully, current URL:', page.url());

    const testUserId = '7da03940-52c5-4879-bb08-ee1e6b8b58ca';

    const routes = [
      { name: 'admin_overview', url: `${baseUrl}/admin` },
      { name: 'admin_users', url: `${baseUrl}/admin/users` },
      { name: 'admin_user_detail', url: `${baseUrl}/admin/users/${testUserId}` },
    ];

    const viewports = [
      { name: 'desktop_1366px', width: 1366, height: 850 },
      { name: 'mobile_375px', width: 375, height: 812 },
    ];

    for (const route of routes) {
      console.log(`\nNavigating to ${route.url}...`);
      await page.goto(route.url, { waitUntil: 'networkidle0' });
      // Give React a moment to render fetched data
      await new Promise((r) => setTimeout(r, 1500));

      for (const vp of viewports) {
        await page.setViewport({ width: vp.width, height: vp.height });
        await new Promise((r) => setTimeout(r, 500));
        const filename = `${route.name}_${vp.name}.png`;
        const filepath = path.join(artifactDir, filename);
        await page.screenshot({ path: filepath, fullPage: true });
        console.log(`📸 Captured screenshot: ${filename} (${vp.width}x${vp.height})`);
      }
    }

    console.log('\n✅ All screenshots captured successfully in artifact directory!');
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
