import express from 'express';
import {sequelize} from './utils/db.js';
import { configDotenv } from "dotenv";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { serve, setup } from 'swagger-ui-express';
import expressLogger from './utils/logger.js';
import authRoute from './routes/auth.route.js';
import templateRouter from './routes/template.route.js';
import listRouter from './routes/list.route.js';
const PORT = 3000;
configDotenv();


// 1. Setup directory paths (Required in ESM to get __dirname behavior)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Load and Parse the JSON file manually
const swaggerFile = fs.readFileSync(path.join(__dirname, './swagger-output.json'));
const swaggerDocument = JSON.parse(swaggerFile);


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Logger middleware
app.use(expressLogger)


// Routes middleware
app.use('/auth',authRoute);
app.use('/api-doc', serve, setup(swaggerDocument))
app.use('/list', listRouter)

// start server
const start = async () => {
  try {

    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
   
    } catch (error) {
        console.error('Error starting server:', error);
    }
    app.listen(PORT, () => {   
        console.log(`Server is running on http://localhost:${PORT}`);
    });
};
start();