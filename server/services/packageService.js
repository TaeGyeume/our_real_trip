const Package = require('../models/Package');

/**
 * ✅ 패키지 상품 생성
 */
async function createPackage(packageData) {
  const {accommodations, flights, tours, price, discountRate, startDate, endDate} =
    packageData;

  // ✅ 최소 2개의 상품이 포함되었는지 검증
  const totalItems =
    (accommodations ? accommodations.length : 0) +
    (flights ? flights.length : 0) +
    (tours ? tours.length : 0);

  if (totalItems < 2) {
    throw new Error('패키지는 최소 2개의 상품을 포함해야 합니다.');
  }

  // ✅ 여행 종료일이 시작일보다 앞서면 오류 발생
  if (new Date(endDate) < new Date(startDate)) {
    throw new Error('여행 종료일은 시작일보다 이후여야 합니다.');
  }

  // ✅ 할인율 적용하여 최종 가격 자동 계산 (소수점 제거)
  const finalPrice = Math.round(price - (price * discountRate) / 100);

  const newPackage = new Package({
    ...packageData,
    finalPrice
  });

  await newPackage.save();
  return newPackage;
}

/**
 * ✅ 전체 패키지 목록 조회 (페이징 + 검색 + 첫 번째 이미지 포함)
 */
async function getAllPackages({page = 1, limit = 10, search = ''}) {
  const query = {};

  // ✅ 제목 검색 (이름 필드에 포함된 텍스트 검색)
  if (search) {
    query.name = {$regex: search, $options: 'i'}; // 대소문자 구분 없이 검색
  }

  const packages = await Package.find(query)
    .populate('accommodations flights tours createdBy')
    .skip((page - 1) * limit) // 페이지네이션 적용
    .limit(limit) // 한 번에 불러올 문서 수 제한
    .sort({createdAt: -1}) // 최신 등록된 순으로 정렬
    .lean(); // 결과를 JavaScript 객체로 변환하여 성능 향상

  // ✅ 첫 번째 이미지만 포함하도록 변환
  const formattedPackages = packages.map(pkg => ({
    ...pkg,
    image: pkg.images && pkg.images.length > 0 ? pkg.images[0] : null // 첫 번째 이미지 가져오기
  }));

  const totalPackages = await Package.countDocuments(query); // 전체 패키지 개수 조회

  return {
    packages: formattedPackages,
    totalPackages,
    currentPage: page,
    totalPages: Math.ceil(totalPackages / limit)
  };
}

/**
 * ✅ 특정 패키지 상품 조회 (전체 이미지 포함)
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

  // 패키지를 조회하여 기존 데이터를 가져옴
  const existingPackage = await Package.findById(packageId);

  if (!existingPackage) {
    throw new Error('패키지를 찾을 수 없습니다.');
  }

  // 기존 상품들을 유지하고, 전달된 데이터만 업데이트
  const updatedData = {
    name: updateData.name || existingPackage.name, // 제목 수정
    description: updateData.description || existingPackage.description, // 설명 수정
    price: updateData.price || existingPackage.price, // 가격 수정
    discountRate: updateData.discountRate || existingPackage.discountRate, // 할인율 수정
    finalPrice: Math.round(
      (updateData.price || existingPackage.price) -
        (updateData.discountRate || existingPackage.discountRate) / 100
    ), // 최종 가격 재계산
    accommodations: accommodations || existingPackage.accommodations, // 기존 숙소 데이터 유지
    flights: flights || existingPackage.flights, // 기존 항공 데이터 유지
    tours: tours || existingPackage.tours, // 기존 투어 데이터 유지
    startDate: updateData.startDate || existingPackage.startDate, // 시작일 수정
    endDate: updateData.endDate || existingPackage.endDate, // 종료일 수정
    category: updateData.category || existingPackage.category // 카테고리 수정
  };

  // 기존 상품을 그대로 두고, 수정을 위한 데이터만 적용
  const totalItems =
    (updatedData.accommodations ? updatedData.accommodations.length : 0) +
    (updatedData.flights ? updatedData.flights.length : 0) +
    (updatedData.tours ? updatedData.tours.length : 0);

  // 패키지에 최소 2개의 상품이 포함되어야 한다는 조건을 유지
  if (totalItems < 2) {
    throw new Error('패키지는 최소 2개의 상품을 포함해야 합니다.');
  }

  // 여행 종료일이 시작일보다 앞서면 오류 발생
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
