import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Technology', 'Programming', 'Web Development', 'Data Science', 'AI/ML', 'Business', 'Design', 'Other']
    },
    thumbnail: {
        type: String,
        required: true
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    authorName: {
        type: String,
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        default: null // null means it's a general blog, not course-specific
    },
    courseName: {
        type: String,
        default: null
    },
    topics: [{
        title: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        },
        order: {
            type: Number,
            required: true
        }
    }],
    tags: [{
        type: String,
        trim: true
    }],
    readTime: {
        type: Number, // in minutes
        default: 5
    },
    views: {
        type: Number,
        default: 0
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    featured: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
blogSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    if (this.status === 'published' && !this.publishedAt) {
        this.publishedAt = Date.now();
    }
    next();
});

// Calculate read time based on content length
blogSchema.pre('save', function(next) {
    if (this.isModified('topics')) {
        const totalWords = this.topics.reduce((acc, topic) => {
            const wordCount = topic.content.split(' ').length;
            return acc + wordCount;
        }, 0);
        this.readTime = Math.ceil(totalWords / 200); // Average reading speed: 200 words per minute
    }
    next();
});

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;