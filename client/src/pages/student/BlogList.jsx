import { useState, useEffect, useContext, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import profileImg from '../../assets/profile_img.png'

const BlogList = () => {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories] = useState(['Technology', 'Programming', 'Web Development', 'Data Science', 'AI/ML', 'Business', 'Design'])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  
  const { category } = useParams()
  const { backendUrl } = useContext(AppContext)

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true)
      let url = `${backendUrl}/api/blog/all`
      
      if (category && category !== 'all') {
        url = `${backendUrl}/api/blog/category/${category}`
        setSelectedCategory(category)
      } else if (selectedCategory && selectedCategory !== 'All') {
        url = `${backendUrl}/api/blog/all?category=${selectedCategory}`
      }
      
      const { data } = await axios.get(url)
      
      if (data.success) {
        setBlogs(data.blogs)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Error fetching blogs:', error)
      toast.error('Error fetching blogs')
    } finally {
      setLoading(false)
    }
  }, [backendUrl, category, selectedCategory])

  const searchBlogs = async () => {
    if (!searchQuery.trim()) {
      fetchBlogs()
      return
    }
    
    try {
      setLoading(true)
      const { data } = await axios.get(`${backendUrl}/api/blog/search?query=${searchQuery}`)
      
      if (data.success) {
        setBlogs(data.blogs)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Error searching blogs:', error)
      toast.error('Error searching blogs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBlogs()
  }, [fetchBlogs])

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat)
    setSearchQuery('')
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tech Blogs & Tutorials
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the latest insights, tutorials, and best practices from industry experts
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search blogs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchBlogs()}
                  className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryChange('All')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'All'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Blog Grid */}
        {blogs.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-medium text-gray-500 mb-2">No blogs found</h3>
            <p className="text-gray-400">Try adjusting your search or category filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <div key={blog._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <Link to={`/blog/${blog.slug}`}>
                  <img
                    src={blog.thumbnail}
                    alt={blog.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                </Link>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                      {blog.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      {blog.readTime} min read
                    </span>
                  </div>
                  
                  <Link to={`/blog/${blog.slug}`}>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                      {blog.title}
                    </h3>
                  </Link>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {blog.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img
                        src={blog.authorId?.imageUrl || profileImg}
                        alt={blog.authorId?.name || blog.authorName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {blog.authorId?.name || blog.authorName}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(blog.publishedAt || blog.createdAt)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{blog.views}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{blog.likes.length}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BlogList