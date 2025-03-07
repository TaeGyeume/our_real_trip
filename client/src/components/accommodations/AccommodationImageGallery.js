import React, {useState} from 'react';
import Modal from 'react-modal';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import {IconButton} from '@mui/material';
import {ArrowBackIos, ArrowForwardIos} from '@mui/icons-material';

const AccommodationImageGallery = ({images, accommodationName, serverUrl}) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const openModal = index => {
    setSelectedImageIndex(index);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const nextImage = () => {
    setSelectedImageIndex(prevIndex => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImageIndex(prevIndex => (prevIndex - 1 + images.length) % images.length);
  };

  return (
    <div>
      {images.length === 1 ? (
        // 이미지가 1개일 때 (기존 방식 유지)
        <div onClick={() => openModal(0)} style={{cursor: 'pointer'}}>
          <img
            src={
              images[0].startsWith('/uploads/') ? `${serverUrl}${images[0]}` : images[0]
            }
            alt={`${accommodationName} 이미지`}
            style={{
              width: '100%',
              height: '400px',
              objectFit: 'cover',
              borderRadius: '8px'
            }}
          />
        </div>
      ) : (
        // 이미지가 2개 이상일 때 (격자 레이아웃 적용)
        <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px'}}>
          {/* 첫 번째 큰 이미지 */}
          <div onClick={() => openModal(0)} style={{cursor: 'pointer'}}>
            <img
              src={
                images[0].startsWith('/uploads/') ? `${serverUrl}${images[0]}` : images[0]
              }
              alt={`${accommodationName} 이미지 1`}
              style={{
                width: '100%',
                height: '400px',
                objectFit: 'cover',
                borderRadius: '8px'
              }}
            />
          </div>

          {/* 작은 이미지 최대 2개만 표시 */}
          <div
            style={{
              display: 'grid',
              gridTemplateRows: `repeat(2, 1fr)`,
              gap: '10px'
            }}>
            {images.slice(1, 3).map((img, index) => {
              // "더보기"를 마지막에 추가할지 여부 체크
              const isLastImage = index === 1 && images.length > 3;
              return (
                <div
                  key={index}
                  onClick={() => openModal(index + 1)}
                  style={{cursor: 'pointer', position: 'relative'}}>
                  <img
                    src={img.startsWith('/uploads/') ? `${serverUrl}${img}` : img}
                    alt={`${accommodationName} 이미지 ${index + 2}`}
                    style={{
                      width: '100%',
                      height: '190px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      filter: isLastImage ? 'brightness(50%)' : 'none' // 마지막 이미지일 경우 흐리게
                    }}
                  />
                  {isLastImage && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        padding: '10px 15px',
                        borderRadius: '5px'
                      }}>
                      더보기
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 이미지 확대 모달 */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="이미지 확대 보기"
        shouldCloseOnOverlayClick={true}
        shouldCloseOnEsc={true}
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1300
          },
          content: {
            position: 'relative',
            border: 'none',
            background: 'transparent',
            overflow: 'hidden',
            padding: '0',
            width: 'auto',
            height: 'auto',
            inset: 'unset',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300
          }
        }}>
        {/* 이전 버튼 */}
        <IconButton
          onClick={prevImage}
          sx={{
            position: 'absolute',
            left: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: '#fff',
            '&:hover': {backgroundColor: 'rgba(0, 0, 0, 0.8)'},
            padding: '12px',
            borderRadius: '50%'
          }}>
          <ArrowBackIos />
        </IconButton>

        {/* 확대 이미지 */}
        <img
          src={
            images[selectedImageIndex].startsWith('/uploads/')
              ? `${serverUrl}${images[selectedImageIndex]}`
              : images[selectedImageIndex]
          }
          alt="확대 이미지"
          style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            objectFit: 'contain',
            borderRadius: '10px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)'
          }}
        />

        {/* 다음 버튼 */}
        <IconButton
          onClick={nextImage}
          sx={{
            position: 'absolute',
            right: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: '#fff',
            '&:hover': {backgroundColor: 'rgba(0, 0, 0, 0.8)'},
            padding: '12px',
            borderRadius: '50%'
          }}>
          <ArrowForwardIos />
        </IconButton>
      </Modal>
    </div>
  );
};

export default AccommodationImageGallery;
