![alt text](image.png)
```
our_real_trip
├─ client
│  ├─ .prettierrc.js
│  ├─ craco.config.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ favicon.ico
│  │  ├─ images
│  │  │  ├─ ad
│  │  │  │  ├─ accommodation1.jpg
│  │  │  │  ├─ accommodation2.png
│  │  │  │  ├─ accommodation3.png
│  │  │  │  ├─ accommodation4.jpg
│  │  │  │  ├─ air1.png
│  │  │  │  ├─ air2.png
│  │  │  │  ├─ air3.png
│  │  │  │  ├─ air4.png
│  │  │  │  ├─ main1.png
│  │  │  │  ├─ main2.png
│  │  │  │  ├─ tourticket1.png
│  │  │  │  ├─ tourticket2.png
│  │  │  │  ├─ tourticket3.png
│  │  │  │  └─ tourticket4.png
│  │  │  ├─ flightscard
│  │  │  │  ├─ busan.jpg
│  │  │  │  ├─ gwangju.jpg
│  │  │  │  ├─ jeju.jpg
│  │  │  │  └─ yeosu.jpg
│  │  │  ├─ logos
│  │  │  │  ├─ airseoul.png
│  │  │  │  ├─ asiana.png
│  │  │  │  ├─ eastar.png
│  │  │  │  ├─ jejuair.png
│  │  │  │  ├─ jinair.png
│  │  │  │  ├─ korean.png
│  │  │  │  └─ twayair.png
│  │  │  ├─ screen
│  │  │  │  ├─ background.gif
│  │  │  │  ├─ flightsloading.gif
│  │  │  │  └─ london.jpg
│  │  │  └─ travelItem
│  │  │     ├─ travelItemad1.jpg
│  │  │     └─ travelItemad2.jpg
│  │  ├─ index.html
│  │  ├─ logo192.png
│  │  ├─ logo512.png
│  │  ├─ manifest.json
│  │  └─ robots.txt
│  └─ src
│     ├─ api
│     │  ├─ accommodation
│     │  │  └─ accommodationService.js
│     │  ├─ auth
│     │  │  ├─ auth.js
│     │  │  └─ index.js
│     │  ├─ axios.js
│     │  ├─ booking
│     │  │  └─ bookingService.js
│     │  ├─ coupon
│     │  │  └─ couponService.js
│     │  ├─ flight
│     │  │  └─ flights.js
│     │  ├─ index.js
│     │  ├─ location
│     │  │  └─ locationService.js
│     │  ├─ mileage
│     │  │  └─ mileageService.js
│     │  ├─ notification
│     │  │  └─ notificationService.js
│     │  ├─ package
│     │  │  └─ packageService.js
│     │  ├─ qna
│     │  │  └─ qnaBoardService.js
│     │  ├─ review
│     │  │  └─ reviewService.js
│     │  ├─ room
│     │  │  └─ roomService.js
│     │  ├─ socket
│     │  │  └─ socket.js
│     │  ├─ tourTicket
│     │  │  └─ tourTicketService.js
│     │  ├─ travelItem
│     │  │  └─ travelItemService.js
│     │  ├─ user
│     │  │  ├─ favoriteService.js
│     │  │  ├─ index.js
│     │  │  └─ user.js
│     │  └─ views
│     │     └─ viewsService.js
│     ├─ App.css
│     ├─ App.js
│     ├─ components
│     │  ├─ accommodations
│     │  │  ├─ AccommodationAmenities.js
│     │  │  ├─ AccommodationCard.js
│     │  │  ├─ AccommodationImageGallery.js
│     │  │  ├─ AccommodationSearch.js
│     │  │  ├─ FilterPanel.js
│     │  │  ├─ GoogleMapComponent.js
│     │  │  ├─ index.js
│     │  │  ├─ NearbyAccommodations.js
│     │  │  ├─ PopularAccommodations.js
│     │  │  ├─ RoomAvailability.js
│     │  │  ├─ RoomCard.js
│     │  │  ├─ RoomImageGallery.js
│     │  │  ├─ SearchBar.js
│     │  │  └─ styles
│     │  │     ├─ AccommodationCard.css
│     │  │     └─ FilterPanel.css
│     │  ├─ ad
│     │  │  └─ AdBanner.js
│     │  ├─ Auth
│     │  │  └─ FindUserIdForm.js
│     │  ├─ booking
│     │  │  ├─ AccommodationBookingForm.js
│     │  │  ├─ AccommodationInfo.js
│     │  │  ├─ BookingSidebar.js
│     │  │  ├─ CouponSelector.js
│     │  │  ├─ FlightBookingForm.js
│     │  │  ├─ MyBookingList.js
│     │  │  ├─ PaymentInfo.js
│     │  │  ├─ QuantitySelector.js
│     │  │  ├─ ReservationInfo.js
│     │  │  ├─ styles
│     │  │  │  ├─ BookingSidebar.css
│     │  │  │  ├─ MyBookingList.css
│     │  │  │  └─ TourTicketBookingForm.css
│     │  │  ├─ TourTicketBookingForm.js
│     │  │  ├─ TourTicketInfo.js
│     │  │  ├─ TravelItemInfo.js
│     │  │  └─ TravelItemPurchasePage.js
│     │  ├─ channelTalk
│     │  │  └─ ChannelTalk.js
│     │  ├─ common
│     │  │  └─ ConsoleLogo.js
│     │  ├─ coupons
│     │  │  ├─ CouponSidebar.js
│     │  │  └─ MyCoupons.js
│     │  ├─ flights
│     │  │  ├─ FlightCard.js
│     │  │  ├─ FlightCardList.js
│     │  │  ├─ FlightList.js
│     │  │  ├─ FlightSearch.js
│     │  │  ├─ FlightSearchCard.js
│     │  │  ├─ LoadingScreen.js
│     │  │  ├─ OneWayBooking.js
│     │  │  ├─ RoundTripBooking.js
│     │  │  ├─ RoundTripSearch.js
│     │  │  ├─ SearchResultsList.js
│     │  │  └─ styles
│     │  │     ├─ FlightSearch.css
│     │  │     └─ LoadingScreen.css
│     │  ├─ Footer.js
│     │  ├─ Header.js
│     │  ├─ LogoutButton.js
│     │  ├─ mileage
│     │  │  ├─ MileageHistory.js
│     │  │  ├─ MileageInput.js
│     │  │  └─ MileageSummary.js
│     │  ├─ NotificationMenu.js
│     │  ├─ NotificationReceiver.js
│     │  ├─ product
│     │  │  ├─ accommodations
│     │  │  │  ├─ AccommodationCard.js
│     │  │  │  ├─ AccommodationForm.js
│     │  │  │  ├─ AccommodationList.js
│     │  │  │  ├─ LocationForm.js
│     │  │  │  └─ SearchBar.js
│     │  │  ├─ coupons
│     │  │  │  ├─ CouponForm.js
│     │  │  │  ├─ CouponList.js
│     │  │  │  └─ styles
│     │  │  │     └─ CouponList.css
│     │  │  ├─ flights
│     │  │  ├─ notification
│     │  │  │  └─ SendNotificationModal.js
│     │  │  ├─ tourTicket
│     │  │  │  ├─ styles
│     │  │  │  │  ├─ TourTicketDetail.css
│     │  │  │  │  └─ TourTicketList.css
│     │  │  │  ├─ TourTicketDetail.js
│     │  │  │  ├─ TourTicketForm.js
│     │  │  │  ├─ TourTicketList.js
│     │  │  │  └─ TourTicketModify.js
│     │  │  └─ travelItems
│     │  │     ├─ CategoryForm.js
│     │  │     ├─ CategoryList.js
│     │  │     ├─ CategorySelector.js
│     │  │     ├─ TravelItemCard.js
│     │  │     ├─ TravelItemForm.js
│     │  │     └─ TravelItemList.js
│     │  ├─ review
│     │  │  ├─ ReviewForm.js
│     │  │  ├─ ReviewList.js
│     │  │  └─ styles
│     │  │     └─ ReviewList.css
│     │  ├─ Sidebar.js
│     │  ├─ socialLogin
│     │  │  ├─ FacebookLoginCallback.js
│     │  │  ├─ GoogleLoginCallback.js
│     │  │  ├─ KakaoLoginCallback.js
│     │  │  └─ NaverLoginCallback.js
│     │  ├─ SocialLoginButtons.js
│     │  ├─ tourTicket
│     │  │  ├─ styles
│     │  │  │  ├─ TourTicketDetail.css
│     │  │  │  └─ TourTicketList.css
│     │  │  ├─ TourTicketDetail.js
│     │  │  ├─ TourTicketFilter.js
│     │  │  └─ TourTicketList.js
│     │  ├─ user
│     │  │  ├─ FavoriteButton.js
│     │  │  ├─ FavoriteList.js
│     │  │  └─ styles
│     │  │     ├─ FavoriteList.css
│     │  │     └─ styles.css
│     │  └─ views
│     │     ├─ PopularProductsCard.js
│     │     └─ PopularProductsSlider.js
│     ├─ contexts
│     │  └─ ReviewContext.js
│     ├─ hooks
│     │  └─ useChannelTalk.js
│     ├─ index.css
│     ├─ index.js
│     ├─ pages
│     │  ├─ accommodations
│     │  │  ├─ AccommodationDetail.js
│     │  │  ├─ AccommodationResults.js
│     │  │  ├─ AccommodationSearch.js
│     │  │  └─ RoomDetail.js
│     │  ├─ auth
│     │  │  ├─ FindUserId.js
│     │  │  ├─ ForgotPassword.js
│     │  │  ├─ index.js
│     │  │  ├─ Login.js
│     │  │  ├─ Register.js
│     │  │  ├─ ResetPassword.js
│     │  │  └─ style
│     │  │     └─ login.css
│     │  ├─ booking
│     │  │  ├─ AccommodationBookingPage.js
│     │  │  ├─ FlightBookingPage.js
│     │  │  └─ TourTicketBookingPage.js
│     │  ├─ coupons
│     │  │  └─ MyCouponsPage.js
│     │  ├─ flights
│     │  │  ├─ FlightResults.js
│     │  │  ├─ Flights.js
│     │  │  ├─ RoundTripConfirm.js
│     │  │  ├─ RoundTripDeparture.js
│     │  │  └─ RoundTripReturn.js
│     │  ├─ index.js
│     │  ├─ main.js
│     │  ├─ mileage
│     │  │  └─ MileagePage.js
│     │  ├─ package
│     │  │  ├─ PackageCreate.js
│     │  │  ├─ PackageDetail.js
│     │  │  ├─ PackageEdit.js
│     │  │  └─ PackageList.js
│     │  ├─ product
│     │  │  ├─ accommodations
│     │  │  │  ├─ AccommodationCreate.js
│     │  │  │  ├─ AccommodationList.js
│     │  │  │  ├─ AccommodationModify.js
│     │  │  │  ├─ LocationAdd.js
│     │  │  │  ├─ LocationEdit.js
│     │  │  │  ├─ LocationList.js
│     │  │  │  ├─ RoomModify.js
│     │  │  │  └─ RoomNew.js
│     │  │  ├─ coupons
│     │  │  │  ├─ CouponCreatePage.js
│     │  │  │  └─ CouponListPage.js
│     │  │  ├─ ProductPage.js
│     │  │  ├─ tourTicket
│     │  │  │  └─ AdminTourTicketPage.js
│     │  │  └─ travelItems
│     │  │     ├─ CategoryPage.js
│     │  │     ├─ TravelItemEditPage.js
│     │  │     ├─ TravelItemListPage.js
│     │  │     └─ TravelItemPage.js
│     │  ├─ qna
│     │  │  ├─ QnaBoardDetail.js
│     │  │  ├─ QnaBoardEdit.js
│     │  │  ├─ QnaBoardList.js
│     │  │  ├─ QnaBoardWrite.js
│     │  │  └─ styles
│     │  │     ├─ QnaBoardDetail.css
│     │  │     ├─ QnaBoardList.css
│     │  │     └─ QnaBoardWrite.css
│     │  ├─ tourTicket
│     │  │  └─ UserTourTicketPage.js
│     │  ├─ travelItem
│     │  │  ├─ styles
│     │  │  │  └─ TravelItemDetailPage.css
│     │  │  ├─ TravelItemDetailPage.js
│     │  │  └─ TravelItemListPage.js
│     │  ├─ Unauthorized.js
│     │  └─ user
│     │     ├─ BookingDetailPage.js
│     │     ├─ EditProfile.js
│     │     ├─ index.js
│     │     ├─ MyBookingPage.js
│     │     ├─ Profile.js
│     │     └─ styles
│     │        ├─ FavoriteListPage.css
│     │        └─ MyBookingPage.css
│     ├─ routes
│     │  └─ PrivateRoute.js
│     ├─ store
│     │  ├─ authStore.js
│     │  └─ notificationStore.js
│     ├─ styles
│     │  └─ Sidebar.css
│     └─ utils
│        └─ airportData.js
├─ image.png
├─ package-lock.json
├─ package.json
├─ README.md
└─ server
   ├─ .prettierrc.js
   ├─ app.js
   ├─ config
   │  ├─ cookieConfig.js
   │  ├─ db.js
   │  ├─ emailConfig.js
   │  ├─ passport.js
   │  └─ socket.js
   ├─ controllers
   │  ├─ accommodationController.js
   │  ├─ authController.js
   │  ├─ bookingController.js
   │  ├─ couponController.js
   │  ├─ favoriteController.js
   │  ├─ flightController.js
   │  ├─ locationController.js
   │  ├─ notificationController.js
   │  ├─ packageController.js
   │  ├─ qnaController.js
   │  ├─ reviewController.js
   │  ├─ roomController.js
   │  ├─ tourTicketController.js
   │  ├─ travelItemController.js
   │  ├─ userCouponController.js
   │  ├─ userMileageController.js
   │  └─ viewsController.js
   ├─ index.js
   ├─ middleware
   │  ├─ authMiddleware.js
   │  ├─ authorizeRoles.js
   │  └─ uploadMiddleware.js
   ├─ models
   │  ├─ Accommodation.js
   │  ├─ Booking.js
   │  ├─ Coupon.js
   │  ├─ favorite.js
   │  ├─ Flight.js
   │  ├─ index.js
   │  ├─ Location.js
   │  ├─ MileageHistory.js
   │  ├─ Notification.js
   │  ├─ Package.js
   │  ├─ Payment.js
   │  ├─ QnaBoard.js
   │  ├─ QnaComment.js
   │  ├─ RefreshToken.js
   │  ├─ Review.js
   │  ├─ Room.js
   │  ├─ TourTicket.js
   │  ├─ TravelItem.js
   │  ├─ User.js
   │  ├─ UserCoupon.js
   │  └─ Verification.js
   ├─ package-lock.json
   ├─ package.json
   ├─ routes
   │  ├─ accommodationRoutes.js
   │  ├─ authRoutes.js
   │  ├─ bookingRoutes.js
   │  ├─ couponRoutes.js
   │  ├─ favoriteRoutes.js
   │  ├─ flightRoutes.js
   │  ├─ index.js
   │  ├─ locationRoutes.js
   │  ├─ notificationRoutes.js
   │  ├─ packageRoutes.js
   │  ├─ productRoutes.js
   │  ├─ qnaRoutes.js
   │  ├─ reviewRoutes.js
   │  ├─ roomRoutes.js
   │  ├─ socialAuthRoutes.js
   │  ├─ tourTicket
   │  │  ├─ tourTicketRoutes.js
   │  │  └─ userTourTicketRoutes.js
   │  ├─ travelItemRoutes.js
   │  ├─ userCouponRoutes.js
   │  ├─ userMileageRoutes.js
   │  └─ viewsRoutes.js
   ├─ scripts
   │  ├─ fetchDomesticFlights.js
   │  ├─ fetchFlightsByDate.js
   │  ├─ fetchInternationalFlights.js
   │  └─ fetchTodayFlights.js
   ├─ services
   │  ├─ accommodationService.js
   │  ├─ authService.js
   │  ├─ bookingService.js
   │  ├─ couponService.js
   │  ├─ favoriteService.js
   │  ├─ locationService.js
   │  ├─ notificationService.js
   │  ├─ packageService.js
   │  ├─ qnaService.js
   │  ├─ reviewService.js
   │  ├─ roomService.js
   │  ├─ tourTicketService.js
   │  ├─ travelItemService.js
   │  ├─ userCouponService.js
   │  ├─ userMileageService.js
   │  └─ viewsService.js
   ├─ test
   │  └─ createTests.js
   └─ utils
      └─ sendVerificationEmail.js

```