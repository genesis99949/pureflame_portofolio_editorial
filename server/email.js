const nodemailer = require('nodemailer');

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, CONTACT_EMAIL } = process.env;
const smtpConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : nodemailer.createTransport({ jsonTransport: true }); // stub: nu trimite nimic, doar "reda" mesajul

function formatAmount(amount, currency) {
  return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

async function sendOrderConfirmationEmail(order) {
  const subject = `Comanda ta PureFlame — ${order.product_name}`;
  const total = order.amount * order.quantity;
  const text = [
    `Salut ${order.customer_first_name},`,
    ``,
    `Iti multumim pentru comanda! Iata detaliile:`,
    ``,
    `Produs: ${order.product_name}${order.color ? ` (${order.color})` : ''} × ${order.quantity}`,
    `Suma platita: ${formatAmount(total, order.currency)}`,
    `Adresa de livrare: ${order.address_street} ${order.address_number}, cod postal ${order.address_postal_code}`,
    `Telefon: ${order.customer_phone}`,
    `Numar comanda: #${order.id}`,
    ``,
    `Livrarea se face in 3-7 zile lucratoare. Te vom contacta pentru confirmarea detaliilor de livrare.`,
    ``,
    `Echipa PureFlame`,
  ].join('\n');

  const info = await transporter.sendMail({
    from: EMAIL_FROM || 'PureFlame <comenzi@pureflame.ro>',
    to: order.customer_email,
    subject,
    text,
  });

  if (!smtpConfigured) {
    console.log(`\n[email] SMTP nu este configurat — emailul de mai jos NU a fost trimis, doar afisat:`);
    console.log(`  Catre: ${order.customer_email}`);
    console.log(`  Subiect: ${subject}`);
    console.log(`  ---\n${text}\n  ---\n`);
  } else {
    console.log(`[email] Email de confirmare trimis catre ${order.customer_email} (messageId: ${info.messageId})`);
  }

  return info;
}

async function sendContactNotificationEmail(msg) {
  const to = CONTACT_EMAIL || EMAIL_FROM || 'PureFlame <comenzi@pureflame.ro>';
  const subject = `Mesaj nou de contact — ${msg.fullName}`;
  const text = [
    `Nume: ${msg.fullName}`,
    `Email: ${msg.email}`,
    `Telefon: ${msg.phone || '-'}`,
    ``,
    `Mesaj:`,
    msg.message,
    ``,
    `Numar mesaj: #${msg.id}`,
  ].join('\n');

  const info = await transporter.sendMail({
    from: EMAIL_FROM || 'PureFlame <comenzi@pureflame.ro>',
    to,
    replyTo: msg.email,
    subject,
    text,
  });

  if (!smtpConfigured) {
    console.log(`\n[email] SMTP nu este configurat — notificarea de contact de mai jos NU a fost trimisa, doar afisata:`);
    console.log(`  Catre: ${to}`);
    console.log(`  Subiect: ${subject}`);
    console.log(`  ---\n${text}\n  ---\n`);
  } else {
    console.log(`[email] Notificare de contact trimisa catre ${to} (messageId: ${info.messageId})`);
  }

  return info;
}

async function sendReviewNotificationEmail(review) {
  const to = CONTACT_EMAIL || EMAIL_FROM || 'PureFlame <comenzi@pureflame.ro>';
  const subject = `Recenzie noua pentru ${review.productId} — necesita aprobare`;
  const text = [
    `Produs: ${review.productId}`,
    `Nume afisat: ${review.displayName}`,
    `Email: ${review.email}`,
    `Rating: ${review.rating}/5`,
    `Status: in asteptare`,
    `Numar recenzie: #${review.id}`,
    ``,
    `Recenzie:`,
    review.message,
  ].join('\n');

  const info = await transporter.sendMail({
    from: EMAIL_FROM || 'PureFlame <comenzi@pureflame.ro>',
    to,
    replyTo: review.email,
    subject,
    text,
  });

  if (!smtpConfigured) {
    console.log(`\n[email] SMTP nu este configurat — notificarea de recenzie NU a fost trimisa, doar afisata:`);
    console.log(`  Catre: ${to}`);
    console.log(`  Subiect: ${subject}`);
    console.log(`  ---\n${text}\n  ---\n`);
  } else {
    console.log(`[email] Notificare de recenzie trimisa catre ${to} (messageId: ${info.messageId})`);
  }

  return info;
}

// Double opt-in: emailul cu link de confirmare. Abonatul NU primeste comunicari de
// marketing pana nu apasa acest link (status ramane 'pending').
async function sendSubscriberConfirmationEmail({ email, confirmUrl, unsubscribeUrl }) {
  const subject = 'Confirma-ti abonarea la PureFlame';
  const text = [
    `Salut,`,
    ``,
    `Mai e un pas: confirma-ti adresa de email accesand linkul de mai jos.`,
    ``,
    confirmUrl,
    ``,
    `Dupa confirmare iti trimitem ghidul "Cum alegi masa cu foc potrivita" imediat ce este gata,`,
    `plus acces timpuriu la colectiile noi.`,
    ``,
    `Daca nu tu ai cerut acest email, ignora-l — nu vei primi nimic altceva.`,
    `Te poti dezabona oricand: ${unsubscribeUrl}`,
    ``,
    `Echipa PureFlame`,
  ].join('\n');

  const info = await transporter.sendMail({
    from: EMAIL_FROM || 'PureFlame <comenzi@pureflame.ro>',
    to: email,
    subject,
    text,
    headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` },
  });

  if (!smtpConfigured) {
    console.log(`\n[email] SMTP nu este configurat — emailul de confirmare abonare NU a fost trimis, doar afisat:`);
    console.log(`  Catre: ${email}`);
    console.log(`  ---\n${text}\n  ---\n`);
  } else {
    console.log(`[email] Email de confirmare abonare trimis catre ${email} (messageId: ${info.messageId})`);
  }

  return info;
}

module.exports = {
  sendOrderConfirmationEmail,
  sendContactNotificationEmail,
  sendReviewNotificationEmail,
  sendSubscriberConfirmationEmail,
  smtpConfigured,
};
