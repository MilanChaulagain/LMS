import { useState, useEffect, useContext } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'
import axios from 'axios'

const CourseBlogs = () => {
  const [course, setCourse] = useState(null)
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)

  const { courseId } = useParams()
  const { backendUrl, getToken } = useContext(AppContext)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCourseAndBlogs = async () => {
      try {
        setLoading(true)
        
        // Validate courseId
        if (!courseId) {
          toast.error('Course ID is missing')
          navigate('/educator/my-courses')
          return
        }
        
        // Fetch course details
        console.log('Fetching course details for:', courseId)
        const courseResponse = await axios.get(`${backendUrl}/api/course/${courseId}`)
        if (courseResponse.data.success) {
          setCourse(courseResponse.data.courseData)
        } else {
          toast.error('Course not found')
          navigate('/educator/my-courses')
          return
        }

        // Fetch course blogs
        console.log('Fetching course blogs for:', courseId)
        const blogsResponse = await axios.get(`${backendUrl}/api/blog/course/${courseId}`)
        if (blogsResponse.data.success) {
          setBlogs(blogsResponse.data.blogs)
        } else {
          toast.error(blogsResponse.data.message || 'Error loading blogs')
        }
      } catch (error) {
        console.error('Error fetching course and blogs:', error)
        if (error.response) {
          console.error('Error response:', error.response.data)
          toast.error(error.response.data.message || 'Error loading course blogs')
        } else {
          toast.error('Network error - please check your connection')
        }
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      fetchCourseAndBlogs()
    }
  }, [courseId, backendUrl, navigate])

  const deleteBlog = async (blogId) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) {
      return
    }

    try {
      const token = await getToken()
      const { data } = await axios.delete(`${backendUrl}/api/blog/${blogId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (data.success) {
        setBlogs(prev => prev.filter(blog => blog._id !== blogId))
        toast.success('Blog deleted successfully')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Error deleting blog:', error)
      toast.error('Error deleting blog')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Course Header */}
      {course && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <img
              src={course.courseThumbnail}
              alt={course.courseTitle}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{course.courseTitle}</h1>
              <p className="text-gray-600 mt-1">{course.courseDescription}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm text-gray-500">Category: {course.category}</span>
                <span className="text-sm text-gray-500">Level: {course.level}</span>
                <span className="text-sm text-gray-500">Price: Rs. {course.fees}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to={`/educator/add-course-blog/${courseId}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create New Blog
              </Link>
              <button
                onClick={() => navigate('/educator/my-courses')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Back to Courses
              </button>
            </div>
            <div className="text-sm text-gray-600">
              {blogs.length} blog{blogs.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>
      )}

      {/* Blogs Grid/List */}
      {blogs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No blogs yet</h3>
          <p className="text-gray-600 mb-6">Create your first course blog to help students learn better</p>
          <Link
            to={`/educator/add-course-blog/${courseId}`}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create First Blog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <div key={blog._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={blog.thumbnail}
                  alt={blog.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    blog.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {blog.status}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {blog.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {blog.readTime} min read
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {blog.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {blog.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>Created: {formatDate(blog.createdAt)}</span>
                  <span>{blog.topics?.length || 0} topics</span>
                </div>
                
                {blog.tags && blog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {blog.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {blog.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{blog.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <Link
                    to={`/blog/${blog.slug}`}
                    target="_blank"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Blog
                  </Link>
                  
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/educator/edit-blog/${blog._id}`}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteBlog(blog._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CourseBlogs