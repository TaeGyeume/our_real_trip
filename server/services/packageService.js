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
    accommodations = [],
    tours = [],
    flights = [],
    roomIds = [], // 선택된 객실 ID 배열
    startDates = [], // 객실 예약 시작일 배열
    endDates = [], // 객실 예약 종료일 배열
    category,
    createdBy
  } = packageData;

  // 최소 2개 상품 검증
  const accommodationCount = accommodations.length;
  const tourCount = tours.length;
  const flightCount = flights.length;
  if (accommodationCount + tourCount + flightCount < 2) {
    throw new Error('패키지는 최소 2개의 상품을 포함해야 합니다.');
  }
  console.log(' [DEBUG] 최소 2개 상품 포함 검증 완료');

  let totalRoomPrice = 0;
  let totalFlightPrice = 0;
  let totalTourPrice = 0;

  // 1) 항공 가격 계산
  const flightsConverted = Array.isArray(flights)
    ? flights.map(flight => ({
        flightId: new mongoose.Types.ObjectId(flight.flightId),
        seatsToUse: flight.seatsToUse
      }))
    : [];

  for (const flight of flightsConverted) {
    const flightData = await Flight.findById(flight.flightId);
    if (!flightData) {
      throw new Error(`항공 정보를 찾을 수 없습니다: ${flight.flightId}`);
    }
    if (flight.seatsToUse > flightData.seatsAvailable) {
      throw new Error('좌석 수가 부족합니다.');
    }
    totalFlightPrice += (flightData.price || 0) * flight.seatsToUse;
  }
  console.log(' [DEBUG] 항공 가격 합산 완료:', totalFlightPrice);

  // 2) 투어 가격 계산
  if (tours.length > 0) {
    const tourData = await TourTicket.find({_id: {$in: tours}});
    if (!tourData || tourData.length !== tours.length) {
      throw new Error('투어 정보를 찾을 수 없습니다.');
    }
    totalTourPrice = tourData.reduce((sum, tour) => sum + (tour.price || 0), 0);
    console.log(' [DEBUG] 투어 가격 합산 완료:', totalTourPrice);
  }

  // 3) 객실(룸) 가격 계산
  //    - **roomIds**가 있으면 해당 객실들만 예약 일수 × 가격
  //    - roomIds가 비어 있으면 => 객실 가격은 0원
  if (roomIds && roomIds.length > 0) {
    const roomIdArray = roomIds.map(r => new mongoose.Types.ObjectId(r));
    const startDatesArray = Array.isArray(startDates)
      ? startDates.map(s => new Date(s))
      : [];
    const endDatesArray = Array.isArray(endDates) ? endDates.map(e => new Date(e)) : [];

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
      totalRoomPrice += (room.pricePerNight || 0) * nights;
      console.log(
        ` [DEBUG] 객실 (${room._id}) 가격: ${room.pricePerNight} * ${nights}일 = ${
          room.pricePerNight * nights
        }`
      );
    }
    console.log(' [DEBUG] 선택된 객실 가격 합산 완료:', totalRoomPrice);
  } else {
    console.log(' [DEBUG] roomIds가 비어 있음 => 객실 가격 0원 처리');
  }

  // 4) 최종 합산 (할인 전)
  const basePrice = totalRoomPrice + totalFlightPrice + totalTourPrice;
  console.log(' [DEBUG] 최종 basePrice 확인:', basePrice);

  // 5) 할인 적용
  const finalPrice = Math.round(basePrice - (basePrice * discountRate) / 100);
  console.log(' [DEBUG] 최종 가격 (할인 적용 후):', finalPrice);

  // 6) 패키지 저장
  const newPackage = new Package({
    ...packageData,
    // accommodations는 필요하면 그대로 저장
    accommodations: accommodations.map(id => new mongoose.Types.ObjectId(id)),
    // 투어, 항공도 마찬가지
    tours: tours.map(id => new mongoose.Types.ObjectId(id)),
    flights: flightsConverted,
    // 선택된 객실 ID, 예약일
    roomIds,
    startDates,
    endDates,
    price: basePrice,
    finalPrice
  });

  await newPackage.save();
  console.log(' [SUCCESS] 패키지 생성 완료:', newPackage);
  return newPackage;
}

/**
 *  전체 패키지 목록 조회 (페이징 + 검색)
 */
async function getAllPackages({page = 1, limit = 10, search = ''}) {
  const query = {};

  if (search) {
    query.name = {$regex: search, $options: 'i'};
  }

  const packages = await Package.find(query)
    .populate({
      path: 'accommodations',
      populate: {
        path: 'rooms',
        model: 'Room',
        select: 'name pricePerNight description'
      }
    })
    .populate({
      path: 'flights.flightId', // flights 배열 내의 flightId 필드를 populate
      model: 'flight'
    })
    .populate('tours')
    .populate('createdBy')
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
 *  특정 패키지 상품 조회
 */
async function getPackageById(packageId) {
  const pkg = await Package.findById(packageId)
    .populate({
      path: 'accommodations',
      populate: {
        path: 'rooms',
        model: 'Room',
        select: 'name pricePerNight description'
      }
    })
    .populate({
      path: 'flights.flightId', // 항공편 정보 정확히 가져오기
      model: 'Flight'
    })
    .populate('tours'); // 투어 정보도 가져오기

  if (!pkg) {
    throw new Error('해당 패키지를 찾을 수 없습니다.');
  }

  //  1) 객실(Room) 가격 계산 (숙박 일수 반영)
  let totalRoomPrice = 0;
  if (pkg.roomIds.length > 0 && pkg.startDates.length > 0 && pkg.endDates.length > 0) {
    for (let i = 0; i < pkg.roomIds.length; i++) {
      const roomId = pkg.roomIds[i];
      const startDate = new Date(pkg.startDates[i]);
      const endDate = new Date(pkg.endDates[i]);

      // 숙박 일수 계산 (최소 1박 보장)
      const nights = Math.max(
        1,
        Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      );

      // 해당 객실 정보 가져오기
      const room = await Room.findById(roomId);
      if (room) {
        totalRoomPrice += (room.pricePerNight || 0) * nights;
      }
    }
  }

  //  2) 항공 가격 계산
  let totalFlightPrice = 0;
  if (pkg.flights.length > 0) {
    for (const flightObj of pkg.flights) {
      if (flightObj.flightId && flightObj.flightId.price) {
        totalFlightPrice += flightObj.flightId.price * (flightObj.seatsToUse || 1);
      }
    }
  }

  //  3) 투어 가격 계산
  let totalTourPrice = pkg.tours.reduce((sum, tour) => sum + (tour.price || 0), 0);

  //  4) 기본 가격 (할인 전)
  const basePrice = totalRoomPrice + totalFlightPrice + totalTourPrice;

  //  5) 할인 가격 적용 (정확한 계산)
  const packageDiscount = Math.round(basePrice * (pkg.discountRate / 100)); // 반올림 적용
  const finalPrice = basePrice - packageDiscount;

  return {
    ...pkg.toObject(),
    totalRoomPrice,
    totalFlightPrice,
    totalTourPrice,
    basePrice,
    packageDiscount,
    finalPrice
  };
}

/**
 *  패키지 상품 수정 (관리자만 가능)
 */

async function updatePackage(packageId, updateData) {
  console.log(' [DEBUG] 요청 데이터:', updateData);

  // 1) 기존 패키지 데이터 조회
  const existingPackage = await Package.findById(packageId);
  if (!existingPackage) {
    throw new Error('패키지를 찾을 수 없습니다.');
  }

  // 2) 기본 업데이트할 필드들 (기존값 유지)
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
    createdBy: existingPackage.createdBy // createdBy는 변경 불가 (작성자 유지)
  };

  // 3) 가격 계산 초기화
  let totalPrice = 0;
  let finalPrice = 0;

  // ------------------------------
  // A) 숙소 업데이트
  // ------------------------------
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

  // ------------------------------
  // B) 투어/티켓 업데이트
  // ------------------------------
  if (updateData.tours) {
    const tourData = await TourTicket.find({_id: {$in: updateData.tours}});

    if (!tourData || tourData.length !== updateData.tours.length) {
      throw new Error('투어 정보를 찾을 수 없습니다.');
    }

    updatedFields.tours = updateData.tours;
    totalPrice += tourData.reduce((sum, tour) => sum + (tour.price || 0), 0);
  } else {
    updatedFields.tours = existingPackage.tours;
  }

  // ------------------------------
  // C) 항공 업데이트
  // ------------------------------
  if (updateData.flights) {
    let flightSum = 0;
    for (const flight of updateData.flights) {
      const flightData = await Flight.findById(flight.flightId);
      if (!flightData) {
        throw new Error(`항공 정보를 찾을 수 없습니다: ${flight.flightId}`);
      }
      if (flight.seatsToUse > flightData.seatsAvailable) {
        throw new Error('좌석 수가 부족합니다.');
      }
      flightSum += (flightData.price || 0) * flight.seatsToUse;
    }
    updatedFields.flights = updateData.flights;
    totalPrice += flightSum;
  } else {
    updatedFields.flights = existingPackage.flights;
  }

  // ------------------------------
  // D) 객실(roomIds) + 날짜(startDates, endDates) 업데이트
  // ------------------------------
  if (updateData.roomIds && updateData.startDates && updateData.endDates) {
    // JSON 문자열로 전달될 경우 파싱 처리
    const roomIdArray = Array.isArray(updateData.roomIds)
      ? updateData.roomIds.map(r => new mongoose.Types.ObjectId(r))
      : JSON.parse(updateData.roomIds).map(r => new mongoose.Types.ObjectId(r));

    const startDatesArray = Array.isArray(updateData.startDates)
      ? updateData.startDates.map(d => new Date(d))
      : JSON.parse(updateData.startDates).map(d => new Date(d));

    const endDatesArray = Array.isArray(updateData.endDates)
      ? updateData.endDates.map(d => new Date(d))
      : JSON.parse(updateData.endDates).map(d => new Date(d));

    updatedFields.roomIds = roomIdArray;
    updatedFields.startDates = startDatesArray;
    updatedFields.endDates = endDatesArray;

    console.log(' [DEBUG] 업데이트된 roomIds:', updatedFields.roomIds);
    console.log(' [DEBUG] 업데이트된 startDates:', updatedFields.startDates);
    console.log(' [DEBUG] 업데이트된 endDates:', updatedFields.endDates);

    // 룸 가격 계산
    if (roomIdArray.length > 0) {
      const roomData = await Room.find({_id: {$in: roomIdArray}});
      if (!roomData || roomData.length !== roomIdArray.length) {
        throw new Error('객실 정보를 찾을 수 없습니다.');
      }

      for (let i = 0; i < roomData.length; i++) {
        const room = roomData[i];
        const start = startDatesArray[i];
        const end = endDatesArray[i];

        if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error('객실 예약 날짜가 유효하지 않습니다.');
        }

        // 최소 1박 보장
        const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
        const roomCost = (room.pricePerNight || 0) * nights;
        totalPrice += roomCost;

        console.log(
          ` [DEBUG] 객실 (${room._id}) 가격: ${room.pricePerNight} * ${nights}일 = ${roomCost}`
        );
      }
    }
  } else {
    updatedFields.roomIds = existingPackage.roomIds;
    updatedFields.startDates = existingPackage.startDates;
    updatedFields.endDates = existingPackage.endDates;
  }

  // ------------------------------
  // E) 최종 가격 재계산 (할인율 반영)
  // ------------------------------
  if (updateData.discountRate !== undefined || totalPrice !== existingPackage.price) {
    finalPrice = Math.round(totalPrice - (totalPrice * updatedFields.discountRate) / 100);
  }

  updatedFields.price = totalPrice;
  updatedFields.finalPrice = finalPrice;

  console.log(' [DEBUG] 계산된 totalPrice:', totalPrice);
  console.log(' [DEBUG] 최종 가격 (finalPrice):', finalPrice);

  // ------------------------------
  // F) DB 업데이트 & populate
  // ------------------------------
  const updatedPackage = await Package.findByIdAndUpdate(packageId, updatedFields, {
    new: true,
    runValidators: true
  })
    .populate('accommodations')
    .populate('flights.flightId')
    .populate('tours')
    .populate('roomIds');

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
