import Blog from '../models/Blog.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

// Configure cloudinary (in case it's not configured globally)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Get all published blogs
export const getAllBlogs = async (req, res) => {
    try {
        const { category, featured, page = 1, limit = 10 } = req.query;
        
        let filter = { status: 'published' };
        
        if (category) {
            filter.category = category;
        }
        
        if (featured === 'true') {
            filter.featured = true;
        }
        
        const skip = (page - 1) * limit;
        
        const blogs = await Blog.find(filter)
            .populate('authorId', 'name imageUrl')
            .populate('courseId', 'courseTitle courseThumbnail')
            .sort({ publishedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('-topics.content'); // Exclude content for list view
        
        const total = await Blog.countDocuments(filter);
        
        res.json({
            success: true,
            blogs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalBlogs: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching blogs',
            error: error.message
        });
    }
};

// Get a single blog by slug
export const getBlogBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        
        const blog = await Blog.findOne({ slug, status: 'published' })
            .populate('authorId', 'name imageUrl bio')
            .populate('courseId', 'courseTitle courseThumbnail courseDescription');
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        // Increment views
        blog.views += 1;
        await blog.save();
        
        res.json({
            success: true,
            blog
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching blog',
            error: error.message
        });
    }
};

// Get blogs by course
// Test endpoint for debugging
export const testBlogConnection = async (req, res) => {
    try {
        console.log('Testing database connection...');
        
        // Test basic blog query
        const blogCount = await Blog.countDocuments();
        console.log('Total blogs in database:', blogCount);
        
        // Test course query
        const courseCount = await Course.countDocuments();
        console.log('Total courses in database:', courseCount);
        
        // Test if courseId parameter works
        const { courseId } = req.params;
        if (courseId) {
            console.log('Testing with courseId:', courseId);
            const course = await Course.findById(courseId);
            console.log('Course found:', course ? course.courseTitle : 'Not found');
        }
        
        res.json({
            success: true,
            message: 'Database connection test successful',
            data: {
                blogCount,
                courseCount,
                courseId: courseId || 'not provided'
            }
        });
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({
            success: false,
            message: 'Database test failed',
            error: error.message
        });
    }
};

export const getBlogsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        
        // Validate courseId format using mongoose
        if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID format'
            });
        }
        
        console.log('Fetching blogs for courseId:', courseId);
        
        // Check if course exists
        const course = await Course.findById(courseId).select('courseTitle courseDescription');
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        console.log('Course found:', course.courseTitle);
        
        // Fetch blogs for this course
        const blogs = await Blog.find({ 
            courseId: new mongoose.Types.ObjectId(courseId), 
            status: 'published' 
        })
            .populate('authorId', 'name imageUrl')
            .populate('courseId', 'courseTitle courseThumbnail')
            .sort({ publishedAt: -1 })
            .select('-topics.content');
        
        console.log('Found blogs:', blogs.length);
        
        res.json({
            success: true,
            blogs,
            course
        });
    } catch (error) {
        console.error('Error in getBlogsByCourse:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching course blogs',
            error: error.message
        });
    }
};

// Get blogs by category
export const getBlogsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        
        const blogs = await Blog.find({ 
            category: { $regex: new RegExp(category, 'i') }, 
            status: 'published' 
        })
            .populate('authorId', 'name imageUrl')
            .populate('courseId', 'courseTitle courseThumbnail')
            .sort({ publishedAt: -1 })
            .select('-topics.content');
        
        res.json({
            success: true,
            blogs,
            category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching blogs by category',
            error: error.message
        });
    }
};

// Create a new blog (Educators only)
export const createBlog = async (req, res) => {
    try {
        const { title, description, category, tags, status = 'draft', courseId } = req.body;
        const authorId = req.userId;
        
        // Parse topics from JSON string if it exists
        let topics = [];
        if (req.body.topics) {
            try {
                topics = JSON.parse(req.body.topics);
            } catch (parseError) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid topics format'
                });
            }
        }
        
        // Process tags - convert string to array if needed
        let tagsArray = [];
        if (tags) {
            if (typeof tags === 'string') {
                tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            } else if (Array.isArray(tags)) {
                tagsArray = tags;
            }
        }
        
        // Check if user is an educator
        const user = await User.findById(authorId);
        if (!user || user.role !== 'educator') {
            return res.status(403).json({
                success: false,
                message: 'Only educators can create blogs'
            });
        }
        
        // If courseId is provided, verify the educator owns the course
        let course = null;
        if (courseId) {
            course = await Course.findOne({ _id: courseId, educator: authorId });
            if (!course) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only create blogs for your own courses'
                });
            }
        }
        
        // Handle thumbnail upload
        let thumbnailUrl = '';
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'blog_thumbnails',
                resource_type: 'image'
            });
            thumbnailUrl = result.secure_url;
        }
        
        // Generate unique slug
        let baseSlug = title
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
        
        let slug = baseSlug;
        let counter = 1;
        
        while (await Blog.findOne({ slug })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        const blog = new Blog({
            title,
            slug,
            description,
            category,
            thumbnail: thumbnailUrl,
            authorId,
            authorName: user.name,
            courseId: courseId || null,
            courseName: course ? course.courseTitle : null,
            topics: topics.map((topic, index) => ({
                ...topic,
                order: index + 1
            })),
            tags: tagsArray,
            status
        });        await blog.save();
        
        res.status(201).json({
            success: true,
            message: 'Blog created successfully',
            blog
        });
    } catch (error) {
        console.error('Error creating blog:', error);
        
        // Handle specific MongoDB errors
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A blog with this title already exists. Please choose a different title.',
                error: 'Duplicate key error'
            });
        }
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error: ' + messages.join(', '),
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creating blog',
            error: error.message
        });
    }
};

// Get a blog for editing (Educators only - own blogs)
export const getBlogForEdit = async (req, res) => {
    try {
        const { id } = req.params;
        const authorId = req.userId;
        
        // Validate blog ID format
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid blog ID format'
            });
        }
        
        const blog = await Blog.findById(id)
            .populate('courseId', 'courseTitle courseThumbnail');
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        // Check if user is the author
        if (blog.authorId.toString() !== authorId) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own blogs'
            });
        }
        
        console.log('Blog for edit - courseId type:', typeof blog.courseId, 'courseId value:', blog.courseId);
        
        res.json({
            success: true,
            blog
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching blog for edit',
            error: error.message
        });
    }
};

// Update a blog
export const updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, tags, status } = req.body;
        const authorId = req.userId;
        
        // Parse topics from JSON string if it exists
        let topics = [];
        if (req.body.topics) {
            try {
                topics = JSON.parse(req.body.topics);
            } catch (parseError) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid topics format'
                });
            }
        }
        
        // Process tags - convert string to array if needed
        let tagsArray = [];
        if (tags) {
            if (typeof tags === 'string') {
                tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            } else if (Array.isArray(tags)) {
                tagsArray = tags;
            }
        }
        
        const blog = await Blog.findById(id);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        // Check if user is the author
        if (blog.authorId.toString() !== authorId) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own blogs'
            });
        }
        
        // Handle thumbnail upload
        let thumbnailUrl = blog.thumbnail;
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'blog_thumbnails',
                resource_type: 'image'
            });
            thumbnailUrl = result.secure_url;
        }
        
        // Generate new slug if title changed
        let slug = blog.slug;
        if (title !== blog.title) {
            let baseSlug = title
                .toLowerCase()
                .replace(/[^\w ]+/g, '')
                .replace(/ +/g, '-');
            
            slug = baseSlug;
            let counter = 1;
            
            while (await Blog.findOne({ slug, _id: { $ne: id } })) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }
        }
        
        const updatedBlog = await Blog.findByIdAndUpdate(
            id,
            {
                title,
                slug,
                description,
                category,
                thumbnail: thumbnailUrl,
                topics: topics.map((topic, index) => ({
                    ...topic,
                    order: index + 1
                })),
                tags: tagsArray,
                status
            },
            { new: true }
        );
        
        res.json({
            success: true,
            message: 'Blog updated successfully',
            blog: updatedBlog
        });
    } catch (error) {
        console.error('Error updating blog:', error);
        
        // Handle specific MongoDB errors
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A blog with this title already exists. Please choose a different title.',
                error: 'Duplicate key error'
            });
        }
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error: ' + messages.join(', '),
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error updating blog',
            error: error.message
        });
    }
};

// Delete a blog
export const deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const authorId = req.userId;
        
        const blog = await Blog.findById(id);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        // Check if user is the author
        if (blog.authorId.toString() !== authorId) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own blogs'
            });
        }
        
        await Blog.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'Blog deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting blog',
            error: error.message
        });
    }
};

// Get educator's blogs
export const getMyBlogs = async (req, res) => {
    try {
        const authorId = req.userId;
        
        const blogs = await Blog.find({ authorId })
            .sort({ createdAt: -1 })
            .select('-topics.content');
        
        res.json({
            success: true,
            blogs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching your blogs',
            error: error.message
        });
    }
};

// Like/Unlike a blog
export const toggleBlogLike = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        
        const blog = await Blog.findById(id);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        const isLiked = blog.likes.includes(userId);
        
        if (isLiked) {
            blog.likes = blog.likes.filter(like => like.toString() !== userId);
        } else {
            blog.likes.push(userId);
        }
        
        await blog.save();
        
        res.json({
            success: true,
            message: isLiked ? 'Blog unliked' : 'Blog liked',
            likesCount: blog.likes.length,
            isLiked: !isLiked
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error toggling blog like',
            error: error.message
        });
    }
};

// Search blogs
export const searchBlogs = async (req, res) => {
    try {
        const { query, category } = req.query;
        
        let searchFilter = {
            status: 'published',
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { tags: { $in: [new RegExp(query, 'i')] } }
            ]
        };
        
        if (category) {
            searchFilter.category = category;
        }
        
        const blogs = await Blog.find(searchFilter)
            .populate('authorId', 'name imageUrl')
            .populate('courseId', 'courseTitle courseThumbnail')
            .sort({ views: -1, publishedAt: -1 })
            .select('-topics.content');
        
        res.json({
            success: true,
            blogs,
            query
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching blogs',
            error: error.message
        });
    }
}