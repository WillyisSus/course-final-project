import jwt from 'jsonwebtoken';
// Only for in template, this should import Sequelize Models
import models from './db.js';
/**
 * @description This function generates accessToken and refreshToken, return both tokens and store new refreshToken in the database after removing the old one
 * @param payload 
 * @example 
 * {
 *   username: "Vo viet Long"
 *   password: "password"
 * }
 */
const generateAccessToken = async (payload) => {
    try {
        const accessToken = jwt.sign(payload,
            process.env.ACCESS_TOKEN_SECRET,
            {expiresIn: "15m"}
        )
        return Promise.resolve(accessToken)
    } catch (error) {
        return Promise.reject(error)   
    }
}
const generateRefreshToken = async (payload) => {
    try {
        const refreshToken = jwt.sign(payload,
            process.env.REFRESH_TOKEN_SECRET,
            {expiresIn: "7d"}
        )
        
        // 1. Find in the database if there is a refresh token record of userID
        // 2. Remove the stored refresh token
        // 3. Store new refresh token in the database
        // Change logic when using this template in exam
        const userOldToken = await models.refresh_tokens.findOne({
            where:{
                user_id: userId
            }
        })
        if (userOldToken) {
            await userOldToken.destroy();  
        }
        const newToken = models.refresh_tokens.build({user_id: userId, token: refreshToken})
        await newToken.save();
        // Keep this refresh token safe
        return Promise.resolve(refreshToken)
    } catch (error) {
        return Promise.reject(error);
    }
}
export default { generateAccessToken, generateRefreshToken }