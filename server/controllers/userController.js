import User from "../models/User.js";
import { Purchase } from "../models/Purchase.js";
import { initializeKhaltiPayment, initializeEsewaPayment, verifyKhaltiPayment, verifyEsewaPayment } from "../services/paymentService.js";
import Course from "../models/Course.js";
import { CourseProgress } from "../models/courseProgress.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

// Register User
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.json({
                success: false,
                message: "All fields are required"
            })
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.json({
                success: false,
                message: "User already exists"
            })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user
        const userData = {
            name,
            email,
            password: hashedPassword,
            role: 'student'
        }

        const user = await User.create(userData)

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        )

        res.json({
            success: true,
            message: "User registered successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        })

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

// Login User
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.json({
                success: false,
                message: "Email and password are required"
            })
        }

        // Find user
        const user = await User.findOne({ email })
        if (!user) {
            return res.json({
                success: false,
                message: "Invalid credentials"
            })
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.json({
                success: false,
                message: "Invalid credentials"
            })
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        )

        res.json({
            success: true,
            message: "Login successful",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        })

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

// Get User Profile
export const getUserProfile = async (req, res) => {
    try {
        const userId = req.userId

        const user = await User.findById(userId).select('-password')
        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            })
        }

        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

export const getUserData = async(req , res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId).select('-password');

        if(!user) {
            return res.json({
                success: false,
                message: "User not found"
            })
        }

        res.json({
            success: true,
            user
        })

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

//users enrolled courses with lecture links

export const userEnrolledCourses = async(req , res ) => {
    try {
        const userId = req.userId;
        const userData = await User.findById(userId).populate('enrolledCourses')

        res.json({
            success: true,
            enrolledCourses: userData.enrolledCourses
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

//Purchase Course
export const purchaseCourse = async(req, res) => {
    try {
        const {courseId, paymentMethod = 'khalti'} = req.body; // Default to khalti
        const {origin} = req.headers;

        const userId = req.userId;

        const userData = await User.findById(userId)
        const courseData = await Course.findById(courseId)

        if(!userData || !courseData) {
            return res.json({
                success: false,
                message: "Data not found"
            })
        }

        // Validate course price and discount
        if (typeof courseData.coursePrice !== 'number' || isNaN(courseData.coursePrice)) {
            return res.json({
                success: false,
                message: "Invalid course price"
            })
        }

        if (typeof courseData.discount !== 'number' || isNaN(courseData.discount)) {
            return res.json({
                success: false,
                message: "Invalid discount value"
            })
        }

        // Calculate final amount
        const discountAmount = (courseData.discount * courseData.coursePrice) / 100;
        const finalAmount = courseData.coursePrice - discountAmount;

        const purchaseData = {
            courseId: courseData._id,
            userId,
            amount: parseFloat(finalAmount.toFixed(2)),
            paymentMethod: paymentMethod
        }

        const newPurchase = await Purchase.create(purchaseData)

        // Initialize payment based on selected method
        if (paymentMethod === 'khalti') {
            const paymentInitData = {
                amount: finalAmount,
                purchaseId: newPurchase._id.toString(),
                productName: courseData.courseTitle,
                customerInfo: {
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone
                }
            };

            const paymentResult = await initializeKhaltiPayment(paymentInitData);
            
            if (paymentResult.success) {
                // Store pidx for verification later
                newPurchase.paymentReference = paymentResult.pidx;
                await newPurchase.save();

                return res.json({
                    success: true,
                    payment_url: paymentResult.payment_url,
                    paymentMethod: 'khalti'
                });
            } else {
                await Purchase.findByIdAndDelete(newPurchase._id);
                return res.json({
                    success: false,
                    message: paymentResult.message
                });
            }
        } 
        else if (paymentMethod === 'esewa') {
            const paymentInitData = {
                amount: finalAmount,
                purchaseId: newPurchase._id.toString(),
                productName: courseData.courseTitle
            };

            const paymentResult = initializeEsewaPayment(paymentInitData);
            
            if (paymentResult.success) {
                return res.json({
                    success: true,
                    payment_url: paymentResult.payment_url,
                    payment_params: paymentResult.params,
                    paymentMethod: 'esewa'
                });
            } else {
                await Purchase.findByIdAndDelete(newPurchase._id);
                return res.json({
                    success: false,
                    message: paymentResult.message
                });
            }
        } 
        else {
            await Purchase.findByIdAndDelete(newPurchase._id);
            return res.json({
                success: false,
                message: "Invalid payment method"
            });
        }

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

//Update User Course Progress

export const updateUserCourseProgress = async(req, res) => {
    try {
        const userId = req.userId;
        const {courseId, lectureId} = req.body;

        const progressData = await CourseProgress.findOne({
            userId, courseId
        })

        if(progressData) {
            if(progressData.lectureCompleted.includes(lectureId)) {
                return res.json({
                    success: true,
                    message: "Lecture Already Completed"
                })
            }

            progressData.lectureCompleted.push(lectureId);
            await progressData.save();
        }
        else {
            await CourseProgress.create({
                userId,
                courseId,
                lectureCompleted: [lectureId]
            })
        }

        res.json({
            success: true,
            message: "Progress Updated"
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

//get user course progress

export const getUserCourseProgress = async(req, res)=> {
    try {
        const userId = req.userId;
        const {courseId, lectureId} = req.body;

        const progressData = await CourseProgress.findOne({
            userId, courseId
        })

        res.json({
            success: true,
            progressData
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

//Add User ratings to course

export const addUserRating = async(req, res)=> {
 
        const userId = req.userId;
        const {courseId, rating} = req.body;

        if(!courseId || !userId, !rating || rating < 1 || rating > 5) {
            return res.json({
                success: false,
                message: "Invalid Details"
            })
        }

    try {
        const course = await Course.findById(courseId);

        if(!course) {
            return res.json({
                success: false,
                message: "Course not found"
            })
        }

        const user = await User.findById(userId);

        if(!user || !user.enrolledCourses.includes(courseId)) {
            return res.json({
                success: false,
                message: "User has not purchased this course"
            })
        }

        const existingRatingIndex = course.courseRatings.findIndex(r => r.userId.toString() === userId.toString());

        if(existingRatingIndex > -1) {
            course.courseRatings[existingRatingIndex].rating = rating;
        }
        else {
            course.courseRatings.push({userId, rating});
        }

        await course.save();

        return res.json({
            success: true,
            message: "Rating added"
        })

    } 
    catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

// Verify Khalti Payment
export const verifyKhaltiPaymentController = async (req, res) => {
    try {
        const { pidx, purchase_order_id } = req.body;

        if (!pidx) {
            return res.json({
                success: false,
                message: "Payment index (pidx) is required"
            });
        }

        // Verify payment with Khalti
        const verificationResult = await verifyKhaltiPayment(pidx);

        if (verificationResult.success && verificationResult.status === 'Completed') {
            // Find and update purchase record
            const purchase = await Purchase.findById(purchase_order_id);
            
            if (!purchase) {
                return res.json({
                    success: false,
                    message: "Purchase record not found"
                });
            }

            // Update purchase status
            purchase.status = 'completed';
            purchase.transactionId = verificationResult.transaction_id;
            await purchase.save();

            // Enroll user in course
            const course = await Course.findById(purchase.courseId);
            const user = await User.findById(purchase.userId);

            if (course && user) {
                if (!course.enrolledStudents.includes(purchase.userId)) {
                    course.enrolledStudents.push(purchase.userId);
                    await course.save();
                }

                // Create course progress record
                const existingProgress = await CourseProgress.findOne({
                    userId: purchase.userId,
                    courseId: purchase.courseId
                });

                if (!existingProgress) {
                    await CourseProgress.create({
                        userId: purchase.userId,
                        courseId: purchase.courseId,
                        lectureCompleted: []
                    });
                }
            }

            return res.json({
                success: true,
                message: "Payment verified and course enrolled successfully"
            });
        } else {
            return res.json({
                success: false,
                message: "Payment verification failed"
            });
        }
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Verify eSewa Payment
export const verifyEsewaPaymentController = async (req, res) => {
    try {
        const { data } = req.query; // eSewa sends data as query parameter

        if (!data) {
            return res.json({
                success: false,
                message: "Payment data is required"
            });
        }

        // Verify payment with eSewa
        const verificationResult = await verifyEsewaPayment(data);

        if (verificationResult.success && verificationResult.status === 'completed') {
            // Find and update purchase record
            const purchase = await Purchase.findById(verificationResult.purchase_order_id);
            
            if (!purchase) {
                return res.json({
                    success: false,
                    message: "Purchase record not found"
                });
            }

            // Update purchase status
            purchase.status = 'completed';
            purchase.transactionId = verificationResult.transaction_id;
            await purchase.save();

            // Enroll user in course
            const course = await Course.findById(purchase.courseId);
            const user = await User.findById(purchase.userId);

            if (course && user) {
                if (!course.enrolledStudents.includes(purchase.userId)) {
                    course.enrolledStudents.push(purchase.userId);
                    await course.save();
                }

                // Create course progress record
                const existingProgress = await CourseProgress.findOne({
                    userId: purchase.userId,
                    courseId: purchase.courseId
                });

                if (!existingProgress) {
                    await CourseProgress.create({
                        userId: purchase.userId,
                        courseId: purchase.courseId,
                        lectureCompleted: []
                    });
                }
            }

            return res.json({
                success: true,
                message: "Payment verified and course enrolled successfully"
            });
        } else {
            return res.json({
                success: false,
                message: "Payment verification failed"
            });
        }
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};