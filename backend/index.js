import express from 'express';
import cors from 'cors'; // Import it
import {sequelize} from './utils/db.js';
import { configDotenv } from "dotenv";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { serve, setup } from 'swagger-ui-express';
import expressLogger from './utils/logger.js';
import authRoute from './routes/auth.route.js';
import productRouter from './routes/product.route.js';
import categoryRouter from './routes/category.route.js';
import autoBidRouter from './routes/autobids.route.js';
import bidRouter from './routes/bid.route.js';
import productCommentsRouter from './routes/productComments.route.js';
import messageRouter from './routes/messages.route.js';
const PORT = 3000;
configDotenv();

// 1. Setup directory paths (Required in ESM to get __dirname behavior)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Load and Parse the JSON file manually
const swaggerFile = fs.readFileSync(path.join(__dirname, './swagger-openapi.json'));
const swaggerDocument = JSON.parse(swaggerFile);


const app = express();

// --- CORS Configuration ---
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"], // Your Vite frontend URL
  credentials: true,               // Allow cookies/tokens
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Hello World!');
})
// Logger middleware
app.use(expressLogger)


// Routes middleware
// app.use('/api/auth',authRoute);
app.use('/api-doc', serve, setup(swaggerDocument))
app.use('/api/products', productRouter);
app.use('/api/categories', categoryRouter); // new line for category routes
app.use('/api/auth',authRoute);
app.use('/api/auto-bids', autoBidRouter);
app.use('/api/bids', bidRouter);
app.use('/api/comments', productCommentsRouter);
app.use('/api/messages', messageRouter);
// start server

 const retryConnection = async (retriesLeft, delay) => {
      try {
          await sequelize.authenticate();
          console.log('Connection has been established successfully.');
      } catch (err) {
          if (retriesLeft === 0) {
              throw err;
          }
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
        retryConnection(5, 3000);
      } catch (error) {
        console.error('Error starting server:', error);
      }
    } 
    app.listen(PORT, () => {   
        console.log(`Server is running on http://localhost:${PORT}`);
    });
};
start();