import {useState} from 'react';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const ReviewImageGallery = ({topReview, reviews}) => {
  const topReviewImages = topReview?.images || [];
  const reviewImages = reviews.flatMap(review => review.images || []);
  const allImages = [...topReviewImages, ...reviewImages];

  const displayedImages = allImages.slice(0, 3); // 처음 3개만 표시
  const remainingImages = allImages.length - 3; // 남아있는 이미지 개수

  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const handleOpenGalleryModal = index => {
    setGalleryIndex(index);
    setIsGalleryModalOpen(true);
  };

  const handleCloseGalleryModal = () => {
    setIsGalleryModalOpen(false);
  };

  const handleNextGalleryImage = () => {
    setGalleryIndex(prevIndex => (prevIndex + 1) % allImages.length);
  };

  const handlePrevGalleryImage = () => {
    setGalleryIndex(prevIndex => (prevIndex - 1 + allImages.length) % allImages.length);
  };

  return (
    <div className="review-gallery">
      {displayedImages.map((image, index) => (
        <div
          key={index}
          className="gallery-image"
          onClick={() => handleOpenGalleryModal(index)}>
          <img src={`http://localhost:5000${image}`} alt={`리뷰 이미지 ${index + 1}`} />
          {/* 마지막 이미지에 남은 이미지 개수 표시 */}
          {index === 2 && remainingImages > 0 && (
            <div className="more-images-overlay">+ {remainingImages}</div>
          )}
        </div>
      ))}

      {isGalleryModalOpen && (
        <div className="modal-overlay" onClick={handleCloseGalleryModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <IconButton
              className="modal-close"
              onClick={handleCloseGalleryModal}
              sx={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'white',
                '&:hover': {background: 'rgba(0, 0, 0, 0.6)'}
              }}>
              <CloseIcon />
            </IconButton>

            <IconButton
              className="modal-prev"
              onClick={handlePrevGalleryImage}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '10px',
                transform: 'translateY(-50%)',
                background: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': {background: 'rgba(0, 0, 0, 0.8)'}
              }}>
              <ArrowBackIosNewIcon />
            </IconButton>

            <img
              src={`http://localhost:5000${allImages[galleryIndex]}`}
              alt="확대된 이미지"
              className="modal-image"
            />

            <IconButton
              className="modal-next"
              onClick={handleNextGalleryImage}
              sx={{
                position: 'absolute',
                top: '50%',
                right: '10px',
                transform: 'translateY(-50%)',
                background: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': {background: 'rgba(0, 0, 0, 0.8)'}
              }}>
              <ArrowForwardIosIcon />
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewImageGallery;
