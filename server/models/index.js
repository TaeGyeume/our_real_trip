const mongoose = require('mongoose');

//  모델 가져오기
const Accommodation = require('./Accommodation');
const TourTicket = require('./TourTicket');
const TravelItem = require('./TravelItem');
const Favorite = require('./Favorite'); // 즐겨찾기 모델

//  Mongoose에 모델을 등록 (대소문자 주의)
mongoose.model('Accommodation', Accommodation.schema);
mongoose.model('TourTicket', TourTicket.schema);
mongoose.model('TravelItem', TravelItem.schema);
mongoose.model('Favorite', Favorite.schema);

//  등록된 모델을 export
module.exports = {
  Accommodation,
  TourTicket,
  TravelItem,
  Favorite
};
