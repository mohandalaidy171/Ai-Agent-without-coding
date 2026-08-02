import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { runTests } from './runner.js';
import { runBugScan } from './bugFinder.js';

const app = express();
const httpServer = createServer(app);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
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

app.use(express.json());

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

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`AetherTest server listening on port ${PORT}`);
});