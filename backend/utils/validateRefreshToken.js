import jwt from 'jsonwebtoken';
import models from './db.js';
export const validateRefreshToken = async (payload) =>{
    try {
        const {user_id} = payload;
        const oldToken = await models.refresh_tokens.findOne({
            where:{
                user_id: user_id
            }
        })
        console.log(oldToken)
        const isValid = jwt.verify(oldToken.token,
            process.env.REFRESH_TOKEN_SECRET
        )
        return isValid
    } catch (error) {
        return Promise.reject(error);
    }
}