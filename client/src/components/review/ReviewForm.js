import React, {useState} from 'react';
import {useSearchParams, useNavigate} from 'react-router-dom';
import {createReview} from '../../api/review/reviewService';
import {useAuthStore} from '../../store/authStore';
import {useReviewContext} from '../../contexts/ReviewContext';
import {TextField, Button, Rating, Box, Typography, LinearProgress} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import './styles/ReviewForm.css';

const ReviewForm = () => {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const bookingId = searchParams.get('bookingId');
  const navigate = useNavigate();

  const {user} = useAuthStore();
  const userId = user?._id;

  const {setReviewStatus} = useReviewContext();

  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(-1); // 마우스 호버 상태 저장
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);

  // 진행 바 상태
  const progress =
    (rating > 0 ? 1 : 0) +
    (content.trim().length > 0 ? 1 : 0) +
    (images.length > 0 ? 1 : 0);

  // 이미지 변경 핸들러
  const handleImageChange = e => {
    setImages(prevImages => [...prevImages, ...Array.from(e.target.files)]);
  };

  // 리뷰 제출 핸들러
  const handleSubmit = async () => {
    if (!userId) {
      alert('로그인이 필요합니다.');
      return;
    }

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('bookingId', bookingId);
    formData.append('productId', productId);
    formData.append('rating', rating);
    formData.append('content', content);

    images.forEach((image, index) => {
      formData.append('images', image);
    });

    try {
      await createReview(formData);
      alert('리뷰 작성 완료!');

      setReviewStatus(prevStatus => ({
        ...prevStatus,
        [productId]: {
          ...prevStatus[productId],
          [bookingId]: true
        }
      }));

      navigate('/booking/my/?status=completed');
    } catch (error) {
      console.error('리뷰 작성 실패:', error.response ? error.response.data : error);
      alert('리뷰 작성 실패');
    }
  };

  return (
    <Box className="review-form">
      <Typography variant="h5" className="review-title">
        리뷰 작성
      </Typography>

      <LinearProgress
        variant="determinate"
        value={(progress / 3) * 100}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: '#eee',
          '& .MuiLinearProgress-bar': {backgroundColor: 'dodgerblue'}
        }}
      />

      <Box className="rating-container">
        <Typography variant="subtitle1">평점</Typography>
        <Rating
          name="rating"
          value={rating}
          onChange={(e, newValue) => setRating(newValue)}
          onChangeActive={(e, newHover) => setHover(newHover)}
          precision={0.5}
          size="large"
          sx={{
            color: 'dodgerblue',
            '& .MuiRating-iconFilled': {color: 'dodgerblue'},
            '& .MuiRating-iconHover': {color: 'dodgerblue'},
            transition: 'none',
            lineHeight: '1'
          }}
        />
        <Typography variant="body1" className="rating-value">
          {hover !== -1 ? hover : rating} / 5
        </Typography>
      </Box>

      <TextField
        className="review-textarea"
        label="리뷰 작성"
        multiline
        rows={4}
        fullWidth
        variant="outlined"
        value={content}
        onChange={e => setContent(e.target.value)}
      />

      <div className="review-helper">
        <h4>리뷰 작성이 어렵다면?</h4>
        <ul>
          <li>🌟 이 여행에서 가장 좋았던 점은?</li>
          <li>🛑 아쉬웠던 점이 있다면?</li>
          <li>📷 추천할 만한 포인트는?</li>
        </ul>
      </div>

      <div className="upload-container">
        <input
          accept="/uploads/*"
          className="file-input"
          id="image-upload"
          multiple
          type="file"
          onChange={handleImageChange}
        />
        <label htmlFor="image-upload" className="upload-label">
          <CloudUploadIcon className="upload-icon" />
          이미지 업로드
        </label>
      </div>

      <div className="review-preview">
        <h3>미리보기</h3>
        <div className="preview-rating">
          <Rating
            value={rating}
            readOnly
            precision={0.5}
            size="large"
            style={{color: 'dodgerblue'}}
          />
          <span>{rating.toFixed(1)} / 5.0</span>
        </div>
        <p className="preview-text">{content || '입력한 내용이 여기에 표시됩니다.'}</p>
        <div className="preview-images">
          {images.length > 0 &&
            images.map((img, idx) => (
              <img
                key={idx}
                src={URL.createObjectURL(img)}
                alt={`미리보기 ${idx + 1}`}
                className="preview-image"
              />
            ))}
        </div>
      </div>

      <Button
        className="submit-button"
        variant="contained"
        color="primary"
        onClick={handleSubmit}>
        작성 완료
      </Button>
    </Box>
  );
};

export default ReviewForm;
