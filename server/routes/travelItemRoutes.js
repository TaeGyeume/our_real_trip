const express = require('express');
const router = express.Router();
const travelItemController = require('../controllers/travelItemController');
const upload = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');

// 상품 등록 API (POST 요청)
router.post(
  '/create',
  upload,
  authMiddleware,
  authorizeRoles('admin'),
  travelItemController.createTravelItem
);

// 최상위 카테고리 조회
router.get('/topCategories', travelItemController.getTopLevelCategories);

// 특정 카테고리의 하위 카테고리 조회
router.get('/subCategories/:categoryId', travelItemController.getSubCategories);

// 특정 카테고리의 상품 조회
router.get('/byCategory/:categoryId', travelItemController.getItemsByCategory);

// 모든 카테고리 조회 API
router.get('/allCategories', travelItemController.getAllCategories);

// 모든 최하위 상품 조회 API
router.get('/allItems', travelItemController.getAllItemsController);

// 특정 상품 수정 (PATCH 요청)
router.patch(
  '/:itemId',
  upload,
  authMiddleware,
  authorizeRoles('admin'),
  travelItemController.updateTravelItemController
);

// 특정 상품 조회 라우트 추가
router.get('/:itemId', travelItemController.getTravelItemByIdController);

// 상품 삭제 라우트
router.delete(
  '/:itemId',
  authMiddleware,
  authorizeRoles('admin'),
  travelItemController.deleteTravelItemController
);

// 최상위 카테고리 수정 (PUT)
router.patch(
  '/top-level/:categoryId',
  authMiddleware,
  authorizeRoles('admin'),
  travelItemController.updateTopLevelCategory
);

// 특정 하위 카테고리 수정 (PUT)
router.patch(
  '/sub-category/:subCategoryId',
  authMiddleware,
  authorizeRoles('admin'),
  travelItemController.updateSubCategory
);

// 특정 하위 카테고리 삭제 (DELETE)
router.delete(
  '/category/:categoryId',
  authMiddleware,
  authorizeRoles('admin'),
  travelItemController.deleteCategory
);

// 여행용품 평점 업데이트 엔드포인트
router.patch('/:id/update-rating', travelItemController.updateRating);

module.exports = router;
