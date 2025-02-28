const mongoose = require('mongoose');
const Package = require('../models/Package');
const Flight = require('../models/Flight');
const Accommodation = require('../models/Accommodation');
const TourTicket = require('../models/TourTicket');
const Room = require('../models/Room');

/**
 *  패키지 상품 생성
 */
async function createPackage(packageData) {
  console.log(' [DEBUG] 받은 packageData:', packageData);

  const {
    name,
    description,
    discountRate,
    startDate,
    endDate,
    accommodations,
    tours,
    flights,
    roomIds, // 객실 ID 배열 (문자열 배열)
    startDates, // 객실 예약 시작일 배열 (문자열)
    endDates, // 객실 예약 종료일 배열 (문자열)
    category,
    createdBy
  } = packageData;

  // 필수 필드 검증
  if (
    !name ||
    !description ||
    !category ||
    !createdBy ||
    !accommodations ||
    !tours ||
    !flights
  ) {
    throw new Error('필수 필드가 누락되었습니다.');
  }

  console.log('🔍 [DEBUG] 필수 필드 검증 완료');

  let totalPrice = 0;

  // 숙소 가격 계산 및 존재 여부 검증
  if (Array.isArray(accommodations) && accommodations.length > 0) {
    console.log('🔍 [DEBUG] 숙소 ID 목록:', accommodations);
    const accommodationData = await Accommodation.find({_id: {$in: accommodations}});
    console.log('🔍 [DEBUG] 숙소 조회 결과:', accommodationData);
    if (!accommodationData || accommodationData.length !== accommodations.length) {
      throw new Error('숙소 정보를 찾을 수 없습니다.');
    }
    console.log('✅ [DEBUG] 숙소 기본 정보 검증 완료');
  }

  // 투어 가격 계산
  if (Array.isArray(tours) && tours.length > 0) {
    const tourData = await TourTicket.find({_id: {$in: tours}});
    if (!tourData || tourData.length !== tours.length) {
      throw new Error('투어 정보를 찾을 수 없습니다.');
    }
    totalPrice += tourData.reduce((sum, tour) => sum + (tour.price || 0), 0);
    console.log('✅ [DEBUG] 투어 가격 합산 완료:', totalPrice);
  }

  // 항공 가격 계산
  console.log('🔍 [DEBUG] flights before conversion:', flights);
  if (!Array.isArray(flights) || flights.length === 0) {
    throw new Error('항공 정보가 올바르지 않습니다.');
  }
  const flightDetails = flights.map(flight => {
    if (!flight.flightId || !flight.seatsToUse) {
      throw new Error(`항공 정보가 올바르지 않습니다: ${JSON.stringify(flight)}`);
    }
    return {
      flightId: new mongoose.Types.ObjectId(flight.flightId),
      seatsToUse: flight.seatsToUse
    };
  });
  console.log('🔍 [DEBUG] flights after conversion:', flightDetails);
  for (const flight of flightDetails) {
    const flightData = await Flight.findById(flight.flightId);
    if (!flightData) throw new Error(`항공 정보를 찾을 수 없습니다: ${flight.flightId}`);
    if (flight.seatsToUse > flightData.seatsAvailable) {
      throw new Error('좌석 수가 부족합니다.');
    }
    totalPrice += flightData.price * flight.seatsToUse;
    console.log('✅ [DEBUG] 항공 가격 합산 완료:', totalPrice);
  }

  // ▶︎ **룸(객실) 가격 계산 추가**
  // roomIds, startDates, endDates를 배열로 받아 ObjectId, Date로 변환하고, 각 객실의 pricePerNight와 예약 기간(일수)을 곱해서 합산
  const roomIdArray = Array.isArray(roomIds)
    ? roomIds.map(r => new mongoose.Types.ObjectId(r))
    : [];
  const startDatesArray = Array.isArray(startDates)
    ? startDates.map(s => new Date(s))
    : [];
  const endDatesArray = Array.isArray(endDates) ? endDates.map(e => new Date(e)) : [];
  console.log('🔍 [DEBUG] roomIds:', roomIdArray);
  console.log('🔍 [DEBUG] startDates:', startDatesArray);
  console.log('🔍 [DEBUG] endDates:', endDatesArray);

  if (roomIdArray.length > 0) {
    const roomData = await Room.find({_id: {$in: roomIdArray}});
    if (!roomData || roomData.length !== roomIdArray.length) {
      throw new Error('객실 정보를 찾을 수 없습니다.');
    }
    for (let i = 0; i < roomData.length; i++) {
      const room = roomData[i];
      const start = startDatesArray[i];
      const end = endDatesArray[i];
      if (!start || !end) {
        throw new Error('객실 예약 날짜가 누락되었습니다.');
      }
      const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      totalPrice += room.pricePerNight * nights;
      console.log(
        `✅ [DEBUG] 객실 (${room._id}) 가격: ${room.pricePerNight} * ${nights}일 = ${room.pricePerNight * nights}`
      );
    }
    console.log('✅ [DEBUG] 객실 가격 합산 완료:', totalPrice);
  }

  // 최종 가격 계산 (할인 적용)
  const calculatedFinalPrice = totalPrice
    ? Math.round(totalPrice - (totalPrice * discountRate) / 100)
    : 0;
  if (isNaN(calculatedFinalPrice)) {
    throw new Error('계산된 최종 가격이 유효하지 않습니다.');
  }
  console.log('✅ [DEBUG] 최종 가격 계산 완료:', calculatedFinalPrice);

  // 새 패키지 데이터 생성 (룸 정보 포함, roomIds 대신 rooms 필드 사용)
  const newPackage = new Package({
    ...packageData,
    accommodations: accommodations.map(id => new mongoose.Types.ObjectId(id)),
    tours: tours.map(id => new mongoose.Types.ObjectId(id)),
    flights: flightDetails,
    rooms: roomIdArray,
    startDates: startDatesArray,
    endDates: endDatesArray,
    price: totalPrice,
    finalPrice: calculatedFinalPrice
  });

  await newPackage.save();

  console.log('✅ [SUCCESS] 패키지 생성 완료:', newPackage);
  return newPackage;
}

/**
 * ✅ 전체 패키지 목록 조회 (페이징 + 검색)
 */
async function getAllPackages({page = 1, limit = 10, search = ''}) {
  const query = {};

  if (search) {
    query.name = {$regex: search, $options: 'i'};
  }

  const packages = await Package.find(query)
    .populate('accommodations flights tours createdBy')
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({createdAt: -1})
    .lean();

  const totalPackages = await Package.countDocuments(query);

  return {
    packages,
    totalPackages,
    currentPage: page,
    totalPages: Math.ceil(totalPackages / limit)
  };
}

/**
 * ✅ 특정 패키지 상품 조회
 */
async function getPackageById(packageId) {
  const pkg = await Package.findById(packageId)
    .populate({
      path: 'accommodations',
      populate: {
        path: 'rooms',
        model: 'Room',
        select: 'name pricePerNight description',
        strictPopulate: false
      }
    })
    .populate('flights') // 항공 정보
    .populate('tours'); // 투어 정보
  if (!pkg) {
    throw new Error('해당 패키지를 찾을 수 없습니다.');
  }
  return pkg;
}

/**
 * ✅ 패키지 상품 수정 (관리자만 가능)
 */
async function updatePackage(packageId, updateData) {
  console.log('🔍 [DEBUG] 요청 데이터:', updateData);

  // 기존 패키지 데이터 조회
  const existingPackage = await Package.findById(packageId);
  if (!existingPackage) {
    throw new Error('패키지를 찾을 수 없습니다.');
  }

  // 업데이트할 필드 설정 (기존 값 유지)
  const updatedFields = {
    name: updateData.name ?? existingPackage.name,
    description: updateData.description ?? existingPackage.description,
    discountRate: updateData.discountRate ?? existingPackage.discountRate,
    startDate: updateData.startDate ?? existingPackage.startDate,
    endDate: updateData.endDate ?? existingPackage.endDate,
    category: updateData.category ?? existingPackage.category,
    minPeople: updateData.minPeople ?? existingPackage.minPeople,
    maxPeople: updateData.maxPeople ?? existingPackage.maxPeople,
    status: updateData.status ?? existingPackage.status,
    images: updateData.images ?? existingPackage.images,
    availableDates: updateData.availableDates ?? existingPackage.availableDates,
    createdBy: existingPackage.createdBy // 작성자 유지
  };

  let totalPrice = existingPackage.price;
  let finalPrice = existingPackage.finalPrice;

  // 숙소 업데이트
  if (updateData.accommodations) {
    const accommodationData = await Accommodation.find({
      _id: {$in: updateData.accommodations}
    });
    if (
      !accommodationData ||
      accommodationData.length !== updateData.accommodations.length
    ) {
      throw new Error('숙소 정보를 찾을 수 없습니다.');
    }
    updatedFields.accommodations = updateData.accommodations;
  } else {
    updatedFields.accommodations = existingPackage.accommodations;
  }

  // 투어 업데이트
  if (updateData.tours) {
    const tourData = await TourTicket.find({_id: {$in: updateData.tours}});
    if (!tourData || tourData.length !== updateData.tours.length) {
      throw new Error('투어 정보를 찾을 수 없습니다.');
    }
    totalPrice = tourData.reduce((sum, tour) => sum + (tour.price || 0), 0);
    updatedFields.tours = updateData.tours;
  } else {
    updatedFields.tours = existingPackage.tours;
  }

  // 항공 업데이트
  if (updateData.flights) {
    for (const flight of updateData.flights) {
      const flightData = await Flight.findById(flight.flightId);
      if (!flightData) {
        throw new Error(`항공 정보를 찾을 수 없습니다: ${flight.flightId}`);
      }
      if (flight.seatsToUse > flightData.seatsAvailable) {
        throw new Error('좌석 수가 부족합니다.');
      }
      totalPrice += flightData.price * flight.seatsToUse;
    }
    updatedFields.flights = updateData.flights;
  } else {
    updatedFields.flights = existingPackage.flights;
  }

  // **객실(룸) 업데이트 처리**
  if (updateData.roomIds) {
    const roomIdArray = Array.isArray(updateData.roomIds)
      ? updateData.roomIds.map(r => new mongoose.Types.ObjectId(r))
      : [];
    const startDatesArray = Array.isArray(updateData.startDates)
      ? updateData.startDates.map(s => new Date(s))
      : [];
    const endDatesArray = Array.isArray(updateData.endDates)
      ? updateData.endDates.map(e => new Date(e))
      : [];
    updatedFields.rooms = roomIdArray; // 변경: roomIds → rooms
    updatedFields.startDates = startDatesArray;
    updatedFields.endDates = endDatesArray;

    if (roomIdArray.length > 0) {
      const roomData = await Room.find({_id: {$in: roomIdArray}});
      if (!roomData || roomData.length !== roomIdArray.length) {
        throw new Error('객실 정보를 찾을 수 없습니다.');
      }
      for (let i = 0; i < roomData.length; i++) {
        const room = roomData[i];
        const start = startDatesArray[i];
        const end = endDatesArray[i];
        if (!start || !end) {
          throw new Error('객실 예약 날짜가 누락되었습니다.');
        }
        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        totalPrice += room.pricePerNight * nights;
        console.log(
          ` [DEBUG] 객실 (${room._id}) 가격: ${room.pricePerNight} * ${nights}일 = ${room.pricePerNight * nights}`
        );
      }
    }
  } else {
    updatedFields.rooms = existingPackage.rooms;
    updatedFields.startDates = existingPackage.startDates;
    updatedFields.endDates = existingPackage.endDates;
  }

  // 할인율 적용하여 최종 가격 재계산
  if (updateData.discountRate !== undefined || totalPrice !== existingPackage.price) {
    finalPrice = Math.round(totalPrice - (totalPrice * updatedFields.discountRate) / 100);
  }

  updatedFields.price = totalPrice ?? existingPackage.price;
  updatedFields.finalPrice = finalPrice ?? existingPackage.finalPrice;

  console.log(' [DEBUG] 최종 가격:', updatedFields.finalPrice);

  const updatedPackage = await Package.findByIdAndUpdate(packageId, updatedFields, {
    new: true,
    runValidators: true
  })
    .populate('accommodations')
    .populate('flights')
    .populate('tours')
    .populate('rooms');

  if (!updatedPackage) {
    throw new Error('패키지 수정 실패: 패키지를 찾을 수 없습니다.');
  }

  console.log(' [SUCCESS] 패키지 수정 완료:', updatedPackage);
  return updatedPackage;
}

/**
 * 패키지 상품 삭제 (관리자만 가능)
 */
async function deletePackage(packageId) {
  const deletedPackage = await Package.findByIdAndDelete(packageId);
  if (!deletedPackage) {
    throw new Error('패키지 삭제 실패: 패키지를 찾을 수 없습니다.');
  }
  return deletedPackage;
}

module.exports = {
  createPackage,
  getAllPackages,
  getPackageById,
  updatePackage,
  deletePackage
};
