const TourTicket = require('../models/TourTicket');
const fs = require('fs');
const path = require('path');

// 모든 투어.티켓 조회
exports.getAllTickets = async () => {
  return await TourTicket.find().sort({createdAt: -1});
};

// 특정 투어.티켓 조회
exports.getTicketById = async id => {
  try {
    const ticket = await TourTicket.findByIdAndUpdate(
      id,
      {$inc: {views: 1}},
      {new: true}
    );

    if (!ticket) {
      throw new Error('해당 티켓을 찾을 수 없습니다.');
    }
    return ticket;
  } catch (error) {
    throw new Error('티켓을 가져오는 중 오류 발생: ' + error.message);
  }
};

exports.createTicket = async ticketData => {
  try {
    const ticket = new TourTicket(ticketData);
    return await ticket.save();
  } catch (error) {
    throw new Error(`상품 등록 오류: ${error.message}`);
  }
};

exports.updateTourTicket = async (
  ticketId,
  {title, description, price, stock, deleteImages, newImages}
) => {
  try {
    let ticket = await TourTicket.findById(ticketId);

    if (!ticket) {
      throw new Error('상품을 찾을 수 없습니다.');
    }

    // 기존 이미지 삭제 처리
    if (deleteImages && Array.isArray(deleteImages)) {
      deleteImages.forEach(imagePath => {
        const fullPath = path.join(
          __dirname,
          '..',
          imagePath.replace('/uploads/', 'uploads/')
        );

        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
          } catch (error) {
            console.error(`이미지 삭제 실패 (${fullPath}):`, error);
          }
        }
      });

      // DB에서도 삭제된 이미지 제거
      ticket.images = ticket.images.filter(img => !deleteImages.includes(img));
    }

    // 새로운 이미지 추가
    if (newImages && newImages.length > 0) {
      const newImagePaths = newImages.map(file => `/uploads/${file.filename}`);
      ticket.images = [...ticket.images, ...newImagePaths]; // 기존 이미지 + 추가된 이미지 유지
    }

    // 상품 정보 업데이트
    ticket.title = title || ticket.title;
    ticket.description = description || ticket.description;
    ticket.price = price || ticket.price;
    ticket.stock = stock || ticket.stock;

    ticket.updatedAt = new Date(Date.now() + 9 * 60 * 60 * 1000);
    await ticket.save();
    return ticket;
  } catch (error) {
    throw new Error(error.message || '상품 수정 중 오류 발생');
  }
};

// 투어.티켓 삭제
exports.deleteMultipleTickets = async ticketIds => {
  try {
    const tickets = await TourTicket.find({_id: {$in: ticketIds}});

    if (!tickets || tickets.length === 0) {
      throw new Error('삭제할 상품을 찾을 수 없습니다.');
    }

    tickets.forEach(ticket => {
      ticket.images.forEach(imagePath => {
        const fullPath = path.join(
          __dirname,
          '..',
          imagePath.replace('/uploads/', 'uploads/')
        );

        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
          } catch (error) {
            console.error(`이미지 삭제 실패 (${fullPath}):`, error);
          }
        }
      });
    });

    const result = await TourTicket.deleteMany({_id: {$in: ticketIds}}); // deleteMany({_id: {$in: ticketIds}}) 쿼리로 여러 개 삭제

    return result.deletedCount; // 삭제된 개수 반환
  } catch (error) {
    console.error('상품 삭제 중 오류 발생:', error);
    throw new Error('상품 삭제 실패');
  }
};
