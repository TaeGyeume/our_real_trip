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
  const finalPrice = Math.round(totalPrice - (totalPrice * discountRate) / 100);

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
  const {accommodations, flights, tours, price, discountRate, startDate, endDate} =
    updateData;

  const existingPackage = await Package.findById(packageId);
  if (!existingPackage) {
    throw new Error('패키지를 찾을 수 없습니다.');
  }

  const updatedData = {
    name: updateData.name || existingPackage.name,
    description: updateData.description || existingPackage.description,
    price: updateData.price || existingPackage.price,
    discountRate: updateData.discountRate || existingPackage.discountRate,
    finalPrice: Math.round(
      (updateData.price || existingPackage.price) -
        (updateData.discountRate || existingPackage.discountRate) / 100
    ),
    accommodations: accommodations || existingPackage.accommodations,
    flights: flights || existingPackage.flights,
    tours: tours || existingPackage.tours,
    startDate: updateData.startDate || existingPackage.startDate,
    endDate: updateData.endDate || existingPackage.endDate,
    category: updateData.category || existingPackage.category
  };

  const totalItems =
    (updatedData.accommodations ? updatedData.accommodations.length : 0) +
    (updatedData.flights ? updatedData.flights.length : 0) +
    (updatedData.tours ? updatedData.tours.length : 0);

  if (totalItems < 2) {
    throw new Error('패키지는 최소 2개의 상품을 포함해야 합니다.');
  }

  if (new Date(updateData.endDate) < new Date(updateData.startDate)) {
    throw new Error('여행 종료일은 시작일보다 이후여야 합니다.');
  }

  const updatedPackage = await Package.findByIdAndUpdate(packageId, updatedData, {
    new: true
  }).populate('accommodations flights tours createdBy');

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
