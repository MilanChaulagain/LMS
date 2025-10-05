import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'
import axios from 'axios'
import '../../assets/blog-content.css'

const AddBlog = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Technology',
    tags: '',
    status: 'draft'
  })
  const [topics, setTopics] = useState([
    { title: '', content: '' }
  ])
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [selectedTopicPreview, setSelectedTopicPreview] = useState(0)

  const { backendUrl, getToken } = useContext(AppContext)
  const navigate = useNavigate()

  const categories = ['Technology', 'Programming', 'Web Development', 'Data Science', 'AI/ML', 'Business', 'Design', 'Other']

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnail(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setThumbnailPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const addTopic = () => {
    setTopics(prev => [...prev, { title: '', content: '' }])
  }

  const removeTopic = (index) => {
    if (topics.length > 1) {
      setTopics(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateTopic = (index, field, value) => {
    setTopics(prev => prev.map((topic, i) => 
      i === index ? { ...topic, [field]: value } : topic
    ))
  }

  // Format blog content to ensure proper HTML structure (same as BlogViewer)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!thumbnail) {
      toast.error('Please upload a thumbnail image')
      return
    }

    if (topics.some(topic => !topic.title.trim() || !topic.content.trim())) {
      toast.error('Please fill in all topic titles and content')
      return
    }

    try {
      setLoading(true)
      const token = await getToken()
      
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('category', formData.category)
      formDataToSend.append('tags', formData.tags)
      formDataToSend.append('status', formData.status)
      formDataToSend.append('topics', JSON.stringify(topics))
      formDataToSend.append('thumbnail', thumbnail)

      const { data } = await axios.post(
        `${backendUrl}/api/blog/create`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (data.success) {
        toast.success('Blog created successfully!')
        navigate('/educator/my-blogs')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Error creating blog:', error)
      toast.error('Error creating blog')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Blog</h1>
        <p className="text-gray-600">Share your knowledge with the community</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blog Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter blog title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of your blog"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="react, javascript, tutorial"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>

        {/* Thumbnail */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Thumbnail Image</h2>
          
          <div className="flex items-center space-x-6">
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            {thumbnailPreview && (
              <div className="w-32 h-24">
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="w-full h-full object-cover rounded-md border"
                />
              </div>
            )}
          </div>
        </div>

        {/* Topics */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Blog Topics</h2>
            <button
              type="button"
              onClick={addTopic}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Topic
            </button>
          </div>

          <div className="space-y-6">
            {topics.map((topic, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-md font-medium text-gray-800">Topic {index + 1}</h3>
                  {topics.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTopic(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Topic Title *
                    </label>
                    <input
                      type="text"
                      value={topic.title}
                      onChange={(e) => updateTopic(index, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter topic title"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Content *
                      </label>
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewMode(false);
                            setSelectedTopicPreview(null);
                          }}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            !previewMode || selectedTopicPreview !== index
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewMode(true);
                            setSelectedTopicPreview(index);
                          }}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            previewMode && selectedTopicPreview === index
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                    
                    {previewMode && selectedTopicPreview === index ? (
                      <div className="min-h-[200px] p-4 border border-gray-300 rounded-md bg-gray-50">
                        <div className="blog-content">
                          <h3 className="text-xl font-semibold mb-4 text-gray-900">{topic.title || 'Topic Title'}</h3>
                          <div dangerouslySetInnerHTML={{ __html: formatBlogContent(topic.content) }} />
                        </div>
                      </div>
                    ) : (
                      <textarea
                        value={topic.content}
                        onChange={(e) => updateTopic(index, 'content', e.target.value)}
                        rows="8"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Write your content here... (HTML supported)"
                        required
                      />
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      You can use HTML tags for formatting (h1, h2, p, strong, em, ul, ol, li, code, pre, etc.)
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/educator/my-blogs')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Blog'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddBlog