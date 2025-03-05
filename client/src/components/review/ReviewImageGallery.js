import {useState} from 'react';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import './styles/ReviewImageGallery.css';

const ReviewImageGallery = ({topReview, reviews}) => {
  const topReviewImages = Array.isArray(topReview?.images) ? topReview.images : [];
  const reviewImages = reviews.flatMap(review =>
    Array.isArray(review.images) ? review.images : []
  );
  const allImages = [...topReviewImages, ...reviewImages];

  const displayedImages = allImages.length > 0 ? allImages.slice(0, 4) : [];
  const remainingImages = Math.max(allImages.length - 4, 0);

  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const handleOpenGalleryModal = index => {
    if (index !== undefined && allImages.length > 0) {
      setGalleryIndex(Math.max(0, Math.min(index, allImages.length - 1)));
      setIsGalleryModalOpen(true);
    }
  };

  const handleCloseGalleryModal = () => {
    setIsGalleryModalOpen(false);
  };

  const handleNextGalleryImage = () => {
    if (allImages.length > 0) {
      setGalleryIndex(prevIndex => (prevIndex + 1) % allImages.length);
    }
  };

  const handlePrevGalleryImage = () => {
    if (allImages.length > 0) {
      setGalleryIndex(prevIndex => (prevIndex - 1 + allImages.length) % allImages.length);
    }
  };

  return (
    <div className="review-gallery">
      {displayedImages.length > 0 ? (
        displayedImages.map((image, index) => (
          <div
            key={index}
            className="gallery-image"
            onClick={() => handleOpenGalleryModal(index)}>
            <img src={`http://localhost:5000${image}`} alt={`리뷰 이미지 ${index + 1}`} />
            {index === 3 && remainingImages > 0 && (
              <div className="more-images-overlay">+ {remainingImages}</div>
            )}
          </div>
        ))
      ) : (
        <p className="no-images">등록된 이미지가 없습니다.</p>
      )}

      {isGalleryModalOpen && allImages.length > 0 && (
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
              disabled={allImages.length <= 1}
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

            {allImages.length > 0 && (
              <img
                src={`http://localhost:5000${allImages[galleryIndex]}`}
                alt="확대된 이미지"
                className="modal-image"
              />
            )}

            <IconButton
              className="modal-next"
              onClick={handleNextGalleryImage}
              disabled={allImages.length <= 1}
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
