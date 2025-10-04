import { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import {assets} from "../../assets/assets"
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'
import AuthModal from '../auth/AuthModal'
import EducatorApplicationModal from '../auth/EducatorApplicationModal'

const Navbar = () => {

    const {navigate, isEducator, user, logout} = useContext(AppContext);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
    const [isEducatorModalOpen, setIsEducatorModalOpen] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)

    const isCourseListPage = location.pathname.includes('/course-list')

    const becomeEducator = async() => {
        try {
            if(isEducator){
                navigate('/educator');
                return;
            }
            
            // Open the educator application modal instead of directly changing role
            setIsEducatorModalOpen(true);
            
        } catch (error) {
            toast.error(error.message);
        }
    }

    const handleLogout = () => {
        logout()
        setShowUserMenu(false)
        toast.success('Logged out successfully')
    }

  return (
    <div className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-500 py-4 back ${isCourseListPage ? 'bg-white' : 'bg-cyan-100/70'}`}>
        <img onClick={()=> navigate('/')} src={assets.logo} alt="Logo" className='w-28 lg:w-32 cursor-pointer'/>
        <div className='hidden md:flex items-center gap-5 text-gray-500'>
            <div className='flex items-center gap-5'>
                {
                user && <>
                    <button className='cursor-pointer' onClick={becomeEducator}>{isEducator ? 'Educator Dashboard' : 'Become Educator'}</button>
                | <Link to='/my-enrollments'>My Enrollments</Link>
                </>
                }
            </div>
            { user ? (
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
                        <span className="text-sm font-medium">{user.name}</span>
                    </button>
                    
                    {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                            <div className="py-1">
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
            ) :
                <button 
                    onClick={() => setIsAuthModalOpen(true)} 
                    className='bg-blue-600 text-white px-5 py-2 rounded-full cursor-pointer'
                >
                    Create Account
                </button>}
        </div>
        {/*This is for smaller phone screens*/}
        <div className='md:hidden flex items-center gap-2 sm:gap-5 text-gray-500'>
            <div className='flex items-center gap-1 sm:gap-2 max-sm:text-xs'>
            {user && <>
                <button className='cursor-pointer' onClick={becomeEducator}>{isEducator ? 'Educator Dashboard' : 'Become Educator'}</button>
                | <Link to='/my-enrollments'>My Enrollments</Link>
                </>
                }
            </div>
            {
                user ? (
                    <div className="relative">
                        <button 
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center space-x-1 bg-gray-100 rounded-full px-2 py-2 hover:bg-gray-200"
                        >
                            <img 
                                src={user.imageUrl || assets.profile_img} 
                                alt="Profile" 
                                className="w-6 h-6 rounded-full object-cover"
                            />
                        </button>
                        
                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border z-50">
                                <div className="py-1">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : 
            <button
                onClick={() => setIsAuthModalOpen(true)}
                className = 'cursor-pointer'
            ><img src={assets.user_icon} alt="" /></button>
            }
        </div>

        <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
        />
        
        <EducatorApplicationModal 
            isOpen={isEducatorModalOpen} 
            onClose={() => setIsEducatorModalOpen(false)} 
        />
    </div>
  )
}

export default Navbar
 