import { ProductService } from "../services/product.service.js";
import { ProductReceiptService } from "../services/productReceipts.service.js";
import { UserService } from "../services/user.service.js";
import { emailTemplates, sendEmail } from "../utils/email.js";
const productReceiptController = {
    // GET /api/receipts?product_id=XXX&role=BIDDER/SELLER/ADMIN
    getAll: async (req, res) => {
        try {
            const product_id = req.query.product_id;
            const role = req.query.role;
            const user = req.user;
            if (role && role === 'ADMIN' && user.role != 'ADMIN'){
                return res.status(403).json({ message: "Access denied. Who are you?" });
            }
            if (!product_id && !role){
                return res.status(400).json({ message: "product_id or role query parameter is required" });
            }
            if (product_id) {
                const receipt = await ProductReceiptService.getReceiptByProductId(product_id);
                if (!receipt) {
                    return res.status(404).json({ message: "Receipt not found for the given product ID" });
                }
                return res.json({
                    message: "Receipt details retrieved",
                    data: receipt
                });
            }else{
                const receipts = await ProductReceiptService.getUserReceipts(user.user_id, role);
                if (!receipts || receipts.length === 0) {
                    return res.status(404).json({ message: "No receipts found for the user" });
                }
                return res.json({
                    message: "User receipts retrieved",
                    data: receipts
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    // GET /api/receipts/:id
    getOne: async (req, res) => {
        try {
            const receiptId = req.params.id;
            const receipt = await ProductReceiptService.getReceiptById(receiptId);
            
            if (!receipt) {
                return res.status(404).json({ message: "Receipt not found" });
            }

            const userId = req.user.user_id;
            if (receipt.buyer_id !== userId && receipt.seller_id !== userId && req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: "Access denied" });
            }

            res.json({ 
                message: "Receipt details retrieved", 
                data: receipt 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // POST /api/receipts
    postOne: async (req, res) => {
        try {
            const {product_id} = req.body;
            const buyer_id = req.user.user_id;
            if (!buyer_id || !product_id) 
            {
                return res.status(400).json({ message: "buyer_id and product_id are required" });
            }
            const oldReceipt = await ProductReceiptService.getReceiptByProductId(product_id);
            if (oldReceipt) {
                return res.status(400).json({ message: "Receipt for this product already exists" });
            }
            const product = await ProductService.findProductById(product_id);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }
            await product.update({
                status: 'EXPIRED',
                winner_id: buyer_id,
                price_current: product.price_buy_now || product.price_current
            });
            const newReceipt = await ProductReceiptService.createReceipt({
                product_id: product.product_id,
                buyer_id: product.winner_id,
                seller_id: product.seller_id,
                amount: product.price_current
            });
            res.status(201).json({ 
                message: "Receipt created successfully", 
                data: newReceipt 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // PUT /api/receipts/:id
    // Used for updating status (Paid, Confirmed)
    putOne: async (req, res) => {
        try {
            const receiptId = req.params.id;
            const userId = req.user.user_id;
            const updateData = req.body; // e.g. { paid_by_buyer: true }
            
            const updatedReceipt = await ProductReceiptService.updateReceiptStatus(receiptId, userId, updateData);
            if (updatedReceipt.status === 'CANCELED'){
                const product = await ProductService.findProductById(updatedReceipt.product_id);
                const buyer = await UserService.findUserById(updatedReceipt.buyer_id);
                const {subject, html} = emailTemplates.canceledTransactionBySeller(buyer.full_name, product.name, "Please check the following feedback for reason of cancellation.", product.product_id);
                await sendEmail({to: buyer.email, subject: subject, html: html})
            }
            res.json({ 
                message: "Receipt updated successfully", 
                data: updatedReceipt 
            });
        } catch (error) {
            if (error.message.includes("authorized")) {
                return res.status(403).json({ message: error.message });
            }
            res.status(500).json({ message: error.message });
        }
    },

    // DELETE /api/receipts/:id
    deleteOne: async (req, res) => {
        try {
            res.status(501).json({ message: "Delete operation not supported for receipts" });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
};

export default productReceiptController;