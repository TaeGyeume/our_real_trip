import {io} from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:5000';

let socket;

export const connectSocket = userId => {
  socket = io(SOCKET_SERVER_URL, {
    query: {userId},
    transports: ['websocket'],
    path: '/socket.io', // path 명시
    reconnectionAttempts: 5, // 연결 실패 시 재시도 추가 (추천)
    reconnectionDelay: 1000 // 재연결 대기 시간
  });

  // socket.on('connect', () => {
  //   console.log('소켓 연결 성공:', socket.id);
  // });

  // socket.on('connect_error', err => {
  //   console.error('소켓 연결 실패:', err.message);
  // });

  // socket.on('disconnect', () => {
  //   console.log('소켓 연결 종료됨.');
  // });

  return socket;
};

export const getSocket = () => {
  if (!socket) throw new Error('소켓 연결이 초기화되지 않았습니다.');
  return socket;
};
