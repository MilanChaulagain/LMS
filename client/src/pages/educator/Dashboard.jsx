import { useContext, useEffect, useState, useCallback } from 'react'
import { AppContext } from '../../context/AppContext';
import { assets} from '../../assets/assets';
import Loading from '../../components/student/Loading';
import { toast } from 'react-toastify';
import axios from 'axios';

const Dashboard = () => {

  const {backendUrl, isEducator, getToken} = useContext(AppContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = useCallback(async()=> {
    try {
      setLoading(true);
      const token = await getToken();
      const {data} = await axios.get(backendUrl + '/api/educator/dashboard', 
        {headers: {Authorization: `Bearer ${token}`}}
      )
      if(data.success) {
        setDashboardData(data.dashboardData);
      }
      else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false);
    }
  }, [backendUrl, getToken])

  useEffect(()=> {
    if(isEducator){
      fetchDashboardData();
    }
  }, [isEducator, fetchDashboardData])

  return loading ? (
    <Loading />
  ) : dashboardData ? (
    <div className='min-h-screen flex flex-col items-start justify-between gap-8 md:p-8 md:pb-0 p-4 pt-8 pb-0'>

      <div className='space-y-5'> 
        {/* Stats Cards */}
        <div className='flex flex-wrap gap-5 items-center'>

          <div className='flex items-center gap-3 shadow-card border border-blue-500 p-4 w-56 rounded-md bg-white hover:shadow-lg transition-shadow'>
              <img src={assets.patients_icon} alt="Total Enrollments" className="w-8 h-8" />
              <div>
                <p className='text-2xl font-medium text-gray-600'>{dashboardData.enrolledStudentsData?.length || 0}</p>
                <p className='text-base text-gray-500'>Total Enrollments</p>
              </div>
          </div>
          <div className='flex items-center gap-3 shadow-card border border-blue-500 p-4 w-56 rounded-md bg-white hover:shadow-lg transition-shadow'>
              <img src={assets.appointments_icon} alt="Total Courses" className="w-8 h-8" />
              <div>
                <p className='text-2xl font-medium text-gray-600'>{dashboardData.totalCourses || 0}</p>
                <p className='text-base text-gray-500'>Total Courses</p>
              </div>
          </div>
          <div className='flex items-center gap-3 shadow-card border border-blue-500 p-4 w-56 rounded-md bg-white hover:shadow-lg transition-shadow'>
              <img src={assets.earning_icon} alt="Total Earnings" className="w-8 h-8" />
              <div>
                <p className='text-2xl font-medium text-gray-600'>NPR &nbsp;{dashboardData.totalEarnings || 0}</p>
                <p className='text-base text-gray-500'>Total Earnings</p>
              </div>
          </div>
        </div>

        {/* Latest Enrollments Table */}
        <div>
          <h2 className='pb-4 text-lg font-medium'>Latest Enrollments</h2>
          <div className='flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20 shadow-sm'>
            {dashboardData.enrolledStudentsData?.length > 0 ? (
              <table className='table-fixed md:table-auto w-full overflow-hidden'>
                <thead className='text-gray-900 border-b border-gray-500/20 text-sm text-left bg-gray-50'>
                  <tr>
                    <th className='px-4 py-3 font-semibold text-center hidden sm:table-cell'>#</th>
                    <th className='px-4 py-3 font-semibold'>Student Name</th>
                    <th className='px-4 py-3 font-semibold'>Course Title</th>
                  </tr>
                </thead>
                <tbody className='text-sm text-gray-600'>
                  {dashboardData.enrolledStudentsData.map((item, index) => (
                    <tr key={`enrollment-${index}`} className='border-b border-gray-500/20 hover:bg-gray-50 transition-colors'>
                      <td className='px-4 py-3 text-center hidden sm:table-cell font-medium'>{index + 1}</td>
                      <td className='md:px-4 px-2 py-3 flex items-center space-x-3'>
                        <img 
                          src={item.student?.imageUrl || assets.profile_img}
                          alt={`${item.student?.name || 'Student'} profile`}
                          className='w-9 h-9 rounded-full object-cover'
                          onError={(e) => {
                            e.target.src = assets.profile_img;
                          }}
                        />
                        <span className='truncate font-medium'>{item.student?.name || 'Unknown Student'}</span>
                      </td>
                      <td className='px-4 py-3 truncate'>{item.courseTitle || 'Unknown Course'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className='py-8 text-center text-gray-500'>
                <img src={assets.appointments_icon} alt="No enrollments" className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium mb-1">No enrollments yet</p>
                <p className="text-sm">Student enrollments will appear here once they start joining your courses.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  )
}

export default Dashboard
