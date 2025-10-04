import express from "express"
import { addUserRating, getUserCourseProgress, getUserData, getUserProfile, loginUser, purchaseCourse, registerUser, updateUserCourseProgress, userEnrolledCourses, verifyKhaltiPaymentController, verifyEsewaPaymentController } from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const userRouter = express.Router();

// Public routes
userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)

// Protected routes
userRouter.get('/profile', authMiddleware, getUserProfile)
userRouter.get('/data', authMiddleware, getUserData)
userRouter.get('/enrolled-courses', authMiddleware, userEnrolledCourses)
userRouter.post('/purchase', authMiddleware, purchaseCourse)

userRouter.post('/update-course-progress', authMiddleware, updateUserCourseProgress)
userRouter.post('/get-course-progress', authMiddleware, getUserCourseProgress)
userRouter.post('/add-rating', authMiddleware, addUserRating)

// Payment verification routes
userRouter.post('/verify-khalti-payment', verifyKhaltiPaymentController)
userRouter.get('/verify-esewa-payment', verifyEsewaPaymentController)

export default userRouter