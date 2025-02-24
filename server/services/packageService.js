const Package = require('../models/Package');

/**
 * 패키지 상품 생성
 */
async function createPackage(packageData) {
  const {accommodations, flights, tours, price, discountRate} = packageData;

  // 최소 2개의 상품이 포함되었는지 검증
  const totalItems =
    (accommodations ? accommodations.length : 0) +
    (flights ? flights.length : 0) +
    (tours ? tours.length : 0);

  if (totalItems < 2) {
    throw new Error('패키지는 최소 2개의 상품을 포함해야 합니다.');
  }

  // 최종 가격 계산 (할인율 적용)
  const finalPrice = price - (price * discountRate) / 100;

  const newPackage = new Package({
    ...packageData,
    finalPrice
  });

  await newPackage.save();
  return newPackage;
}

/**
 * 전체 패키지 목록 조회 (필터링 가능)
 */
async function getAllPackages(filters = {}) {
  const packages = await Package.find(filters).populate(
    'accommodations flights tours createdBy'
  );
  return packages;
}

/**
 * 특정 패키지 상품 조회
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
 * 패키지 상품 수정 (관리자만 가능)
 */
async function updatePackage(packageId, updateData) {
  const {accommodations, flights, tours, price, discountRate} = updateData;

  // 최소 2개의 상품이 포함되었는지 검증
  const totalItems =
    (accommodations ? accommodations.length : 0) +
    (flights ? flights.length : 0) +
    (tours ? tours.length : 0);

  if (totalItems < 2) {
    throw new Error('패키지는 최소 2개의 상품을 포함해야 합니다.');
  }

  // 최종 가격 계산 (할인율 적용)
  updateData.finalPrice = price - (price * discountRate) / 100;

  const updatedPackage = await Package.findByIdAndUpdate(packageId, updateData, {
    new: true
  }).populate('accommodations flights tours createdBy');

  if (!updatedPackage) {
    throw new Error('패키지 수정 실패: 패키지를 찾을 수 없습니다.');
  }

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
