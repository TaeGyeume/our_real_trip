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
    let {itemId, itemType} = req.body;
    const userId = req.user.id;

    console.log(
      ` Received request - userId: ${userId}, itemId: ${itemId}, itemType:`,
      itemType
    );

    if (!userId) {
      return res.status(400).json({error: 'User ID is required'});
    }
    if (!itemId || !itemType) {
      return res.status(400).json({error: 'itemId and itemType are required'});
    }

    //  itemType을 정확하게 변환
    itemType = normalizeItemType(itemType);
    console.log(` Processed itemType (converted to enum format): ${itemType}`);

    //  유효한 itemType인지 검증
    const validItemTypes = ['Accommodation', 'TourTicket', 'TravelItem'];
    if (!validItemTypes.includes(itemType)) {
      console.error(` Invalid itemType received: ${itemType}`);
      return res.status(400).json({
        error: `Invalid item type received: ${itemType}. Expected one of: ${validItemTypes.join(', ')}`
      });
    }

    const result = await favoriteService.toggleFavorite(userId, itemId, itemType);
    res.status(200).json(result);
  } catch (error) {
    console.error(' Error toggling favorite:', error.message);
    res.status(400).json({error: error.message});
  }
};

//  사용자 즐겨찾기 목록 조회
const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    // console.log(` Fetching favorites for user: ${userId}`);

    const favorites = await favoriteService.getUserFavorites(userId);
    res.status(200).json({favorites});
  } catch (error) {
    // console.error(' Error fetching user favorites:', error.message);
    res.status(400).json({error: error.message});
  }
};

module.exports = {
  toggleFavorite,
  getUserFavorites
};
