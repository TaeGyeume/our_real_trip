const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    types: [
      {
        type: String,
        enum: ['flight', 'accommodation', 'tourTicket', 'travelItem', 'package'],
        required: true
      }
    ],
    productIds: [
      {type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'types'}
    ],
    roomIds: [{type: mongoose.Schema.Types.ObjectId, ref: 'Room'}],
    startDates: [{type: Date}],
    endDates: [{type: Date}],
    counts: [{type: Number, required: true}],
    merchant_uid: {type: String, required: true},
    totalPrice: {type: Number, required: true},
    discountAmount: {type: Number, default: 0}, // 할인 금액 저장
    finalPrice: {type: Number, required: true}, // 최종 결제 금액 저장
    usedMileage: {type: Number, default: 0}, // 사용된 마일리지 필드 추가
    userId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    userCouponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserCoupon',
      default: null
    }, // 유저가 사용한 쿠폰 ID 저장
    reservationInfo: {
      name: String,
      email: String,
      phone: String,
      address: String
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'CANCELED', 'CONFIRMED'],
      default: 'PENDING'
    },
    createdAt: {type: Date, default: () => new Date(Date.now() + 9 * 60 * 60 * 1000)},
    updatedAt: {type: Date, default: () => new Date(Date.now() + 9 * 60 * 60 * 1000)}
  },
  {timestamps: false}
);

module.exports = mongoose.model('Booking', bookingSchema);
