import { useState, useEffect, useContext } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import '../../assets/blog-content.css'
import profileImg from '../../assets/profile_img.png'

const BlogViewer = () => {
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedTopicIndex, setSelectedTopicIndex] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  
  const { slug } = useParams()
  const { backendUrl, userData, getToken } = useContext(AppContext)

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true)
        const { data } = await axios.get(`${backendUrl}/api/blog/${slug}`)
        
        if (data.success) {
          setBlog(data.blog)
          setLikesCount(data.blog.likes.length)
          if (userData) {
            setIsLiked(data.blog.likes.includes(userData._id))
          }
        } else {
          toast.error(data.message)
        }
      } catch (error) {
        console.error('Error fetching blog:', error)
        toast.error('Error fetching blog')
      } finally {
        setLoading(false)
      }
    }

    fetchBlog()
  }, [slug, backendUrl, userData])

  const handleLike = async () => {
    if (!userData) {
      toast.warning('Please login to like blogs')
      return
    }

    try {
      const token = await getToken()
      const { data } = await axios.post(
        `${backendUrl}/api/blog/like/${blog._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (data.success) {
        setIsLiked(data.isLiked)
        setLikesCount(data.likesCount)
        toast.success(data.message)
      }
    } catch (error) {
      console.error('Error liking blog:', error)
      toast.error('Error liking blog')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Format blog content to ensure proper HTML structure
  const formatBlogContent = (content) => {
    if (!content) return '';
    
    // Add line breaks for better readability if content is plain text
    let formattedContent = content;
    
    // If content doesn't contain HTML tags, convert line breaks to <br> tags
    if (!content.includes('<') && !content.includes('>')) {
      formattedContent = content.replace(/\n/g, '<br>');
    }
    
    // Ensure paragraphs are properly wrapped
    if (!formattedContent.includes('<p>') && !formattedContent.includes('<h1>') && !formattedContent.includes('<h2>')) {
      // Split by double line breaks and wrap in paragraphs
      const paragraphs = formattedContent.split(/\n\s*\n/);
      formattedContent = paragraphs.map(p => p.trim() ? `<p>${p.trim()}</p>` : '').join('');
    }
    
    return formattedContent;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Blog not found</h2>
          <Link to="/blogs" className="text-blue-600 hover:text-blue-800">
            ← Back to blogs
          </Link>
        </div>
      </div>
    )
  }

  const currentTopic = blog.topics && blog.topics.length > 0 ? blog.topics[selectedTopicIndex] : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-gray-700">Home</Link>
            <span>›</span>
            <Link to="/blogs" className="hover:text-gray-700">Blogs</Link>
            <span>›</span>
            <span className="text-gray-900">{blog.title}</span>
          </nav>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{blog.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                  {blog.category}
                </span>
                <span>{blog.readTime} min read</span>
                <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
              </div>
              
              {/* Course Information - Show if blog is associated with a course */}
              {blog.courseId && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="text-sm font-medium text-blue-800">
                      Part of Course: 
                      <Link 
                        to={`/course/${blog.courseId._id}`}
                        className="ml-1 text-blue-600 hover:text-blue-800 underline"
                      >
                        {blog.courseId?.courseTitle || blog.courseName}
                      </Link>
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isLiked
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{likesCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Topics List */}
          <div className="lg:w-1/5 lg:order-1 order-2">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-8">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Table of Contents</h3>
              {blog.topics && blog.topics.length > 0 ? (
                <nav className="space-y-1">
                  {blog.topics.map((topic, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedTopicIndex(index)}
                      className={`w-full text-left px-2 py-2 rounded-md text-xs transition-colors ${
                        selectedTopicIndex === index
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="font-medium">{index + 1}.</span>{' '}
                      <span className="ml-1">{topic.title}</span>
                    </button>
                  ))}
                </nav>
              ) : (
                <p className="text-xs text-gray-500">No topics available</p>
              )}
              
              {/* Author Info */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-xs font-medium text-gray-900 mb-2">About the Author</h4>
                <div className="flex items-center space-x-2">
                  <img
                    src={blog.authorId?.imageUrl || profileImg}
                    alt={blog.authorId?.name || blog.authorName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-xs font-medium text-gray-900">
                      {blog.authorId?.name || blog.authorName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {blog.authorId?.bio || 'Content Creator'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:w-4/5 lg:order-2 order-1">
            <div className="bg-white rounded-lg shadow-md p-8">
              {currentTopic ? (
                <>
                  {/* Topic Navigation */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">{currentTopic.title}</h2>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedTopicIndex(Math.max(0, selectedTopicIndex - 1))}
                        disabled={selectedTopicIndex === 0}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded disabled:opacity-50 hover:bg-gray-200 disabled:cursor-not-allowed"
                      >
                        ← Previous
                      </button>
                      <span className="text-sm text-gray-500">
                        {selectedTopicIndex + 1} of {blog.topics?.length || 0}
                      </span>
                      <button
                        onClick={() => setSelectedTopicIndex(Math.min((blog.topics?.length || 1) - 1, selectedTopicIndex + 1))}
                        disabled={selectedTopicIndex === (blog.topics?.length || 1) - 1}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded disabled:opacity-50 hover:bg-gray-200 disabled:cursor-not-allowed"
                      >
                        Next →
                      </button>
                    </div>
                  </div>

                  {/* Topic Content */}
                  <div className="prose prose-xl max-w-none">
                    <div 
                      dangerouslySetInnerHTML={{ __html: formatBlogContent(currentTopic.content) }}
                      className="blog-content"
                    />
                  </div>

                  {/* Bottom Navigation */}
                  <div className="flex items-center justify-between mt-12 pt-6 border-t border-gray-200">
                    {selectedTopicIndex > 0 ? (
                      <button
                        onClick={() => setSelectedTopicIndex(selectedTopicIndex - 1)}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>{blog.topics[selectedTopicIndex - 1].title}</span>
                      </button>
                    ) : (
                      <div></div>
                    )}

                    {selectedTopicIndex < (blog.topics?.length || 1) - 1 ? (
                      <button
                        onClick={() => setSelectedTopicIndex(selectedTopicIndex + 1)}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                      >
                        <span>{blog.topics[selectedTopicIndex + 1].title}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ) : (
                      <div></div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">No Content Available</h2>
                  <p className="text-gray-600">This blog doesn&apos;t have any topics yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlogViewer