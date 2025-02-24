const express = require('express');
const router = express.Router();
const qnaController = require('../controllers/qnaController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, qnaController.createQnaBoard);

//  QnA 게시글 목록 조회 (페이징 & 카테고리 필터 가능)
router.get('/', qnaController.getQnaBoards);

//  특정 QnA 게시글 조회 (상세보기)
router.get('/:qnaBoardId', qnaController.getQnaBoardById);

//  QnA 게시글 삭제 (작성자 또는 관리자만 가능)
router.delete('/:qnaBoardId', authMiddleware, qnaController.deleteQnaBoard);

//  QnA 댓글 작성 (로그인 필요)
router.post('/:qnaBoardId/comments', authMiddleware, qnaController.createQnaComment);

//  QnA 댓글 목록 조회 (페이징 적용)
router.get('/:qnaBoardId/comments', qnaController.getQnaComments);

//  QnA 댓글 삭제 (작성자 또는 관리자만 가능)
router.delete('/comments/:commentId', authMiddleware, qnaController.deleteQnaComment);

// QnA 게시글 수정 (작성자만 수정 가능)
router.put('/:qnaBoardId', authMiddleware, qnaController.updateQnaBoard);

module.exports = router;
