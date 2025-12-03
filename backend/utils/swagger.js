import swaggerAutogen  from 'swagger-autogen';
import { configDotenv } from 'dotenv';
configDotenv();

const doc = {
  info: {
    title: 'My API',
    description: 'Automatically generated documentation',
  },
  host: process.env.PORT,
  schemes: ['http'],
};

// The file where the JSON documentation will be stored
const outputFile = '../swagger-output.json';

// An array of all files that contain your routes
const routes = [
  '../index.js',
]; 

/* NOTE: If you use distinct route files (e.g., routes/users.js), 
   include them here like: ['./routes/users.js', './routes/orders.js'] */
swaggerAutogen(outputFile, routes, doc);