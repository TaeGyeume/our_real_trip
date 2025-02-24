const mongoose = require('mongoose');

const QnaCommentSchema = new mongoose.Schema(
  {
    qnaBoard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'qnaBoard', // 질문(QnA) 참조
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // 댓글 작성자
      required: true
    },
    content: {
      type: String,
      required: true
    },
    isAdmin: {
      type: Boolean,
      default: false // 관리자가 답변했는지 여부
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {timestamps: true}
);

//  페이징을 위한 인덱스 설정
QnaCommentSchema.index({qnaBoard: 1, createdAt: -1});

module.exports = mongoose.model('qnaComment', QnaCommentSchema);
