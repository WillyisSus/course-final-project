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
  bidPlaced: (productName, newPrice, productId) => ({
    subject: `New Bid on: ${productName}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h3>New Bid Alert! 🔨</h3>
        <p>A new bid of <b>$${newPrice}</b> has been placed on <b>${productName}</b>.</p>
        <a href="http://localhost:5173/products/${productId}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Auction</a>
      </div>
    `
  }),

  // C. Winner Notification
  auctionWinner: (winnerName, productName, price, productId) => ({
    subject: "Congratulations! You Won!",
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>🎉 You Won the Auction!</h2>
        <p>Dear ${winnerName},</p>
        <p>You have won <b>${productName}</b> with a final bid of <b>$${price}</b>.</p>
        <a href="http://localhost:5173/products/${productId}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">View Product</a>
        <p>Please proceed to checkout to claim your item.</p>
      </div>
    `
  }),

  // D. Payment Confirmation
  paymentConfirmation: (buyerName, productName, amount, receiptId) => ({
    subject: `Payment Received for ${productName}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>✅ Payment Confirmed</h2>
        <p>Dear ${buyerName},</p>
        <p>Thank you for your payment! We have successfully received your payment of <b>$${amount}</b> for <b>${productName}</b>.</p>
        <p><b>Receipt ID:</b> ${receiptId}</p>
        <p>Your item will be processed shortly. You can track the status and contact with the seller in your account dashboard.</p>
      </div>
    `
  }),

  // E. Block Notification
  blockNotification: (userName, productName, reason, productId) => ({
    subject: "Your Bids have been rejected by seller",
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Bids Refejection Notice</h2>
        <p>Dear ${userName},</p>
        <p>Your bids have be rejected from the product ${productName} by seller </p>
        <p><b>${reason || 'Policy violation'}</b></p>
        <a href="http://localhost:5173/products/${productId}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">View Product</a>
        <p>If you believe this is a mistake, please contact support so we can review your case.</p>
      </div>
    `
  }),

  // F. Transaction canceled by seller
  canceledTransactionBySeller: (buyerName, productName, reason, productId) => ({
    subject: `Transaction canceled for ${productName}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Transaction Canceled</h2>
        <p>Dear ${buyerName},</p>
        <p>The seller has canceled the transaction for <b>${productName}</b>.</p>
        <p><b>Reason:</b> ${reason || 'No reason provided'}</p>
        <a href="http://localhost:5173/products/${productId}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">View Product</a>
        <p>If you have questions or would like us to review this decision, please reach out to support.</p>
      </div>
    `
  }),

  // G. Negative feedback notice
  negativeFeedback: (recipientName, productName, comment, productId) => ({
    subject: `New negative feedback on ${productName}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>New Feedback Received</h2>
        <p>Hi ${recipientName},</p>
        <p>You received <b>negative feedback</b> on <b>${productName}</b>.</p>
        <p><b>Comment:</b> ${comment || 'No additional details provided.'}</p>
        <a href="http://localhost:5173/products/${productId}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">View Product</a>
        <p>If you disagree with this feedback or need help, please contact support.</p>
      </div>
    `
  }),

  // H. Positive feedback notice
  positiveFeedback: (recipientName, productName, comment, productId) => ({
    subject: `New positive feedback on ${productName}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Great Feedback Received</h2>
        <p>Hi ${recipientName},</p>
        <p>You received <b>positive feedback</b> on <b>${productName}</b>. Nice work!</p>
        <p><b>Comment:</b> ${comment || 'No additional details provided.'}</p>
        <a href="http://localhost:5173/products/${productId}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">View Product</a>
        <p>Keep it up and thanks for being a valued member of our marketplace.</p>
      </div>
    `
  }),

  // I. Forgot Password Request
  forgotPasswordRequest: (userName, resetUrl) => ({
    subject: "Reset Your BigBiddie Password",
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>Hi ${userName},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Reset Password</a>
        <p>This link will expire in 15 minute for security reasons.</p>
        <p>If you didn't request a password reset, you can safely ignore this email. Do not share this email at risk of compromising your account</p>
      </div>
    `
  })
};