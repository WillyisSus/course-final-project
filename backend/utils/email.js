import nodemailer from 'nodemailer';

// 1. Create the Transporter
// Ideally, put these credentials in your .env file
const transporter = nodemailer.createTransport({
  service: 'gmail', // or use 'host' and 'port' for other providers
  auth: {
    user: process.env.EMAIL_USER, // e.g., 'your-email@gmail.com'
    pass: process.env.EMAIL_PASS  // App Password (NOT your login password)
  }
});

// 2. Define the sending function
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"BigBiddie" <${process.env.EMAIL_USER}>`, // Sender address
      to,      // Receiver email
      subject, // Subject line
      html,    // HTML body content
    });

    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

// --- 3. TEMPLATES (The Logic you asked for) ---

export const emailTemplates = {
  // A. OTP Verification
  otpVerification: (otpCode) => ({
    subject: "Verify your BigBiddie Account",
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Welcome to BigBiddie!</h2>
        <p>Please use the following OTP to verify your account:</p>
        <h1 style="color: #2563eb; letter-spacing: 5px;">${otpCode}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `
  }),

  // B. New Bid Notification (To the Seller or Previous Bidder)
  bidPlaced: (productName, newPrice, productUrl) => ({
    subject: `New Bid on: ${productName}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h3>New Bid Alert! 🔨</h3>
        <p>A new bid of <b>$${newPrice}</b> has been placed on <b>${productName}</b>.</p>
        <a href="${productUrl}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Auction</a>
      </div>
    `
  }),

  // C. Winner Notification
  auctionWinner: (winnerName, productName, price) => ({
    subject: "Congratulations! You Won!",
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>🎉 You Won the Auction!</h2>
        <p>Dear ${winnerName},</p>
        <p>You have won <b>${productName}</b> with a final bid of <b>$${price}</b>.</p>
        <p>Please proceed to checkout to claim your item.</p>
      </div>
    `
  })
};