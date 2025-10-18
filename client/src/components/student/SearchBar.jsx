import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { assets } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'

const SearchBar = ({data, onSearchChange}) => {

  const navigate = useNavigate();
  const [input, setInput] = useState(data ? data : '');

  // Sync input with data prop changes
  useEffect(() => {
    if (data !== undefined) {
      setInput(data);
    }
  }, [data]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    
    // Call the callback for real-time search if provided
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const onSearchHandler = (e)=> {
    e.preventDefault()
    navigate('/course-list/' + input)
  }

  return (
      <form 
      onSubmit={onSearchHandler}
      className='max-w-xl w-full md:h-14 h-12 flex items-center bg-white border border-gray-500/20 rounded'>

        <img src={assets.search_icon} alt="search icon" 
          className='md:w-auto w-10 px-3'
        />

        <input 
          onChange={handleInputChange}
          value = {input}
          type='text' 
          placeholder='Search for courses'
          className='w-full h-full outline-none text-gray-500/80'
        />

        <button 
          type='submit' 
          className ='bg-blue-600 rounded text-white md:px-10 px-7 md:py-3 py-2 mx-1 cursor-pointer'>
            Search
        </button>

      </form>
  )
}

SearchBar.propTypes = {
  data: PropTypes.string,
  onSearchChange: PropTypes.func
}

export default SearchBar
