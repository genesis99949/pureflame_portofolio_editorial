// Backup local al bazei de date SQLite, cu compresie si criptare optionala (AES-256-GCM).
// Ruleaza manual cu: node scripts/backup-db.js
// Pentru backup automat, programeaza aceasta comanda (cron pe Linux, Task Scheduler pe Windows).
//
// Daca variabila de mediu BACKUP_ENCRYPTION_KEY este setata, fisierul rezultat este criptat.
// Fara ea, se produce doar un .db.gz necriptat — foloseste asta doar daca folderul de backup
// este el insusi protejat (acces restrictionat, disc criptat).
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'orders.db');
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');
const RETENTION_DAYS = Number(process.env.BACKUP_RETENTION_DAYS) || 30;
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY;

function encrypt(buffer, passphrase) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(passphrase, salt, 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format fisier: [salt(16)][iv(12)][authTag(16)][ciphertext...]
  return Buffer.concat([salt, iv, authTag, ciphertext]);
}

function pruneOldBackups() {
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  for (const file of fs.readdirSync(BACKUP_DIR)) {
    const filePath = path.join(BACKUP_DIR, file);
    const stat = fs.statSync(filePath);
    if (stat.isFile() && stat.mtimeMs < cutoff) {
      fs.unlinkSync(filePath);
      console.log(`[backup] sters (peste ${RETENTION_DAYS} zile): ${file}`);
    }
  }
}

function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`[backup] Nu exista baza de date la ${DB_PATH}. Nimic de salvat.`);
    process.exit(1);
  }
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const raw = fs.readFileSync(DB_PATH);
  const gzipped = zlib.gzipSync(raw);

  let outBuffer = gzipped;
  let ext = '.db.gz';
  if (ENCRYPTION_KEY) {
    outBuffer = encrypt(gzipped, ENCRYPTION_KEY);
    ext = '.db.gz.enc';
  } else {
    console.warn('[backup] ATENTIE: BACKUP_ENCRYPTION_KEY nu este setat — backup NECRIPTAT. Protejeaza folderul de backup.');
  }

  const outPath = path.join(BACKUP_DIR, `orders-${timestamp}${ext}`);
  fs.writeFileSync(outPath, outBuffer);
  console.log(`[backup] Salvat: ${outPath} (${outBuffer.length} bytes)`);

  pruneOldBackups();
}

main();
