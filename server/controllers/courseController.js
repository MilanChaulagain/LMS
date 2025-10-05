import Course from "../models/Course.js";

//Get All courses
export const getAllCourses = async (req, res)=> {

    try {
        const courses = await Course.find({isPublished: true}).select([
            '-courseContent',
            '-enrolledStudents'
        ]).populate({path: 'educator'})

        res.json({
            success: true,
            courses
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }

}

//Get Course by Id

export const getCourseId = async(req, res)=> {
    const {id} = req.params

    try {
        // Validate course ID format
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID format'
            });
        }

        const courseData = await Course.findById(id).populate({path: 'educator'})
        
        if (!courseData) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        //Remove lectureUrl if ISpreviewFree is false
        courseData.courseContent.forEach(chapter => {
            chapter.chapterContent.forEach(lecture => {
                if(!lecture.isPreviewFree) {
                    lecture.lectureUrl = ""
                }
            })
        })

        res.json({
            success: true,
            courseData
        })
    } catch (error) {
        console.error('Error in getCourseId:', error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}