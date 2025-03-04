import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {fetchRoomList} from '../../../api/accommodation/accommodationService';
import axios from '../../../api/axios';
import RoomCard from '../../../components/accommodations/RoomCard';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  Stack,
  FormControl,
  InputLabel,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const AccommodationModify = () => {
  const {accommodationId} = useParams();
  const navigate = useNavigate();
  const SERVER_URL =
    process.env.REACT_APP_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://ourrealtrip.shop/api';

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    location: '',
    coordinates: {lat: '', lng: ''},
    category: '',
    amenities: [],
    images: [],
    rooms: []
  });

  const [availableRooms, setAvailableRooms] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [countries, setCountries] = useState([]); // 국가 목록
  const [cities, setCities] = useState([]); // 특정 국가의 도시 목록
  const [selectedCountry, setSelectedCountry] = useState(''); // 현재 선택된 국가

  // 기존 숙소 데이터 가져오기
  useEffect(() => {
    const fetchAccommodation = async () => {
      try {
        const response = await axios.get(`/accommodations/${accommodationId}`);
        const data = response.data;

        // `coordinates.coordinates` 배열이 없을 경우 예외처리
        const coordinatesData = Array.isArray(data.coordinates?.coordinates)
          ? data.coordinates.coordinates
          : [126.978, 37.5665]; // 기본값 설정

        setFormData({
          ...data,
          coordinates: {
            lat: coordinatesData[1] || '', // 위도
            lng: coordinatesData[0] || '' // 경도
          },
          location: data.location?._id || '',
          images: data.images || []
        });

        setPreviewImages(
          data.images.map(img =>
            img.startsWith('/uploads/') ? `${SERVER_URL}${img}` : img
          )
        );
        setSelectedCountry(data.location?.country || ''); // 국가 자동 선택
        setCities([{_id: data.location?._id, name: data.location?.name}]); // 기존 도시 자동 선택

        setLoading(false);
      } catch (err) {
        console.error('숙소 정보 불러오기 오류:', err);
        setError('숙소 정보를 불러오는 중 오류 발생');
        setLoading(false);
      }
    };

    fetchAccommodation();
  }, [accommodationId, SERVER_URL]);

  // 객실 데이터 가져오기
  useEffect(() => {
    const fetchRooms = async () => {
      const rooms = await fetchRoomList(accommodationId);
      setAvailableRooms(rooms);
    };

    fetchRooms();
  }, [accommodationId]);

  // 입력값 변경 핸들러
  const handleChange = e => {
    const {name, value} = e.target;
    setFormData({...formData, [name]: value});
  };

  // 국가 목록 가져오기
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get('/locations/countries');
        setCountries(response.data);
      } catch (error) {
        console.error('국가 목록 불러오기 오류:', error);
      }
    };

    fetchCountries();
  }, []);

  // 국가 변경 핸들러
  const handleCountryChange = async e => {
    const country = e.target.value;
    setSelectedCountry(country);
    setCities([]);
    setFormData(prev => ({...prev, location: ''})); // 국가 변경 시 도시 초기화

    if (country) {
      try {
        const response = await axios.get(`/locations/cities?country=${country}`);
        setCities(response.data);
      } catch (error) {
        console.error('도시 목록 불러오기 오류:', error);
      }
    }
  };

  // 도시 변경 핸들러 (location 값 업데이트)
  const handleCityChange = e => {
    setFormData(prev => ({...prev, location: e.target.value}));
  };

  // 좌표 입력 핸들러
  const handleCoordinateChange = e => {
    const {name, value} = e.target;
    setFormData({
      ...formData,
      coordinates: {
        ...formData.coordinates,
        [name]: parseFloat(value) || ''
      }
    });
  };

  // 파일 업로드 핸들러 (미리보기 포함)
  const handleFileChange = e => {
    const files = Array.from(e.target.files);

    // 새 이미지 미리보기 URL 생성
    const newPreviews = files.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));

    // 상태 업데이트
    setPreviewImages([...previewImages, ...newPreviews.map(item => item.url)]);
    setNewImages([...newImages, ...newPreviews]); // File 객체와 URL 저장
  };

  // 이미지 삭제 핸들러 (업로드된 이미지 & 새 이미지 모두 포함)
  const handleDeleteImage = imageUrl => {
    // 기존 이미지 삭제 목록에 추가
    if (formData.images.includes(imageUrl.replace(SERVER_URL, ''))) {
      setImagesToDelete([...imagesToDelete, imageUrl.replace(SERVER_URL, '')]);
    }

    // 새로 업로드한 이미지인 경우 필터링하여 제거
    const updatedNewImages = newImages.filter(image => image.url !== imageUrl);

    setNewImages(updatedNewImages); // newImages 상태 업데이트
    setPreviewImages(previewImages.filter(img => img !== imageUrl));

    setFormData({
      ...formData,
      images: formData.images.filter(img => img !== imageUrl.replace(SERVER_URL, ''))
    });
  };

  // 편의시설 추가 핸들러
  const handleAddAmenity = () => {
    setFormData({...formData, amenities: [...formData.amenities, '']});
  };

  // 편의시설 삭제 핸들러
  const handleRemoveAmenity = index => {
    const newAmenities = formData.amenities.filter((_, i) => i !== index);
    setFormData({...formData, amenities: newAmenities});
  };

  // 편의시설 입력 변경 핸들러
  const handleAmenityChange = (index, value) => {
    const newAmenities = [...formData.amenities];
    newAmenities[index] = value;
    setFormData({...formData, amenities: newAmenities});
  };

  // 수정 요청 핸들러 (FormData로 업로드)
  const handleSubmit = async e => {
    e.preventDefault();

    // 최신 좌표 값을 가져와서 저장
    const coordinates = {
      type: 'Point',
      coordinates: [
        parseFloat(formData.coordinates.lng) || 126.978, // 경도
        parseFloat(formData.coordinates.lat) || 37.5665 // 위도
      ]
    };

    try {
      // 이미지 삭제 요청을 먼저 보낸다.
      if (imagesToDelete.length > 0) {
        for (const image of imagesToDelete) {
          console.log('이미지 삭제 요청:', image);

          await axios.delete(`/accommodations/${accommodationId}/images`, {
            data: {imageUrl: image}, // DELETE 요청에서는 `data` 속성을 사용해야 한다.
            headers: {'Content-Type': 'application/json'}
          });
        }
      }

      // 숙소 업데이트 요청
      const updatedFormData = new FormData();
      updatedFormData.append('name', formData.name);
      updatedFormData.append('description', formData.description);
      updatedFormData.append('location', formData.location);
      updatedFormData.append('address', formData.address);
      updatedFormData.append('category', formData.category);
      updatedFormData.append('coordinates', JSON.stringify(coordinates));
      updatedFormData.append('amenities', JSON.stringify(formData.amenities));

      // 기존 이미지 유지 (삭제되지 않은 이미지만 추가)
      const remainingImages = formData.images.filter(
        img => !imagesToDelete.includes(img)
      );
      updatedFormData.append('existingImages', JSON.stringify(remainingImages));

      // 새로 업로드한 이미지 중 삭제되지 않은 파일만 추가
      newImages.forEach(image => updatedFormData.append('images', image.file));

      // console.log('전송할 FormData 확인:');
      // for (let pair of updatedFormData.entries()) {
      //   console.log(pair[0], pair[1]);
      // }

      // 숙소 정보 수정 요청
      await axios.patch(`/accommodations/${accommodationId}`, updatedFormData, {
        headers: {'Content-Type': 'multipart/form-data'}
      });

      alert('숙소 정보가 수정되었습니다.');
      navigate(`/product/accommodations/list`);
    } catch (err) {
      console.error('숙소 수정 오류:', err);
      alert('숙소 수정에 실패했습니다.');
    }
  };

  // 취소 버튼 클릭 시 원래 데이터로 복원
  const handleCancel = () => {
    setImagesToDelete([]); // 삭제 요청 목록 초기화
    setPreviewImages(
      formData.images.map(img =>
        img.startsWith('/uploads/') ? `${SERVER_URL}${img}` : img
      )
    );
    navigate(`/product/accommodations/list`);
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Box sx={{maxWidth: 800, mx: 'auto', mt: 4}}>
      <Typography variant="h4" sx={{mb: 3, fontWeight: 'bold', textAlign: 'center'}}>
        숙소 수정
      </Typography>

      <Stack spacing={2} component="form" onSubmit={handleSubmit}>
        <FormControl fullWidth>
          <InputLabel>국가 선택</InputLabel>
          <Select
            value={selectedCountry}
            onChange={handleCountryChange}
            label="국가 선택">
            <MenuItem value="">국가를 선택하세요</MenuItem>
            {countries.map((country, index) => (
              <MenuItem key={index} value={country}>
                {country}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>도시 선택</InputLabel>
          <Select
            name="location"
            value={formData.location}
            onChange={handleCityChange}
            label="도시 선택"
            required>
            <MenuItem value="">도시를 선택하세요</MenuItem>
            {cities.map(city => (
              <MenuItem key={city._id} value={city._id}>
                {city.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="숙소명"
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
          label="주소"
          fullWidth
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
        />

        <TextField
          label="위도 (Latitude)"
          fullWidth
          type="number"
          name="lat"
          value={formData.coordinates.lat}
          onChange={handleCoordinateChange}
          required
        />
        <TextField
          label="경도 (Longitude)"
          fullWidth
          type="number"
          name="lng"
          value={formData.coordinates.lng}
          onChange={handleCoordinateChange}
          required
        />

        <FormControl fullWidth>
          <InputLabel>카테고리</InputLabel>
          <Select
            name="category"
            value={formData.category}
            onChange={handleChange}
            label="카테고리">
            <MenuItem value="Hotel">호텔</MenuItem>
            <MenuItem value="Pension">펜션</MenuItem>
            <MenuItem value="Resort">리조트</MenuItem>
            <MenuItem value="Motel">모텔</MenuItem>
          </Select>
        </FormControl>

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

        <Typography variant="h6">숙소 이미지</Typography>
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

        <Button
          variant="contained"
          onClick={() =>
            navigate(`/product/room/new?accommodationId=${accommodationId}`)
          }>
          + 객실 추가
        </Button>

        <Typography variant="h6">객실 목록</Typography>
        {availableRooms.length > 0 ? (
          availableRooms.map(room => <RoomCard key={room._id} room={room} />)
        ) : (
          <Typography color="textSecondary">예약 가능한 객실이 없습니다.</Typography>
        )}

        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" color="primary" type="submit">
            수정 완료
          </Button>
          <Button variant="outlined" onClick={handleCancel}>
            취소
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default AccommodationModify;
