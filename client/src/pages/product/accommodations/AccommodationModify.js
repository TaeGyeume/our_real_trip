import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {fetchRoomList} from '../../../api/accommodation/accommodationService';
import axios from '../../../api/axios';
import RoomCard from '../../../components/accommodations/RoomCard';

const AccommodationModify = () => {
  const {accommodationId} = useParams();
  const navigate = useNavigate();
  const SERVER_URL = 'http://localhost:5000';

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
  }, [accommodationId]);

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

    console.log('변환된 좌표 데이터:', JSON.stringify(coordinates));

    try {
      // 이미지 삭제 요청을 먼저 보낸다.
      if (imagesToDelete.length > 0) {
        for (const image of imagesToDelete) {
          console.log('이미지 삭제 요청:', image);

          await axios.delete(`/accommodations/${accommodationId}/images`, {
            data: {imageUrl: image}, // DELETE 요청에서는 `data` 속성을 사용해야 한다.
            headers: {'Content-Type': 'application/json'}
          });

          console.log('이미지 삭제 성공:', image);
        }
      }

      console.log('삭제된 이미지 리스트:', imagesToDelete);

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

      console.log('전송할 FormData 확인:');
      for (let pair of updatedFormData.entries()) {
        console.log(pair[0], pair[1]);
      }

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
    <div className="container mt-4">
      <h2>숙소 수정</h2>
      <form onSubmit={handleSubmit}>
        {/* 국가 선택 */}
        <div className="mb-3">
          <label className="form-label">국가 선택</label>
          <select
            className="form-control"
            value={selectedCountry}
            onChange={handleCountryChange}>
            <option value="">국가를 선택하세요</option>
            {countries.map((country, index) => (
              <option key={index} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
        {/* 도시 선택 */}
        <div className="mb-3">
          <label className="form-label">도시 선택</label>
          <select
            className="form-control"
            name="location"
            value={formData.location}
            onChange={handleCityChange}
            required>
            <option value="">도시를 선택하세요</option>
            {cities.map(city => (
              <option key={city._id} value={city._id}>
                {city.name}
              </option> // city.name 표시
            ))}
          </select>
        </div>

        {/* 숙소명 */}
        <div className="mb-3">
          <label className="form-label">숙소명</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        {/* 설명 */}
        <div className="mb-3">
          <label className="form-label">설명</label>
          <textarea
            className="form-control"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        {/* 주소 */}
        <div className="mb-3">
          <label className="form-label">주소</label>
          <input
            type="text"
            className="form-control"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>

        {/* 좌표 입력 */}
        <div className="mb-3">
          <label className="form-label">위도 (Latitude)</label>
          <input
            type="number"
            className="form-control"
            name="lat"
            value={formData.coordinates.lat}
            onChange={handleCoordinateChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">경도 (Longitude)</label>
          <input
            type="number"
            className="form-control"
            name="lng"
            value={formData.coordinates.lng}
            onChange={handleCoordinateChange}
            required
          />
        </div>

        {/* 카테고리 선택 */}
        <div className="mb-3">
          <label className="form-label">카테고리</label>
          <select
            className="form-control"
            name="category"
            value={formData.category}
            onChange={handleChange}>
            <option value="Hotel">호텔</option>
            <option value="Pension">펜션</option>
            <option value="Resort">리조트</option>
            <option value="Motel">모텔</option>
          </select>
        </div>

        {/* 편의시설 */}
        <div className="mb-3">
          <label className="form-label">편의시설</label>
          {formData.amenities.map((amenity, index) => (
            <div key={index}>
              <input
                type="text"
                value={amenity}
                onChange={e => handleAmenityChange(index, e.target.value)}
                className="form-control"
              />
              <button type="button" onClick={() => handleRemoveAmenity(index)}>
                삭제
              </button>
            </div>
          ))}
          <button type="button" onClick={handleAddAmenity}>
            + 추가
          </button>
        </div>

        {/* 숙소 이미지 업로드 */}
        <div className="mb-3">
          <label className="form-label">숙소 이미지</label>
          <input
            type="file"
            className="form-control"
            name="images"
            multiple
            onChange={handleFileChange}
          />
        </div>

        {/* 업로드한 이미지 미리보기 및 삭제 */}
        {previewImages.length > 0 && (
          <div className="image-preview">
            {previewImages.map((image, index) => (
              <div key={index} className="preview-container">
                <img src={image} alt={`preview-${index}`} className="preview-image" />
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteImage(image)}>
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
        {/* 객실 추가 버튼 */}
        <button
          type="button"
          className="btn btn-primary mt-2"
          onClick={() =>
            navigate(`/product/room/new?accommodationId=${accommodationId}`)
          }>
          + 객실 추가
        </button>

        {/* 방 정보 표시 */}
        <h3>객실 목록</h3>
        {availableRooms.length > 0 ? (
          availableRooms.map(room => <RoomCard key={room._id} room={room} />)
        ) : (
          <p>예약 가능한 객실이 없습니다.</p>
        )}

        <button type="submit" className="btn btn-primary">
          수정 완료
        </button>
        <button type="button" className="btn btn-secondary ms-2" onClick={handleCancel}>
          취소
        </button>
      </form>
    </div>
  );
};

export default AccommodationModify;
