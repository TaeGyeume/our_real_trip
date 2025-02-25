import React, {useState} from 'react';
import {useSearchParams, useNavigate} from 'react-router-dom';
import {createReview} from '../../api/review/reviewService';
import {useAuthStore} from '../../store/authStore';

const ReviewForm = () => {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const bookingId = searchParams.get('bookingId');
  const navigate = useNavigate();

  const {user} = useAuthStore();
  const userId = user?._id;

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);

  const handleImageChange = e => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async () => {
    if (!userId) {
      console.error('로그인 필요');
    }

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('bookingId', bookingId);
    formData.append('productId', productId);
    formData.append('rating', rating);
    formData.append('content', content);

    if (images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        formData.append('images', images[i]);
      }
    }

    try {
      await createReview(formData);
      alert('리뷰 작성 완료!');
      navigate('/booking/my/?status=completed');
    } catch (error) {
      console.error('리뷰 작성 실패:', error.response ? error.response.data : error);
      alert('리뷰 작성 실패');
    }
  };

  return (
    <div>
      <h2>리뷰 작성</h2>
      <input
        type="number"
        value={rating}
        onChange={e => setRating(e.target.value)}
        min="1"
        max="5"
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="리뷰 작성..."
      />
      <input type="file" multiple onChange={handleImageChange} />
      <button onClick={handleSubmit}>작성 완료</button>
    </div>
  );
};

export default ReviewForm;
