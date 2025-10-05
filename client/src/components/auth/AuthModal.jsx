import { useState, useEffect } from 'react'
import Login from './Login'
import Register from './Register'
import PropTypes from 'prop-types'

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login')

  // Reset to initial mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLogin(initialMode === 'login')
    }
  }, [isOpen, initialMode])

  if (!isOpen) return null

  const switchToRegister = () => setIsLogin(false)
  const switchToLogin = () => setIsLogin(true)

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
      <div className="relative max-w-md w-full mx-4">
        <button
          onClick={onClose}
          className="absolute top-1 right-1 text-yellow-950 cursor-pointer rounded-full w-12 h-12 flex items-center justify-center z-10 text-4xl hover:bg-gray-100/20"
        >
          ×
        </button>
        
        {isLogin ? (
          <Login switchToRegister={switchToRegister} onClose={onClose} />
        ) : (
          <Register switchToLogin={switchToLogin} onClose={onClose} />
        )}
      </div>
    </div>
  )
}

AuthModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialMode: PropTypes.oneOf(['login', 'register'])
}

export default AuthModal