import { UpgradeRequestService } from '../services/upgradeRequest.service.js';

const upgradeRequestController = {
    // GET /api/upgrade-requests?status=PENDING
    // Admin: View queue of requests
    getAll: async (req, res) => {
        try {
            // Optional filter: defaults to 'PENDING' if not specified, 
            // or fetch all if logic allows. Service usually defaults to PENDING.
            const status = req.query.status || 'PENDING';
            
            const requests = await UpgradeRequestService.findAllUpgradeRequests(status);
            
            res.json({ 
                message: `Upgrade requests with status '${status}' retrieved`, 
                data: requests 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // GET /api/upgrade-requests/:id
    // Admin: View details of a specific request
    getOne: async (req, res) => {
        try {
            // Note: If findRequestById isn't in your service, 
            // you might need to add it or use findAllUpgradeRequests filtering by ID logic.
            // Assuming we add a simple lookup helper:
            // const request = await models.upgrade_requests.findByPk(req.params.id); 
            // OR use the Service if implemented.
            
            // For now, returning 501 as this is rarely used (Admins usually view the list)
            res.status(501).json({ message: "Single request view not implemented yet" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // POST /api/upgrade-requests
    // Authenticated User: "I want to become a Seller"
    postOne: async (req, res) => {
        try {
            const userId = req.user.user_id; // From Auth Middleware
            const { reason } = req.body;

            const newRequest = await UpgradeRequestService.createUpgradeRequest(userId, reason);

            res.status(201).json({ 
                message: "Upgrade request submitted successfully", 
                data: newRequest 
            });
        } catch (error) {
            // Handle duplicate request error
            if (error.message.includes('already have a pending')) {
                return res.status(409).json({ message: error.message });
            }
            res.status(500).json({ message: error.message });
        }
    },

    // PUT /api/upgrade-requests/:id
    // Admin: Approve or Reject
    putOne: async (req, res) => {
        try {
            const { status } = req.body; // Expecting "APPROVED" or "REJECTED"
            const requestId = req.params.id;

            if (!['APPROVED', 'REJECTED'].includes(status)) {
                return res.status(400).json({ message: "Status must be APPROVED or REJECTED" });
            }

            // Service handles the side-effects (e.g., updating User Role if Approved)
            const updatedRequest = await UpgradeRequestService.updateUpgradeRequestStatus(requestId, status);

            res.json({ 
                message: `Request ${status.toLowerCase()} successfully`, 
                data: updatedRequest 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // DELETE /api/upgrade-requests/:id
    // Admin: Clean up old requests
    deleteOne: async (req, res) => {
        try {
            await UpgradeRequestService.deleteUpgradeRequest(req.params.id);
            res.json({ message: "Upgrade request deleted" });
        } catch (error) {
            const status = error.message.includes('not found') ? 404 : 500;
            res.status(status).json({ message: error.message });
        }
    },
}

export default upgradeRequestController;