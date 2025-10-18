import { useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import uniqid from 'uniqid'
import Quill from 'quill';
import { assets } from '../../assets/assets';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const EditCourse = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { backendUrl, getToken } = useContext(AppContext)

  const quillRef = useRef(null);
  const editorRef = useRef(null);

  const [courseTitle, setCourseTitle] = useState('')
  const [coursePrice, setCoursePrice] = useState(0)
  const [discount, setDiscount] = useState(0);
  const [image, setImage] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quillReady, setQuillReady] = useState(false);

  const [showPopup, setShowPopup] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: '',
    lectureDuration: '',
    lectureUrl: '',
    isPreviewFree: false,
    videoFile: null,
    videoSource: 'url'
  })

  // Fetch existing course data
  const fetchCourseData = useCallback(async () => {
    try {
      const token = getToken();
      const { data } = await axios.get(`${backendUrl}/api/educator/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        const course = data.course;
        setCourseTitle(course.courseTitle);
        setCoursePrice(course.coursePrice);
        setDiscount(course.discount);
        setExistingImageUrl(course.courseThumbnail);
        setChapters(course.courseContent || []);
        
        // Set the course description in Quill editor when it's ready
        if (quillReady && quillRef.current && quillRef.current.root) {
          quillRef.current.root.innerHTML = course.courseDescription || '';
        } else {
          // If Quill isn't ready yet, wait for it
          const checkQuill = () => {
            if (quillRef.current && quillRef.current.root) {
              quillRef.current.root.innerHTML = course.courseDescription || '';
            } else {
              setTimeout(checkQuill, 100);
            }
          };
          checkQuill();
        }
      } else {
        toast.error('Failed to fetch course data');
        navigate('/educator/my-courses');
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast.error('Error fetching course data');
      navigate('/educator/my-courses');
    } finally {
      setLoading(false);
    }
  }, [courseId, backendUrl, getToken, navigate, quillReady])

  const handleChapter = (action, chapterId) => {
    if (action === 'add') {
      const title = prompt("Enter chapter Name: ");
      if (title) {
        const newChapter = {
          chapterId: uniqid(),
          chapterTitle: title,
          chapterContent: [],
          collapsed: false,
          chapterOrder: chapters.length > 0 ? chapters.slice(-1)[0].chapterOrder + 1 : 1,
        };
        setChapters([...chapters, newChapter]);
      }
    } else if (action === 'remove') {
      setChapters(chapters.filter((chapter) => chapter.chapterId !== chapterId))
    } else if (action === 'toggle') {
      setChapters(
        chapters.map((chapter) => chapter.chapterId === chapterId ? { ...chapter, collapsed: !chapter.collapsed } : chapter)
      )
    };
  }

  const handleLecture = (action, chapterId, lectureIndex) => {
    if (action === 'add') {
      setCurrentChapterId(chapterId);
      setShowPopup(true);
    } else if (action === 'remove') {
      setChapters(
        chapters.map((chapter) => {
          if (chapter.chapterId === chapterId) {
            chapter.chapterContent.splice(lectureIndex, 1);
          }
          return chapter;
        })
      )
    }
  }

  const addLecture = async () => {
    try {
      // Validation
      if (!lectureDetails.lectureTitle || !lectureDetails.lectureDuration) {
        toast.error('Please fill in lecture title and duration');
        return;
      }

      if (lectureDetails.videoSource === 'url' && !lectureDetails.lectureUrl) {
        toast.error('Please provide a video URL');
        return;
      }

      if (lectureDetails.videoSource === 'upload' && !lectureDetails.videoFile) {
        toast.error('Please select a video file to upload');
        return;
      }

      let finalLectureUrl = lectureDetails.lectureUrl;

      // If uploading a video file, upload it first
      if (lectureDetails.videoSource === 'upload' && lectureDetails.videoFile) {
        setUploadingVideo(true);
        const formData = new FormData();
        formData.append('video', lectureDetails.videoFile);

        const token = getToken();
        const { data } = await axios.post(backendUrl + '/api/educator/upload-video', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 300000, // 5 minutes timeout for large video uploads
          maxContentLength: 500 * 1024 * 1024, // 500MB
          maxBodyLength: 500 * 1024 * 1024, // 500MB
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload Progress: ${percentCompleted}%`);
            // You could update a progress bar here
          }
        });

        if (data.success) {
          finalLectureUrl = data.videoUrl;
          toast.success('Video uploaded successfully!');
        } else {
          toast.error('Video upload failed: ' + data.message);
          setUploadingVideo(false);
          return;
        }
        setUploadingVideo(false);
      }

      setChapters(
        chapters.map((chapter) => {
          if (chapter.chapterId === currentChapterId) {
            const newLecture = {
              lectureTitle: lectureDetails.lectureTitle,
              lectureDuration: lectureDetails.lectureDuration,
              lectureUrl: finalLectureUrl,
              isPreviewFree: lectureDetails.isPreviewFree,
              lectureOrder: chapter.chapterContent.length > 0 ? chapter.chapterContent.slice(-1)[0].lectureOrder + 1 : 1,
              lectureId: uniqid()
            };
            chapter.chapterContent.push(newLecture);
          }
          return chapter;
        })
      );
      setShowPopup(false);
      setLectureDetails({
        lectureTitle: '',
        lectureDuration: '',
        lectureUrl: '',
        isPreviewFree: false,
        videoFile: null,
        videoSource: 'url'
      })
    } catch (error) {
      setUploadingVideo(false);
      toast.error('Error adding lecture: ' + error.message);
    }
  }

  const handleSubmit = async (e) => {
    try {
      e.preventDefault()
      
      // Get course description from Quill editor or fallback to empty string
      let courseDescription = '';
      if (quillRef.current && quillRef.current.root) {
        courseDescription = quillRef.current.root.innerHTML;
      }
      
      const courseData = {
        courseTitle,
        courseDescription,
        coursePrice: Number(coursePrice),
        discount: Number(discount),
        courseContent: chapters,
      }

      const formData = new FormData()
      formData.append('courseData', JSON.stringify(courseData));
      if (image) {
        formData.append('image', image);
      }

      const token = getToken();
      const { data } = await axios.put(`${backendUrl}/api/educator/edit-course/${courseId}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        toast.success('Course updated successfully!');
        navigate('/educator/my-courses');
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    // Initialize Quill editor
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
      });
      setQuillReady(true);
    }

    // Fetch course data when component mounts and Quill is ready
    if (courseId && (!quillRef.current || quillReady)) {
      fetchCourseData();
    }
  }, [courseId, fetchCourseData, quillReady])

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className='h-screen overflow-scroll flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0'>
      <div className="flex items-center justify-between w-full mb-4">
        <h2 className="text-2xl font-semibold">Edit Course</h2>
        <button
          onClick={() => navigate('/educator/my-courses')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className='flex flex-col gap-4 max-w-md w-full text-gray-500'>
        <div className='flex flex-col gap-1'>
          <p>Course Title</p>
          <input type="text" onChange={e => setCourseTitle(e.target.value)} value={courseTitle} placeholder='Type here' className='outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500' required />
        </div>

        <div className='flex flex-col gap-1'>
          <p>Course Description</p>
          <div ref={editorRef}></div>
        </div>

        <div className='flex items-center justify-between flex-wrap'>
          <div className='flex flex-col gap-1'>
            <p>Course Price</p>
            <input type="number" onChange={e => setCoursePrice(e.target.value)} value={coursePrice} placeholder='0' className='outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500' required />
          </div>

          <div className='flex md:flex-row flex-col items-center gap-3'>
            <p>Course Thumbnail</p>
            <label htmlFor="thumbnailImage" className='flex items-center gap-3'>
              <img src={assets.file_upload_icon} alt="" className='p-3 bg-blue-500 rounded cursor-pointer' />
              <input type="file" id='thumbnailImage' onChange={e => setImage(e.target.files[0])} accept='image/*' hidden />
              {image ? (
                <img className='max-h-10' src={URL.createObjectURL(image)} alt="Course thumbnail preview" />
              ) : existingImageUrl ? (
                <img className='max-h-10' src={existingImageUrl} alt="Current thumbnail" />
              ) : null}
            </label>
          </div>
        </div>

        <div className='flex flex-col gap-1'>
          <p>Discount %</p>
          <input type="number" onChange={e => setDiscount(e.target.value)} value={discount} placeholder='0' min={0} max={100} className='outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500' required />
        </div>

        {/* Chapters and Lectures */}
        <div>
          {chapters.map((chapter, chapterIndex) => (
            <div key={chapterIndex} className='bg-white border rounded-lg mb-4'>
              <div className='flex justify-between items-center p-4 border-b'>
                <div className='flex items-center'>
                  <img src={assets.dropdown_icon} width={14} alt="" className={`mr-2 cursor-pointer transition-all ${chapter.collapsed && "-rotate-90"}`}
                    onClick={() => handleChapter('toggle', chapter.chapterId)}
                  />
                  <span className='font-semibold'>{chapterIndex + 1} {chapter.chapterTitle}</span>
                </div>
                <span className='text-gray-500'>{chapter.chapterContent.length} Lectures</span>
                <img src={assets.cross_icon} alt="" className='cursor-pointer'
                  onClick={() => handleChapter('remove', chapter.chapterId)}
                />
              </div>

              {!chapter.collapsed && (
                <div className='p-4'>
                  {chapter.chapterContent.map((lecture, lectureIndex) => (
                    <div key={lectureIndex} className='flex justify-between items-center mb-2'>
                      <span>{lectureIndex + 1} {lecture.lectureTitle} - {lecture.lectureDuration} mins -
                        <a href={lecture.lectureUrl} target='_blank' className='text-blue-500 ml-1' rel="noreferrer">
                          {lecture.lectureUrl.includes('cloudinary') ? 'Uploaded Video' : 'Video Link'}
                        </a> - {lecture.isPreviewFree ? 'Free Preview' : 'Paid'}</span>

                      <img src={assets.cross_icon} alt="" className='cursor-pointer'
                        onClick={() => handleLecture('remove', chapter.chapterId, lectureIndex)} />
                    </div>
                  ))}
                  <div className='inline-flex bg-gray-100 p-2 rounded cursor-pointer mt-2 hover:bg-blue-400 hover:text-white'
                    onClick={() => handleLecture('add', chapter.chapterId)}>
                    + Add Lecture
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className='flex justify-center items-center bg-blue-100 p-2 rounded-lg cursor-pointer hover:bg-blue-400 hover:text-white' onClick={() => handleChapter('add')}>
            + Add Chapter
          </div>

          {showPopup && (
            <div className='fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50'>
              <div className='bg-white text-gray-700 p-4 rounded relative w-full max-w-80'>
                <h2 className='text-lg font-semibold mb-4'>Add Lecture</h2>

                <div className='mb-2'>
                  <p>Lecture Title</p>
                  <input
                    type="text"
                    className='mt-1 block w-full border rounded py-1 px-2'
                    value={lectureDetails.lectureTitle}
                    onChange={(e) => setLectureDetails({ ...lectureDetails, lectureTitle: e.target.value })}
                  />
                </div>

                <div className='mb-2'>
                  <p>Duration (minutes)</p>
                  <input
                    type="number"
                    className='mt-1 block w-full border rounded py-1 px-2'
                    value={lectureDetails.lectureDuration}
                    onChange={(e) => setLectureDetails({ ...lectureDetails, lectureDuration: e.target.value })}
                  />
                </div>

                <div className='mb-2'>
                  <p>Video Source</p>
                  <div className='mt-1 flex gap-4'>
                    <label className='flex items-center'>
                      <input
                        type="radio"
                        value="url"
                        checked={lectureDetails.videoSource === 'url'}
                        onChange={(e) => setLectureDetails({ ...lectureDetails, videoSource: e.target.value, videoFile: null })}
                        className='mr-2'
                      />
                      URL Link
                    </label>
                    <label className='flex items-center'>
                      <input
                        type="radio"
                        value="upload"
                        checked={lectureDetails.videoSource === 'upload'}
                        onChange={(e) => setLectureDetails({ ...lectureDetails, videoSource: e.target.value, lectureUrl: '' })}
                        className='mr-2'
                      />
                      Upload Video
                    </label>
                  </div>
                </div>

                {lectureDetails.videoSource === 'url' ? (
                  <div className='mb-2'>
                    <p>Lecture URL</p>
                    <input
                      type="text"
                      className='mt-1 block w-full border rounded py-1 px-2'
                      value={lectureDetails.lectureUrl}
                      onChange={(e) => setLectureDetails({ ...lectureDetails, lectureUrl: e.target.value })}
                      placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                    />
                  </div>
                ) : (
                  <div className='mb-2'>
                    <p>Upload Video File</p>
                    <div className='mt-1 flex items-center gap-3'>
                      <label htmlFor="videoFile" className='flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded cursor-pointer hover:bg-blue-600'>
                        <img src={assets.file_upload_icon} alt="" className='w-4 h-4' />
                        Choose Video
                      </label>
                      <input
                        type="file"
                        id="videoFile"
                        accept="video/*"
                        onChange={(e) => setLectureDetails({ ...lectureDetails, videoFile: e.target.files[0] })}
                        hidden
                      />
                      {lectureDetails.videoFile && (
                        <span className='text-sm text-green-600'>
                          ✓ {lectureDetails.videoFile.name}
                        </span>
                      )}
                    </div>
                    <p className='text-xs text-gray-500 mt-1'>
                      Supported formats: MP4, AVI, MOV, WMV (Max: 500MB)
                    </p>
                  </div>
                )}

                <div className='mb-2'>
                  <p>Is Preview Free?</p>
                  <input
                    type="checkbox"
                    className='mt-1 scale-125 cursor-pointer'
                    checked={lectureDetails.isPreviewFree}
                    onChange={(e) => setLectureDetails({ ...lectureDetails, isPreviewFree: e.target.checked })}
                  />
                </div>

                <button
                  type='button'
                  className={`w-full px-4 py-2 rounded cursor-pointer ${uploadingVideo
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : 'bg-blue-400 text-white hover:bg-blue-500'
                    }`}
                  onClick={addLecture}
                  disabled={uploadingVideo}
                >
                  {uploadingVideo ? 'Uploading Video...' : 'Add'}
                </button>

                <img onClick={() => setShowPopup(false)} src={assets.cross_icon} className='absolute top-4 right-4 w-4 cursor-pointer' alt="" />
              </div>
            </div>
          )}
        </div>

        <button type='submit' className='bg-green-600 text-white w-max py-2.5 px-8 rounded my-4 cursor-pointer hover:bg-green-700'>
          Update Course
        </button>
      </form>
    </div>
  )
}

export default EditCourse