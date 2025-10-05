import { useContext, useEffect, useState, useCallback } from 'react'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
// import { assets } from '../../assets/assets';

const MyCourses = () => {

  const {currency, backendUrl, getToken, isEducator} = useContext(AppContext);
  const [courses, setCourses] = useState(null);
  const navigate = useNavigate();

  const fetchEducatorCourses = useCallback(async () => {
    try {
      const token = await getToken();
      const {data} = await axios.get(backendUrl + '/api/educator/courses', 
        {headers: {Authorization: `Bearer ${token}`}}
      )
      data.success && setCourses(data.courses)
    } catch (error) {
      toast.error(error.message);
    }
  }, [getToken, backendUrl])

  const handleEditCourse = (courseId) => {
    navigate(`/educator/edit-course/${courseId}`);
  }

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const token = await getToken();
        const {data} = await axios.delete(`${backendUrl}/api/educator/delete-course/${courseId}`, {
          headers: {Authorization: `Bearer ${token}`}
        });
        
        if (data.success) {
          toast.success('Course deleted successfully');
          fetchEducatorCourses(); // Refresh the courses list
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        console.error('Error deleting course:', error);
        toast.error('Error deleting course');
      }
    }
  }

  useEffect(()=> {
    if(isEducator){
      fetchEducatorCourses();
    }
  }, [isEducator, fetchEducatorCourses])

  return courses ? (
    <div className='h-screen flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0'>
      <div className='w-full'>
        <h2 className='pb-4 text-lg font-medium'>My Courses</h2>
        <div className='flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20'>
          <table className='md:table-auto table-fixed w-full overflow-hidden'>
            <thead className='text-gray-900 border-b border-gray-500/20 text-sm text-left'>
              <tr>
                <th className='px-4 py-3 font-semibold truncate'>All Courses</th>
                <th className='px-4 py-3 font-semibold truncate'>Earnings</th>
                <th className='px-4 py-3 font-semibold truncate'>Students</th>
                <th className='px-4 py-3 font-semibold truncate'>Published On</th>
                <th className='px-4 py-3 font-semibold truncate'>Actions</th>
              </tr>
            </thead>
            <tbody className='text-sm text-gray-500'>
              {courses.map((course)=> (
                <tr key={course._id} className='border-b border-gray-500/20'>
                  <td className='md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 truncate'>
                    <img src={course.courseThumbnail} alt="Course Image" className='w-16' />
                    <span className='truncate hidden md:block'>
                      {course.courseTitle}
                    </span>
                  </td>
                  <td className='px-4 py-3'>{currency} {Math.floor(course.enrolledStudents.length * (course.coursePrice - course.discount * course.coursePrice /100 ))}</td>
                  <td className='px-4 py-3'>{course.enrolledStudents.length}</td>
                  <td className='px-4 py-3'>
                    {new Date(course.createdAt).toLocaleDateString()}
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => handleEditCourse(course._id)}
                        className='bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-xs'
                        title="Edit Course"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course._id)}
                        className='bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs'
                        title="Delete Course"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ) : <Loading />
}

export default MyCourses
