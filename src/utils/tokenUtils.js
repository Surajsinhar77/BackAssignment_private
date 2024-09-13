const jwt = require('jsonwebtoken')
const userModel = require("../model/user.model");
require('dotenv').config;

class TokenService{
    accessTokenSecret
    refreshTokenSecret

    payload = {
        _id: '_id',
        username: 'username',
        email: 'email',
    }

    constructor() {
        this.accessTokenSecret = process.env.ACCESS_TOKEN_SECRET_KEY
        this.refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET_KEY
    }

    generateAuthToken(payload){
        this.payload._id = payload._id;
        this.payload.username = payload.username;
        this.payload.email = payload.email;
        
        const accessToken = jwt.sign(this.payload, process.env.ACCESS_TOKEN_SECRET_KEY, {expiresIn : '24h' });
        const refreshToken = jwt.sign(this.payload, process.env.REFRESH_TOKEN_SECRET_KEY, {expiresIn: '7d'});

        return {accessToken, refreshToken};
    }

    verifyAccessToken(token){
        try {
            return jwt.verify(token, this.accessTokenSecret);
            
        } catch (err) {
            throw err; // Re-throw the error for the caller to handle
        }
    }

    verifyRefreshToken(token){
        try{
            return jwt.verify(token, this.refreshTokenSecret);
        }catch(err){
            throw err;
        }
    }


    async findAndRefreshToken(UserId, token){
        try{
            return await userModel.findByIdAndUpdate(UserId, {token: token}, {new: true});
        }catch(err){
            throw err;
        }
    }

    const setTokenCookies = async (res, accessToken, refreshToken) => {
        const isProduction = process.env.NODE_ENV === 'production';
        const domain = isProduction ? 'your-domain.com' : 'localhost';
    
        res.cookie('accessToken', accessToken, { 
            httpOnly: true,
            secure: isProduction, // Only secure in production
            domain: domain, // Ensure the correct domain
            path: '/',
            sameSite: isProduction ? 'None' : 'Lax', // Cross-site cookies for production
        });
    
        res.cookie('refreshToken', refreshToken, { 
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            httpOnly: true,
            secure: isProduction, // Only secure in production
            domain: domain, // Ensure the correct domain
            path: '/',
            sameSite: isProduction ? 'None' : 'Lax', // Cross-site cookies for production
        });
    };



    const removeTokenCookies = async (res, UserId) => {
        const isProduction = process.env.NODE_ENV === 'production';
        const domain = isProduction ? 'your-domain.com' : 'localhost';
    
        const cookieOptions = { 
            path: '/', 
            domain: domain, 
            secure: isProduction, 
            httpOnly: true, 
            sameSite: isProduction ? 'None' : 'Lax' // Cross-site for production
        };
    
        await userModel.findByIdAndUpdate(UserId, { token: "" });
    
        res.clearCookie('accessToken', cookieOptions);
        res.clearCookie('refreshToken', cookieOptions);
    };

}

module.exports = new TokenService();
