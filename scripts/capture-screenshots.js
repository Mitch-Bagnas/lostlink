const fs = require('fs');
const path = require('path');
const puppeteer = require(path.join(__dirname, '../backend/node_modules/puppeteer-core'));

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\danie\\.gemini\\antigravity\\brain\\9f4bb3bb-f2b4-471d-8204-492a77bcb6e8\\screenshots';
const REPO_DIR = path.join(__dirname, '../screenshots');

[ARTIFACT_DIR, REPO_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function capture() {
  console.log('Launching headless Chrome for visual verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  async function takePair(url, baseName, setupFn) {
    console.log(`\nNavigating to ${url} for ${baseName}...`);
    
    // 1366px Desktop
    await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
    if (setupFn) await setupFn(page);
    await page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(r => setTimeout(r, 1000));
    
    const deskPath1 = path.join(REPO_DIR, `${baseName}-1366px.png`);
    const deskPath2 = path.join(ARTIFACT_DIR, `${baseName}-1366px.png`);
    await page.screenshot({ path: deskPath1, fullPage: false });
    fs.copyFileSync(deskPath1, deskPath2);
    console.log(`Saved desktop screenshot: ${deskPath1}`);

    // 375px Mobile
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
    if (setupFn) await setupFn(page);
    await new Promise(r => setTimeout(r, 1000));

    const mobPath1 = path.join(REPO_DIR, `${baseName}-375px.png`);
    const mobPath2 = path.join(ARTIFACT_DIR, `${baseName}-375px.png`);
    await page.screenshot({ path: mobPath1, fullPage: false });
    fs.copyFileSync(mobPath1, mobPath2);
    console.log(`Saved mobile screenshot: ${mobPath1}`);
  }

  // 1. Landing Page
  await takePair('http://localhost:5173/', 'landing');

  // 2. Found Item Public Page (Seeded QR for Blue Samsonite Backpack)
  await takePair('http://localhost:5173/found/33333333-3333-4333-a333-333333333331', 'found-item');

  // 3. Log In to test Authenticated Pages
  console.log('\nLogging in with demo account for Dashboard and Item Detail screenshots...');
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto('http://localhost:5173/auth', { waitUntil: 'networkidle0' });
  
  // Fill credentials
  await page.type('input[type="email"]', 'demo@lostlink.ph');
  await page.type('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  // 4. Dashboard
  await takePair('http://localhost:5173/dashboard', 'dashboard');

  // 5. Item Detail (Item 1: Blue Samsonite Backpack)
  await takePair('http://localhost:5173/items/22222222-2222-4222-a222-222222222221', 'item-detail');

  await browser.close();
  console.log('\n✅ ALL 8 SCREENSHOTS CAPTURED AND SAVED SUCCESSFULLY!');
}

capture().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
