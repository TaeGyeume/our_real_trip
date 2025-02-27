const favoriteService = require('../services/favoriteService');
const {Accommodation, TourTicket, TravelItem} = require('../models'); //  models/index.js에서 불러오기

//  itemType 변환 함수 (Favorite 모델과 일치하도록 변환)
const normalizeItemType = itemType => {
  if (typeof itemType === 'string') {
    //  정확한 대소문자로 enum과 일치하게 변환
    const mapping = {
      accommodation: 'Accommodation',
      tourticket: 'TourTicket',
      travelitem: 'TravelItem'
    };

    const lowercasedType = itemType.toLowerCase(); // 모든 입력을 소문자로 변환
    return mapping[lowercasedType] || itemType; //  매핑된 값이 있으면 반환, 없으면 원본 유지
  }
  return itemType;
};

//  즐겨찾기 추가 또는 삭제
const toggleFavorite = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.warn('🚨 [서버] 로그인하지 않은 사용자 → 401 Unauthorized');
      return res.status(401).json({error: '로그인이 필요합니다.'});
    }

    let {itemId, itemType} = req.body;
    const userId = req.user.id;

    console
      .log
      // `📌 [서버] 즐겨찾기 요청 - userId: ${userId}, itemId: ${itemId}, itemType: ${itemType}`
      ();

    if (!itemId || !itemType) {
      return res.status(400).json({error: 'itemId and itemType are required'});
    }

    const result = await favoriteService.toggleFavorite(userId, itemId, itemType);
    res.status(200).json(result);
  } catch (error) {
    console.error('🚨 [서버] 즐겨찾기 토글 오류:', error.message);
    res.status(500).json({error: '즐겨찾기 상태 변경 중 오류가 발생했습니다.'});
  }
};

//  사용자 즐겨찾기 목록 조회 (비로그인 사용자도 가능)
const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user?.id || null; // 🔹 로그인한 경우 userId 설정, 아니면 null

    if (!userId) {
      // console.log('🛠 [Controller] 비로그인 사용자 요청 → 빈 배열 반환');
      return res.status(200).json({favorites: []}); // ✅ 로그인하지 않은 경우, 빈 배열 반환
    }

    const favorites = await favoriteService.getUserFavorites(userId);
    res.status(200).json({favorites});
  } catch (error) {
    console.error('🚨 [Controller] 즐겨찾기 조회 오류:', error.message);
    res.status(400).json({error: error.message});
  }
};

module.exports = {
  toggleFavorite,
  getUserFavorites
};
