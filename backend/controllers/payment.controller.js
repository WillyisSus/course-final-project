import models from '../models/init-models.js'; 
import { PaypalService } from '../services/paypal.service.js';
import { ProductService } from '../services/product.service.js';
import { ProductReceiptService } from '../services/productReceipts.service.js';

const EXCHANGE_RATE = 25000; 

const paymentController = {
    createOrder: async (req, res) => {
        try {
            const { product_id } = req.body;
            const userId = req.user.user_id;
            
            const productReceipt = await ProductReceiptService.getReceiptByProductId(product_id);
            if (!productReceipt) return res.status(404).json({ message: "Product receipt not found" });

            let amountVND = productReceipt.amount;
            // if (product.status === 'ACTIVE' && product.price_buy_now) {
            //     amountVND = product.price_buy_now;
            // } else if (isWinner) {
            //     amountVND = product.price_current;
            // } else {
            //      amountVND = product.price_buy_now || product.price_current;
            // }

       
            const amountUSD = (amountVND / EXCHANGE_RATE).toFixed(2);

            console.log(`Converting ₫${amountVND} to $${amountUSD}`);

   
            const order = await PaypalService.createOrder(amountUSD);
            res.json(order);
        } catch (error) {
            console.error("PayPal Create Error:", error);
            res.status(500).json({ message: "Failed to create order" });
        }
    },
    captureOrder: async (req, res) => {

        try {
            const { orderID, product_id } = req.body;
            const captureData = await PaypalService.capturePayment(orderID);

            if (captureData.status === 'COMPLETED') {
                const productReceipt = await ProductReceiptService.getReceiptByProductId(product_id);
                await productReceipt.update({ paid_by_buyer: true });
                res.json({ status: 'FINISHED' });
            }
        } catch (error) {
            console.error("Capture Error:", error);
            res.status(500).json({ message: "Payment failed" });
        }
    }
};
export default paymentController;