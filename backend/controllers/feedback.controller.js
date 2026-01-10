import { FeedbackService } from '../services/feedback.service.js';
import { ProductService } from '../services/product.service.js';
import { UserService } from '../services/user.service.js';
import { emailTemplates, sendEmail } from '../utils/email.js';

const feedbackController = {
    // GET /api/feedbacks?user_id=123
    getAll: async (req, res) => {
        try {
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({ 
                    message: "user_id query parameter is required to fetch feedbacks." 
                });
            }
            const feedbacks = await FeedbackService.findAllFeedbacksByUser(user_id);
            res.json({ 
                message: `Feedbacks for user ${user_id} retrieved`, 
                data: feedbacks 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },


    // POST /api/feedbacks
    postOne: async (req, res) => {
        try {
            const from_user_id = req.user.user_id;
            const feedbackData = {
                ...req.body,
                from_user_id: from_user_id
            };

            const newFeedback = await FeedbackService.createFeedback(feedbackData);
            if (newFeedback){
                const toUser = await UserService.findUserById(newFeedback.to_user_id);
                const product = await ProductService.findProductById(newFeedback.product_id);
                console.log('Send email to ', toUser.email);
                let email = {};
                if (parseInt(newFeedback.rating) > 0){
                    email = emailTemplates.positiveFeedback(toUser.full_name, product.name, newFeedback.comment, product.product_id)
                } else{
                    email = emailTemplates.negativeFeedback(toUser.full_name, product.name, newFeedback.comment, product.product_id)
                }
                await sendEmail({to: toUser.email, subject: email.subject, html: email.html});
            }
            res.status(201).json({ 
                message: "Feedback submitted successfully", 
                data: newFeedback 
            });
        } catch (error) {
            // Check for specific error messages from the Service
            if (error.message.includes('cannot leave feedback')) {
                return res.status(403).json({ message: error.message });
            }
            res.status(500).json({ message: error.message });
        }
    },

    // PUT /api/feedbacks/:id
    putOne: async (req, res) => {
        try {
            const updatedFeedback = await FeedbackService.updateFeedback(req.params.id, req.body);
            
            res.json({ 
                message: "Feedback updated", 
                data: updatedFeedback 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // DELETE /api/feedbacks/:id
    deleteOne: async (req, res) => {
        try {
            // Usually an Admin-only function or logic to check ownership
            await FeedbackService.deleteFeedback(req.params.id);
            res.json({ message: "Feedback deleted" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

}

export default feedbackController;