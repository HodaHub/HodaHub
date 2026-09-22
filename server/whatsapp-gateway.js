import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, '..', '.whatsapp_session');

const PORT = process.env.WHATSAPP_PORT || 3001;

// Global state
let sock = null;
let currentQrDataUrl = null;
let isConnected = false;
let userPhone = null;

// OTP Store: Map<cleanPhone, { otp: string, expiresAt: number }>
const otpStore = new Map();

// Initialize Baileys WhatsApp Connection
async function connectToWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: 'silent' }),
      browser: Browsers.appropriate('HodaHub Gateway'),
      syncFullHistory: false,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          currentQrDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 8 });
          console.log('\n📲 [HodaHub WhatsApp Gateway] New QR code generated!');
          console.log(`👉 Open http://localhost:${PORT}/qr in your browser to scan visually!\n`);
        } catch (err) {
          console.error('QR generation error:', err);
        }
      }

      if (connection === 'close') {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        isConnected = false;
        userPhone = null;
        currentQrDataUrl = null;

        console.log(
          '🔌 [HodaHub WhatsApp Gateway] Connection closed. Reconnecting:',
          shouldReconnect
        );
        if (shouldReconnect) {
          setTimeout(connectToWhatsApp, 3000);
        }
      } else if (connection === 'open') {
        isConnected = true;
        currentQrDataUrl = null;
        userPhone = sock.user?.id?.split(':')[0] || 'Linked Device';
        console.log(`\n✅ [HodaHub WhatsApp Gateway] CONNECTED successfully as: +${userPhone}!\n`);
      }
    });
  } catch (err) {
    console.error('WhatsApp startup error:', err);
    setTimeout(connectToWhatsApp, 5000);
  }
}

// Start WhatsApp client
connectToWhatsApp();

// HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Route: GET /status
  if (url.pathname === '/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        isConnected,
        userPhone,
        hasQr: !!currentQrDataUrl,
      })
    );
    return;
  }

  // Route: GET /qr or GET /
  if ((url.pathname === '/qr' || url.pathname === '/') && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HodaHub WhatsApp Gateway</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
          body { background: #0b141a; color: #e9edef; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
          .card { background: #111b21; border: 1px solid #222d34; border-radius: 24px; padding: 36px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
          .badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-bottom: 20px; }
          .badge.connected { background: rgba(37, 211, 102, 0.15); color: #25d366; border: 1px solid rgba(37, 211, 102, 0.3); }
          .badge.waiting { background: rgba(254, 186, 7, 0.15); color: #febc07; border: 1px solid rgba(254, 186, 7, 0.3); }
          h1 { font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #fff; }
          p { color: #8696a0; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
          .qr-box { background: #fff; padding: 16px; border-radius: 20px; display: inline-block; box-shadow: 0 8px 24px rgba(0,0,0,0.2); margin-bottom: 20px; }
          .qr-box img { display: block; width: 260px; height: 260px; }
          .steps { text-align: left; background: #202c33; padding: 16px 20px; border-radius: 16px; font-size: 13px; color: #d1d7db; margin-top: 20px; }
          .steps ol { padding-left: 20px; }
          .steps li { margin-bottom: 6px; }
          .btn { background: #00a884; color: #111b21; font-weight: 700; border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 16px; font-size: 14px; }
          .btn:hover { background: #029071; }
        </style>
        ${!isConnected ? `<script>setTimeout(() => window.location.reload(), 3000);</script>` : ''}
      </head>
      <body>
        <div class="card">
          ${
            isConnected
              ? `
            <div class="badge connected">● CONNECTED & READY</div>
            <h1>Gateway Connected!</h1>
            <p>Your WhatsApp account <strong>+${userPhone}</strong> is successfully linked. Real-time OTPs will be delivered directly from this number.</p>
            <div style="font-size: 64px; margin: 20px 0;">🎉</div>
            <a href="http://localhost:5173" class="btn">Return to HodaHub Website</a>
          `
              : currentQrDataUrl
              ? `
            <div class="badge waiting">⏳ WAITING FOR SCAN</div>
            <h1>Scan with WhatsApp</h1>
            <p>Scan this QR code to activate instant, zero-cost WhatsApp OTP delivery for HodaHub.</p>
            <div class="qr-box">
              <img src="${currentQrDataUrl}" alt="WhatsApp QR Code" />
            </div>
            <div class="steps">
              <ol>
                <li>Open <strong>WhatsApp</strong> on your mobile phone.</li>
                <li>Tap <strong>Settings</strong> or <strong>Menu (⋮)</strong> ➔ <strong>Linked Devices</strong>.</li>
                <li>Tap <strong>Link a Device</strong> and point your camera at this QR code.</li>
              </ol>
            </div>
          `
              : `
            <div class="badge waiting">● STARTING ENGINE</div>
            <h1>Generating QR Code...</h1>
            <p>Please wait a few seconds while the WhatsApp service initializes.</p>
            <div style="padding: 40px; font-size: 32px;">⏳</div>
          `
          }
        </div>
      </body>
      </html>
    `);
    return;
  }

  // Route: POST /send-otp
  if (url.pathname === '/send-otp' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { phone } = JSON.parse(body || '{}');
        const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);

        if (cleanPhone.length !== 10) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid 10-digit Indian phone number' }));
          return;
        }

        if (!isConnected || !sock) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: 'WhatsApp Gateway is not connected yet. Please scan the QR code at http://localhost:3001/qr',
            })
          );
          return;
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
        otpStore.set(cleanPhone, { otp, expiresAt });

        // Destination JID format: 91XXXXXXXXXX@s.whatsapp.net
        const jid = `91${cleanPhone}@s.whatsapp.net`;
        const messageText = `🛍️ *HodaHub Verification Code*\n\nHello! Your login verification code is:\n\n👉 *${otp}*\n\nThis code is valid for *5 minutes*. Please do not share this OTP with anyone for security.\n\n— Team HodaHub`;

        await sock.sendMessage(jid, { text: messageText });
        console.log(`📤 [HodaHub WhatsApp Gateway] OTP ${otp} delivered to +91${cleanPhone}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'OTP sent successfully via WhatsApp' }));
      } catch (err) {
        console.error('Failed to dispatch WhatsApp message:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message || 'Error sending message' }));
      }
    });
    return;
  }

  // Route: POST /verify-otp
  if (url.pathname === '/verify-otp' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const { phone, otp } = JSON.parse(body || '{}');
        const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
        const cleanOtp = String(otp || '').trim();

        // Universal development bypass: 123456 always passes
        if (cleanOtp === '123456') {
          otpStore.delete(cleanPhone);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, verified: true }));
          return;
        }

        const session = otpStore.get(cleanPhone);
        if (!session) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'No OTP requested for this phone number' }));
          return;
        }

        if (Date.now() > session.expiresAt) {
          otpStore.delete(cleanPhone);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'OTP has expired. Please request a new code.' }));
          return;
        }

        if (session.otp !== cleanOtp) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Incorrect OTP code. Please check and retry.' }));
          return;
        }

        // Matched!
        otpStore.delete(cleanPhone);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, verified: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Failed to parse verification body' }));
      }
    });
    return;
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`\n🚀 [HodaHub WhatsApp Gateway] Listening on http://localhost:${PORT}`);
  console.log(`👉 Web QR Scanner: http://localhost:${PORT}/qr\n`);
});
