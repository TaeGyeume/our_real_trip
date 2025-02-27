const mongoose = require('mongoose');

// 사용자 스키마 정의
const UserSchema = new mongoose.Schema(
  {
    userid: {
      type: String, // 로그인 시 사용할 사용자 아이디 (로컬 로그인 시 필수)
      unique: true,
      sparse: true, // 소셜 로그인 시 userid가 없을 수 있으므로 sparse 설정
      default: undefined // null 대신 undefined로 설정
    },
    email: {
      type: String, // 비밀번호 찾기, 알림 수신용 이메일
      unique: true,
      sparse: true // 소셜 로그인 시 이메일이 없을 수 있으므로 sparse 설정
    },
    phone: {
      type: String, // 핸드폰 번호 (로컬 로그인 시 필수)
      unique: true,
      default: undefined, // 기본값을 undefined로 설정
      sparse: true // 소셜 로그인 시 핸드폰 번호가 없을 수 있으므로 sparse 설정
    },
    password: {
      type: String // 비밀번호 (로컬 로그인 시 필수, 소셜 로그인 시 불필요)
    },
    profileImage: {
      type: String, // 프로필 이미지 URL
      default: ''
    },
    address: {
      type: String, // 주소
      default: ''
    },
    username: {
      type: String, // 실제 사용자 이름 (예: 장동건, 유재석)
      default: ''
    },
    provider: {
      type: String, // 가입 유형 (local, facebook, google, naver, kakao)
      enum: ['local', 'facebook', 'google', 'naver', 'kakao'],
      default: 'local'
    },
    socialId: {
      type: String, // 소셜 로그인 ID (Facebook, Google, Naver, Kakao)
      default: undefined,
      sparse: true
    },
    totalSpent: {type: Number, default: 0}, // 누적 결제 금액
    membershipLevel: {
      type: String, // 회원 등급
      enum: ['길초보', '길잡이', '모험왕'],
      default: '길초보'
    },
    roles: {
      type: [String], // 사용자 역할 (admin, user)
      enum: ['user', 'admin'],
      default: ['user']
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId, // 즐겨찾기 항목
        ref: 'Product' // 참조할 컬렉션 (예: 여행 상품)
      }
    ],
    passwordResetToken: {
      type: String // 비밀번호 초기화 토큰 (이메일 발송 시 사용)
    },
    passwordResetExpires: {
      type: Date // 토큰 만료 시간
    },
    mileage: {type: Number, default: 0}
  },
  {timestamps: true} // 자동으로 createdAt, updatedAt 필드 추가
);

UserSchema.methods.updateMembership = function () {
  if (this.totalSpent >= 5_000_000) {
    this.membershipLevel = '모험왕';
  } else if (this.totalSpent >= 1_000_000) {
    this.membershipLevel = '길잡이';
  } else {
    this.membershipLevel = '길초보';
  }
};

module.exports = mongoose.model('User', UserSchema);
