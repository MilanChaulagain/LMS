import { useState, useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'
import axios from 'axios'
import PropTypes from 'prop-types'

const EducatorApplicationModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    expertise: '',
    experience: '',
    motivation: '',
    agreeToTerms: false
  })
  const [loading, setLoading] = useState(false)

  const { backendUrl, getToken, setIsEducator } = useContext(AppContext)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.agreeToTerms) {
      toast.error('Please agree to the terms and conditions')
      return
    }

    if (!formData.expertise || !formData.experience || !formData.motivation) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const token = getToken()
      const { data } = await axios.post(backendUrl + '/api/educator/apply', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (data.success) {
        setIsEducator(true)
        toast.success('Congratulations! You are now an educator!')
        onClose()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Application failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  if (!isOpen) return null

  return (
     <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
      <div className="relative max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-1 right-1 text-yellow-950 cursor-pointer rounded-full w-12 h-12 flex items-center justify-center z-10 text-4xl hover:bg-gray-100/20"
        >
          ×
        </button>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center mb-4">Become an Educator</h2>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">What does being an educator mean?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Create and publish courses on our platform</li>
              <li>• Share your knowledge with students worldwide</li>
              <li>• Earn money from course sales</li>
              <li>• Access to educator dashboard and analytics</li>
              <li>• Build your teaching reputation</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What&apos;s your area of expertise? *
              </label>
              <input
                type="text"
                name="expertise"
                value={formData.expertise}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Web Development, Data Science, Photography"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How many years of experience do you have? *
              </label>
              <select
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select experience level</option>
                <option value="0-1">0-1 years</option>
                <option value="1-3">1-3 years</option>
                <option value="3-5">3-5 years</option>
                <option value="5-10">5-10 years</option>
                <option value="10+">10+ years</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why do you want to become an educator? *
              </label>
              <textarea
                name="motivation"
                value={formData.motivation}
                onChange={handleChange}
                required
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell us about your passion for teaching and what you hope to achieve..."
              />
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="text-sm text-gray-700">
                I agree to the educator terms and conditions, including maintaining high-quality content standards and following platform guidelines. *
              </label>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Apply to Become Educator'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

EducatorApplicationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
}

export default EducatorApplicationModal