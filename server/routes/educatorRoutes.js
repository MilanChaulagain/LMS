import express from "express";

import { addCourse, applyToEducator, educatorDashboardData, getEducatorCourses, getEnrolledStudentsData, updateRoleToEducator, uploadVideo, editCourse, deleteCourse, getEducatorCourse } from "../controllers/educatorController.js";
import upload from "../configs/multer.js";
import { authMiddleware, protectEducator } from "../middlewares/authMiddleware.js";

const educatorRouter = express.Router();

//Apply to become Educator
educatorRouter.post('/apply', authMiddleware, applyToEducator)

//Add Educator Role (legacy)
educatorRouter.get('/update-role', authMiddleware, updateRoleToEducator)

//Upload video
educatorRouter.post('/upload-video', authMiddleware, upload.single('video'), uploadVideo);

educatorRouter.post('/add-course', authMiddleware, upload.single('image'), protectEducator, addCourse);
educatorRouter.put('/edit-course/:courseId', authMiddleware, upload.single('image'), protectEducator, editCourse);
educatorRouter.delete('/delete-course/:courseId', authMiddleware, protectEducator, deleteCourse);

educatorRouter.get('/courses', authMiddleware, protectEducator, getEducatorCourses);
educatorRouter.get('/course/:courseId', authMiddleware, protectEducator, getEducatorCourse);
educatorRouter.get('/dashboard', authMiddleware, protectEducator, educatorDashboardData);
educatorRouter.get('/enrolled-students', authMiddleware, protectEducator, getEnrolledStudentsData);

export default educatorRouter;

