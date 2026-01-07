import models from '../utils/db.js'; //

export const UpgradeRequestService = {

  // Admin view: See all pending requests
  async findAllUpgradeRequests(statusFilter = 'PENDING') {
    return await models.upgrade_requests.findAll({
      where: { status: statusFilter }, //
      include: [
        {
          model: models.users,
          as: 'user', //
          attributes: ['user_id', 'full_name', 'email', 'positive_rating']
        }
      ],
      order: [['request_id', 'ASC']]
    });
  },
  async findUpgradeRequestById(userId) {
    return await models.upgrade_requests.findOne({
      where: { user_id: userId },
      include: [
        {
          model: models.users,
          as: 'user', //
          attributes: ['user_id', 'full_name', 'email', 'positive_rating', 'negative_rating']
        }
      ]
    });
  },
  // User Action: Create a request
  async createUpgradeRequest(userId, reason) {
    // Check if user already has a pending request
    const existing = await models.upgrade_requests.findOne({
      where: { 
        user_id: userId, 
        status: 'PENDING' 
      }
    });
    
    if (existing) throw new Error('You already have a pending upgrade request.');

    return await models.upgrade_requests.create({
      user_id: userId,
      reason,
      status: 'PENDING'
    });
  },

  // Admin Action: Approve or Reject
  async updateUpgradeRequestStatus(requestId, status) {
    const request = await models.upgrade_requests.findByPk(requestId);
    if (!request) throw new Error('Request not found');

    // If approved, we should automatically update the User's role
    if (status === 'APPROVED') {
        const user = await models.users.findByPk(request.user_id);
        if (user) {
            // Give them 7 days of seller privileges (example logic)
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 7);
            
            await user.update({ 
                role: 'SELLER',
                seller_exp_date: expiryDate //
            });
        }
    }

    return await request.update({ status });
  },

  async deleteUpgradeRequest(requestId) {
    const request = await models.upgrade_requests.findByPk(requestId);
    if (!request) throw new Error('Request not found');
    return await request.destroy();
  }
};