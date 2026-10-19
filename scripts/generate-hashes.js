const path = require('path');
const bcrypt = require(path.join(__dirname, '../backend/node_modules/bcryptjs'));

async function generate() {
  const password = 'Password123!';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log(`Password: ${password}`);
  console.log(`Generated bcrypt hash: ${hash}`);
  
  // Verify comparison
  const isValid = await bcrypt.compare(password, hash);
  console.log(`Verification check: ${isValid ? 'PASSED' : 'FAILED'}`);
}

generate();
