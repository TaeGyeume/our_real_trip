const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  accommodation: {
    type: mongoose.Schema.Types.ObjectId, // 해당 객실이 속한 숙소와 연결
    ref: 'Accommodation',
    required: true
  },
  name: {
    type: String, // 객실명 (예: 디럭스룸, 스탠다드룸)
    required: true
  },
  description: {
    type: String // 객실 설명
  },
  pricePerNight: {
    type: Number, // 1박당 가격
    required: true
  },
  maxGuests: {
    type: Number, // 최대 숙박 가능 인원
    required: true
  },
  images: [
    {
      type: String // 객실 이미지 URL 리스트
    }
  ],
  amenities: [
    {
      type: String // 객실 편의시설 리스트 (예: Wifi, TV, 에어컨 등)
    }
  ],
  checkInTime: {
    type: String, // 입실 시간 (기본값: 15:00)
    default: '15:00',
    required: true
  },
  checkOutTime: {
    type: String, // 퇴실 시간 (기본값: 11:00)
    default: '11:00',
    required: true
  },
  available: {
    type: Boolean, // 객실 예약 가능 여부
    default: true
  },
  availableCount: {
    type: Number, // 남은 객실 개수 (예약 시 감소, 취소 시 증가)
    required: true
  },
  reservedDates: [
    {
      date: {type: Date, required: true}, // 예약된 날짜
      count: {type: Number, required: true, default: 0} // 해당 날짜의 예약 개수
    }
  ],
  createdAt: {
    type: Date,
    default: () => new Date(Date.now() + 9 * 60 * 60 * 1000) // KST
  }
});

// 가격 검색 최적화를 위한 인덱스 추가
RoomSchema.index({pricePerNight: 1});

// 객실이 저장 또는 업데이트될 때 `availableCount`가 0이면 `available`을 `false`로 변경
RoomSchema.pre('save', function (next) {
  if (this.availableCount <= 0) {
    this.available = false;
  } else {
    this.available = true;
  }
  next();
});

// `findOneAndUpdate` 시에도 적용되도록 미들웨어 추가
RoomSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();

  if (update.availableCount !== undefined) {
    update.available = update.availableCount > 0;
  }

  next();
});

module.exports = mongoose.model('Room', RoomSchema);
