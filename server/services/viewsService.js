const TourTicket = require('../models/TourTicket');
const TravelItem = require('../models/TravelItem');

exports.getPopularProducts = async (limit = 10) => {
  try {
    // 모든 투어 티켓 가져오기 (조회수 높은 순 정렬)
    const topTourTickets = await TourTicket.find({stock: {$gt: 0}})
      .select('_id title location price images views stock')
      .lean();

    // 모든 여행 용품 가져오기 (조회수 높은 순 정렬)
    const topTravelItems = await TravelItem.find({stock: {$gt: 0}})
      .select('_id name category price images views stock')
      .lean();

    // 상품을 하나의 배열로 합치고 조회수 기준으로 정렬
    const combinedProducts = [
      ...topTourTickets.map(item => ({
        ...item,
        type: 'tourTicket',
        views: item.views || 0
      })), // views 없으면 기본 0
      ...topTravelItems.map(item => ({
        ...item,
        type: 'travelItem',
        views: item.views || 0
      }))
    ].sort((a, b) => b.views - a.views); // 조회수 내림차순 정렬

    // 최종적으로 limit 적용
    return {success: true, products: combinedProducts.slice(0, limit)};
  } catch (error) {
    console.error('인기 상품 조회 오류:', error);
    return {success: false, message: '서버 오류'};
  }
};
