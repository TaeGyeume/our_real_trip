const packageService = require('../services/packageService');

/**
 * ✅ 패키지 상품 생성 (관리자만 가능)
 */
exports.createPackage = async (req, res) => {
  try {
    // 관리자 권한 확인 (RBAC 적용)
    if (!req.user || !req.user.roles || !req.user.roles.includes('admin')) {
      return res.status(403).json({message: '관리자만 패키지를 생성할 수 있습니다.'});
    }

    // 요청 본문 유효성 검사
    const {
      name,
      description,
      price,
      discountRate,
      startDate,
      endDate,
      accommodations,
      tours,
      flights,
      category,
      createdBy
    } = req.body;

    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !accommodations ||
      !tours ||
      !flights ||
      !createdBy
    ) {
      return res.status(400).json({message: '필수 필드가 누락되었습니다.'});
    }

    const createdPackage = await packageService.createPackage(req.body);
    return res.status(201).json(createdPackage);
  } catch (error) {
    console.error('[ERROR] 패키지 생성 실패:', error);
    return res.status(500).json({message: '패키지 생성 실패', error: error.message});
  }
};

/**
 * ✅ 전체 패키지 목록 조회 (페이징 + 제목 검색 가능)
 */
exports.getAllPackages = async (req, res) => {
  try {
    const {page = 1, limit = 10, search = ''} = req.query;

    const filters = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search
    };

    // 유효성 검사 (예: 페이지 및 limit 값이 숫자여야 한다)
    if (isNaN(filters.page) || filters.page <= 0) {
      return res.status(400).json({message: '유효하지 않은 페이지 번호입니다.'});
    }

    if (isNaN(filters.limit) || filters.limit <= 0) {
      return res.status(400).json({message: '유효하지 않은 limit 값입니다.'});
    }

    const packages = await packageService.getAllPackages(filters);
    return res.status(200).json(packages);
  } catch (error) {
    console.error('[ERROR] 패키지 목록 조회 실패:', error);
    return res.status(500).json({message: '패키지 목록 조회 실패', error: error.message});
  }
};

/**
 * ✅ 특정 패키지 상품 조회
 */
exports.getPackageById = async (req, res) => {
  try {
    const {id} = req.params;
    const packageData = await packageService.getPackageById(id);

    if (!packageData) {
      return res.status(404).json({message: '패키지를 찾을 수 없습니다.'});
    }

    return res.status(200).json(packageData);
  } catch (error) {
    console.error('[ERROR] 패키지 조회 실패:', error);
    return res.status(500).json({message: '패키지 조회 실패', error: error.message});
  }
};

/**
 * ✅ 패키지 상품 수정 (관리자만 가능)
 */
exports.updatePackage = async (req, res) => {
  try {
    // 관리자 권한 확인
    if (!req.user || !req.user.roles || !req.user.roles.includes('admin')) {
      return res.status(403).json({message: '관리자만 패키지를 수정할 수 있습니다.'});
    }

    const {id} = req.params;
    const updatedPackage = await packageService.updatePackage(id, req.body);

    if (!updatedPackage) {
      return res.status(404).json({message: '패키지를 찾을 수 없습니다.'});
    }

    return res.status(200).json(updatedPackage);
  } catch (error) {
    console.error('[ERROR] 패키지 수정 실패:', error);
    return res.status(500).json({message: '패키지 수정 실패', error: error.message});
  }
};

/**
 * ✅ 패키지 상품 삭제 (관리자만 가능)
 */
exports.deletePackage = async (req, res) => {
  try {
    // 관리자 권한 확인
    if (!req.user || !req.user.roles || !req.user.roles.includes('admin')) {
      return res.status(403).json({message: '관리자만 패키지를 삭제할 수 있습니다.'});
    }

    const {id} = req.params;
    const deletedPackage = await packageService.deletePackage(id);

    if (!deletedPackage) {
      return res.status(404).json({message: '패키지를 찾을 수 없습니다.'});
    }

    return res.status(200).json({message: '패키지가 성공적으로 삭제되었습니다.'});
  } catch (error) {
    console.error('[ERROR] 패키지 삭제 실패:', error);
    return res.status(500).json({message: '패키지 삭제 실패', error: error.message});
  }
};
