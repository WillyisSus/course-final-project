import { WatchlistService } from '../services/watchlist.service.js';

const watchlistController = {
    // GET /api/watchlists
    // Returns all products watched by the current user
    getAll: async (req, res) => {
        try {
            const userId = req.user.user_id; // From Auth Middleware
            
            const watchlist = await WatchlistService.findAllWatchlistItems(userId);
            
            res.json({ 
                message: "Your watchlist retrieved successfully", 
                data: watchlist 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // GET /api/watchlists/:id
    // Check if a specific product (by ID) is in the user's watchlist
    // Useful for the frontend to toggle the "Heart" icon state
    getOne: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const productId = req.params.id;

            // We reuse the service logic or call a specific check function
            // Here I'll verify via the list or a direct find (assuming you might add findOne to service)
            // For now, let's assume we fetch all and find it (or you can add isWatched() to Service)
            const items = await WatchlistService.findAllWatchlistItems(userId);
            const isWatched = items.some(item => item.product_id == productId);

            if (!isWatched) {
                return res.status(404).json({ message: "Product is not in your watchlist" });
            }

            res.json({ 
                message: "Product is in your watchlist", 
                data: { product_id: productId, is_watched: true } 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // POST /api/watchlists
    // Add a product to the watchlist
    postOne: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const { product_id } = req.body;

            if (!product_id) {
                return res.status(400).json({ message: "Product ID is required" });
            }

            const newItem = await WatchlistService.addToWatchlist(userId, product_id);

            res.status(201).json({ 
                message: "Added to watchlist", 
                data: newItem 
            });
        } catch (error) {
            // Handle duplicate entry gracefully
            if (error.message.includes('already in watchlist')) {
                return res.status(409).json({ message: error.message });
            }
            res.status(500).json({ message: error.message });
        }
    },

    // PUT /api/watchlists/:id
    // Not applicable for watchlists (it's binary: watched or not)
    putOne: async (req, res) => {
        res.status(405).json({ message: "Update not supported for watchlist items. Please Delete and Re-add." });
    },

    // DELETE /api/watchlists/:id
    // Remove a product from the watchlist
    deleteOne: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const productId = req.params.id;

            await WatchlistService.removeFromWatchlist(userId, productId);

            res.json({ message: "Removed from watchlist" });
        } catch (error) {
            const status = error.message.includes('not found') ? 404 : 500;
            res.status(status).json({ message: error.message });
        }
    },
}

export default watchlistController;