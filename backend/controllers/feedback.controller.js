import { FeedbackService } from '../services/feedback.service.js';

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
            // 1. Identify the reviewer (the logged-in user)
            const from_user_id = req.user.user_id;

            // 2. Prepare the data
            // The body should contain: { product_id, to_user_id, rating, comment }
            // Note: ideally, 'to_user_id' should be calculated server-side based on the product
            // to prevent manipulation, but for now we follow the Zod schema you accepted.
            const feedbackData = {
                ...req.body,
                from_user_id: from_user_id
            };

            const newFeedback = await FeedbackService.createFeedback(feedbackData);

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
            // In many systems, feedbacks are immutable. 
            // If you allow editing, you should strictly check ownership here.
            
            // For now, allowing update via Service:
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