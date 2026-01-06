import { ProductCommentService } from '../services/productComments.service.js';

const productCommentController = {
    // GET /api/comments?product_id=123
    // Fetch all Q&A for a specific product
    getAll: async (req, res) => {
        try {
            const { product_id } = req.query;

            if (!product_id) {
                return res.status(400).json({ 
                    message: "product_id query parameter is required." 
                });
            }

            const comments = await ProductCommentService.findAllByProduct(product_id);
            
            res.json({ 
                message: "Product comments retrieved", 
                data: comments 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // POST /api/comments
    // Post a new Question or Reply
    postOne: async (req, res) => {
        try {
            const userId = req.user.user_id; // From Auth Middleware
            const { product_id, content, parent_id } = req.body;

            // Basic validation
            if (!content || !product_id) {
                return res.status(400).json({ message: "Content and Product ID are required" });
            }

            const newComment = await ProductCommentService.createComment(
                product_id, 
                userId, 
                content, 
                parent_id || null // null if it's a root question
            );
            const commentPayload = await ProductCommentService.findCommentById(newComment.comment_id);
            const io = req.app.get('io');
            io.to(`product_${product_id}`).emit('new_comment', {
                type: "NEW_COMMENT",
                data: commentPayload
            });
            res.status(201).json({ 
                message: parent_id ? "Reply posted successfully" : "Question posted successfully", 
                data: newComment 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    replyComment: async (req, res) => {
        try {
            const productId = req.params.id;
            const userId = req.user.user_id;
            const { content, parentId } = req.body;
            const newReply = await ProductCommentService.createComment(productId, userId, content, parentId);
            res.status(201).json({ message: "Reply added successfully", data: newReply });
        } catch (error) {
            console.error("Error in replyComment:", error);
            res.status(500).json({ message: error.message });   
        }
    },
    // DELETE /api/comments/:id
    deleteOne: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const commentId = req.params.id;

            await ProductCommentService.deleteComment(commentId, userId);

            res.json({ message: "Comment deleted successfully" });
        } catch (error) {
            const status = error.message.includes('Unauthorized') ? 403 : 500;
            res.status(status).json({ message: error.message });
        }
    }
};

export default productCommentController;