import { BlockBidderService } from "../services/blockedBidders.service.js";

const blockedBidderController = {
    getAll: async (req, res) => {
        try {
            const blockedBidders = await BlockBidderService.findAllBlocks()
            res.json({ message: "Get all blocked entry", data: blockedBidders });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    getAllBlockedByUser: async (req, res) => {
        try {
            const user_id = req.user.user_id;
            if (!user_id) {
                return res.status(400).json({ message: "user_id query parameter is required" });
            }
            const productId = req.params.productId;
            const blockedBidders = await BlockBidderService.findAllBlockedBySeller(user_id);
            res.json({ message: `Get blocked bidders for product ${productId}`, data: blockedBidders });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    getAllBlockedByProduct: async (req, res) => {
        try {
            const user_id = req.user.user_id;
            if (!user_id) {
                return res.status(400).json({ message: "user_id query parameter is required" });
            }
            const blockedEntries = await BlockBidderService.findAllBlockedByProduct(user_id);
            res.json({ message: `Get blocked products for user ${user_id}`, data: blockedEntries });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    deleteOne: async (req, res) => {
        try {
            const {user_id, product_id} = req.body;
            if (!user_id || !product_id) {
                return res.status(400).json({ message: "user_id and product_id are required" });
            }
            await BlockBidderService.deleteBlock(product_id, req.user.user_id, user_id);
            res.json({ message: `Blocked bidder with id ${req.params.id} deleted` });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

}

export default blockedBidderController;
