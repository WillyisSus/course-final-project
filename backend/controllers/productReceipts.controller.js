import { ProductReceiptService } from '../services/product_receipt.service.js';

const productReceiptController = {
    // GET /api/receipts
    getAll: async (req, res) => {
        try {
            const userId = req.user.user_id; // From Auth Middleware
            const receipts = await ProductReceiptService.getUserReceipts(userId);
            
            res.json({ 
                message: "Receipts retrieved successfully", 
                data: receipts 
            });
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
            const { product_id, seller_id, amount } = req.body;
            const buyer_id = req.user.user_id;

            const newReceipt = await ProductReceiptService.createReceipt({
                product_id,
                buyer_id,
                seller_id,
                amount
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