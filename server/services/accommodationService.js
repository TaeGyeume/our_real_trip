// const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Accommodation = require('../models/Accommodation');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Location = require('../models/Location');

// 숙소 생성 함수
exports.createAccommodation = async accommodationData => {
  try {
    const newAccommodation = new Accommodation(accommodationData);
    await newAccommodation.save();
    return newAccommodation;
  } catch (error) {
    throw new Error('숙소 생성 중 오류 발생: ' + error.message);
  }
};

// 실시간 자동완성 검색 함수
exports.autocompleteSearch = async query => {
  try {
    if (!query) return {locations: [], accommodations: []};

    // 공백 제거 및 정규식 변환 (띄어쓰기 무시)
    const normalizedQuery = query.replace(/\s+/g, ''); // 모든 공백 제거
    const regex = new RegExp(normalizedQuery.split('').join('.*'), 'i'); // 띄어쓰기 없는 검색

    // **도시(Location) 검색 (`text index` & `regex`)**
    let locations = await Location.find(
      {$text: {$search: query}}, // MongoDB Full-Text Search
      {score: {$meta: 'textScore'}} // 검색 관련성 점수 추가
    )
      .sort({score: {$meta: 'textScore'}}) // 관련성 높은 순 정렬
      .limit(10);

    // `text index` 결과가 없으면 정규식 검색으로 대체
    let regexLocations = await Location.find({name: {$regex: regex}}).limit(10);

    // 두 검색 결과를 합치고 중복 제거
    locations = [...locations, ...regexLocations].filter(
      (v, i, a) => a.findIndex(t => t._id.toString() === v._id.toString()) === i
    );

    // **숙소(Accommodation) 검색 (`text index` & `regex`)**
    let accommodations = await Accommodation.find(
      {$text: {$search: query}}, // Full-Text Search 적용
      {score: {$meta: 'textScore'}}
    )
      .sort({score: {$meta: 'textScore'}}) // 검색 관련성 순 정렬
      .limit(10);

    // `text index` 결과가 없으면 정규식 검색으로 대체
    let regexAccommodations = await Accommodation.find({name: {$regex: regex}})
      .select('name coordinates description images')
      .populate('location', 'name country')
      .limit(10);

    // 두 검색 결과를 합치고 중복 제거
    accommodations = [...accommodations, ...regexAccommodations].filter(
      (v, i, a) => a.findIndex(t => t._id.toString() === v._id.toString()) === i
    );

    return {locations, accommodations};
  } catch (error) {
    throw new Error('자동완성 검색 중 오류 발생: ' + error.message);
  }
};

// 숙소 검색 함수 (무한 스크롤 + 정렬 기능 수정)
exports.getAccommodationsBySearch = async ({
  city,
  startDate,
  endDate,
  adults,
  minPrice = 0,
  maxPrice = 500000,
  category = 'all',
  sortBy = 'default',
  page = 1,
  limit = 10
}) => {
  try {
    const checkInDate = new Date(startDate);
    const checkOutDate = new Date(endDate);

    // **검색어 전처리 (띄어쓰기 제거 및 정규식 변환)**
    const normalizedCity = city.replace(/\s+/g, '');
    const regexCity = new RegExp(normalizedCity.split('').join('.*'), 'i');

    // *도시 검색 (`text index` & `regex`)**
    let locations = await Location.find(
      {$text: {$search: city}},
      {score: {$meta: 'textScore'}}
    )
      .sort({score: {$meta: 'textScore'}})
      .limit(10);

    let regexLocations = await Location.find({name: {$regex: regexCity}}).limit(10);
    locations = [...locations, ...regexLocations].filter(
      (v, i, a) => a.findIndex(t => t._id.toString() === v._id.toString()) === i
    );

    const locationIds = locations.map(loc => loc._id);

    // **예약된 방 ID 조회**
    const bookedRooms = await Booking.find({
      type: 'accommodation',
      $or: [{startDate: {$lt: checkOutDate}, endDate: {$gt: checkInDate}}]
    }).distinct('roomId');

    // **가격 필터 설정**
    const priceFilter =
      maxPrice >= 500000 ? {$gte: minPrice} : {$gte: minPrice, $lte: maxPrice};

    // **예약된 객실을 제외하고 사용 가능한 숙소 필터링**
    let availableRooms = await Room.find({
      maxGuests: {$gte: adults},
      _id: {$nin: bookedRooms}, // 예약된 객실 제외
      pricePerNight: priceFilter, // 가격 필터 적용
      availableCount: {$gt: 0} // 예약 가능한 객실만 포함
    }).select('_id accommodation maxGuests pricePerNight availableCount reservedDates');

    // 예약된 객실 제거 후 다시 필터링
    availableRooms = availableRooms.filter(room => {
      let currentDate = new Date(startDate);
      while (currentDate < new Date(endDate)) {
        const dateStr = currentDate.toISOString().split('T')[0];

        // 예약된 날짜 목록에서 현재 날짜가 포함되어 있는지 확인
        const reservedDates = room.reservedDates || [];
        const reservedCountOnDate =
          reservedDates.find(d => d.date.toISOString().split('T')[0] === dateStr)
            ?.count || 0;

        // 예약 가능 객실이 없으면 제외
        if (reservedCountOnDate >= room.availableCount) return false;

        currentDate.setDate(currentDate.getDate() + 1);
      }
      return true;
    });

    const availableAccommodationIds = [
      ...new Set(availableRooms.map(room => room.accommodation.toString()))
    ];

    // **총 개수 계산 (무한 스크롤)**
    const totalCount = await Accommodation.countDocuments({
      $or: [{location: {$in: locationIds}}, {name: {$regex: regexCity}}],
      _id: {$in: availableAccommodationIds},
      ...(category !== 'all' ? {category} : {})
    });

    // **숙소 검색 (`text index` & `regex`)**
    let accommodations = await Accommodation.find({
      $or: [{location: {$in: locationIds}}, {name: {$regex: regexCity}}],
      _id: {$in: availableAccommodationIds},
      ...(category !== 'all' ? {category} : {})
    }).lean(); // `lean()`을 사용하여 JSON 데이터로 변환

    // **예약 가능한 객실만 기준으로 `minPrice` 설정**
    accommodations = accommodations.map(accommodation => {
      // 해당 숙소의 예약 가능한 객실만 필터링
      const filteredRooms = availableRooms.filter(
        room => room.accommodation.toString() === accommodation._id.toString()
      );

      // 숙소의 `minPrice`를 실제 예약 가능한 객실의 최저 가격으로 설정
      accommodation.minPrice = filteredRooms.length
        ? Math.min(...filteredRooms.map(r => r.pricePerNight))
        : null; // 예약 가능한 객실이 없으면 `null` 처리

      return accommodation;
    });

    // **예약 가능한 객실이 있는 숙소만 남기기**
    accommodations = accommodations.filter(
      accommodation => accommodation.minPrice !== null
    );

    // **정렬 적용 (가격 / 평점 / 기본 관련성)**
    if (sortBy === 'priceLow') {
      accommodations.sort((a, b) => a.minPrice - b.minPrice);
    } else if (sortBy === 'priceHigh') {
      accommodations.sort((a, b) => b.minPrice - a.minPrice);
    } else if (sortBy === 'rating') {
      accommodations.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'default') {
      accommodations.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        const cityLower = city.toLowerCase();

        // 검색어와 완전히 일치하는 경우 우선
        if (nameA === cityLower) return -1;
        if (nameB === cityLower) return 1;

        // 검색어가 포함된 경우 (앞쪽에 위치할수록 더 높은 순위)
        const indexA = nameA.indexOf(cityLower);
        const indexB = nameB.indexOf(cityLower);
        if (indexA !== -1 && indexB === -1) return -1;
        if (indexB !== -1 && indexA === -1) return 1;
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;

        // 기존 `score` (text index 점수) 기준 정렬
        return (b.score || 0) - (a.score || 0);
      });
    }

    // **페이징 처리**
    const paginatedAccommodations = accommodations.slice(
      (page - 1) * limit,
      page * limit
    );

    return {
      accommodations: paginatedAccommodations,
      totalPages: Math.ceil(totalCount / limit)
    };
  } catch (error) {
    console.error('숙소 검색 중 오류 발생:', error);
    throw new Error('숙소 검색 중 오류 발생: ' + error.message);
  }
};

// 특정 숙소의 검색 조건에 맞는 방 조회
exports.getAvailableRoomsByAccommodation = async ({
  accommodationId,
  startDate,
  endDate,
  adults,
  minPrice = 0, // 기본값: 0원
  maxPrice = 500000 // 기본값: 50만 원 이상
}) => {
  try {
    // **해당 숙소(Accommodation) 존재 여부 확인**
    const accommodation = await Accommodation.findById(accommodationId)
      .populate('location') // location 필드의 실제 데이터 가져오기
      .exec();
    if (!accommodation) {
      throw new Error('해당 숙소를 찾을 수 없습니다.');
    }

    const updatedViews = await exports.incrementViews(accommodationId);

    // **검색 조건이 없을 경우 모든 객실 반환**
    if (!startDate || !endDate || !adults) {
      console.log('검색 조건이 없으므로 모든 객실 반환');
      const allRooms = await Room.find({accommodation: accommodationId}).select(
        'name pricePerNight images maxGuests amenities availableCount reservedDates checkInTime checkOutTime'
      );
      return {accommodation, availableRooms: allRooms};
    }

    const checkInDate = new Date(startDate);
    const checkOutDate = new Date(endDate);

    // **예약된 방 조회 (해당 날짜 범위에서 예약된 방 제외)**
    const bookedRooms = await Booking.find({
      accommodation: accommodationId,
      $or: [{startDate: {$lt: checkOutDate}, endDate: {$gt: checkInDate}}]
    }).distinct('roomId');

    // **검색 조건에 맞는 객실 조회**
    const priceFilter =
      maxPrice >= 500000 ? {$gte: minPrice} : {$gte: minPrice, $lte: maxPrice};

    let availableRooms = await Room.find({
      accommodation: accommodationId, // 특정 숙소 ID 필터
      maxGuests: {$gte: adults}, // 최소 인원 조건 충족
      _id: {$nin: bookedRooms}, // 예약된 방 제외
      pricePerNight: priceFilter // 가격 필터 적용
    }).select(
      'name pricePerNight images maxGuests amenities availableCount reservedDates checkInTime checkOutTime'
    );

    // 특정 날짜에 예약이 꽉 찬 객실 제외
    availableRooms = availableRooms.filter(room => {
      let currentDate = new Date(startDate);

      while (currentDate < new Date(endDate)) {
        const dateStr = currentDate.toISOString().split('T')[0];

        // `reservedDates`가 없는 경우 빈 배열로 설정
        const reservedDates = room.reservedDates || [];

        // 해당 날짜의 예약 개수 확인
        const reservedCountOnDate =
          reservedDates.find(d => d.date.toISOString().split('T')[0] === dateStr)
            ?.count || 0;
        // 가용 객실 개수보다 예약 개수가 많으면 제외
        if (reservedCountOnDate >= room.availableCount) return false;
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return true;
    });

    return {
      accommodation: {...accommodation.toObject(), views: updatedViews}, // 업데이트된 조회수 포함
      availableRooms
    };
  } catch (error) {
    console.error('특정 숙소의 객실 검색 중 오류 발생:', error);
    throw new Error('객실 검색 중 오류 발생: ' + error.message);
  }
};

// 숙소 업데이트 함수
exports.updateAccommodation = async (accommodationId, updateData, imageFiles) => {
  try {
    // 숙소 존재 여부 확인
    const existingAccommodation = await Accommodation.findById(accommodationId);
    if (!existingAccommodation) {
      throw new Error('숙소를 찾을 수 없습니다.');
    }

    // 기존 이미지 유지 (삭제되지 않은 이미지만 유지)
    let updatedImages = existingAccommodation.images;

    if (updateData.existingImages) {
      updatedImages = JSON.parse(updateData.existingImages);
    }

    // 새 이미지가 업로드되었을 경우 기존 이미지 리스트에 추가
    if (imageFiles && imageFiles.length > 0) {
      const newImageUrls = imageFiles.map(file => `/uploads/${file.filename}`);
      updatedImages = [...updatedImages, ...newImageUrls];
    }

    // 좌표 데이터 변환 (JSON 문자열 -> 객체)
    if (updateData.coordinates) {
      updateData.coordinates = JSON.parse(updateData.coordinates);
    }

    if (typeof updateData.amenities === 'string') {
      updateData.amenities = JSON.parse(updateData.amenities);
    }

    // 업데이트 데이터에 반영
    updateData.images = updatedImages;

    // 숙소 업데이트 실행
    const updatedAccommodation = await Accommodation.findByIdAndUpdate(
      accommodationId,
      updateData,
      {new: true}
    );

    return updatedAccommodation;
  } catch (error) {
    throw new Error('숙소 업데이트 중 오류 발생: ' + error.message);
  }
};

// 숙소 삭제 함수
exports.deleteAccommodation = async accommodationId => {
  try {
    // 1️⃣ 숙소 존재 여부 확인
    const existingAccommodation = await Accommodation.findById(accommodationId);
    if (!existingAccommodation) {
      throw new Error('숙소를 찾을 수 없습니다.');
    }

    console.log(`숙소 삭제 시작: ${accommodationId}`);

    // 해당 숙소에 속한 모든 객실(Room) 찾기
    const rooms = await Room.find({accommodation: accommodationId});

    // 객실의 모든 이미지 삭제
    rooms.forEach(room => {
      if (room.images && room.images.length > 0) {
        room.images.forEach(imageUrl => {
          const absoluteFilePath = path.join(
            __dirname,
            '../uploads',
            imageUrl.replace('/uploads/', '')
          );

          if (fs.existsSync(absoluteFilePath)) {
            fs.unlinkSync(absoluteFilePath); // 동기 방식으로 삭제
            console.log(`객실 이미지 삭제 성공: ${absoluteFilePath}`);
          } else {
            console.warn(`객실 이미지 파일이 존재하지 않음: ${absoluteFilePath}`);
          }
        });
      }
    });

    // 숙소의 모든 이미지 삭제
    if (existingAccommodation.images && existingAccommodation.images.length > 0) {
      existingAccommodation.images.forEach(imageUrl => {
        const absoluteFilePath = path.join(
          __dirname,
          '../uploads',
          imageUrl.replace('/uploads/', '')
        );

        if (fs.existsSync(absoluteFilePath)) {
          fs.unlinkSync(absoluteFilePath); // 동기 방식으로 삭제
          console.log(`숙소 이미지 삭제 성공: ${absoluteFilePath}`);
        } else {
          console.warn(`숙소 이미지 파일이 존재하지 않음: ${absoluteFilePath}`);
        }
      });
    }

    // 해당 숙소에 속한 모든 객실 삭제
    await Room.deleteMany({accommodation: accommodationId});

    // 숙소 삭제
    await Accommodation.findByIdAndDelete(accommodationId);

    console.log(`숙소 및 관련 데이터 삭제 완료: ${accommodationId}`);

    return {message: '숙소 및 해당 숙소의 모든 객실과 이미지가 삭제되었습니다.'};
  } catch (error) {
    console.error('숙소 삭제 중 오류 발생:', error);
    throw new Error('숙소 삭제 중 오류 발생: ' + error.message);
  }
};

exports.getAllAccommodations = async (page = 1, limit = 6) => {
  try {
    const skip = (page - 1) * limit; // 스킵할 데이터 개수

    const accommodations = await Accommodation.find()
      .populate('rooms') // 숙소와 관련된 방 정보 가져오기
      .skip(skip) // 이전 페이지 데이터 건너뛰기
      .limit(parseInt(limit)); // 특정 개수만큼 가져오기

    const totalCount = await Accommodation.countDocuments(); // 전체 숙소 개수

    return {
      accommodations,
      totalPages: Math.ceil(totalCount / limit), // 총 페이지 수 계산
      currentPage: parseInt(page)
    };
  } catch (error) {
    throw new Error('숙소 목록을 불러오는 중 오류 발생: ' + error.message);
  }
};

// 숙소 이름으로 검색 함수 (중복 제거 및 페이지네이션 적용)
exports.getAccommodationsByName = async (name, page = 1, limit = 6) => {
  try {
    if (!name) {
      throw new Error('검색할 숙소 이름을 입력해주세요.');
    }

    // 정규식 기반 검색 (띄어쓰기 무시)
    const normalizedName = name.replace(/\s+/g, '');
    const regexName = new RegExp(normalizedName.split('').join('.*'), 'i');

    // 페이지네이션을 위한 계산
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // **먼저 `$text` 검색 수행** (최대 `limit` 개수만 가져옴)
    let textSearchResults = await Accommodation.find(
      {$text: {$search: name}},
      {score: {$meta: 'textScore'}}
    )
      .sort({score: {$meta: 'textScore'}, createdAt: -1}) // `textScore` 정렬 후 `createdAt` 기준 정렬
      .skip(skip)
      .limit(parseInt(limit));

    // `$text` 검색에서 충분한 개수가 나오면 `$regex` 검색을 실행하지 않음
    if (textSearchResults.length >= limit) {
      return {
        accommodations: textSearchResults,
        totalPages: Math.ceil(
          (await Accommodation.countDocuments({$text: {$search: name}})) / limit
        ),
        currentPage: parseInt(page)
      };
    }

    let remainingLimit = limit - textSearchResults.length;

    // **부족한 경우 `$regex` 검색 추가 수행** (`remainingLimit` 만큼만 가져오기)
    let regexSearchResults = await Accommodation.find({
      name: {$regex: regexName}
    })
      .sort({createdAt: -1}) // `createdAt` 기준 정렬
      .skip(skip)
      .limit(remainingLimit);

    // **중복 제거 후 최종 리스트 생성**
    const uniqueAccommodations = new Map();
    [...textSearchResults, ...regexSearchResults].forEach(acc =>
      uniqueAccommodations.set(acc._id.toString(), acc)
    );

    // 전체 개수 조회 (총 페이지 수 계산에 사용)
    const totalCount = await Accommodation.countDocuments({
      name: {$regex: regexName}
    });

    return {
      accommodations: Array.from(uniqueAccommodations.values()),
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page)
    };
  } catch (error) {
    console.error('숙소 이름 검색 중 오류 발생:', error);
    throw new Error('숙소 이름 검색 중 오류 발생: ' + error.message);
  }
};

exports.getAccommodationById = async accommodationId => {
  if (!accommodationId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new Error('잘못된 숙소 ID 형식입니다.');
  }

  const accommodation = await Accommodation.findById(accommodationId)
    .populate('location') // location 필드의 실제 데이터를 함께 가져옴
    .exec();

  if (!accommodation) {
    throw new Error('숙소를 찾을 수 없습니다.');
  }

  return accommodation;
};

// 숙소 조회수 증가 서비스
exports.incrementViews = async accommodationId => {
  try {
    const updatedAccommodation = await Accommodation.findByIdAndUpdate(
      accommodationId,
      {$inc: {views: 1}}, // 조회수 증가
      {new: true}
    );
    return updatedAccommodation.views; // 증가된 조회수 반환
  } catch (error) {
    console.error('숙소 조회수 증가 오류:', error);
    throw new Error('조회수 증가 중 오류 발생');
  }
};

// 조회수 순으로 가져오기
exports.getPopularAccommodations = async () => {
  try {
    const accommodations = await Accommodation.find()
      .sort({views: -1}) // 조회수 내림차순 정렬
      .limit(10) // 인기 숙소 10개만 가져옴
      .lean();

    return accommodations;
  } catch (error) {
    throw new Error('인기 숙소 조회 중 오류 발생: ' + error.message);
  }
};

exports.deleteImage = async (accommodationId, imageUrl) => {
  try {
    const baseUrl = 'http://localhost:5000';
    const relativeImagePath = imageUrl.replace(baseUrl, ''); // 절대 URL → 상대 경로 변환
    const absoluteFilePath = path.join(
      __dirname,
      '../uploads',
      relativeImagePath.replace('/uploads/', '')
    ); // `server/uploads`에 맞춰 경로 수정

    // 숙소 찾기
    const accommodation = await Accommodation.findById(accommodationId);
    if (!accommodation) {
      return {status: 404, message: '숙소를 찾을 수 없습니다.'};
    }

    // 이미지 존재 여부 확인
    if (!accommodation.images.includes(relativeImagePath)) {
      return {status: 404, message: '해당 이미지는 숙소에 등록되어 있지 않습니다.'};
    }

    // DB에서 이미지 제거
    accommodation.images = accommodation.images.filter(img => img !== relativeImagePath);
    await accommodation.save();

    // 서버에서 실제 이미지 파일 삭제
    if (fs.existsSync(absoluteFilePath)) {
      fs.unlink(absoluteFilePath, err => {
        if (err) {
          console.error('이미지 파일 삭제 오류:', err);
        } else {
          console.log('이미지 파일 삭제 성공:', absoluteFilePath);
        }
      });
    } else {
      console.warn('삭제할 이미지 파일이 존재하지 않음:', absoluteFilePath);
    }

    return {
      status: 200,
      message: '이미지가 삭제되었습니다.',
      images: accommodation.images
    };
  } catch (error) {
    console.error('이미지 삭제 오류:', error);
    return {status: 500, message: '이미지 삭제 중 오류 발생'};
  }
};

// 특정 좌표 기준으로 반경 내 숙소 리스트 조회
exports.getNearbyAccommodations = async (lat, lng, maxDistance = 5000, limit = 10) => {
  try {
    if (!lat || !lng) {
      throw new Error('위도(lat)와 경도(lng)를 입력하세요.');
    }

    const accommodations = await Accommodation.find({
      coordinates: {
        $near: {
          $geometry: {type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)]},
          $maxDistance: parseInt(maxDistance) // 기본 반경 5km
        }
      }
    }).limit(parseInt(limit));

    return accommodations;
  } catch (error) {
    throw new Error(`주변 숙소 조회 실패: ${error.message}`);
  }
};
