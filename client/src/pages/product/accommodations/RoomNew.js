import React, {useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import axios from '../../../api/axios';
import {Box, Typography, TextField, Button, Stack, IconButton} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const RoomNew = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accommodationId = searchParams.get('accommodationId') || '';

  const [formData, setFormData] = useState({
    accommodation: accommodationId,
    name: '',
    description: '',
    pricePerNight: '',
    maxGuests: '',
    amenities: [''], // 초기값 빈 배열로 설정
    available: true,
    availableCount: '',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    images: []
  });

  const [previewImages, setPreviewImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  // 입력값 변경 핸들러
  const handleChange = e => {
    const {name, value} = e.target;
    setFormData({...formData, [name]: value});
  };

  // 편의시설 추가 핸들러 (삭제하지 않고 폼에서 사용)
  const handleAddAmenity = () => {
    setFormData({...formData, amenities: [...formData.amenities, '']});
  };

  const handleRemoveAmenity = index => {
    const newAmenities = formData.amenities.filter((_, i) => i !== index);
    setFormData({...formData, amenities: newAmenities});
  };

  const handleAmenityChange = (index, value) => {
    const newAmenities = [...formData.amenities];
    newAmenities[index] = value;
    setFormData({...formData, amenities: newAmenities});
  };

  // 파일 업로드 핸들러 (미리보기 포함)
  const handleFileChange = e => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file) // preview 속성 추가
    }));

    setPreviewImages(prev => [...prev, ...newFiles.map(f => f.preview)]);
    setNewImages(prev => [...prev, ...newFiles]); // 새 이미지 저장
  };

  // 이미지 삭제 핸들러
  const handleDeleteImage = imageUrl => {
    if (imageUrl.startsWith('blob:')) {
      setNewImages(prev => prev.filter(img => img.preview !== imageUrl)); // 정확하게 제거
    } else {
      setImagesToDelete(prev => [...prev, imageUrl]);
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(img => img !== imageUrl)
      }));
    }

    setPreviewImages(prev => prev.filter(img => img !== imageUrl));
  };

  // 생성 요청 핸들러 (FormData로 업로드)
  const handleSubmit = async e => {
    e.preventDefault();

    const newRoomData = new FormData();
    newRoomData.append('accommodation', formData.accommodation);
    newRoomData.append('name', formData.name);
    newRoomData.append('description', formData.description);
    newRoomData.append('pricePerNight', formData.pricePerNight);
    newRoomData.append('maxGuests', formData.maxGuests);
    newRoomData.append('available', formData.available);
    newRoomData.append('availableCount', formData.availableCount);
    newRoomData.append('checkInTime', formData.checkInTime);
    newRoomData.append('checkOutTime', formData.checkOutTime);
    newRoomData.append('amenities', JSON.stringify(formData.amenities));

    // 기존 이미지 중 삭제되지 않은 이미지만 유지
    const remainingImages = formData.images.filter(img => !imagesToDelete.includes(img));
    newRoomData.append('existingImages', JSON.stringify(remainingImages));

    // `newImages`에서 삭제된 이미지를 제외하고 남은 이미지만 추가
    const finalNewImages = newImages
      .filter(img => !imagesToDelete.includes(img.preview)) // `preview` 값 기준으로 삭제 여부 확인
      .map(img => img.file); // `File` 객체만 추출

    if (finalNewImages.length > 0) {
      finalNewImages.forEach(image => {
        newRoomData.append('images', image);
      });
    } else {
      // console.log('업로드할 새 이미지 없음!');
    }

    try {
      // 이미지 삭제 요청 (이미 존재하는 이미지 삭제)
      if (imagesToDelete.length > 0) {
        await axios.post(
          `/rooms/${formData.accommodation}/images/delete`,
          {deletedImages: imagesToDelete},
          {headers: {'Content-Type': 'application/json'}}
        );
      }

      // 새 객실 생성 요청
      await axios.post('/rooms', newRoomData, {
        headers: {'Content-Type': 'multipart/form-data'}
      });

      alert('새 객실이 추가되었습니다.');
      navigate(`/product/accommodations/modify/${accommodationId}`);
    } catch (err) {
      console.error('객실 생성 오류:', err);
      alert('객실 생성에 실패했습니다.');
    }
  };

  return (
    <Box sx={{maxWidth: 800, mx: 'auto', mt: 4, p: 3, boxShadow: 3, borderRadius: 2}}>
      <Typography variant="h4" sx={{mb: 3, fontWeight: 'bold', textAlign: 'center'}}>
        새 객실 추가
      </Typography>

      <Stack spacing={2} component="form" onSubmit={handleSubmit}>
        <TextField
          label="숙소 ID"
          fullWidth
          name="accommodation"
          value={formData.accommodation}
          onChange={handleChange}
          required
        />
        <TextField
          label="객실명"
          fullWidth
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <TextField
          label="설명"
          fullWidth
          multiline
          rows={3}
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
        />
        <TextField
          label="가격 (1박)"
          fullWidth
          type="number"
          name="pricePerNight"
          value={formData.pricePerNight}
          onChange={handleChange}
          required
        />
        <TextField
          label="최대 인원"
          fullWidth
          type="number"
          name="maxGuests"
          value={formData.maxGuests}
          onChange={handleChange}
          required
        />
        <TextField
          label="방 개수"
          fullWidth
          type="number"
          name="availableCount"
          value={formData.availableCount}
          onChange={handleChange}
          required
        />

        <Typography variant="h6">편의시설</Typography>
        {formData.amenities.map((amenity, index) => (
          <Stack key={index} direction="row" spacing={1} alignItems="center">
            <TextField
              fullWidth
              value={amenity}
              onChange={e => handleAmenityChange(index, e.target.value)}
            />
            <IconButton color="error" onClick={() => handleRemoveAmenity(index)}>
              <DeleteIcon />
            </IconButton>
          </Stack>
        ))}
        <Button startIcon={<AddIcon />} onClick={handleAddAmenity}>
          편의시설 추가
        </Button>

        <TextField
          label="체크인 시간"
          fullWidth
          type="time"
          name="checkInTime"
          value={formData.checkInTime}
          onChange={handleChange}
          required
        />
        <TextField
          label="체크아웃 시간"
          fullWidth
          type="time"
          name="checkOutTime"
          value={formData.checkOutTime}
          onChange={handleChange}
          required
        />

        <Typography variant="h6">객실 이미지</Typography>
        <Button component="label" variant="contained" startIcon={<UploadFileIcon />}>
          이미지 업로드
          <input type="file" hidden multiple onChange={handleFileChange} />
        </Button>

        <Stack direction="row" spacing={2} flexWrap="wrap">
          {previewImages.map((image, index) => (
            <Box key={index} sx={{position: 'relative'}}>
              <img
                src={image}
                alt={`preview-${index}`}
                width={80}
                height={80}
                style={{borderRadius: 8}}
              />
              <IconButton
                sx={{position: 'absolute', top: 0, right: 0}}
                onClick={() => handleDeleteImage(image)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
        </Stack>

        <Button variant="contained" color="primary" type="submit" fullWidth>
          객실 추가
        </Button>
      </Stack>
    </Box>
  );
};

export default RoomNew;
