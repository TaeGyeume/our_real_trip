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

    // 객실 관련 필드(roomIds, startDates, endDates)를 추가로 추출합니다.
    const {
      name,
      description,
      discountRate,
      startDate,
      endDate,
      accommodations,
      tours,
      flights,
      roomIds, // 추가
      startDates, // 추가
      endDates, // 추가
      category,
      createdBy
    } = req.body;

    // 필수 필드 검증 (룸 관련 필드는 필요에 따라 검증 여부 결정)
    if (
      !name ||
      !description ||
      !category ||
      !createdBy ||
      !accommodations ||
      !tours ||
      !flights
      // 필요하다면 roomIds, startDates, endDates도 필수 체크할 수 있습니다.
    ) {
      return res.status(400).json({message: '필수 필드가 누락되었습니다.'});
    }

    console.log(' [DEBUG] 요청 데이터:', req.body);

    // flights 배열 변환
    const flightDetails = Array.isArray(flights)
      ? flights.map(flight => {
          if (!mongoose.Types.ObjectId.isValid(flight.flightId)) {
            console.error(`[ERROR] 유효하지 않은 Flight ID: ${flight.flightId}`);
            throw new Error(`유효하지 않은 Flight ID: ${flight.flightId}`);
          }
          return {
            flightId: new mongoose.Types.ObjectId(flight.flightId),
            seatsToUse: flight.seatsToUse
          };
        })
      : [];

    console.log(' [DEBUG] flights after conversion:', flightDetails);

    // accommodations & tours 변환
    const accommodationIds = accommodations.map(acc => new mongoose.Types.ObjectId(acc));
    const tourIds = tours.map(tour => new mongoose.Types.ObjectId(tour));

    const createdById = new mongoose.Types.ObjectId(createdBy);

    // 숙소 가격 계산 및 존재 여부 검증
    if (Array.isArray(accommodations) && accommodations.length > 0) {
      console.log(' [DEBUG] 숙소 ID 목록:', accommodations);

      const accommodationData = await Accommodation.find({_id: {$in: accommodations}});
      console.log(' [DEBUG] 숙소 조회 결과:', accommodationData);

      if (!accommodationData || accommodationData.length !== accommodations.length) {
        throw new Error('숙소 정보를 찾을 수 없습니다.');
      }
    }

    // 컨트롤러에서 roomIds, startDates, endDates도 그대로 전달
    const packageData = {
      name,
      description,
      discountRate,
      startDate,
      endDate,
      accommodations: accommodationIds,
      tours: tourIds,
      flights: flightDetails,
      roomIds, // 그대로 전달 (서비스에서 ObjectId 및 Date 변환 처리)
      startDates, // 그대로 전달
      endDates, // 그대로 전달
      category,
      createdBy: createdById
    };

    console.log(' [DEBUG] 패키지 데이터 생성 완료:', packageData);

    // 패키지 생성 서비스 호출 (price 자동 계산 등)
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
