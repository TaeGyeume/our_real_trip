const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema(
  {
    name: {type: String, required: true, trim: true},
    description: {type: String, trim: true},
    type: {type: String, enum: ['Basic'], default: 'Basic', required: true},
    price: {type: Number, required: true, min: 0},
    discountRate: {type: Number, default: 0, min: 0, max: 100},
    finalPrice: {type: Number, required: true},

    accommodations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'accommodation'
      }
    ],

    // ✅seatsToUse를 포함하는 flights 배열
    flights: [
      {
        flightId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'flight',
          required: true
        },
        seatsToUse: {
          type: Number,
          required: true,
          min: 1
        }
      }
    ],

    tours: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tourTicket'
      }
    ],

    // 새로운 필드: 객실(룸) 정보
    roomIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room'
      }
    ],
    startDates: [{type: Date}],
    endDates: [{type: Date}],

    images: [{type: String}],
    startDate: {type: Date, required: true},
    endDate: {type: Date, required: true},
    duration: {type: Number},
    availableDates: [{type: Date}],

    category: {
      type: String,
      enum: ['Self-Guided', 'Tour Package'],
      required: true
    },

    minPeople: {type: Number, default: 1, min: 1},
    maxPeople: {type: Number, default: 20, min: 1},
    status: {
      type: String,
      enum: ['Available', 'Sold Out', 'Ongoing', 'Cancelled'],
      default: 'Available'
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {timestamps: true}
);

// ✅ 인덱스 설정
PackageSchema.index({name: 'text', description: 'text', category: 'text'});

/**
 * ✅ 패키지 저장 전에 유효성 검증
 */
PackageSchema.pre('save', function (next) {
  const totalItems =
    (this.accommodations ? this.accommodations.length : 0) +
    (this.flights ? this.flights.length : 0) +
    (this.tours ? this.tours.length : 0);

  if (totalItems < 2) {
    return next(new Error('패키지는 최소 2개의 상품을 포함해야 합니다.'));
  }

  if (!this.startDate || !this.endDate) {
    return next(new Error('여행 시작일과 종료일을 입력해야 합니다.'));
  }

  if (this.endDate < this.startDate) {
    return next(new Error('여행 종료일은 시작일보다 이후여야 합니다.'));
  }

  // 할인율 적용하여 최종 가격 자동 계산
  this.finalPrice = Math.round(this.price - (this.price * this.discountRate) / 100);

  // 여행 기간 자동 계산
  const durationInMs = this.endDate - this.startDate;
  this.duration = Math.round(durationInMs / (1000 * 60 * 60 * 24)) + 1;

  next();
});

module.exports = mongoose.model('package', PackageSchema);
