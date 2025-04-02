import crypto from 'crypto';
import util from 'util';

const scryptAsync = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  const hash = await hashPassword('password123');
  console.log('Hashed password for "password123":', hash);
}

main()
  .then(() => console.log('Done'))
  .catch(err => console.error('Error:', err));
