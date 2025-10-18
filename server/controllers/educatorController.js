import Course from "../models/Course.js";
import {v2 as cloudinary} from "cloudinary"
import dotenv from 'dotenv';
import User from "../models/User.js"
import { Purchase } from "../models/Purchase.js";
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

//upload video for lecture
export const uploadVideo = async (req, res) => {
    try {
        const videoFile = req.file;

        if (!videoFile) {
            return res.json({
                success: false,
                message: "No video file uploaded"
            });
        }

        // Check if file is a video
        if (!videoFile.mimetype.startsWith('video/')) {
            return res.json({
                success: false,
                message: "Only video files are allowed"
            });
        }

        // Upload to cloudinary
        const videoUpload = await cloudinary.uploader.upload(videoFile.path, {
            resource_type: "video",
            folder: "course_videos",
            eager_async: true, // Process large videos asynchronously
            eager: [
                { quality: "auto", format: "mp4" }
            ],
            access_control: [
                {
                    access_type: "anonymous"
                }
            ]
        });

        // Ensure the URL ends with .mp4 for better browser compatibility
        let videoUrl = videoUpload.secure_url;
        
        // If the URL doesn't already have an extension, add .mp4
        if (!videoUrl.match(/\.(mp4|webm|ogg)$/i)) {
            // Replace the file extension with .mp4
            videoUrl = videoUrl.replace(/\.[^.]+$/, '.mp4');
        }

        return res.json({
            success: true,
            message: "Video uploaded successfully",
            videoUrl: videoUrl,
            publicId: videoUpload.public_id
        });

    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        });
    }
}


//apply to become educator
export const applyToEducator = async (req, res)=> {
    try {
        const userId = req.userId;
        const { expertise, experience, motivation } = req.body;

        if (!expertise || !experience || !motivation) {
            return res.json({
                success: false,
                message: "Please fill in all required fields"
            })
        }

        const user = await User.findById(userId);
        
        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            })
        }

        if (user.role === 'educator') {
            return res.json({
                success: false,
                message: "You are already an educator"
            })
        }

        // Store application details (you could save these to a separate collection if needed)
        user.role = 'educator';
        user.educatorProfile = {
            expertise,
            experience,
            motivation,
            approvedAt: new Date()
        };
        
        await user.save();

        res.json({
            success: true,
            message: "Congratulations! Your educator application has been approved!"
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

//update role to educator (legacy - keeping for backwards compatibility)
export const updateRoleToEducator = async (req, res)=> {
    try {
        const userId = req.userId;

        const user = await User.findById(userId);
        
        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            })
        }

        if (user.role === 'educator') {
            return res.json({
                success: true,
                message: "You are already an educator"
            })
        }

        user.role = 'educator';
        await user.save();

        res.json({
            success: true,
            message: "You can publish a course now"
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

//add new course

export const addCourse = async (req, res)=> {
    try {
        const {courseData} = req.body;
        const imageFile = req.file

        const educatorId = req.userId

        if(!imageFile) {
            return res.json({
                success: false,
                message: "Thumbnail not attached"
            })
        }

        const parsedCourseData = await JSON.parse(courseData)
        parsedCourseData.educator = educatorId

        const newCourse = await Course.create(parsedCourseData)

        const imageUpload = await cloudinary.uploader.upload(imageFile.path)

        newCourse.courseThumbnail = imageUpload.secure_url

        await newCourse.save()

        return res.json({
            success: true,
            message: "Course added"
        })

    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        })
    }
}

//get educator courses

export const getEducatorCourses = async(req, res)=> {
    try {
        const educator = req.userId;

        const courses = await Course.find({educator})

        res.json({
            success: true,
            courses
        })
        
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

//get single course for editing (educator only)

export const getEducatorCourse = async(req, res)=> {
    try {
        const educator = req.userId;
        const { courseId } = req.params;

        const course = await Course.findOne({_id: courseId, educator});

        if (!course) {
            return res.json({
                success: false,
                message: "Course not found or you don't have permission to edit it"
            });
        }

        res.json({
            success: true,
            course
        })
        
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

// Get Educator Dashboard Data (Total Earning, Enrolled Students, No of courses)

export const educatorDashboardData = async (req, res)=> {
    try {
        const educator = req.userId;

        const courses = await Course.find({educator});

        const totalCourses = courses.length;

        const courseIds = courses.map(course => course._id)

        //Calculate total earning from purchases

        const purchases = await Purchase.find({
            courseId: {$in: courseIds},
            status: 'completed'
        })

        const totalEarnings = purchases.reduce((sum, purchase)=> sum + purchase.amount, 0 );

        //Collect unique students enrolled ids with thier course title

        const enrolledStudentsData = [];

        for(const course of courses) {
            const students = await User.find({
                _id: {$in: course.enrolledStudents}
            }, 'name imageUrl');

            students.forEach(student => {
                enrolledStudentsData.push({
                    courseTitle: course.courseTitle,
                    student
                })
            });
        }

        res.json({
            success: true,
            dashboardData: {
                enrolledStudentsData,
                totalEarnings,
                totalCourses
            }
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

//get enrolled students data with purchase data

export const getEnrolledStudentsData = async (req, res)=> {
    try {
        const educator = req.userId;

        const courses = await Course.find({educator});

        const courseIds = courses.map(course => course._id)

        const purchases = await Purchase.find({
            courseId: {$in: courseIds},
            status: 'completed'
        }).populate('userId', 'name imageUrl').populate('courseId', 'courseTitle')

        const enrolledStudents = purchases.map(purchase => ({
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseDate: purchase.createdAt
        }))

        res.json({
            success: true,
            enrolledStudents
        })

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

//edit course

export const editCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { courseData } = req.body;
        const imageFile = req.file;
        const educatorId = req.userId;

        // Check if course exists and belongs to educator
        const course = await Course.findOne({ _id: courseId, educator: educatorId });
        
        if (!course) {
            return res.json({
                success: false,
                message: "Course not found or you don't have permission to edit it"
            });
        }

        const parsedCourseData = JSON.parse(courseData);

        // Update course fields
        course.courseTitle = parsedCourseData.courseTitle;
        course.courseDescription = parsedCourseData.courseDescription;
        course.coursePrice = parsedCourseData.coursePrice;
        course.discount = parsedCourseData.discount;
        course.courseContent = parsedCourseData.courseContent;

        // Update thumbnail if new image provided
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path);
            course.courseThumbnail = imageUpload.secure_url;
        }

        await course.save();

        return res.json({
            success: true,
            message: "Course updated successfully"
        });

    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        });
    }
}

//delete course

export const deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const educatorId = req.userId;

        // Check if course exists and belongs to educator
        const course = await Course.findOne({ _id: courseId, educator: educatorId });
        
        if (!course) {
            return res.json({
                success: false,
                message: "Course not found or you don't have permission to delete it"
            });
        }

        // Check if course has enrolled students
        if (course.enrolledStudents && course.enrolledStudents.length > 0) {
            return res.json({
                success: false,
                message: "Cannot delete course with enrolled students"
            });
        }

        await Course.findByIdAndDelete(courseId);

        return res.json({
            success: true,
            message: "Course deleted successfully"
        });

    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        });
    }
}

//get course for editing (educator only, includes all data)

export const getCourseForEdit = async (req, res) => {
    try {
        const { courseId } = req.params;
        const educatorId = req.userId;

        // Check if course exists and belongs to educator
        const course = await Course.findOne({ _id: courseId, educator: educatorId });
        
        if (!course) {
            return res.json({
                success: false,
                message: "Course not found or you don't have permission to edit it"
            });
        }

        return res.json({
            success: true,
            course
        });

    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        });
    }
}