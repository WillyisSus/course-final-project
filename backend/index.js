import express from 'express';
import cors from 'cors'; 
import { sequelize } from './utils/db.js';
import { configDotenv } from "dotenv";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { serve, setup } from 'swagger-ui-express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import expressLogger from './utils/logger.js';

// Route Imports
import authRoute from './routes/auth.route.js';
import productRouter from './routes/product.route.js';
import categoryRouter from './routes/category.route.js';
import autoBidRouter from './routes/autobids.route.js';
import bidRouter from './routes/bid.route.js';
import productCommentsRouter from './routes/productComments.route.js';
import messageRouter from './routes/messages.route.js';
import startWorker from './utils/worker.js';
import watchlistRouter from './routes/watchlist.route.js';
import upgradeRequestRouter from './routes/upgradeRequest.route.js';
import paymentRouter from './routes/payment.route.js';
import productReceiptRouter from './routes/productReceipts.route.js';
import blockedBiddersRouter from './routes/blockedBidders.route.js';
import userRouter from './routes/user.route.js';
import feedbackRoute from './routes/feedback.route.js';
import rateLimit from 'express-rate-limit'; // <--- 1. Import here  
const PORT = 3000;
configDotenv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerFile = fs.readFileSync(path.join(__dirname, './swagger-openapi.json'));
const swaggerDocument = JSON.parse(swaggerFile);

const app = express();
const httpServer = createServer(app); 

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"], 
    credentials: true,               
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    allowedHeaders: ['Content-Type', 'Authorization'] 
  }
});

app.set('io', io); 

io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected`);

  socket.on("join_product", (productId) => {
    const roomName = `product_${productId}`;
    socket.join(roomName);
    console.log(`User ${socket.id} joined room: ${roomName}`);
  });

  socket.on("leave_product", (productId) => {
    const roomName = `product_${productId}`;
    socket.leave(roomName);
    console.log(`User ${socket.id} left room: ${roomName}`);
  });
  socket.on("join_transaction", (productId) => {
    const roomName = `transaction_${productId}`;
    socket.join(roomName);
    console.log(`User ${socket.id} joined transaction room: ${roomName}`);
  });
    socket.on("leave_transaction", (productId) => {
    const roomName = `transaction_${productId}`;
    socket.leave(roomName);
    console.log(`User ${socket.id} left transaction room: ${roomName}`);
  });
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"], 
  credentials: true,               
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization'] 
}));
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressLogger);
app.use('/images', express.static(path.join(__dirname, './images')));
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.use('/api-doc', serve, setup(swaggerDocument));
app.use('/api/auth', authRoute);
app.use('/api/products', productRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/auto-bids', autoBidRouter);
app.use('/api/bids', bidRouter);
app.use('/api/comments', productCommentsRouter);
app.use('/api/messages', messageRouter);
app.use('/api/watchlists', watchlistRouter)
app.use('/api/upgrade-requests', upgradeRequestRouter)
app.use('/api/payment', paymentRouter);
app.use('/api/receipts', productReceiptRouter)
app.use('/api/blocked-bidders', blockedBiddersRouter);
app.use('/api/users', userRouter);
app.use('/api/feedbacks', feedbackRoute);
const retryConnection = async (retriesLeft, delay) => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (err) {
        if (retriesLeft === 0) throw err;
        console.log(`Retrying to connect to the database... (${retriesLeft} retries left)`);
        setTimeout(() => {
            retryConnection(retriesLeft - 1, delay);
        }, delay);
    }
}

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    startWorker();
  } catch (error) {
    console.error('Error starting server, retrying', error);
    try {
      await retryConnection(5, 3000);
    } catch (error) {
      console.error('Fatal: Could not connect to database:', error);
      return; 
    }
  } 
  httpServer.listen(PORT, () => {   
      console.log(`Server is running on http://localhost:${PORT}`);
  });
};

start();