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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressLogger);

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