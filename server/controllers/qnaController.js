const fs = require('fs');
const path = require('path');
const busboy = require('busboy');
const mongoose = require('mongoose');
const qnaService = require('../services/qnaService');

const createQnaBoard = async (req, res) => {
  try {
    const contentType = req.headers['content-type'] || '';

    // console.log(` 요청 Content-Type: ${contentType}`);

    // JSON 요청일 경우 (파일 없이 게시글 등록)
    if (contentType.includes('application/json')) {
      // console.log('  JSON 요청 처리');

      const {category, title, content} = req.body;
      const userId = req.user?.id;

      if (!category || !title || !content) {
        return res.status(400).json({error: '카테고리, 제목, 내용을 입력해야 합니다.'});
      }

      const qnaBoard = await qnaService.createQnaBoard(
        userId,
        category,
        title,
        content,
        [],
        []
      );

      // console.log(' JSON 요청으로 MongoDB 저장 완료:', qnaBoard);

      return res.status(201).json({
        message: 'QnA 게시글이 성공적으로 등록되었습니다.',
        qnaBoard
      });
    }

    // multipart/form-data 요청일 경우 (파일 포함)
    if (!contentType.includes('multipart/form-data')) {
      return res
        .status(400)
        .json({error: '파일 업로드는 multipart/form-data 형식이어야 합니다.'});
    }

    // console.log(' 📎 FormData 요청 처리 (파일 포함)');

    const bb = busboy({headers: req.headers});
    const uploadDir = path.join(__dirname, '../uploads/qna');

    let formData = {
      category: '',
      title: '',
      content: '',
      images: [],
      attachments: []
    };

    let fileUploadPromises = [];

    // 파일 저장 처리
    bb.on('file', (name, file, info) => {
      // console.log(` 파일 업로드 시작: ${info.filename}, 필드명: ${name}`);
      const {filename} = info;
      const saveTo = path.join(uploadDir, `${Date.now()}-${filename}`);
      const stream = fs.createWriteStream(saveTo);

      file.pipe(stream);

      file.on('end', () => {
        // console.log(` 파일 저장 완료: ${saveTo}`);

        if (name.startsWith('images')) {
          formData.images.push(`/uploads/qna/${path.basename(saveTo)}`);
        } else if (name.startsWith('attachments')) {
          formData.attachments.push(`/uploads/qna/${path.basename(saveTo)}`);
        }
      });

      stream.on('error', err => {
        console.error(' 파일 저장 오류:', err);
      });

      fileUploadPromises.push(
        new Promise(resolve => {
          stream.on('finish', () => {
            // console.log(` 파일 스트림 종료: ${saveTo}`);
            resolve();
          });
        })
      );
    });

    // 폼 필드 값 처리
    bb.on('field', (name, value) => {
      // console.log(` 폼 필드 수신: ${name} = ${value}`);
      if (value && value.trim() !== '') {
        formData[name] = value.trim();
      } else {
        // console.warn(` 필드 데이터가 비어 있음: ${name}`);
      }
    });

    // 모든 파일 업로드 완료 후 실행
    bb.on('finish', async () => {
      try {
        // console.log(' 모든 파일과 필드 수신 완료');
        await Promise.all(fileUploadPromises);

        // console.log(' 최종 저장할 데이터:', formData);
        const {category, title, content, images, attachments} = formData;
        const userId = req.user?.id;

        if (!category || !title || !content) {
          return res.status(400).json({error: '카테고리, 제목, 내용을 입력해야 합니다.'});
        }

        const qnaBoard = await qnaService.createQnaBoard(
          userId,
          category,
          title,
          content,
          images,
          attachments
        );

        // console.log(' MongoDB 저장 완료:', qnaBoard);

        return res.status(201).json({
          message: 'QnA 게시글이 성공적으로 등록되었습니다.',
          qnaBoard
        });
      } catch (error) {
        console.error(' QnA 게시글 생성 오류:', error);
        return res.status(500).json({error: error.message});
      }
    });

    req.pipe(bb);
  } catch (error) {
    console.error(' QnA 처리 중 오류 발생:', error);
    return res.status(500).json({error: '서버 오류 발생'});
  }
};

//  QnA 게시글 목록 조회 (페이징)
const getQnaBoards = async (req, res) => {
  try {
    const {page = 1, limit = 10, category} = req.query;

    const result = await qnaService.getQnaBoards(
      parseInt(page),
      parseInt(limit),
      category
    );
    res.status(200).json(result);
  } catch (error) {
    // console.error(' Error fetching QnA Boards:', error);
    res.status(500).json({error: error.message});
  }
};

//  특정 QnA 게시글 조회 (상세보기)
const getQnaBoardById = async (req, res) => {
  try {
    const {qnaBoardId} = req.params;

    const qnaBoard = await qnaService.getQnaBoardById(qnaBoardId);
    res.status(200).json(qnaBoard);
  } catch (error) {
    // console.error(' Error fetching QnA Board:', error);
    res.status(404).json({error: error.message});
  }
};

//  QnA 게시글 삭제 (작성자 또는 관리자만 가능)
const deleteQnaBoard = async (req, res) => {
  try {
    const {qnaBoardId} = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.roles.includes('admin');

    // console.log(` 게시글 삭제 요청:`, {
    //   boardId: qnaBoardId,
    //   userId,
    //   roles: req.user.roles
    // });

    //  1. 삭제할 게시글 정보 가져오기
    const qnaBoard = await qnaService.getQnaBoardById(qnaBoardId);
    if (!qnaBoard) {
      return res.status(404).json({error: '게시글을 찾을 수 없습니다.'});
    }

    //  2. 해당 게시글의 이미지 & 첨부파일 삭제
    const uploadDir = path.join(__dirname, '../uploads/qna');

    if (qnaBoard.images.length > 0) {
      qnaBoard.images.forEach(filePath => {
        const fullPath = path.join(uploadDir, path.basename(filePath));
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    if (qnaBoard.attachments.length > 0) {
      qnaBoard.attachments.forEach(filePath => {
        const fullPath = path.join(uploadDir, path.basename(filePath));
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    //  3. 게시글 삭제
    const result = await qnaService.deleteQnaBoard(qnaBoardId, userId, isAdmin);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(403).json({error: error.message});
  }
};

//  QnA 댓글 작성 (관리자 또는 사용자)
const createQnaComment = async (req, res) => {
  try {
    const {qnaBoardId} = req.params;
    const {content} = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin'; // 관리자 여부 확인

    const qnaComment = await qnaService.createQnaComment(
      qnaBoardId,
      userId,
      content,
      isAdmin
    );
    res.status(201).json({message: 'QnA 댓글이 등록되었습니다.', qnaComment});
  } catch (error) {
    console.error(' Error creating QnA Comment:', error);
    res.status(500).json({error: error.message});
  }
};

//  QnA 댓글 목록 조회 (페이징 처리)
const getQnaComments = async (req, res) => {
  try {
    const {qnaBoardId} = req.params;
    const {page = 1, limit = 5} = req.query;

    const result = await qnaService.getQnaComments(
      qnaBoardId,
      parseInt(page),
      parseInt(limit)
    );
    res.status(200).json(result);
  } catch (error) {
    // console.error(' Error fetching QnA Comments:', error);
    res.status(500).json({error: error.message});
  }
};

// QnA 댓글 삭제 (작성자 또는 관리자만 가능)
const deleteQnaComment = async (req, res) => {
  try {
    const {commentId} = req.params;
    const {id: userId, roles: userRoles} = req.user; // `req.user`에서 id와 roles 가져오기

    // console.log(' 댓글 삭제 요청:', {commentId, userId, userRoles});

    const result = await qnaService.deleteQnaComment(commentId, userId, userRoles);
    return res.status(200).json(result);
  } catch (error) {
    console.error(' Error deleting QnA Comment:', error);
    return res.status(403).json({error: error.message});
  }
};

const updateQnaBoard = async (req, res) => {
  try {
    // console.log('🛠️ [DEBUG] QnA 게시글 수정 요청 도착');

    const {qnaBoardId} = req.params; // URL에서 게시글 ID 가져오기
    const userId = req.user.id; // 사용자 ID

    // console.log('✏️ 수정할 게시글 ID:', qnaBoardId);
    // console.log('👤 사용자 ID:', userId);

    const formData = {
      category: '',
      title: '',
      content: '',
      images: [],
      attachments: [],
      deletedImages: [],
      deletedAttachments: []
    };

    const bb = busboy({headers: req.headers});

    bb.on('file', (name, file, info) => {
      const {filename} = info;
      const uploadDir = path.join(__dirname, '../uploads/qna');
      const saveTo = path.join(uploadDir, `${Date.now()}-${filename}`);
      const stream = fs.createWriteStream(saveTo);

      file.pipe(stream);

      file.on('end', () => {
        // console.log(` 파일 저장 완료: ${saveTo}`);
        if (name === 'images') {
          formData.images.push(`/uploads/qna/${path.basename(saveTo)}`);
        } else if (name === 'attachments') {
          formData.attachments.push(`/uploads/qna/${path.basename(saveTo)}`);
        }
      });
    });

    bb.on('field', (name, value) => {
      // console.log(` 폼 필드 수신: ${name} = ${value}`);

      if (name === 'deletedImages' || name === 'deletedAttachments') {
        try {
          // JSON 문자열이 제대로 전달되었는지 확인 후 변환
          formData[name] = JSON.parse(value);
          // console.log(` 변환된 ${name}:`, formData[name]);
        } catch (error) {
          console.warn(` ${name} 데이터 파싱 실패:`, value);
          formData[name] = []; // 변환 실패 시 빈 배열 사용
        }
      } else {
        formData[name] = value;
      }
    });

    bb.on('finish', async () => {
      // console.log(' 모든 데이터 수신 완료:', formData);

      try {
        // 2️ **MongoDB ObjectId 변환 (문자열 → ObjectId)**
        if (!mongoose.Types.ObjectId.isValid(qnaBoardId)) {
          throw new Error(`유효하지 않은 QnA 게시글 ID: ${qnaBoardId}`);
        }
        const objectId = new mongoose.Types.ObjectId(qnaBoardId);

        // 3️ 서비스 로직 호출
        const result = await qnaService.updateQnaBoard(
          objectId,
          userId,
          formData.category,
          formData.title,
          formData.content,
          formData.images,
          formData.attachments,
          formData.deletedImages,
          formData.deletedAttachments
        );

        // console.log(' QnA 게시글 수정 완료:', result);
        return res.status(200).json(result);
      } catch (error) {
        console.error(' QnA 게시글 수정 중 오류 발생:', error);
        return res.status(500).json({error: error.message});
      }
    });

    req.pipe(bb);
  } catch (error) {
    console.error(' QnA 게시글 수정 처리 중 서버 오류:', error);
    return res.status(500).json({error: '서버 오류 발생'});
  }
};

module.exports = {
  createQnaBoard,
  getQnaBoards,
  getQnaBoardById,
  deleteQnaBoard,
  createQnaComment,
  getQnaComments,
  deleteQnaComment,
  updateQnaBoard
};
