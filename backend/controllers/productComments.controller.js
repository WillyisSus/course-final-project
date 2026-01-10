import { ProductService } from '../services/product.service.js';
import { ProductCommentService } from '../services/productComments.service.js';
import { UserService } from '../services/user.service.js';
import { emailTemplates, sendEmail } from '../utils/email.js';

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
            console.log("Fetched comments for Product ID:", product_id, comments);
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
            console.log("Posting comment for Product ID:", product_id, "by User ID:", userId);
            // Basic validation
            if (!content || !product_id) {
                return res.status(400).json({ message: "Content and Product ID are required" });
            }
            const product = await ProductService.findProductById(product_id);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }
            const newComment = await ProductCommentService.createComment(
                product_id, 
                userId, 
                content, 
                parent_id || null // null if it's a root question
            );
            const commentPayload = await ProductCommentService.findCommentById(newComment.comment_id);
            if (userId !== product.seller_id){
                const seller = await UserService.findUserById(product.seller_id);
                const email = emailTemplates.newCommentOnProduct(
                    seller.full_name, 
                    product.name, 
                    product.product_id,)
                await sendEmail({to: seller.email, subject: email.subject, html: email.html});
            }
            const io = req.app.get('io').to(`product_${product_id}`);
            io.emit('new_comment', {
                type: parent_id?"REPLY_COMMENT":"NEW_COMMENT",
                data: commentPayload
            });
            res.status(201).json({ 
                message: parent_id ? "Reply posted successfully" : "Question posted successfully", 
                data: newComment 
            });
        } catch (error) {
            console.error("Error in postOne:", error);
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