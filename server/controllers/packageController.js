const packageService = require('../services/packageService');
const mongoose = require('mongoose');
const Flight = require('../models/Flight'); // Flight 모델 추가
const Accommodation = require('../models/Accommodation');
const TourTicket = require('../models/TourTicket');
const Room = require('../models/Room');
const fs = require('fs');
const Package = require('../models/Package'); // 패키지 모델 불러오기

/**
 * 패키지 생성에 필요한 데이터 불러오기 (숙소, 투어/티켓, 항공)
 */
exports.getPackageCreateData = async (req, res) => {
  try {
    // 숙소, 투어/티켓, 항공 데이터 불러오기
    const accommodations = await Accommodation.find({}).populate({
      path: 'rooms',
      model: 'Room',
      select: 'name pricePerNight description'
    });

    // populate 후 rooms 중 null인 값 제거
    const filteredAccommodations = accommodations.map(acc => ({
      ...acc._doc,
      rooms: acc.rooms.filter(room => room !== null)
    }));

    const tourTickets = await TourTicket.find({});
    const flights = await Flight.find({});

    // 데이터가 제대로 불러와졌다면 응답으로 반환
    return res.status(200).json({
      accommodations: filteredAccommodations,
      tourTickets,
      flights
    });
  } catch (error) {
    console.error('[ERROR] 패키지 생성 데이터 불러오기 실패:', error);
    return res
      .status(500)
      .json({message: '패키지 생성 데이터 불러오기 실패', error: error.message});
  }
};

/**
 *  패키지 상품 생성 (관리자만 가능)
 */

exports.getPackageCreateData = async (req, res) => {
  try {
    // 숙소, 투어/티켓, 항공 데이터 불러오기
    const accommodations = await Accommodation.find({}).populate({
      path: 'rooms',
      model: 'Room',
      select: 'name pricePerNight description'
    });

    // populate 후 rooms 중 null인 값 제거
    const filteredAccommodations = accommodations.map(acc => ({
      ...acc._doc,
      rooms: acc.rooms.filter(room => room !== null)
    }));

    const tourTickets = await TourTicket.find({});
    const flights = await Flight.find({});

    return res.status(200).json({
      accommodations: filteredAccommodations,
      tourTickets,
      flights
    });
  } catch (error) {
    console.error('[ERROR] 패키지 생성 데이터 불러오기 실패:', error);
    return res
      .status(500)
      .json({message: '패키지 생성 데이터 불러오기 실패', error: error.message});
  }
};

/**
 * 패키지 상품 생성 (관리자만 가능)
 */
exports.createPackage = async (req, res) => {
  try {
    // 관리자 권한 체크
    if (!req.user || !req.user.roles || !req.user.roles.includes('admin')) {
      return res.status(403).json({message: '관리자만 패키지를 생성할 수 있습니다.'});
    }

    // 1) 요청 바디에서 필요한 필드들 추출
    let {
      name,
      description,
      discountRate,
      startDate,
      endDate,
      accommodations,
      tours,
      flights,
      // 기존에 roomIds가 있었다면, 그대로 두셔도 되고 무시하셔도 됩니다
      roomIds,
      startDates,
      endDates,
      rooms, // <-- "rooms" 필드(JSON) 예: '{"숙소ID":["방ID1","방ID2"]}'
      category,
      createdBy
    } = req.body;

    // 2) JSON 파싱: accommodations, tours, flights (문자열이면 파싱)
    if (typeof accommodations === 'string') {
      try {
        accommodations = JSON.parse(accommodations);
      } catch (err) {
        accommodations = [accommodations];
      }
    }
    if (typeof tours === 'string') {
      try {
        tours = JSON.parse(tours);
      } catch (err) {
        tours = [tours];
      }
    }
    if (typeof flights === 'string') {
      try {
        flights = JSON.parse(flights);
      } catch (err) {
        flights = [];
      }
    }

    // 2.5) rooms 필드(JSON) → roomIds 배열로 변환
    // 예: rooms = '{"67b16479...":["67c29d38...","67c29d8f..."], "67b607a8...":["..."]}'
    // parsedRooms = { '67b16479...': ['67c29d38...', '67c29d8f...'], ... }
    let parsedRooms = {};
    if (typeof rooms === 'string') {
      try {
        parsedRooms = JSON.parse(rooms);
      } catch (err) {
        console.error('rooms 필드 파싱 중 오류:', err);
        parsedRooms = {};
      }
    } else if (typeof rooms === 'object' && rooms !== null) {
      parsedRooms = rooms;
    }
    // roomIdsArray = 모든 숙소 방 ID를 하나로 모은 배열
    const roomIdsArray = Object.values(parsedRooms).flat();
    // (기존 roomIds가 있다면 무시하거나 합쳐서 써도 됩니다)

    // 2.6) startDates / endDates도 문자열이면 JSON.parse
    // 예: '["2025-03-05","2025-03-06"]' → 실제 배열 ["2025-03-05","2025-03-06"]
    if (typeof startDates === 'string') {
      try {
        startDates = JSON.parse(startDates);
      } catch (err) {
        console.error('startDates 파싱 오류:', err);
        startDates = [];
      }
    }
    if (typeof endDates === 'string') {
      try {
        endDates = JSON.parse(endDates);
      } catch (err) {
        console.error('endDates 파싱 오류:', err);
        endDates = [];
      }
    }

    // 3) 최소 2개 상품 포함 검증
    const hasAccommodations = Array.isArray(accommodations) && accommodations.length > 0;
    const hasTours = Array.isArray(tours) && tours.length > 0;
    const hasFlights = Array.isArray(flights) && flights.length > 0;
    if (!(hasAccommodations + hasTours + hasFlights >= 2)) {
      return res
        .status(400)
        .json({message: '패키지는 최소 2개의 상품을 포함해야 합니다.'});
    }

    // 필수 필드 체크
    if (
      !name ||
      !description ||
      !category ||
      !createdBy ||
      !accommodations ||
      !tours ||
      !flights
    ) {
      return res.status(400).json({message: '필수 필드가 누락되었습니다.'});
    }

    // discountRate가 문자열이면 숫자로 변환
    if (typeof discountRate === 'string') {
      discountRate = parseInt(discountRate, 10);
      if (isNaN(discountRate)) discountRate = 0;
    }

    console.log(' [DEBUG] 요청 데이터:', req.body);

    // 4) flights 배열 변환 (ObjectId 변환)
    const flightDetails = Array.isArray(flights)
      ? flights.map(flight => {
          if (
            typeof flight.flightId === 'string' &&
            mongoose.Types.ObjectId.isValid(flight.flightId)
          ) {
            return {
              flightId: new mongoose.Types.ObjectId(flight.flightId),
              seatsToUse: flight.seatsToUse
            };
          } else if (flight.flightId instanceof mongoose.Types.ObjectId) {
            return flight;
          } else {
            console.error(`🚨 [ERROR] 유효하지 않은 Flight ID: ${flight.flightId}`);
            throw new Error(`🚨 유효하지 않은 Flight ID: ${flight.flightId}`);
          }
        })
      : [];

    console.log(' [DEBUG] flights after conversion:', flightDetails);

    // 5) accommodations & tours 변환 (ObjectId)
    const accommodationIds = accommodations.map(acc => new mongoose.Types.ObjectId(acc));
    const tourIds = tours.map(tour => new mongoose.Types.ObjectId(tour));

    const createdById = mongoose.Types.ObjectId.isValid(createdBy)
      ? new mongoose.Types.ObjectId(createdBy)
      : req.user?._id;
    if (!createdById) {
      console.error(`🚨 [ERROR] 유효하지 않은 createdBy ID: ${createdBy}`);
      return res.status(400).json({message: '유효하지 않은 createdBy ID입니다.'});
    }

    // 6) 이미지 파일 경로 처리
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map(file => file.path);
    }

    // 7) 최종 packageData 구성
    const packageData = {
      name,
      description,
      discountRate,
      startDate,
      endDate,
      accommodations: accommodationIds,
      tours: tourIds,
      flights: flightDetails,
      // 우리가 방 정보(roomIds)를 roomIdsArray로 대체
      roomIds: roomIdsArray,
      startDates,
      endDates,
      category,
      createdBy: createdById,
      images: imagePaths
    };

    console.log(' [DEBUG] 패키지 데이터 생성 완료:', packageData);

    // 8) 서비스 호출
    const createdPackage = await packageService.createPackage(packageData);

    console.log(' [SUCCESS] 패키지 생성 완료:', createdPackage);
    return res.status(201).json(createdPackage);
  } catch (error) {
    console.error('[ERROR] 패키지 생성 실패:', error);
    return res.status(500).json({message: '패키지 생성 실패', error: error.message});
  }
};

/**
 * 전체 패키지 목록 조회 (페이징 + 제목 검색 가능)
 */
exports.getAllPackages = async (req, res) => {
  try {
    const {page = 1, limit = 10, search = ''} = req.query;

    const filters = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search
    };

    // 유효성 검사 (예: 페이지 및 limit 값이 숫자여야 한다)
    if (isNaN(filters.page) || filters.page <= 0) {
      return res.status(400).json({message: '유효하지 않은 페이지 번호입니다.'});
    }

    if (isNaN(filters.limit) || filters.limit <= 0) {
      return res.status(400).json({message: '유효하지 않은 limit 값입니다.'});
    }

    const packages = await packageService.getAllPackages(filters);
    return res.status(200).json(packages);
  } catch (error) {
    console.error('[ERROR] 패키지 목록 조회 실패:', error);
    return res.status(500).json({message: '패키지 목록 조회 실패', error: error.message});
  }
};

/**
 *  특정 패키지 상품 조회
 */
// 패키지 상세 조회 (예시)
exports.getPackageById = async (req, res) => {
  try {
    const {id} = req.params;

    const packageData = await Package.findById(id)
      .populate({
        path: 'accommodations',
        // 방(room)에서 roomType, pricePerNight를 보고 싶다면 select 문 추가
        populate: {
          path: 'rooms',
          select: 'roomType pricePerNight name'
        }
      })
      .populate({
        path: 'flights.flightId',
        // 항공편에서 보고 싶은 필드 추가
        select: 'flightNumber airline price departureDate'
      })
      // 투어티켓에서 title, price, images를 보고 싶다면
      .populate('tours', 'title price images');

    if (!packageData) {
      return res.status(404).json({message: '패키지를 찾을 수 없습니다.'});
    }

    // flightId가 없을 경우 대비
    packageData.flights = packageData.flights.map(flight => ({
      ...flight,
      flightId: flight.flightId || {}
    }));

    // 객실 가격 총합
    const totalRoomPrice = packageData.accommodations.reduce((sum, acc) => {
      return (
        sum + acc.rooms.reduce((roomSum, room) => roomSum + (room.pricePerNight || 0), 0)
      );
    }, 0);

    // 항공 가격
    const totalFlightPrice = packageData.flights.reduce((sum, flight) => {
      return sum + (flight.flightId.price || 0) * (flight.seatsToUse || 1);
    }, 0);

    // 투어티켓 가격 (quantity가 없으면 1로 처리)
    const totalTourPrice = packageData.tours.reduce((sum, tour) => {
      const qty = tour.quantity || 1;
      return sum + (tour.price || 0) * qty;
    }, 0);

    // 기본 가격
    const basePrice = totalRoomPrice + totalFlightPrice + totalTourPrice;

    // 패키지 할인
    const discountRate = packageData.discountRate || 0;
    const packageDiscount = Math.floor((basePrice * discountRate) / 100);
    const finalPrice = Math.max(basePrice - packageDiscount, 0);

    // 응답
    res.json({
      ...packageData.toObject(),
      totalRoomPrice,
      totalFlightPrice,
      totalTourPrice,
      basePrice,
      discountRate,
      packageDiscount,
      finalPrice
    });
  } catch (error) {
    console.error('패키지 상세 조회 오류:', error);
    res.status(500).json({message: '서버 오류'});
  }
};

/**
 *  패키지 상품 수정 (관리자만 가능)
 */
exports.updatePackage = async (req, res) => {
  try {
    if (!req.user || !req.user.roles || !req.user.roles.includes('admin')) {
      return res.status(403).json({message: '관리자만 패키지를 수정할 수 있습니다.'});
    }

    const {id} = req.params;
    console.log('🔍 [DEBUG] 요청 데이터:', req.body);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({message: '업데이트할 데이터가 없습니다.'});
    }

    // 1) JSON 필드 파싱: accommodations, tours, flights, rooms, existingImages
    let {accommodations, tours, flights, rooms, existingImages} = req.body;

    // accommodations: 문자열이면 파싱, 실패 시 단일 값으로 배열 처리
    if (typeof accommodations === 'string') {
      try {
        accommodations = JSON.parse(accommodations);
      } catch (err) {
        accommodations = [accommodations];
      }
      req.body.accommodations = accommodations;
    }

    // tours
    if (typeof tours === 'string') {
      try {
        tours = JSON.parse(tours);
      } catch (err) {
        tours = [tours];
      }
      req.body.tours = tours;
    }

    // flights
    if (typeof flights === 'string') {
      try {
        flights = JSON.parse(flights);
      } catch (err) {
        flights = [];
      }
      req.body.flights = flights;
    }

    // rooms (객체)
    if (typeof rooms === 'string') {
      try {
        rooms = JSON.parse(rooms);
      } catch (err) {
        rooms = {};
      }
      req.body.rooms = rooms;
    }

    // existingImages: 값이 없으면 빈 배열, 문자열이면 파싱, 아니면 배열로 처리
    if (!existingImages) {
      req.body.existingImages = [];
    } else if (typeof existingImages === 'string') {
      try {
        req.body.existingImages = JSON.parse(existingImages);
      } catch (err) {
        req.body.existingImages = [existingImages];
      }
    }
    // 보장: req.body.existingImages가 배열인지 확인
    if (!Array.isArray(req.body.existingImages)) {
      req.body.existingImages = [req.body.existingImages];
    }

    // 2) 새 이미지 파일이 업로드된 경우 처리
    if (req.files && req.files.length > 0) {
      const newImagePaths = req.files.map(file => file.path);

      // 기존 패키지 조회 후, 기존 이미지 중 제거할 것 있으면 삭제
      const currentPackage = await Package.findById(id);
      if (currentPackage && currentPackage.images && currentPackage.images.length > 0) {
        // 기존 이미지 중, req.body.existingImages에 없는 것 삭제
        currentPackage.images.forEach(oldPath => {
          if (!req.body.existingImages.includes(oldPath)) {
            fs.unlink(oldPath, err => {
              if (err) {
                console.error('이미지 삭제 실패:', oldPath, err);
              } else {
                console.log('이미지 삭제 성공:', oldPath);
              }
            });
          }
        });
      }
      // 최종 이미지: 기존 유지할 이미지 + 새로 업로드된 이미지
      req.body.images = [...req.body.existingImages, ...newImagePaths];
    } else {
      // 새 파일 없으면, 기존 이미지 유지
      req.body.images = req.body.existingImages || [];
    }

    // 3) 서비스 함수 호출
    const updatedPackage = await packageService.updatePackage(id, req.body);

    if (!updatedPackage) {
      return res.status(404).json({message: '패키지를 찾을 수 없습니다.'});
    }

    return res.status(200).json(updatedPackage);
  } catch (error) {
    console.error('[ERROR] 패키지 수정 실패:', error);
    return res.status(500).json({message: '패키지 수정 실패', error: error.message});
  }
};

/*
 * 패키지 상품 삭제 (관리자만 가능)
 */
exports.deletePackage = async (req, res) => {
  try {
    if (!req.user || !req.user.roles || !req.user.roles.includes('admin')) {
      return res.status(403).json({message: '관리자만 패키지를 삭제할 수 있습니다.'});
    }

    const {id} = req.params;

    // 먼저 해당 패키지를 조회하여 이미지 파일 경로들을 가져옵니다.
    const packageToDelete = await Package.findById(id);
    if (!packageToDelete) {
      return res.status(404).json({message: '패키지를 찾을 수 없습니다.'});
    }

    // 패키지에 등록된 이미지 파일 삭제
    if (packageToDelete.images && packageToDelete.images.length > 0) {
      packageToDelete.images.forEach(imagePath => {
        fs.unlink(imagePath, err => {
          if (err) {
            console.error('이미지 삭제 실패:', imagePath, err);
          } else {
            console.log('이미지 삭제 성공:', imagePath);
          }
        });
      });
    }

    // 서비스 또는 직접 DB에서 패키지 삭제
    const deletedPackage = await packageService.deletePackage(id);

    if (!deletedPackage) {
      return res.status(404).json({message: '패키지를 찾을 수 없습니다.'});
    }

    return res.status(200).json({message: '패키지가 성공적으로 삭제되었습니다.'});
  } catch (error) {
    console.error('[ERROR] 패키지 삭제 실패:', error);
    return res.status(500).json({message: '패키지 삭제 실패', error: error.message});
  }
};
