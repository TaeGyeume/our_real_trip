// 서버 실행 파일

require('dotenv').config();
const app = require('./app'); // Express 설정 가져옴, 실행은 여기서
const {initSocket} = require('./config/socket');
const notificationService = require('./services/notificationService');
const cron = require('node-cron');

const PORT = process.env.SERVER_PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

initSocket(server);

cron.schedule('0 0 * * *', async () => {
  console.log('예약 3일 전 알림 스케줄러 실행');
  try {
    await notificationService.sendBookingReminders();
    console.log('예약 알림 발송 완료');
  } catch (error) {
    console.error('예약 알림 발송 중 오류 발생:', error);
  }
});

// 임시 테스트용 1분마다 실행
// cron.schedule('*/1 * * * *', async () => {
//   console.log('예약 3일 전 알림 테스트 실행!');
//   try {
//     await notificationService.sendBookingReminders();
//     console.log('알림 전송 완료');
//   } catch (error) {
//     console.error('알림 전송 오류:', error);
//   }
// });
