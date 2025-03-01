const packageService = require('../services/packageService');
const mongoose = require('mongoose');
const Flight = require('../models/Flight'); // Flight 모델 추가
const Accommodation = require('../models/Accommodation');
const TourTicket = require('../models/TourTicket');
const Room = require('../models/Room');
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
exports.createPackage = async (req, res) => {
  try {
    if (!req.user || !req.user.roles || !req.user.roles.includes('admin')) {
      return res.status(403).json({message: '관리자만 패키지를 생성할 수 있습니다.'});
    }

    const {
      name,
      description,
      discountRate,
      startDate,
      endDate,
      accommodations = [],
      tours = [],
      flights = [],
      roomIds,
      startDates,
      endDates,
      category,
      createdBy
    } = req.body;
    //  최소 2개 상품 조합 검증 (accommodations + tours, flights + accommodations, flights + tours 조합 가능)
    const hasAccommodations = accommodations.length > 0;
    const hasTours = tours.length > 0;
    const hasFlights = flights.length > 0;

    if (!(hasAccommodations + hasTours + hasFlights >= 2)) {
      return res
        .status(400)
        .json({message: '패키지는 최소 2개의 상품을 포함해야 합니다.'});
    }

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

    console.log(' [DEBUG] 요청 데이터:', req.body);

    // ✅ flights 배열 변환 (ObjectId 변환)
    const flightDetails = Array.isArray(flights)
      ? flights.map(flight => {
          // 🔥 문자열인 경우에만 ObjectId 변환! 이미 ObjectId라면 변환하지 않음.
          if (
            typeof flight.flightId === 'string' &&
            mongoose.Types.ObjectId.isValid(flight.flightId)
          ) {
            return {
              flightId: new mongoose.Types.ObjectId(flight.flightId),
              seatsToUse: flight.seatsToUse
            };
          } else if (flight.flightId instanceof mongoose.Types.ObjectId) {
            return flight; // 이미 ObjectId라면 변환하지 않음
          } else {
            console.error(`🚨 [ERROR] 유효하지 않은 Flight ID: ${flight.flightId}`);
            throw new Error(`🚨 유효하지 않은 Flight ID: ${flight.flightId}`);
          }
        })
      : [];

    console.log(' [DEBUG] flights after conversion:', flightDetails);

    // ✅ accommodations & tours 변환
    const accommodationIds = accommodations.map(acc => new mongoose.Types.ObjectId(acc));
    const tourIds = tours.map(tour => new mongoose.Types.ObjectId(tour));
    const createdById = mongoose.Types.ObjectId.isValid(req.body.createdBy)
      ? new mongoose.Types.ObjectId(req.body.createdBy)
      : req.user?._id; // ✅ `req.user._id`를 fallback으로 사용

    if (!createdById) {
      console.error(`🚨 [ERROR] 유효하지 않은 createdBy ID: ${req.body.createdBy}`);
      return res.status(400).json({message: '유효하지 않은 createdBy ID입니다.'});
    }

    const packageData = {
      name,
      description,
      discountRate,
      startDate,
      endDate,
      accommodations: accommodationIds,
      tours: tourIds,
      flights: flightDetails, // ✅ ObjectId 변환된 flights 사용
      roomIds,
      startDates,
      endDates,
      category,
      createdBy: createdById
    };

    console.log(' [DEBUG] 패키지 데이터 생성 완료:', packageData);

    // ✅ Service에 변환된 데이터를 전달
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
exports.getPackageById = async (req, res) => {
  try {
    const {id} = req.params;

    const packageData = await Package.findById(id)
      .populate({
        path: 'accommodations',
        populate: {path: 'rooms', select: 'pricePerNight'}
      })
      .populate({
        path: 'flights.flightId',
        select: 'flightNumber price'
      })

      .populate('tours', 'price');

    if (!packageData) {
      return res.status(404).json({message: '패키지를 찾을 수 없습니다.'});
    }

    packageData.flights = packageData.flights.map(flight => ({
      ...flight,
      flightId: flight.flightId || {} // flightId가 없으면 빈 객체
    }));

    // ✅ 숙소 가격: 객실 가격 총합 (최고가 X)
    const totalRoomPrice = packageData.accommodations.reduce((sum, acc) => {
      return (
        sum + acc.rooms.reduce((roomSum, room) => roomSum + (room.pricePerNight || 0), 0)
      );
    }, 0);

    // ✅ 항공 가격: 좌석 수 x 항공 가격
    const totalFlightPrice = packageData.flights.reduce((sum, flight) => {
      return sum + (flight.flightId.price * flight.seatsToUse || 0);
    }, 0);

    // ✅ 투어/티켓 가격: 선택한 개수 x 가격
    const totalTourPrice = packageData.tours.reduce((sum, tour) => {
      return sum + tour.price * (tour.quantity || 1);
    }, 0);

    // 기본 가격 (객실 + 투어 + 항공)
    const basePrice = totalRoomPrice + totalFlightPrice + totalTourPrice;

    // 패키지 할인 적용
    const discountRate = packageData.discountRate || 0;
    const packageDiscount = Math.floor((basePrice * discountRate) / 100);

    // 최종 가격 계산
    const finalPrice = Math.max(basePrice - packageDiscount, 0);

    // ✅ 클라이언트에 반환
    res.json({
      ...packageData.toObject(),
      totalRoomPrice, // 객실 가격 총합
      totalFlightPrice, // 항공 가격 (좌석 수 적용)
      totalTourPrice, // 투어 가격 (개수 적용)
      basePrice, // 할인 전 가격
      discountRate, // 할인율
      packageDiscount, // 할인 금액
      finalPrice // 최종 결제 금액
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
    // 관리자 권한 확인
    if (!req.user || !req.user.roles || !req.user.roles.includes('admin')) {
      return res.status(403).json({message: '관리자만 패키지를 수정할 수 있습니다.'});
    }

    const {id} = req.params;

    // 🔍 [DEBUG] 요청 바디 확인
    console.log('🔍 [DEBUG] 요청 데이터:', req.body);

    // req.body가 제대로 들어오는지 확인
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({message: '업데이트할 데이터가 없습니다.'});
    }

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
    // 관리자 권한 확인
    if (!req.user || !req.user.roles || !req.user.roles.includes('admin')) {
      return res.status(403).json({message: '관리자만 패키지를 삭제할 수 있습니다.'});
    }

    const {id} = req.params;
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
