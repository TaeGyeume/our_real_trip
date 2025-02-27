import axios from '../../api/axios';

/**
 * 특정 객실 삭제 요청
 * @param {string} roomId - 삭제할 객실 ID
 * @returns {Promise<void>}
 */
export const deleteRoom = async roomId => {
  return await axios.delete(`/rooms/${roomId}`);
};

/**
 * 특정 객실 정보를 가져오는 API 요청
 * @param {string} roomId - 조회할 객실 ID
 * @returns {Promise<Object>} - 객실 데이터 반환
 */
export const getRoomById = async roomId => {
  try {
    const response = await axios.get(`/rooms/${roomId}`);
    return response.data;
  } catch (error) {
    console.error('객실 정보 가져오기 실패:', error);
    throw new Error('객실 정보를 가져오는 중 오류 발생');
  }
};

/**
 * 특정 날짜에 예약 가능한 객실 개수 조회 API 요청
 * @param {string} roomId - 객실 ID
 * @param {string} date - 조회할 날짜 (YYYY-MM-DD 형식)
 * @returns {Promise<number>} - 예약 가능한 객실 개수 반환
 */
export const getAvailableRoomsByDate = async (roomId, date) => {
  try {
    const response = await axios.get(`/rooms/${roomId}/availability/${date}`);
    return response.data.availableRooms; // 서버에서 availableRooms 반환
  } catch (error) {
    console.error('예약 가능 객실 조회 실패:', error);
    throw new Error('예약 가능 객실을 조회하는 중 오류 발생');
  }
};
