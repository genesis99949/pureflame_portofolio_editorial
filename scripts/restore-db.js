// Restaureaza un backup creat cu scripts/backup-db.js.
// Foloseste periodic acest script pe o copie de test ca sa verifici ca backup-urile chiar
// pot fi restaurate (un backup netestat nu e o strategie de backup).
//
// Utilizare:
//   node scripts/restore-db.js backups/orders-2026-08-01T12-00-00-000Z.db.gz.enc restored-orders.db
require('dotenv').config();
const fs = require('node:fs');
const zlib = require('node:zlib');
const crypto = require('node:crypto');

const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY;

function decrypt(buffer, passphrase) {
  const salt = buffer.subarray(0, 16);
  const iv = buffer.subarray(16, 28);
  const authTag = buffer.subarray(28, 44);
  const ciphertext = buffer.subarray(44);
  const key = crypto.scryptSync(passphrase, salt, 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function main() {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    console.error('Utilizare: node scripts/restore-db.js <fisier-backup> <fisier-destinatie.db>');
    process.exit(1);
  }

  let data = fs.readFileSync(inputPath);

  if (inputPath.endsWith('.enc')) {
    if (!ENCRYPTION_KEY) {
      console.error('EROARE: fisierul este criptat, dar BACKUP_ENCRYPTION_KEY nu este setat.');
      process.exit(1);
    }
    data = decrypt(data, ENCRYPTION_KEY);
  }

  const raw = zlib.gunzipSync(data);
  fs.writeFileSync(outputPath, raw);
  console.log(`[restore] Baza de date restaurata la: ${outputPath}`);
  console.log('[restore] Verifica integritatea (ex: deschide fisierul cu un client SQLite) inainte sa il consideri valid.');
}

main();
