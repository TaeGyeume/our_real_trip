const mongoose = require('mongoose');
const tourTicketService = require('../services/tourTicketService');

// 모든 투어.티켓 조회
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await tourTicketService.getAllTickets();
    res.json(tickets);
  } catch (error) {
    res.status(500).json({message: '서버 오류', error});
  }
};

// 특정 투어.티켓 상세 조회
exports.getTicketById = async (req, res) => {
  const {id} = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({message: '유효하지 않은 ID 형식입니다.'});
    }

    const ticket = await tourTicketService.getTicketById(id);
    if (ticket) {
      res.json(ticket);
    } else {
      res.status(404).json({message: '상품을 찾을 수 없습니다.'});
    }
  } catch (error) {
    res.status(500).json({message: '서버 오류', error});
  }
};

exports.createTicket = async (req, res) => {
  try {
    const {title, description, location, price, stock} = req.body;

    // 업로드된 파일 경로 리스트 생성
    const imagePaths = req.files
      ? req.files.map(file => `/uploads/${file.filename}`)
      : [];

    const newTicket = await tourTicketService.createTicket({
      title,
      description,
      location,
      price,
      stock,
      images: imagePaths
    });

    res.status(201).json({message: '상품 등록 성공', ticket: newTicket});
  } catch (error) {
    console.error('상품 등록 오류:', error);
    res.status(400).json({message: '상품 등록 실패', error: error.message});
  }
};

exports.updateTicket = async (req, res) => {
  try {
    const {title, description, location, price, stock, deleteImages} = req.body;
    const ticketId = req.params.id;

    let parsedDeleteImages = [];

    if (deleteImages) {
      try {
        parsedDeleteImages = JSON.parse(deleteImages);
      } catch (error) {
        console.error('JSON 파싱 오류:', error);
        return res.status(400).json({message: '잘못된 JSON 형식입니다.'});
      }
    }

    const updatedTicket = await tourTicketService.updateTourTicket(ticketId, {
      title,
      description,
      location,
      price,
      stock,
      deleteImages: parsedDeleteImages,
      newImages: req.files // 새 이미지 추가
    });

    res.status(200).json({message: '상품이 수정되었습니다.', updatedTicket});
  } catch (error) {
    console.error('상품 수정 오류:', error);
    res.status(500).json({message: '서버 오류가 발생했습니다.', error: error.message});
  }
};

// 투어.티켓 삭제
exports.deleteMultipleTickets = async (req, res) => {
  const {ticketIds} = req.body;

  if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
    return res.status(400).json({message: '삭제할 상품 ID가 올바르지 않습니다.'});
  }

  try {
    const deletedCount = await tourTicketService.deleteMultipleTickets(ticketIds);

    if (deletedCount === 0) {
      return res.status(404).json({message: '삭제할 상품을 찾을 수 없습니다.'});
    }

    res.status(200).json({message: `${deletedCount}개의 상품이 삭제되었습니다.`});
  } catch (error) {
    console.error('상품 삭제 오류:', error);
    res.status(500).json({message: '서버 오류가 발생했습니다.'});
  }
};
