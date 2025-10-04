import { assets } from '../../assets/assets';
import { Link } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';

const Navbar = () => {

  const { user, logout } = useContext(AppContext);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <div className='flex items-center justify-between px-4 md:px-8 border-b border-gray-500 py-3'>
      <Link to="/">
        <img src={assets.logo} alt="logo" className="w-28 lg:w-32" />
      </Link>

      <div className='flex items-center gap-5 text-gray-500 relative'>
        <p>Hi! {user ? user.name : 'Educator'}</p>
        {user ? (
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-2 hover:bg-gray-200"
            >
              <img 
                src={user.imageUrl || assets.profile_img} 
                alt="Profile" 
                className="w-8 h-8 rounded-full object-cover"
              />
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <img className='max-w-8' src={assets.profile_img} alt="profile" />
        )}
      </div>
    </div>
  )
}

export default Navbar
