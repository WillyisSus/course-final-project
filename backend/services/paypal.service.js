import axios from 'axios';
const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_API_BASE } = process.env;

export const PaypalService = {
  async generateAccessToken() {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const response = await axios.post(`${PAYPAL_API_BASE}/v1/oauth2/token`, 
      'grant_type=client_credentials', 
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data.access_token;
  },

  async createOrder(amount) {
    const accessToken = await this.generateAccessToken();
    const url = `${PAYPAL_API_BASE}/v2/checkout/orders`;
    
    const payload = {
      intent: 'CAPTURE',
      purchase_units: [{
          amount: { currency_code: 'USD', value: amount.toString() },
      }],
    };

    const response = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  // 3. Capture Payment (Take the Money)
  async capturePayment(orderId) {
    const accessToken = await this.generateAccessToken();
    const url = `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`;

    const response = await axios.post(url, {}, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    return response.data;
  }
};