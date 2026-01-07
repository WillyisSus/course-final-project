import {AutoBidService} from '../services/autobids.service.js';
import { BidService } from '../services/bids.service.js';
import { ProductService } from '../services/product.service.js';
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
    // GET /api/auto-bids?product_id=123
    getAutoBidOfUserForProduct: async (req, res) => {
        try {
            const { product_id} = req.query;
            const bidderId = req.user.user_id;
            if (bidderId === undefined) {
                return res.status(401).json({ 
                    message: "Something wrong happened when checking user info." 
                });
            }
            const autoBids = await AutoBidService.findAutoBidOfUserForProduct(product_id, bidderId);
            res.json({
                message: "Auto-bids for user retrieved",
                data: autoBids
            });
        } catch (error) {
            console.error("Error in getAutoBidOfUserForProduct:", error);
            res.status(500).json({ message: error.message });
        }
    },

    // POST /api/auto-bids
    postOne: async (req, res) => {
        try {
            const bidderId = req.user?.user_id || 1; // From auth middleware
            const { product_id, max_price } = req.body;
            const newAutoBid = await AutoBidService.createAutoBid(product_id, bidderId, max_price);
            if (newAutoBid){
                const resData = {};
                resData.autoBid = newAutoBid;
                const calculateNewBids = await AutoBidService.calculateAutoBids(product_id, bidderId, max_price);
                if (calculateNewBids){
                    resData.bidUpdates = calculateNewBids;
                    const updatedProduct = await ProductService.findProductDetail(product_id);
                    const io = req.app.get('io')
                    io.to(`product_${product_id}`).emit('product_updated', {
                        type: 'BID_PLACED',
                        data: {
                            product: updatedProduct,
                            newBid: calculateNewBids
                        }
                    });
                }
                res.status(201).json({ 
                    message: "Auto-bid configuration created successfully", 
                    data: resData
                });
            }
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
            if (updatedAutoBid){
                const calculateNewBids = await AutoBidService.calculateAutoBids(updatedAutoBid.product_id, bidderId, max_price);
                if (calculateNewBids){
                    const newBidPlaced = await BidService.findBidDetail(calculateNewBids.bid_id);
                    const updatedProduct = await ProductService.findProductDetail(updatedAutoBid.product_id);
                    const io = req.app.get('io')
                    io.to(`product_${updatedAutoBid.product_id}`).emit('product_updated', {
                        type: 'BID_PLACED',
                        data: {
                            product: updatedProduct,
                            newBid: newBidPlaced
                        }
                    });
                }
            }
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