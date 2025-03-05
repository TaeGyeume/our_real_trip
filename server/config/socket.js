const {Server} = require('socket.io');
let io;

const initSocket = server => {
  io = new Server(server, {
    cors: {
      origin:
        process.env.NODE_ENV === 'production'
          ? 'https://your-deployed-site.com' // 배포 환경
          : `http://localhost:${process.env.CLIENT_PORT || 3000}`, // 개발 환경
      methods: ['GET', 'POST']
    },
    path: '/socket.io' // 경로 명시적으로 지정
  });

  io.on('connection', socket => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      socket.join(userId);
      socket.on('disconnect', () => {});
    }
  });
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO가 초기화되지 않았습니다!');
  }
  return io;
};

module.exports = {initSocket, getIO};
