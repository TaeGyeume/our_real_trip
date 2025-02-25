import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import axios from '../../../api/axios';

const RoomModify = () => {
  const {roomId} = useParams();
  const navigate = useNavigate();
  const SERVER_URL = 'http://localhost:5000';

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricePerNight: '',
    maxGuests: '',
    amenities: [],
    available: true,
    availableCount: '',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    images: [],
    accommodationId: ''
  });

  const [previewImages, setPreviewImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 기존 객실 정보 불러오기
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await axios.get(`/rooms/${roomId}`);
        const data = response.data;

        setFormData({
          ...data,
          amenities: data.amenities || [],
          images: data.images || []
        });

        setPreviewImages(
          data.images.map(img =>
            img.startsWith('/uploads/') ? `${SERVER_URL}${img}` : img
          )
        );

        setLoading(false);
      } catch (err) {
        console.error('객실 정보 불러오기 오류:', err);
        setError('객실 정보를 불러오는 중 오류 발생');
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  // 입력값 변경 핸들러
  const handleChange = e => {
    const {name, value} = e.target;
    setFormData({...formData, [name]: value});
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

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await axios.get(`/rooms/${roomId}`);
        const data = response.data;

        console.log('객실 데이터:', data); // 디버깅용 로그 추가

        setFormData({
          ...data,
          amenities: data.amenities || [],
          checkInTime: data.checkInTime || '15:00',
          checkOutTime: data.checkOutTime || '11:00',
          images: data.images || [],
          accommodationId: data.accommodation || '' // 숙소 ID 저장 (수정)
        });

        setPreviewImages(
          data.images.map(img =>
            img.startsWith('/uploads/') ? `${SERVER_URL}${img}` : img
          )
        );

        console.log('숙소 ID 저장됨:', data.accommodation); // 디버깅용
        setLoading(false);
      } catch (err) {
        console.error('객실 정보 불러오기 오류:', err);
        setError('객실 정보를 불러오는 중 오류 발생');
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

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

  // 이미지 삭제 핸들러 (UI & 데이터에서 정확히 삭제)
  const handleDeleteImage = imageUrl => {
    console.log('삭제할 이미지:', imageUrl);

    if (imageUrl.startsWith('blob:')) {
      setNewImages(prev => {
        return prev.filter(img => {
          if (img.preview === imageUrl) {
            return false; // 정확히 제거
          }
          return true;
        });
      });
    } else {
      const fullImagePath = imageUrl.startsWith('http')
        ? imageUrl
        : `${SERVER_URL}${imageUrl}`;

      setImagesToDelete(prev => [...prev, fullImagePath]);

      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(img => img !== fullImagePath.replace(SERVER_URL, ''))
      }));
    }

    setPreviewImages(prev => prev.filter(img => img !== imageUrl));
  };

  // blob: URL에 해당하는 File.name 찾기 함수
  // const findFileNameByBlob = (file, blobUrl) => {
  //   const tempUrl = URL.createObjectURL(file);
  //   return tempUrl === blobUrl ? file.name : null;
  // };

  // 기존 이미지 삭제된 경우 newImages에서도 제거
  useEffect(() => {
    setNewImages(prev =>
      prev.filter(img => {
        return !imagesToDelete.some(deletedImg => deletedImg === img.preview);
      })
    );
  }, [imagesToDelete]);

  // 수정 요청 핸들러 (FormData로 업로드)
  const handleSubmit = async e => {
    e.preventDefault();

    console.log('최종 삭제할 이미지 목록 전송:', imagesToDelete);

    try {
      const formattedDeletedImages = imagesToDelete
        .filter(img => !img.startsWith('blob:'))
        .map(img => (img.startsWith(SERVER_URL) ? img.replace(SERVER_URL, '') : img));

      console.log('DELETE 요청 전송 (삭제할 이미지):', formattedDeletedImages);

      if (formattedDeletedImages.length > 0) {
        await axios.post(
          `/rooms/${roomId}/images/delete`,
          {deletedImages: formattedDeletedImages},
          {headers: {'Content-Type': 'application/json'}}
        );
        console.log('이미지 삭제 완료!');
      }

      const updatedRoomData = new FormData();
      updatedRoomData.append('name', formData.name);
      updatedRoomData.append('description', formData.description);
      updatedRoomData.append('pricePerNight', formData.pricePerNight);
      updatedRoomData.append('maxGuests', formData.maxGuests);
      updatedRoomData.append('available', formData.available);
      updatedRoomData.append('availableCount', formData.availableCount);
      updatedRoomData.append('checkInTime', formData.checkInTime);
      updatedRoomData.append('checkOutTime', formData.checkOutTime);
      updatedRoomData.append('amenities', JSON.stringify(formData.amenities));

      const remainingImages = formData.images
        .filter(img => !imagesToDelete.includes(`${SERVER_URL}${img}`))
        .map(img => img.replace(SERVER_URL, ''));

      updatedRoomData.append('existingImages', JSON.stringify(remainingImages));

      // `newImages`에서 삭제된 이미지를 제외하고 남은 이미지만 추가
      const finalNewImages = newImages
        .filter(img => !imagesToDelete.includes(img.preview)) // `preview` 값 기준으로 삭제 여부 확인
        .map(img => img.file); // `File` 객체만 추출

      console.log('최종 업로드할 새로운 이미지:', finalNewImages);

      if (finalNewImages.length > 0) {
        finalNewImages.forEach(image => {
          updatedRoomData.append('images', image);
        });
      } else {
        console.log('업로드할 새 이미지 없음!');
      }

      console.log('PATCH 요청 전송 (객실 수정)');
      await axios.patch(`/rooms/${roomId}`, updatedRoomData, {
        headers: {'Content-Type': 'multipart/form-data'}
      });

      alert('객실 정보가 수정되었습니다.');

      navigate(`/product/accommodations/modify/${formData.accommodationId}`);
    } catch (err) {
      console.error('객실 수정 오류:', err);
      alert('객실 수정에 실패했습니다.');
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
    navigate(-1);
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container mt-4">
      <h2>객실 수정</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">객실명</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

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

        <div className="mb-3">
          <label className="form-label">가격</label>
          <input
            type="number"
            className="form-control"
            name="pricePerNight"
            value={formData.pricePerNight}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">최대 인원</label>
          <input
            type="number"
            className="form-control"
            name="maxGuests"
            value={formData.maxGuests}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">방 개수</label>
          <input
            type="number"
            className="form-control"
            name="availableCount"
            value={formData.availableCount}
            onChange={handleChange}
            required
          />
        </div>

        {/* 편의시설 입력 UI 추가 */}
        <div className="mb-3">
          <label className="form-label">편의시설</label>
          {formData.amenities.map((amenity, index) => (
            <div key={index} className="d-flex">
              <input
                type="text"
                className="form-control me-2"
                value={amenity}
                onChange={e => handleAmenityChange(index, e.target.value)}
              />
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleRemoveAmenity(index)}>
                삭제
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-secondary mt-2"
            onClick={handleAddAmenity}>
            + 추가
          </button>
        </div>

        <div className="mb-3">
          <label className="form-label">체크인 시간</label>
          <input
            type="time"
            className="form-control"
            name="checkInTime"
            value={formData.checkInTime}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">체크아웃 시간</label>
          <input
            type="time"
            className="form-control"
            name="checkOutTime"
            value={formData.checkOutTime}
            onChange={handleChange}
            required
          />
        </div>

        {/* 숙소 이미지 업로드 */}
        <div className="mb-3">
          <label className="form-label">객실 이미지</label>
          <input
            type="file"
            className="form-control"
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

        <button type="submit" className="btn btn-primary">
          객실 수정 완료
        </button>
        <button type="button" className="btn btn-secondary ms-2" onClick={handleCancel}>
          취소
        </button>
      </form>
    </div>
  );
};

export default RoomModify;
