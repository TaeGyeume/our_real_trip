import React, {useEffect, useState} from 'react';
import api from './api/axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import {BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import {useSocketStore} from './store/authStore';
import {AuthPages, Main, UserPages} from './pages';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import EditProfile from './pages/user/EditProfile';
import Header from './components/Header';
import Footer from './components/Footer';
import CouponSidebar from './components/coupons/CouponSidebar';
import NaverLoginCallback from './components/socialLogin/NaverLoginCallback';
import FacebookLoginCallback from './components/socialLogin/FacebookLoginCallback';
import KakaoLoginCallback from './components/socialLogin/KakaoLoginCallback';
import GoogleLoginCallback from './components/socialLogin/GoogleLoginCallback';
import FindUserId from './pages/auth/FindUserId';
import {useAuthStore} from './store/authStore'; // Zustand 스토어
import {useNotificationStore} from './store/notificationStore';
import PrivateRoute from './routes/PrivateRoute'; // 보호된 라우트 추가
import Unauthorized from './pages/Unauthorized'; // 권한 없음 페이지 추가
import AccommodationSearch from './pages/accommodations/AccommodationSearch';
import AccommodationResults from './pages/accommodations/AccommodationResults';
import AccommodationDetail from './pages/accommodations/AccommodationDetail';
import RoomDetail from './pages/accommodations/RoomDetail';
import Flights from './pages/flights/Flights';
import FlightResults from './pages/flights/FlightResults';
import RoundTripDeparture from './pages/flights/RoundTripDeparture';
import RoundTripReturn from './pages/flights/RoundTripReturn';
import RoundTripConfirm from './pages/flights/RoundTripConfirm';
import FlightBookingPage from './pages/booking/FlightBookingPage';
import FlightsList from './pages/product/flights/FlightsList';
import FlightForm from './pages/product/flights/FlightForm';
import TravelItemList from './pages/travelItem/TravelItemListPage';
import TravelItemDetail from './pages/travelItem/TravelItemDetailPage';
import MyCouponsPage from './pages/coupons/MyCouponsPage';
import ProductPage from './pages/product/ProductPage';
import AccommodationList from './pages/product/accommodations/AccommodationList';
import AccommodationCreate from './pages/product/accommodations/AccommodationCreate';
import AccommodationModify from './pages/product/accommodations/AccommodationModify';
import RoomNew from './pages/product/accommodations/RoomNew';
import RoomModify from './pages/product/accommodations/RoomModify';
import LocationAdd from './pages/product/accommodations/LocationAdd';
import LocationList from './pages/product/accommodations/LocationList';
import LocationEdit from './pages/product/accommodations/LocationEdit';
import TourTicketList from './components/product/tourTicket/TourTicketList';
import TourTicketForm from './components/product/tourTicket/TourTicketForm';
import TourTicketDetail from './components/product/tourTicket/TourTicketDetail';
import TourTicketModify from './components/product/tourTicket/TourTicketModify';
import CategoryPage from './pages/product/travelItems/CategoryPage';
import TravelItemPage from './pages/product/travelItems/TravelItemPage';
import TravelItemListPage from './pages/product/travelItems/TravelItemListPage';
import TravelItemEditPage from './pages/product/travelItems/TravelItemEditPage';
import CouponCreatePage from './pages/product/coupons/CouponCreatePage';
import CouponListPage from './pages/product/coupons/CouponListPage';
import UserTourTicketPage from './pages/tourTicket/UserTourTicketPage';
import TourTicketBookingPage from './pages/booking/TourTicketBookingPage';
import AccommodationBookingPage from './pages/booking/AccommodationBookingPage';
import TravelItemPurchaseForm from './components/booking/TravelItemPurchasePage';
import MyBookingPage from './pages/user/MyBookingPage';
import BookingDetailPage from './pages/user/BookingDetailPage';
import ChannelTalk from './components/channelTalk/ChannelTalk';
import MileagePage from './pages/mileage/MileagePage';
import '@fortawesome/fontawesome-free/css/all.min.css'; // FontAwesome 아이콘 스타일 불러오기
import FavoriteList from './components/user/FavoriteList'; // 즐겨찾기 목록 페이지
import QnaBoardList from './pages/qna/QnaBoardList';
import QnaBoardDetail from './pages/qna/QnaBoardDetail';
import QnaBoardWrite from './pages/qna/QnaBoardWrite';
import QnaBoardEdit from './pages/qna/QnaBoardEdit';
import ReviewForm from './components/review/ReviewForm';
import NotificationReceiver from './components/NotificationReceiver';
import PackageList from './components/product/package/PackageList';
import PackageDetail from './components/product/package/PackageDetail';
import PackageEdit from './components/product/package/PackageEdit';
import PackageCreate from './components/product/package/PackageCreate';
import PackageBookingForm from './components/booking/PackageBookingForm';
import AdminPackageList from './pages/product/packges/PackageList';
import Modal from 'react-modal';
// import FlightList from './components/flights/FlightList';
import LocationDetailPage from './pages/location/LocationDetailPage';

const App = () => {
  const [serverMessage, setServerMessage] = useState('');
  const checkAuth = useAuthStore(state => state.checkAuth);
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const {fetchNotifications, listenSocketNotifications} = useNotificationStore();
  const {socket, connect, disconnect} = useSocketStore();

  Modal.setAppElement('#root');

  // 서버 메시지 및 인증 상태 확인
  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const response = await api.get('/'); // 서버 연결 테스트
        setServerMessage(response.data.message);
      } catch (error) {
        console.error('서버 연결 실패:', error.message);
        setServerMessage('서버와 연결할 수 없습니다.');
      }
    };

    fetchMessage();
    checkAuth(); // 새로고침 시 인증 상태 확인 및 토큰 갱신
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      connect(user._id);
    }
    return () => disconnect();
  }, [isAuthenticated, user, connect, disconnect]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      if (socket) listenSocketNotifications(socket); // 소켓 실시간 이벤트 초기화
    }
  }, [isAuthenticated, fetchNotifications, listenSocketNotifications, socket]);

  return (
    <Router>
      {isAuthenticated && <NotificationReceiver />}
      {/* <h1 className="text-center">Our Real Trip</h1> */}
      <ChannelTalk />
      {serverMessage && (
        <div
          className={`alert ${
            serverMessage.includes('실패') ? 'alert-danger' : 'alert-success'
          }`}
          role="alert">
          {serverMessage}
        </div>
      )}
      <Header />
      <div className="container mt-5">
        <Routes>
          {/* 비인증 사용자 접근 가능 */}
          <Route path="/" element={<Navigate to="/main" />} />
          <Route path="/main" element={<Main />} />
          <Route path="/register" element={<AuthPages.Register />} />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/profile" /> : <AuthPages.Login />}
          />
          <Route path="/qna" element={<QnaBoardList />} />
          <Route path="/packages" element={<PackageList />} />
          <Route path="/package/:id" element={<PackageDetail />} />
          <Route path="/find-userid" element={<FindUserId />} />
          <Route path="/google/callback" element={<GoogleLoginCallback />} />
          <Route path="/kakao/callback" element={<KakaoLoginCallback />} />
          <Route path="/naver/callback" element={<NaverLoginCallback />} />
          <Route path="/facebook/callback" element={<FacebookLoginCallback />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/accommodations" element={<AccommodationSearch />} />
          <Route path="/accommodations/results" element={<AccommodationResults />} />
          <Route
            path="/accommodations/:accommodationId/detail"
            element={<AccommodationDetail />}
          />
          <Route path="/accommodation/room/:roomId" element={<RoomDetail />} />
          <Route path="/location/:id" element={<LocationDetailPage />} />

          {/* 항공편 목록 페이지 추가 */}
          <Route path="/flights" element={<Flights />} />
          <Route path="/flights/results" element={<FlightResults />} />
          <Route path="/flights/roundtrip-departure" element={<RoundTripDeparture />} />
          <Route path="/flights/roundtrip-return" element={<RoundTripReturn />} />
          <Route path="/flights/roundtrip-confirm" element={<RoundTripConfirm />} />

          <Route path="/travelItems" element={<TravelItemList />} />
          <Route path="/travelItems/:itemId" element={<TravelItemDetail />} />

          <Route path="/tourTicket/*" element={<UserTourTicketPage />} />

          {/* 인증된 사용자만 접근 가능 */}
          <Route element={<PrivateRoute />}>
            <Route path="/package/booking/:id" element={<PackageBookingForm />} />
            {/* <Route path="/reservation/:flightId" element={<Reservation />} /> */}
            <Route path="/profile" element={<UserPages.Profile />} />
            <Route path="/profile/update" element={<EditProfile />} />
            {/* <Route path="/:type/booking/:id" element={<TourTicektBookingPage />} /> */}
            <Route path="/tourTicket/booking/:id" element={<TourTicketBookingPage />} />
            <Route
              path="/accommodation/booking/:roomId"
              element={<AccommodationBookingPage />}
            />
            <Route path="/flights/booking" element={<FlightBookingPage />} />
            <Route path="/favorite-list" element={<FavoriteList />} />
            <Route path="/qna/:qnaBoardId" element={<QnaBoardDetail />} />
            <Route path="/qna/write" element={<QnaBoardWrite />} />
            <Route
              path="/travelItems/purchase/:itemId"
              element={<TravelItemPurchaseForm />}
            />
            <Route path="/qna/edit/:qnaBoardId" element={<QnaBoardEdit />} />
            <Route path="/booking/my" element={<MyBookingPage />} />
            <Route path="/coupons/my" element={<MyCouponsPage />} />
            <Route path="/mileage" element={<MileagePage />} />
            <Route path="/booking/detail/:bookingId" element={<BookingDetailPage />} />
            <Route path="/reviews/create" element={<ReviewForm />} />
          </Route>
          {/* 어드민 전용 페이지 */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/product/packages/list" element={<AdminPackageList />} />
            <Route path="/product/package/create" element={<PackageCreate />} />
            {/* <Route path="/package/edit/:id" element={<PackageEdit />} /> */}
            <Route path="/packages/:id/edit" element={<PackageEdit />} />{' '}
            <Route path="/product" element={<ProductPage />} />
            <Route path="/product/tourTicket/list" element={<TourTicketList />} />
            <Route path="/product/tourTicket/new" element={<TourTicketForm />} />
            <Route path="/product/accommodations/list" element={<AccommodationList />} />
            <Route path="/product/accommodations/new" element={<AccommodationCreate />} />
            <Route
              path="/product/accommodations/modify/:accommodationId"
              element={<AccommodationModify />}
            />
            <Route path="/product/room/new" element={<RoomNew />} />
            <Route path="/product/room/modify/:roomId" element={<RoomModify />} />
            <Route path="/product/locations/new" element={<LocationAdd />} />
            <Route path="/product/locations/list" element={<LocationList />} />
            <Route
              path="/product/locations/Edit/:locationId"
              element={<LocationEdit />}
            />
            <Route path="/product" element={<ProductPage />} />
            <Route path="/product/tourTicket/list" element={<TourTicketList />} />
            <Route path="/product/tourTicket/:id" element={<TourTicketDetail />} />
            <Route path="/product/tourTicket/modify/:id" element={<TourTicketModify />} />
            <Route path="/product/tourTicket/new" element={<TourTicketForm />} />
            <Route path="/product/travelItems/newCategory" element={<CategoryPage />} />
            <Route path="/product/travelItems/new" element={<TravelItemPage />} />
            <Route path="/product/travelItems/list" element={<TravelItemListPage />} />
            <Route path="/product/coupon/new" element={<CouponCreatePage />} />
            <Route path="/product/coupon/list" element={<CouponListPage />} />
            <Route
              path="/product/travelItems/edit/:itemId"
              element={<TravelItemEditPage />}
            />
            <Route path="/flights/list" element={<FlightsList />} />
            <Route path="/flights/create" element={<FlightForm />} />
            <Route path="/flights/edit/:id" element={<FlightForm />} />
          </Route>
          {/* 권한 없음 페이지 */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          {/* 404 처리 */}
          <Route path="*" element={<div>페이지를 찾을 수 없습니다.</div>} />
        </Routes>
      </div>
      <CouponSidebar />
      <Footer />
    </Router>
  );
};

export default App;
