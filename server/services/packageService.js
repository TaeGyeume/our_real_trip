const mongoose = require('mongoose');
const Package = require('../models/Package');
const Flight = require('../models/Flight');
const Accommodation = require('../models/Accommodation');
const TourTicket = require('../models/TourTicket');

/**
 * ✅ 패키지 상품 생성
 */
async function createPackage(packageData) {
  console.log('🔍 [DEBUG] 받은 packageData:', packageData);

  const {
    accommodations,
    flights,
    tours,
    discountRate,
    startDate,
    endDate,
    createdBy,
    category
  } = packageData;

  // ✅ 필수 필드 검증
  if (!packageData.name || !packageData.description || !category || !createdBy) {
    throw new Error('필수 필드가 누락되었습니다.');
  }

  console.log('🔍 [DEBUG] 필수 필드 검증 완료');

  let totalPrice = 0;

  // ✅ 숙소 가격 계산 및 존재 여부 검증
  if (Array.isArray(accommodations) && accommodations.length > 0) {
    console.log('🔍 [DEBUG] 숙소 ID 목록:', accommodations);

    const accommodationData = await Accommodation.find({_id: {$in: accommodations}});

    console.log('🔍 [DEBUG] 숙소 조회 결과:', accommodationData);

    if (!accommodationData || accommodationData.length !== accommodations.length) {
      throw new Error('숙소 정보를 찾을 수 없습니다.');
    }

    totalPrice += accommodationData.reduce((sum, acc) => sum + (acc.minPrice || 0), 0);
    console.log('✅ [DEBUG] 숙소 가격 합산 완료:', totalPrice);
  }

  // ✅ 투어 가격 계산
  if (Array.isArray(tours) && tours.length > 0) {
    const tourData = await TourTicket.find({_id: {$in: tours}});

    if (!tourData || tourData.length !== tours.length) {
      throw new Error('투어 정보를 찾을 수 없습니다.');
    }

    totalPrice += tourData.reduce((sum, tour) => sum + (tour.price || 0), 0);
    console.log('✅ [DEBUG] 투어 가격 합산 완료:', totalPrice);
  }

  // ✅ 항공 가격 계산
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

  // ✅ 최종 가격 계산 (할인 적용)
  // totalPrice가 유효한지 확인 후 finalPrice 계산
  const finalPrice = totalPrice
    ? Math.round(totalPrice - (totalPrice * discountRate) / 100)
    : 0;

  // finalPrice가 NaN이면 0으로 설정
  if (isNaN(finalPrice)) {
    throw new Error('계산된 최종 가격이 유효하지 않습니다.');
  }

  console.log('✅ [DEBUG] 최종 가격 계산 완료:', finalPrice);

  const newPackage = new Package({
    ...packageData,
    flights: flightDetails, // ✅ 변환된 flights 저장
    price: totalPrice, // ✅ 자동 계산된 가격 저장
    finalPrice
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

  // ✅ 제목 검색 (이름 필드에 포함된 텍스트 검색)
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
  const pkg = await Package.findById(packageId).populate(
    'accommodations flights tours createdBy'
  );
  if (!pkg) {
    throw new Error('해당 패키지를 찾을 수 없습니다.');
  }
  return pkg;
}

/**
 * ✅ 패키지 상품 수정 (관리자만 가능)
 */
async function updatePackage(packageId, updateData) {
  const {accommodations, flights, tours, discountRate, startDate, endDate} = updateData;

  // 기존 패키지 데이터를 조회하여 수정
  const existingPackage = await Package.findById(packageId);
  if (!existingPackage) {
    throw new Error('패키지를 찾을 수 없습니다.');
  }

  // 새로 입력된 숙소, 항공, 투어 정보로 가격을 계산
  let totalPrice = 0;

  if (accommodations && accommodations.length > 0) {
    const accommodationData = await Accommodation.find({_id: {$in: accommodations}});
    if (!accommodationData || accommodationData.length !== accommodations.length) {
      throw new Error('숙소 정보를 찾을 수 없습니다.');
    }
    totalPrice += accommodationData.reduce((sum, acc) => sum + (acc.minPrice || 0), 0);
  }

  if (tours && tours.length > 0) {
    const tourData = await TourTicket.find({_id: {$in: tours}});
    if (!tourData || tourData.length !== tours.length) {
      throw new Error('투어 정보를 찾을 수 없습니다.');
    }
    totalPrice += tourData.reduce((sum, tour) => sum + (tour.price || 0), 0);
  }

  if (flights && flights.length > 0) {
    for (const flight of flights) {
      const flightData = await Flight.findById(flight.flightId);
      if (!flightData) {
        throw new Error(`항공 정보를 찾을 수 없습니다: ${flight.flightId}`);
      }
      if (flight.seatsToUse > flightData.seatsAvailable) {
        throw new Error('좌석 수가 부족합니다.');
      }
      totalPrice += flightData.price * flight.seatsToUse;
    }
  }

  // 최종 가격 계산 (할인 적용)
  let finalPrice = 0;
  if (totalPrice > 0) {
    finalPrice = Math.round(totalPrice - (totalPrice * discountRate) / 100);
  }

  // finalPrice가 NaN이면 0으로 설정
  if (isNaN(finalPrice)) {
    finalPrice = 0;
  }

  // 패키지 데이터 업데이트
  const updatedPackage = await Package.findByIdAndUpdate(
    packageId,
    {
      ...updateData,
      price: totalPrice,
      finalPrice
    },
    {new: true}
  ).populate('accommodations flights tours createdBy');

  if (!updatedPackage) {
    throw new Error('패키지 수정 실패: 패키지를 찾을 수 없습니다.');
  }

  return updatedPackage;
}

/**
 * ✅ 패키지 상품 삭제 (관리자만 가능)
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
