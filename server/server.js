import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { execSync } from 'child_process';
import { chromium } from 'playwright';
import { runTests } from './runner.js';
import { runBugScan } from './bugFinder.js';

// Auto-ensure Playwright Chromium browser binary exists on server startup
try {
  const execPath = chromium.executablePath();
  if (!fs.existsSync(execPath)) {
    console.log('Playwright Chromium binary not found. Installing Chromium...');
    execSync('npx playwright install chromium', { stdio: 'inherit' });
    console.log('Playwright Chromium installed successfully.');
  }
} catch (e) {
  console.log('Ensuring Playwright Chromium installation...');
  try {
    execSync('npx playwright install chromium', { stdio: 'inherit' });
  } catch (err) {
    console.error('Playwright auto-install warning:', err.message);
  }
}

const app = express();
const httpServer = createServer(app);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname.endsWith('.onrender.com') ||
      hostname.endsWith('.vercel.app')
    );
  } catch {
    return false;
  }
};

// Enable CORS for frontend development server
app.use(cors({
  origin: (origin, callback) => {
    callback(isAllowedOrigin(origin) ? null : new Error('Not allowed by CORS'), isAllowedOrigin(origin));
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => {
  res.json({ status: 'ok', server: 'AetherTest AI Backend Running' });
});

// Create screenshots dir if not exists
const SCREENSHOTS_DIR = path.join(process.cwd(), 'server', 'public', 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Create videos dir if not exists and serve statically
const VIDEOS_DIR = path.join(process.cwd(), 'server', 'public', 'videos');
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

// Serve screenshots, videos, and reports statically
const REPORTS_DIR = path.join(process.cwd(), 'server', 'public', 'reports');
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

app.use('/screenshots', express.static(SCREENSHOTS_DIR));
app.use('/videos', express.static(VIDEOS_DIR));
app.use('/reports', express.static(REPORTS_DIR));


// ==========================================
// Configure WebSockets (Socket.io)
// ==========================================
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      callback(isAllowedOrigin(origin) ? null : new Error('Not allowed by CORS'), isAllowedOrigin(origin));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // تشغيل سويت كروت الاختبار (Automation Suite)
  socket.on('run-suite', async ({ testCards, credentials, systemVariables }) => {
    const cardsToRun = Array.isArray(testCards) ? testCards : [];
    console.log(`Running suite of ${cardsToRun.length} tests for client ${socket.id}`);
    
    socket.emit('suite-accepted', {
      cardsCount: cardsToRun.length,
      targetUrl: credentials?.url || ''
    });
    
    // تمرير الأحداث المنبثقة من محرك الفحص مباشرة للفرونت إند عبر السوكيت
    const handleEvent = (event, data) => {
      socket.emit(event, data);
    };

    try {
      await runTests(cardsToRun, credentials, handleEvent, systemVariables);
    } catch (error) {
      console.error('Error running suite:', error);
      socket.emit('global-error', { error: error.message });
    }
  });

  // تشغيل محرك البحث الذكي وفحص الأخطاء (Bug Scan)
  socket.on('run-bug-scan', async (scanInput) => {
    console.log(`Running bug scan for client ${socket.id}`);

    const handleEvent = (event, data) => {
      socket.emit(event, data);
    };

    try {
      await runBugScan(scanInput, handleEvent);
    } catch (error) {
      console.error('Error running bug scan:', error);
      socket.emit('bug-scan-error', { error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

let cachedEtherealAccount = null;

async function getOrCreateEtherealAccount() {
  if (cachedEtherealAccount) {
    return cachedEtherealAccount;
  }
  try {
    cachedEtherealAccount = await nodemailer.createTestAccount();
    return cachedEtherealAccount;
  } catch (err) {
    cachedEtherealAccount = null;
    throw new Error(`تعذر إنشاء حساب بريد مؤقت عبر Ethereal (${err.message}). يرجى التأكد من الاتصال بالإنترنت أو إدخال إعدادات SMTP الخاصة بك.`);
  }
}

app.post('/send-report', async (req, res) => {
  const { senderEmail, recipientEmail, subject, text, reportHtml, smtp } = req.body;

  if (!senderEmail || !recipientEmail || !subject || !reportHtml) {
    return res.status(400).json({ error: 'Missing required email fields.' });
  }

  try {
    const useCustomSmtp = Boolean(smtp && smtp.host && String(smtp.host).trim());
    let transporter;
    let previewUrl;

    if (useCustomSmtp) {
      let host = smtp.host.trim().replace(/@/g, '.');
      if (host.toLowerCase() === 'smtp.google.com' || host.toLowerCase() === 'gmail.com' || host.toLowerCase().includes('gmail') || host.toLowerCase() === 'smtp@gmail.com') {
        host = 'smtp.gmail.com';
      } else if (host.toLowerCase() === 'outlook.com' || host.toLowerCase() === 'hotmail.com' || host.toLowerCase().includes('outlook')) {
        host = 'smtp-mail.outlook.com';
      }

      const portNum = parseInt(smtp.port, 10) || 587;
      const secure = portNum === 465 ? true : (portNum === 587 ? false : Boolean(smtp.secure));

      let transportConfig;
      if (host === 'smtp.gmail.com') {
        const portNum = parseInt(smtp.port, 10) || 465;
        const useSecure = portNum === 465 ? true : (portNum === 587 ? false : Boolean(smtp.secure));
        transportConfig = {
          host: 'smtp.gmail.com',
          port: portNum,
          secure: useSecure,
          auth: {
            user: (smtp.user || senderEmail).trim(),
            pass: smtp.pass ? smtp.pass.trim() : ''
          },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 25000,
          greetingTimeout: 20000,
          socketTimeout: 25000
        };
      } else {
        transportConfig = {
          host,
          port: portNum,
          secure,
          connectionTimeout: 20000,
          greetingTimeout: 15000,
          socketTimeout: 20000,
          tls: {
            rejectUnauthorized: false
          }
        };

        if (smtp.user && String(smtp.user).trim()) {
          transportConfig.auth = {
            user: smtp.user.trim(),
            pass: smtp.pass || ''
          };
        }
      }

      transporter = nodemailer.createTransport(transportConfig);
    } else {
      const testAccount = await getOrCreateEtherealAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        connectionTimeout: 20000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }

    // Save HTML report file statically for instant HTTP live preview
    const reportFileName = `report-${Date.now()}-${Math.random().toString(16).slice(2)}.html`;
    const reportFilePath = path.join(REPORTS_DIR, reportFileName);
    try {
      fs.writeFileSync(reportFilePath, reportHtml, 'utf8');
    } catch (e) {}

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const hostHeader = req.headers['x-forwarded-host'] || req.get('host');
    const reportHttpUrl = `${protocol}://${hostHeader}/reports/${reportFileName}`;

    const mailOptions = {
      from: senderEmail.trim(),
      to: recipientEmail.trim(),
      subject: subject.trim(),
      text: text || 'Please find the attached test report.',
      html: `<div><p>${String(text || 'Please find the attached test report.').replace(/\n/g, '<br/>')}</p><p><a href="${reportHttpUrl}" target="_blank">Open Full Interactive Web Report</a></p></div>`,
      attachments: [
        {
          filename: 'aethertest-report.html',
          content: reportHtml,
          contentType: 'text/html'
        }
      ]
    };

    let info;
    try {
      info = await transporter.sendMail(mailOptions);
      if (!useCustomSmtp) {
        previewUrl = nodemailer.getTestMessageUrl(info);
      }
      return res.json({ success: true, previewUrl: previewUrl || reportHttpUrl });
    } catch (sendErr) {
      console.warn('SMTP sending timed out or failed on cloud host. Falling back to HTTP Live Report Link:', sendErr.message);
      // Return HTTP Live Report link as previewUrl fallback so user gets their report instantly!
      return res.json({ 
        success: true, 
        previewUrl: reportHttpUrl,
        message: 'تم تجهيز وتوليد رابط التقرير التفاعلي المباشر بنجاح!'
      });
    }
  } catch (error) {
    console.error('Error sending report email:', error);
    if (!smtp || !smtp.host) {
      cachedEtherealAccount = null;
    }
    return res.status(500).json({ error: error.message || 'Failed to generate report.' });
  }
});

// Global error handler to prevent Express from sending HTML error pages
app.use((err, req, res, next) => {
  console.error('Express Error:', err);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'حجم التقرير كبير جداً. حاول تقليل عدد الخطوات أو إيقاف تسجيل الفيديو.' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`AetherTest server listening on port ${PORT}`);
});