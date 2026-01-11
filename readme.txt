================================================================================
FRONTEND SETUP GUIDE
================================================================================

This guide will help you set up and run the frontend application on your local
machine. Follow all steps carefully in order.

NOTE: If there are commands, please run them in the frontend folder.

================================================================================
PREREQUISITES
================================================================================

Before starting, ensure you have the following installed on your computer:

1. Node.js (>= 18.0.0) and npm installed
   Download from: https://nodejs.org/

2. Backend server running and reachable at http://localhost:3000
   If your backend host/port differ, update src/lib/axios.ts accordingly.

================================================================================
STEP 1: NAVIGATE TO FRONTEND FOLDER
================================================================================

Open your terminal and navigate to the frontend directory:

  cd path/to/course-final-project/frontend

================================================================================
STEP 2: INSTALL DEPENDENCIES
================================================================================

Run the following command to install all required Node.js packages:

  npm install

This will install all dependencies listed in package.json.

================================================================================
STEP 3: CONFIGURE ENVIRONMENT VARIABLES
================================================================================

Create a new file named .env in the frontend root directory and add the
following configuration. Replace the placeholder values with your actual
credentials:

--- Copy everything below this line to your .env file ---

# Google reCAPTCHA Configuration
VITE_RECAPTCHA_SECRET_KEY=your_google_recaptcha_v2_site_key

# PayPal Configuration
VITE_PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id

--- End of .env file ---

IMPORTANT NOTES:

• VITE_RECAPTCHA_SECRET_KEY:
  - Used in src/pages/RegisterPage.tsx for the checkbox widget
  - Generate a v2 key for your domain/localhost at:
    https://www.google.com/recaptcha/admin

• VITE_PAYPAL_CLIENT_ID:
  - Used in src/components/CheckoutButton.tsx
  - Get the client id from the same sandbox app the backend uses
  - Must match the backend PayPal configuration

• Security Notes:
  - Keep keys out of version control
  - If you change backend credentials/apps, regenerate matching keys here

================================================================================
STEP 4: RUN THE APPLICATION
================================================================================

Development Mode (with hot reload)
----------------------------------
Start the development server with automatic reload on code changes:

  npm run dev

The application will start at http://localhost:5173 by default.

Lint Code
---------
Check code quality and style:

  npm run lint

Production Build
----------------
Create an optimized production build:

  npm run build

Preview Production Build
-------------------------
Preview the production build locally:

  npm run preview

================================================================================
TROUBLESHOOTING
================================================================================

Issue 1: ReCAPTCHA failing
---------------------------
Solution:
- Confirm the site key is v2 (not v3)
- Ensure the domain is allowed in reCAPTCHA settings
- Verify the backend accepts the token

Issue 2: PayPal errors
-----------------------
Solution:
- Verify the sandbox client id matches the backend-configured app
- Ensure the sandbox account has balance
- Check PayPal sandbox status at https://developer.paypal.com/

Issue 3: API errors
-------------------
Solution:
- Ensure the backend is running at the URL configured in src/lib/axios.ts
- Check CORS settings on the backend
- Verify network connectivity to backend server
- Adjust baseURL in src/lib/axios.ts if backend runs on different port

Issue 4: Port already in use
-----------------------------
Solution:
- The default port is 5173
- If port is in use, Vite will automatically try the next available port
- Or manually specify port with: npm run dev -- --port 3001

================================================================================
NEXT STEPS
================================================================================

After completing the setup:

1. Register a new user account or use seeded credentials from backend
2. Test the auction features (browsing, bidding, watchlist)
3. Verify PayPal integration with sandbox account
4. Review frontend code structure in src/ directory
5. Customize styling and components as needed

================================================================================
END OF FRONTEND SETUP GUIDE
================================================================================


================================================================================
BACKEND SETUP GUIDE
================================================================================

This guide will help you set up and run the backend application on your local 
machine. Follow all steps carefully in order.

NOTE: If there are commands, please run them in the backend folder.

================================================================================
BACKEND SETUP GUIDE
================================================================================

This guide will help you set up and run the backend application on your local 
machine. Follow all steps carefully in order.

================================================================================
PREREQUISITES
================================================================================

Before starting, ensure you have the following installed on your computer:

1. Node.js (>= 14.0.0) and npm (>= 6.0.0)
   Download from: https://nodejs.org/

2. PostgreSQL Database Server
   Download from: https://www.postgresql.org/download/

3. Docker and Docker Compose (for ELK stack)
   Download from: https://www.docker.com/get-started

4. Git (optional, for cloning)
   Download from: https://git-scm.com/downloads

================================================================================
STEP 1: CLONE OR EXTRACT THE PROJECT
================================================================================

If you received the project as a zip file, extract it to your desired location.
Navigate to the backend folder in your terminal:

  cd path/to/course-final-project/backend

================================================================================
STEP 2: INSTALL DEPENDENCIES
================================================================================

Run the following command to install all required Node.js packages:

  npm install

This will install all dependencies listed in package.json including:
- express, sequelize, pg (PostgreSQL client)
- socket.io (real-time communication)
- nodemailer (email sending)
- winston (logging)
- bcryptjs, jsonwebtoken (authentication)
- And many more...

================================================================================
STEP 3: SETUP POSTGRESQL DATABASE
================================================================================

3.1 Create PostgreSQL User and Database
----------------------------------------
Option A - Using psql command line:
  1. Open psql terminal (or pgAdmin)
  2. Create a new user:
     CREATE USER your_username WITH PASSWORD 'your_password';
  
  3. Grant necessary privileges:
     ALTER USER your_username WITH SUPERUSER;

Option B - Using pgAdmin:
  1. Open pgAdmin
  2. Right-click on "Login/Group Roles" → Create → Login/Group Role
  3. Enter a name and password
  4. Grant necessary privileges in the "Privileges" tab

3.2 Import Database Schema
---------------------------
The project includes a database dump file: database_final.sql

To import it:

Option A - Using psql command line:
  psql -U your_username -h localhost -f database_final.sql

Option B - Using pgAdmin:
  1. Right-click on "Databases" → Create → Database
  2. Name it "project-final"
  3. Right-click on the new database → Restore
  4. Select the database_final.sql file
  5. Click "Restore"

Note: The database_final.sql file will create a database named "project-final"
      Make sure this matches your .env configuration (see next step).

================================================================================
STEP 4: CONFIGURE ENVIRONMENT VARIABLES
================================================================================

Create a new file named .env in the backend root directory and add the 
following configuration. Replace the placeholder values with your actual 
credentials:

--- Copy everything below this line to your .env file ---

# Database Configuration (PostgreSQL)
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=project-final
DB_USER=your_username
DB_PASSWORD=your_password

# Server Configuration
PORT=3000

# JWT Secrets (generate random strings for production)
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here

# Email Configuration (for nodemailer)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Google reCAPTCHA (optional)
GOOGLE_SECRET_KEY=your_google_recaptcha_secret_key

# PayPal Configuration (for payment processing)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com

--- End of .env file ---

IMPORTANT NOTES:

• DB_USER and DB_PASSWORD: Use the PostgreSQL credentials you created in Step 3
• DB_NAME: Should match the database name (default: "project-final")
• DB_HOST: Use "localhost" for local development
• PORT: The port where your Express server will run (default: 3000)

• JWT Secrets: Generate strong random strings for these. You can use:
  - Online generator: https://www.grc.com/passwords.htm
  - Or run in terminal: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

• Email Configuration:
  - For Gmail, use an "App Password" (not your regular password)
  - Enable 2-factor authentication in Gmail
  - Generate App Password at: https://myaccount.google.com/apppasswords

• PayPal Configuration:
  - Sign up for PayPal Developer account at: https://developer.paypal.com/
  - Create a sandbox app to get CLIENT_ID and CLIENT_SECRET
  - For production, change PAYPAL_API_BASE to: https://api-m.paypal.com

================================================================================
STEP 5: POPULATE DATABASE WITH SEED DATA
================================================================================
If you're not using local PostgreSQL but Docker container, you can setup it with
docker-compose -f postgres-database.yaml up -d
After creating the database schema, populate it with initial data:

This link directly to the DB configuration in the .env file, because this file use the predefined Sequelize Connector to populate the database
  node -r dotenv/config seeders/seed.js
You can change the data to be populate (mostly users' emails to match your wanted emails by go to the CREATE USER part of the file)

This script will:
- Clean existing data (if any)
- Create default categories
- Create sample users (admin, sellers, bidders)
- Create sample products and bids
- Set up initial relationships

Note: This step is REQUIRED for the application to work properly as it creates
      necessary baseline data.

================================================================================
STEP 6: SETUP ELK STACK (Elasticsearch, Logstash, Kibana)
================================================================================

The backend uses the ELK stack for centralized logging and monitoring.

6.1 Prepare Log Directory
--------------------------
Make sure the logs/ directory exists in the backend root:

  mkdir logs

6.2 Start ELK Stack with Docker Compose
----------------------------------------
Run the following command to start all ELK services:

  docker-compose -f docker-compose.logging.yml up -d

This will start:
- Elasticsearch (port 9200) - Log storage and search engine
- Logstash (port 5044) - Log processing pipeline
- Kibana (port 5601) - Visualization and dashboard UI
- Filebeat - Log shipper

6.3 Verify ELK Stack is Running
--------------------------------
Check if all containers are running:

  docker ps

You should see 4 containers: elasticsearch, logstash, kibana, filebeat

Access Kibana dashboard at: http://localhost:5601

6.4 Configure Kibana (First Time Setup)
----------------------------------------
1. Open Kibana at http://localhost:5601
2. Wait for Kibana to connect to Elasticsearch (may take 1-2 minutes)
3. Go to "Stack Management" → "Index Patterns"
4. Create an index pattern for "bids-app-log-*" to view application logs

Note: The ELK stack is optional for basic development but recommended for
      production-like logging and debugging.

================================================================================
STEP 7: START THE BACKEND SERVER
================================================================================

Development Mode (with auto-restart)
-----------------------------------------
For development with automatic server restart on code changes:

  npm run dev

The server will start on the port specified in your .env file (default: 3000)

You should see output similar to:
  "Connection has been established successfully."
  "Server is running on http://localhost:3000"

================================================================================
STEP 8: VERIFY INSTALLATION
================================================================================

8.1 Test Database Connection
-----------------------------
If the server starts successfully, the database connection is working.
You should see: "Connection has been established successfully."

8.2 Access API Documentation
-----------------------------
The backend includes Swagger API documentation. Access it at:

  http://localhost:3000/api-docs

This will show all available API endpoints and allow you to test them.

8.3 Test Basic Endpoints
-------------------------
You can test the API using:
- Swagger UI at http://localhost:3000/api-docs
- Postman or similar API client
- The tests/product.test.http file (requires REST Client extension in VS Code)

8.4 Check WebSocket Connection
-------------------------------
The backend uses Socket.IO for real-time features. The socket server runs on
the same port as the Express server (default: 3000).

================================================================================
COMMON ISSUES AND TROUBLESHOOTING
================================================================================

Issue 1: "Error: connect ECONNREFUSED" or Database connection fails
--------------------------------------------------------------------
Solution:
- Verify PostgreSQL is running
- Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in .env
- Ensure the database "project-final" exists
- Check PostgreSQL logs for authentication errors

Issue 2: Port already in use (EADDRINUSE)
------------------------------------------
Solution:
- Change the PORT value in .env file
- Or stop the process using that port

Issue 3: JWT errors or authentication issues
---------------------------------------------
Solution:
- Ensure ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET are set in .env
- Make sure they are long, random strings (at least 32 characters)

Issue 4: Email sending fails
-----------------------------
Solution:
- For Gmail, ensure you're using an App Password, not your regular password
- Enable "Less secure app access" or use App Passwords
- Check EMAIL_USER and EMAIL_PASS in .env

Issue 5: ELK stack containers fail to start
--------------------------------------------
Solution:
- Ensure Docker Desktop is running
- Check if ports 9200, 5044, 5601 are available
- Increase Docker memory allocation (Settings → Resources → Memory)
- Run: docker-compose -f docker-compose.logging.yml logs to see error messages

Issue 6: Seeders script fails
------------------------------
Solution:
- Ensure database schema is created first (Step 3.2)
- Check database connection settings in .env
- Make sure you have write permissions to the database

================================================================================
ADDITIONAL INFORMATION
================================================================================

Project Structure Overview:
---------------------------
- controllers/    - Request handlers for each feature
- models/         - Sequelize ORM models (database tables)
- routes/         - API route definitions
- services/       - Business logic layer
- utils/          - Helper functions (db, email, tokens, etc.)
- seeders/        - Database seed scripts
- config/         - Configuration files for ELK stack
- migrations/     - Database migration files (if any)
- tests/          - HTTP test files

Key Features:
-------------
- RESTful API for auction platform
- Real-time bidding with Socket.IO
- User authentication with JWT
- Email notifications
- PayPal payment integration
- Automatic bidding system
- Product categories and search
- User feedback and messaging
- Watchlist functionality
- Admin upgrade requests

Development Scripts:
--------------------
- npm run dev        - Start development server with auto-reload

================================================================================
NEXT STEPS
================================================================================

After completing the setup:

1. Create an admin user or use seeded users to test the system
2. Explore API endpoints via Swagger UI at http://localhost:3000/api-docs
3. Set up the frontend application to connect to this backend
4. Configure CORS settings in index.js if frontend runs on different port
5. Review security settings before deploying to production

================================================================================
SUPPORT AND DOCUMENTATION
================================================================================

For additional help:
- Check the swagger-openapi.json file for complete API documentation
- Review code comments in controllers and services
- Check application logs in the logs/ directory
- View Kibana dashboard for detailed log analysis

================================================================================
END OF SETUP GUIDE
================================================================================

Last Updated: January 11, 2026
