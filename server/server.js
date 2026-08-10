import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { runTests } from './runner.js';
import { runBugScan } from './bugFinder.js';

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

// Serve screenshots and videos statically
app.use('/screenshots', express.static(SCREENSHOTS_DIR));
app.use('/videos', express.static(VIDEOS_DIR));


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
      let host = smtp.host.trim();
      if (host.toLowerCase() === 'smtp.google.com' || host.toLowerCase() === 'gmail.com') {
        host = 'smtp.gmail.com';
      } else if (host.toLowerCase() === 'outlook.com' || host.toLowerCase() === 'hotmail.com') {
        host = 'smtp-mail.outlook.com';
      }

      const portNum = parseInt(smtp.port, 10) || 587;
      // Port 465 requires direct SSL (secure: true). Port 587 uses STARTTLS (secure: false).
      const secure = portNum === 465 ? true : (portNum === 587 ? false : Boolean(smtp.secure));

      const transportConfig = {
        host,
        port: portNum,
        secure,
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
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

      transporter = nodemailer.createTransport(transportConfig);
    } else {
      const testAccount = await getOrCreateEtherealAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }

    const fromAddress = senderEmail.trim();
    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipientEmail.trim(),
      subject: subject.trim(),
      text: text || 'Please find the attached test report.',
      html: `<div><p>${String(text || 'Please find the attached test report.').replace(/\n/g, '<br/>')}</p></div>`,
      attachments: [
        {
          filename: 'aethertest-report.html',
          content: reportHtml,
          contentType: 'text/html'
        }
      ]
    });

    if (!useCustomSmtp) {
      previewUrl = nodemailer.getTestMessageUrl(info);
    }

    return res.json({ success: true, previewUrl });
  } catch (error) {
    console.error('Error sending report email:', error);
    if (!smtp || !smtp.host) {
      cachedEtherealAccount = null;
    }
    return res.status(500).json({ error: error.message || 'Failed to send email report.' });
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