import { Route, Routes, useMatch } from 'react-router-dom'
import Home from './pages/student/Home'
import CoursesList from './pages/student/CoursesList'
import CourseDetails from './pages/student/CourseDetails'
import MyEnrollments from './pages/student/MyEnrollments'
import Player from './pages/student/Player'
import PaymentSuccess from './pages/student/PaymentSuccess'
import PaymentFailure from './pages/student/PaymentFailure'
import BlogList from './pages/student/BlogList'
import BlogViewer from './pages/student/BlogViewer'
import Loading from './components/student/Loading'
import Educator from './pages/educator/Educator'
import Dashboard from './pages/educator/Dashboard'
import AddCourse from './pages/educator/AddCourse'
import EditCourse from './pages/educator/EditCourse'
import MyCourses from './pages/educator/MyCourses'
import StudentsEnrolled from './pages/educator/StudentsEnrolled'
import AddBlog from './pages/educator/AddBlog'
import MyBlogs from './pages/educator/MyBlogs'
import EditBlog from './pages/educator/EditBlog'
import AddCourseBlog from './pages/educator/AddCourseBlog'
import CourseBlogs from './pages/educator/CourseBlogs'
import Navbar from './components/student/Navbar'
import "quill/dist/quill.snow.css";
import "react-toastify/dist/ReactToastify.css";
import {ToastContainer} from "react-toastify"

const App = () => {

  const isEducatorRoute = useMatch('/educator/*')

  return (
    <div className='text-default mih-h-height bg-white'>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastClassName="custom-toast"
        bodyClassName="custom-toast-body"
        style={{ 
          top: isEducatorRoute ? '70px' : '85px',
          zIndex: 9999,
          right: '16px'
        }}
      />
      {!isEducatorRoute && <Navbar />}
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/course-list' element={<CoursesList/>} />
        <Route path='/course-list/:input' element={<CoursesList />} />
        <Route path='/course/:id' element={<CourseDetails />} />
        <Route path='/my-enrollments' element={<MyEnrollments />} />
        <Route path='/player/:courseId' element={<Player />} />
        <Route path='/payment/success' element={<PaymentSuccess />} />
        <Route path='/payment/failure' element={<PaymentFailure />} />
        <Route path='/blogs' element={<BlogList />} />
        <Route path='/blogs/:category' element={<BlogList />} />
        <Route path='/blog/:slug' element={<BlogViewer />} />
        <Route path='/loading/:path' element={<Loading />} />
        <Route path='/educator' element={<Educator />} >
          <Route path='/educator' element={<Dashboard />} />
          <Route path='add-course' element={<AddCourse />} />
          <Route path='edit-course/:courseId' element={<EditCourse />} />
          <Route path='my-courses' element={<MyCourses />} />
          <Route path='student-enrolled' element={<StudentsEnrolled />} />
          <Route path='add-blog' element={<AddBlog />} />
          <Route path='my-blogs' element={<MyBlogs />} />
          <Route path='edit-blog/:blogId' element={<EditBlog />} />
          <Route path='course-blogs/:courseId' element={<CourseBlogs />} />
          <Route path='add-course-blog/:courseId' element={<AddCourseBlog />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
