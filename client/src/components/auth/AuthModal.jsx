import { useState } from 'react'
import Login from './Login'
import Register from './Register'
import PropTypes from 'prop-types'

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true)

  if (!isOpen) return null

  const switchToRegister = () => setIsLogin(false)
  const switchToLogin = () => setIsLogin(true)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="relative max-w-md w-full mx-4">
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 z-10"
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
  onClose: PropTypes.func.isRequired
}

export default AuthModal