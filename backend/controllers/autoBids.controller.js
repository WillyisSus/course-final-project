import { AutoBidService } from '../services/autoBid.service.js';

const autoBidController = {
    // GET /api/auto-bids?product_id=123
    getAll: async (req, res) => {
        try {
            const { product_id } = req.query;

            if (!product_id) {
                return res.status(400).json({ 
                    message: "product_id query parameter is required to fetch auto-bids." 
                });
            }

            const autoBids = await AutoBidService.findAllAutoBidsOfProduct(product_id);
            res.json({ 
                message: `Auto-bids for product ${product_id} retrieved`, 
                data: autoBids 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // GET /api/auto-bids/:id
    getOne: async (req, res) => {
        try {
            // Note: We didn't explicitly create findAutoBidById in the service 
            // because auto-bids are usually accessed via the Product list.
            // If you need this, add findAutoBidById to AutoBidService first.
            res.status(501).json({ message: "Get single auto-bid not implemented yet." });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    // POST /api/auto-bids
    postOne: async (req, res) => {
        try {
            const bidderId = req.user.user_id; // From auth middleware
            const { product_id, max_price } = req.body;

            const newAutoBid = await AutoBidService.createAutoBid(product_id, bidderId, max_price);

            res.status(201).json({ 
                message: "Auto-bid configuration created successfully", 
                data: newAutoBid 
            });
        } catch (error) {
            // Handle specific business logic errors (like 'Max price too low') with 400
            res.status(400).json({ message: error.message });
        }
    },

    // PUT /api/auto-bids/:id
    putOne: async (req, res) => {
        try {
            const bidderId = req.user.user_id;
            const autoBidId = req.params.id;
            const { max_price } = req.body;

            const updatedAutoBid = await AutoBidService.updateAutoBid(autoBidId, bidderId, max_price);

            res.json({ 
                message: "Auto-bid updated successfully", 
                data: updatedAutoBid 
            });
        } catch (error) {
            const status = error.message.includes('Unauthorized') ? 403 : 400;
            res.status(status).json({ message: error.message });
        }
    },

    // DELETE /api/auto-bids/:id
    deleteOne: async (req, res) => {
        try {
            const bidderId = req.user.user_id;
            const autoBidId = req.params.id;

            await AutoBidService.deleteAutoBid(autoBidId, bidderId);

            res.json({ message: "Auto-bid deleted successfully" });
        } catch (error) {
            const status = error.message.includes('Unauthorized') ? 403 : 400;
            res.status(status).json({ message: error.message });
        }
    },

}

export default autoBidController;