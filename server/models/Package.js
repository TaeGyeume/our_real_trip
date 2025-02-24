const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema(
  {
    name: {
      type: String, // 패키지 상품명
      required: true
    },
    description: {
      type: String // 패키지 설명
    },
    type: {
      type: String, // 패키지 유형 (기본형/커스텀)
      enum: ['Basic', 'Custom'],
      required: true
    },
    price: {
      type: Number, // 총 가격 (숙소, 항공, 투어/티켓 가격 합산)
      required: true
    },
    discountRate: {
      type: Number, // 할인율 (%)
      default: 0
    },
    accommodations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'accommodation' // 숙소 참조 (필수)
      }
    ],
    flights: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'flight' // 항공편 참조 (선택 가능)
      }
    ],
    tours: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tourTicket' // 투어/티켓 참조 (필수)
      }
    ],
    images: [
      {
        type: String // 패키지 대표 이미지 (선택 가능)
      }
    ],
    startDate: {
      type: Date, // 여행 시작일 (출발 날짜)
      required: true
    },
    endDate: {
      type: Date, // 여행 종료일 (귀국 날짜)
      required: true
    },
    duration: {
      type: Number, // 여행 기간 자동 계산 (endDate - startDate)
      required: true
    },
    availableDates: [
      {
        type: Date // 패키지 상품 이용 가능 날짜
      }
    ],
    category: {
      type: String, // 패키지 유형 (예: 자유여행, 패키지여행)
      enum: ['Self-Guided', 'Tour Package'],
      required: true
    },
    minPeople: {
      type: Number, // 최소 출발 인원
      default: 1
    },
    maxPeople: {
      type: Number, // 최대 가능 인원
      default: 20
    },
    status: {
      type: String, // 예약 가능 상태
      enum: ['Available', 'Sold Out', 'Ongoing', 'Cancelled'],
      default: 'Available'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // 패키지 상품을 등록한 사용자 (관리자)
      required: true
    },
    createdAt: {
      type: Date,
      default: () => new Date(Date.now() + 9 * 60 * 60 * 1000) // KST (한국 시간)
    },
    updatedAt: {
      type: Date,
      default: () => new Date(Date.now() + 9 * 60 * 60 * 1000) // KST
    }
  },
  {timestamps: false}
);

// 인덱스 설정 (이름, 설명, 카테고리 검색 최적화)
PackageSchema.index({name: 'text', description: 'text', category: 'text'});

module.exports = mongoose.model('package', PackageSchema);
