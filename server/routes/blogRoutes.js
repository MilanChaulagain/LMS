import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
    getAllBlogs,
    getBlogBySlug,
    getBlogsByCategory,
    getBlogsByCourse,
    getBlogForEdit,
    createBlog,
    updateBlog,
    deleteBlog,
    getMyBlogs,
    toggleBlogLike,
    searchBlogs,
    testBlogConnection
} from '../controllers/blogController.js';

const blogRouter = express.Router();

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Public routes
blogRouter.get('/all', getAllBlogs);
blogRouter.get('/search', searchBlogs);
blogRouter.get('/category/:category', getBlogsByCategory);
blogRouter.get('/test/:courseId?', testBlogConnection);
blogRouter.get('/course/:courseId', getBlogsByCourse);
blogRouter.get('/:slug', getBlogBySlug);

// Protected routes (require authentication)
blogRouter.post('/like/:id', authMiddleware, toggleBlogLike);

// Educator routes (require authentication)
blogRouter.get('/educator/my-blogs', authMiddleware, getMyBlogs);
blogRouter.get('/edit/:id', authMiddleware, getBlogForEdit);
blogRouter.post('/create', authMiddleware, upload.single('thumbnail'), createBlog);
blogRouter.put('/update/:id', authMiddleware, upload.single('thumbnail'), updateBlog);
blogRouter.delete('/delete/:id', authMiddleware, deleteBlog);

export default blogRouter;