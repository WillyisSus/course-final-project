import { BidService } from '../services/bids.service.js';

const bidController = {
    // GET /api/bids?product_id=123
    getAll: async (req, res) => {
        try {
            const { product_id } = req.query;

            // Bids are meaningless without the context of a product
            if (!product_id) {
                return res.status(400).json({ 
                    message: "product_id query parameter is required to fetch bid history." 
                });
            }

            const bids = await BidService.findAllBidsOfProduct(product_id);
            
            res.json({ 
                message: `Bid history for product ${product_id} retrieved`, 
                data: bids 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // GET /api/bids/:id
    // useful for auditing a specific transaction
    getOne: async (req, res) => {
        try {
            // Since we didn't explicitly export findBidById in the service earlier (as it's rarely used),
            // we can implement a quick lookup here or return 501 if you don't need it.
            // For now, I'll return a placeholder to keep the template structure valid.
            res.status(501).json({ message: "Single bid lookup is not yet implemented." });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    // postOne, putOne, and deleteOne have been removed 
    // because bid creation is handled by the AutoBid system/Business Logic
    // and history should be immutable.
}

export default bidController;