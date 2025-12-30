import models from '../utils/db.js'; //

export const UserService = {

  // creating a new user, usually during registration
  async createUser(userData) {
    // strict check to ensure email is unique before hitting the DB error
    const existingUser = await models.users.findOne({ 
      where: { email: userData.email } //
    });
    
    if (existingUser) {
      throw new Error('Email is already registered');
    }

    // I'm assuming the controller hashes the password before passing it here,
    // or I could add a library like bcrypt here if I wanted this service to be self-contained.
    // For now, I'll assume userData is ready for insertion.
    return await models.users.create({
      ...userData,
      is_verified: false, // default to false until OTP check
      role: 'BIDDER',     // default role
      positive_rating: 0,
      negative_rating: 0
    });
  },

  // fetching a user profile by ID, but stripping out sensitive auth data
  async findUserById(userId) {
    console.log("Finding user by ID:", userId);
    const user = await models.users.findOne({
      where: { user_id: userId },
      attributes: { 
        exclude: ['password_hash', 'refresh_token'] // keeping secrets secret
      }
    });

    if (!user) {
      throw new Error('User not found');
    }
    return user;
  },

  // helper to find by email (useful for login flows), explicitly requesting the password if needed
  async findUserByEmail(email, withPassword = false) {
    const options = {
      where: { email: email },
      attributes: {
        exclude: ['refresh_token', 'otp_code'] // always exclude these
      }
    };
    
    if (!withPassword) {
      options.attributes.exclude.push('password_hash');
    }

    return await models.users.findOne(options);
  },
  async getRefreshTokenByUserId(userId) {
    const user = await models.users.findByPk(userId, {
      attributes: ['refresh_token']
    });
    if (!user) {
      throw new Error('User not found');
    }
    return user.refresh_token;
  },
  // updating profile info like address or full name
  async updateUser(userId, updateData) {
    const user = await models.users.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // preventing accidental role escalation through a standard update
    if (updateData.role && updateData.role !== user.role) {
      throw new Error('Cannot update role directly. Use the upgrade request flow.');
    }

    return await user.update(updateData);
  },

  // deleting a user account
  async deleteUser(userId) {
    const user = await models.users.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // strict check: I can't delete a user if they have active ties to the system.
    // checking for products
    const productCount = await models.products.count({ where: { seller_id: userId } });
    if (productCount > 0) {
      throw new Error('Cannot delete user: They have listed products.');
    }

    // checking for bids
    const bidCount = await models.bids.count({ where: { bidder_id: userId } });
    if (bidCount > 0) {
      throw new Error('Cannot delete user: They have a bidding history.');
    }

    // safe to delete since they have no major dependencies
    return await user.destroy();
  }
};