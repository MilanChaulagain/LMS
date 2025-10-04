import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration"
import axios from "axios"
import { toast } from "react-toastify";
import PropTypes from 'prop-types';

export const AppContext = createContext()

export const AppContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const currency = import.meta.env.VITE_CURRENCY;

    const navigate = useNavigate()

    const [user, setUser] = useState(null)
    const [token, setToken] = useState(localStorage.getItem('token') || null)
    const [allCourses, setAllCourses] = useState([]);
    const [isEducator, setIsEducator] = useState(false);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [userData, setUserData] = useState(null)

    // Function to get token for API calls
    const getToken = () => {
        return token
    }

    // Function to logout user
    const logout = () => {
        setUser(null)
        setToken(null)
        setUserData(null)
        setIsEducator(false)
        setEnrolledCourses([])
        localStorage.removeItem('token')
        navigate('/')
    }

    //Fetch all courses

    const fetchAllCourses = async()=> {
        try {
            const {data} = await axios.get(backendUrl + '/api/course/all');

            if(data.success){
                setAllCourses(data.courses);
            }
            else {
                toast.error(data.message);
            }

        } catch (error) {
            toast.error(error.message);
        }
    }

    //Fetch userData

    const fetchUserData = async () => {
        if (!token || !user) return

        if (user.role === 'educator') {
            setIsEducator(true);
        }
        try {
            const {data} = await axios.get(backendUrl + '/api/user/data', {headers: {
                Authorization: `Bearer ${token}`
            }});

            if(data.success) {
                setUserData(data.user);
            }
            else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    //Function to calculate average rating of course
    const calculateRating =(course) => {
        if(course.courseRatings.length === 0){
            return 0;
        }
        let totalRating = 0;
        course.courseRatings.forEach(rating => {
             totalRating+=rating.rating;
        })

        return Math.floor(totalRating / course.courseRatings.length);
    }

    //Function to calculate course chapter time
    const calculateChapterTime = (chapter)=> {
        let time = 0;
        chapter.chapterContent.map((lecture)=> time += lecture.lectureDuration)

        return humanizeDuration(time*60*1000, {units: ["h", "m"]})
    }

    //Function to calculate course duration
    const calculateCourseDuration =(course)=> {
        let time = 0;
        course.courseContent.map((chapter)=> chapter.chapterContent.map(
            (lecture)=> time += lecture.lectureDuration 
        ))
        return humanizeDuration(time*60*1000, {units: ["h", "m"]})
    }

    //Function to calculate number of lectures in the course
    const calculateNumberOfLectures = (course)=> {
        let totalLectures = 0;
        course.courseContent.forEach(chapter => {
            if(Array.isArray(chapter.chapterContent)) {
                totalLectures += chapter.chapterContent.length;
            }
        })
        return totalLectures;
    }

    //Fetch user enrolled courses
    const fetchUserEnrolledCourses = async()=> {
        if (!token) return
        
        try {
            const {data} = await axios.get(backendUrl + '/api/user/enrolled-courses', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if(data.success) {
            setEnrolledCourses(data.enrolledCourses.reverse())
        }else {
            toast.error(data.message)
        }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Function to verify and load user from token
    const loadUserFromToken = async () => {
        if (!token) return

        try {
            const { data } = await axios.get(backendUrl + '/api/user/profile', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (data.success) {
                setUser(data.user)
                if (data.user.role === 'educator') {
                    setIsEducator(true)
                }
            } else {
                logout()
            }
        } catch (error) {
            console.log(error);
            logout()
        }
    }

    useEffect(()=> {
        fetchAllCourses();
    }, [])

    useEffect(()=> {
        if (token) {
            loadUserFromToken()
        }
    }, [token])

    useEffect(()=> {
        if(user && token) {
            fetchUserData()
            fetchUserEnrolledCourses()
        }
    }, [user, token])

    const value = {
        currency,
        allCourses,
        navigate,
        calculateRating,
        isEducator,
        setIsEducator,
        calculateChapterTime,
        calculateCourseDuration,
        calculateNumberOfLectures,
        fetchUserEnrolledCourses,
        enrolledCourses,
        backendUrl,
        userData,
        setUserData,
        getToken,
        fetchAllCourses,
        user,
        setUser,
        token,
        setToken,
        logout
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

AppContextProvider.propTypes = {
    children: PropTypes.node.isRequired
}