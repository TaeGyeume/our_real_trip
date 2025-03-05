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
          required: false
        },
        seatsToUse: {
          type: Number,
          required: false,
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

//  인덱스 설정
PackageSchema.index({name: 'text', description: 'text', category: 'text'});

/**
 *  패키지 저장 전에 유효성 검증
 */
//  여기에 `pre('save')` 훅 추가!
PackageSchema.pre('save', async function (next) {
  // 1) 숙소(방) 가격 합산
  let totalRoomPrice = 0;
  if (this.roomIds && this.roomIds.length > 0) {
    // roomIds가 실제로 populate되어 있거나, DB에서 찾아와야 함
    // 예) Room.find({ _id: { $in: this.roomIds } })
    const rooms = await mongoose.model('Room').find({_id: {$in: this.roomIds}});
    totalRoomPrice = rooms.reduce((sum, r) => sum + (r.pricePerNight || 0), 0);
  }

  // 2) 항공 가격 합산
  let totalFlightPrice = 0;
  if (this.flights && this.flights.length > 0) {
    for (const f of this.flights) {
      const flightDoc = await mongoose.model('flight').findById(f.flightId);
      if (flightDoc) {
        const seats = f.seatsToUse || 1;
        totalFlightPrice += (flightDoc.price || 0) * seats;
      }
    }
  }

  // 3) 투어 가격 합산
  let totalTourPrice = 0;
  if (this.tours && this.tours.length > 0) {
    const tourDocs = await mongoose.model('tourTicket').find({_id: {$in: this.tours}});
    totalTourPrice = tourDocs.reduce((sum, t) => sum + (t.price || 0), 0);
  }

  // 4) 총합
  const basePrice = totalRoomPrice + totalFlightPrice + totalTourPrice;

  // 5) 할인율 적용
  this.price = basePrice; // <-- basePrice를 'price' 필드에 저장
  this.finalPrice = Math.round(basePrice - (basePrice * this.discountRate) / 100);

  // 나머지 유효성 체크 (날짜 등)
  // ...
  next();
});

module.exports = mongoose.model('package', PackageSchema);
