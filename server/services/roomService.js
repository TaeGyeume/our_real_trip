const fs = require('fs');
const path = require('path');
const Room = require('../models/Room');
const Accommodation = require('../models/Accommodation');

// 객실 추가 함수 (이미지 업로드 지원)
exports.createRoom = async (roomData, imageFiles) => {
  try {
    const {accommodation, amenities} = roomData;

    // 숙소 존재 여부 확인
    const existingAccommodation = await Accommodation.findById(accommodation);
    if (!existingAccommodation) {
      throw new Error('숙소를 찾을 수 없습니다.');
    }

    // **amenities가 문자열이면 배열로 변환**
    let parsedAmenities = [];
    if (typeof amenities === 'string') {
      try {
        parsedAmenities = JSON.parse(amenities); // 문자열 → 배열 변환
      } catch (error) {
        throw new Error('amenities 필드는 JSON 형식의 배열이어야 합니다.');
      }
    } else if (Array.isArray(amenities)) {
      parsedAmenities = amenities; // 이미 배열이면 그대로 사용
    }

    // 이미지 파일이 있으면 저장
    let uploadedImages = [];
    if (imageFiles && imageFiles.length > 0) {
      uploadedImages = imageFiles.map(file => `/uploads/${file.filename}`);
    }

    // 객실 생성
    const newRoom = new Room({
      ...roomData,
      amenities: parsedAmenities, // 변환된 amenities 저장
      images: uploadedImages
    });

    await newRoom.save();

    // 숙소의 가격 범위 업데이트
    await exports.updateAccommodationPriceRange(accommodation);

    // 숙소에 객실 추가
    await Accommodation.findByIdAndUpdate(accommodation, {
      $push: {rooms: newRoom._id}
    });

    return newRoom;
  } catch (error) {
    throw new Error('객실 생성 중 오류 발생: ' + error.message);
  }
};

// 객실 업데이트 함수 (이미지 업로드 지원)
exports.updateRoom = async (roomId, updatedData, imageFiles) => {
  try {
    // 기존 객실 정보 가져오기
    const existingRoom = await Room.findById(roomId);
    if (!existingRoom) {
      throw new Error('객실을 찾을 수 없습니다.');
    }

    // amenities가 문자열이면 배열로 변환
    let parsedAmenities = [];
    if (typeof updatedData.amenities === 'string') {
      try {
        parsedAmenities = JSON.parse(updatedData.amenities); // 문자열 → 배열 변환
      } catch (error) {
        throw new Error('amenities 필드는 JSON 형식의 배열이어야 합니다.');
      }
    } else if (Array.isArray(updatedData.amenities)) {
      parsedAmenities = updatedData.amenities; // 이미 배열이면 그대로 사용
    }

    // 이미지 파일이 있을 경우 기존 이미지 유지하고 새 이미지 추가
    let updatedImages = existingRoom.images || [];
    if (imageFiles && imageFiles.length > 0) {
      const newImageUrls = imageFiles.map(file => `/uploads/${file.filename}`);
      updatedImages = [...updatedImages, ...newImageUrls];
    }

    // 객실 업데이트
    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      {...updatedData, amenities: parsedAmenities, images: updatedImages}, // amenities 및 이미지 추가
      {new: true, runValidators: true}
    );

    // 숙소의 minPrice, maxPrice 업데이트
    if (updatedRoom.pricePerNight !== existingRoom.pricePerNight) {
      await exports.updateAccommodationPriceRange(updatedRoom.accommodation);
    }

    return updatedRoom;
  } catch (error) {
    throw new Error('객실 업데이트 중 오류 발생: ' + error.message);
  }
};

// 객실 삭제 함수
exports.deleteRoom = async roomId => {
  try {
    // 1️⃣ 삭제할 객실 찾기
    const room = await Room.findById(roomId);
    if (!room) {
      throw new Error('객실을 찾을 수 없습니다.');
    }

    const accommodationId = room.accommodation;

    // 객실의 모든 이미지 삭제 (서버 파일 시스템에서 제거)
    if (room.images && room.images.length > 0) {
      room.images.forEach(imageUrl => {
        const absoluteFilePath = path.join(
          __dirname,
          '../uploads',
          imageUrl.replace('/uploads/', '')
        );

        if (fs.existsSync(absoluteFilePath)) {
          fs.unlink(absoluteFilePath, err => {
            if (err) {
              console.error(`이미지 삭제 오류 (${imageUrl}):`, err);
            } else {
              // console.log(`이미지 삭제 성공: ${absoluteFilePath}`);
            }
          });
        } else {
          console.warn(`삭제할 이미지 파일이 존재하지 않음: ${absoluteFilePath}`);
        }
      });
    }

    // 객실 삭제
    await Room.findByIdAndDelete(roomId);

    // 숙소에서 객실 ID 제거
    await Accommodation.findByIdAndUpdate(accommodationId, {
      $pull: {rooms: roomId}
    });

    // 숙소의 minPrice, maxPrice 업데이트
    await exports.updateAccommodationPriceRange(accommodationId);

    return {message: '객실 및 관련 이미지가 성공적으로 삭제되었습니다.'};
  } catch (error) {
    throw new Error('객실 삭제 중 오류 발생: ' + error.message);
  }
};

// 숙소의 minPrice, maxPrice 업데이트 함수
exports.updateAccommodationPriceRange = async accommodationId => {
  try {
    const rooms = await Room.find({accommodation: accommodationId});

    if (rooms.length > 0) {
      const minPrice = Math.min(...rooms.map(room => room.pricePerNight));
      const maxPrice = Math.max(...rooms.map(room => room.pricePerNight));

      await Accommodation.findByIdAndUpdate(accommodationId, {minPrice, maxPrice});
    } else {
      // 객실이 없다면 가격 초기화
      await Accommodation.findByIdAndUpdate(accommodationId, {minPrice: 0, maxPrice: 0});
    }
  } catch (error) {
    throw new Error('숙소 가격 업데이트 중 오류 발생: ' + error.message);
  }
};

exports.deleteImage = async (roomId, imageUrl) => {
  try {
    const baseUrl = 'http://localhost:5000';
    const relativeImagePath = imageUrl.replace(baseUrl, ''); // 절대 URL → 상대 경로 변환
    const absoluteFilePath = path.join(
      __dirname,
      '../uploads',
      relativeImagePath.replace('/uploads/', '')
    ); // 서버의 uploads 폴더 기준으로 경로 설정

    // 객실(Room) 찾기
    const room = await Room.findById(roomId);
    if (!room) {
      return {status: 404, message: '객실을 찾을 수 없습니다.'};
    }

    // 이미지가 객실에 등록되어 있는지 확인
    if (!room.images.includes(relativeImagePath)) {
      return {status: 404, message: '해당 이미지는 객실에 등록되어 있지 않습니다.'};
    }

    // DB에서 이미지 제거
    room.images = room.images.filter(img => img !== relativeImagePath);
    await room.save();

    // 서버에서 실제 이미지 파일 삭제
    if (fs.existsSync(absoluteFilePath)) {
      fs.unlink(absoluteFilePath, err => {
        if (err) {
          console.error('이미지 파일 삭제 오류:', err);
        } else {
          // console.log('이미지 파일 삭제 성공:', absoluteFilePath);
        }
      });
    } else {
      console.warn('삭제할 이미지 파일이 존재하지 않음:', absoluteFilePath);
    }

    return {status: 200, message: '이미지가 삭제되었습니다.', images: room.images};
  } catch (error) {
    console.error('이미지 삭제 오류:', error);
    return {status: 500, message: '이미지 삭제 중 오류 발생'};
  }
};

exports.getRoomById = async roomId => {
  try {
    const room = await Room.findById(roomId);
    if (!room) {
      throw new Error('객실을 찾을 수 없습니다.');
    }
    return room;
  } catch (error) {
    throw new Error('객실 조회 중 오류 발생: ' + error.message);
  }
};

// 개별 이미지 삭제 서비스
exports.deleteImage = async (roomId, imageUrl) => {
  try {
    // console.log('삭제할 이미지:', imageUrl);

    if (!imageUrl) {
      return {status: 400, message: '삭제할 이미지 URL이 제공되지 않았습니다.'};
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return {status: 404, message: '객실을 찾을 수 없습니다.'};
    }

    if (!room.images.includes(imageUrl)) {
      return {status: 404, message: '해당 이미지는 객실에 등록되어 있지 않습니다.'};
    }

    // DB에서 이미지 제거
    room.images = room.images.filter(img => img !== imageUrl);
    await room.save();

    // 서버에서 실제 이미지 파일 삭제
    const absoluteFilePath = path.join(
      __dirname,
      '../uploads',
      imageUrl.replace('/uploads/', '')
    );
    // console.log('삭제할 파일 경로:', absoluteFilePath);

    if (fs.existsSync(absoluteFilePath)) {
      fs.unlink(absoluteFilePath, err => {
        if (err) console.error('이미지 삭제 오류:', err);
      });
    }

    return {status: 200, message: '이미지가 삭제되었습니다.', images: room.images};
  } catch (error) {
    console.error('이미지 삭제 오류:', error);
    return {status: 500, message: '서버 오류로 인해 이미지 삭제 실패'};
  }
};

// 특정 날짜의 예약 가능한 객실 개수 조회
exports.getAvailableRoomsByDate = async (roomId, date) => {
  try {
    const room = await Room.findById(roomId);
    if (!room) throw new Error('객실을 찾을 수 없습니다.');

    // 해당 날짜의 예약 정보를 가져옴
    const reservedDate = room.reservedDates.find(
      d => d.date.toISOString().split('T')[0] === date
    );

    // 예약된 객실 개수 계산
    const reservedCount = reservedDate ? reservedDate.count : 0;

    // 남은 객실 개수 반환
    return {availableRooms: room.availableCount - reservedCount};
  } catch (error) {
    throw new Error(error.message);
  }
};
