import jwt from "jsonwebtoken"
import User from "../models/User.js"

// JWT Authentication middleware
export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '')
        
        if (!token) {
            return res.json({
                success: false,
                message: "No token provided"
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.userId = decoded.userId
        
        next()
    } catch (error) {
        res.json({
            success: false,
            message: "Invalid token"
        })
    }
}

//Middleware (Educator route)
export const protectEducator = async (req, res, next)=> {

    try {
        const userId = req.userId
        const user = await User.findById(userId);

        if(!user || user.role !== 'educator') {
            return res.json({
                success: false,
                message: "Unauthorized access"
            })
        }

        next()
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }

}