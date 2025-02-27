import React, {useEffect, useState} from 'react';
import {getAvailableRoomsByDate} from '../../api/room/roomService';

const RoomAvailability = ({roomId, startDate}) => {
  const [availableRooms, setAvailableRooms] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const available = await getAvailableRoomsByDate(roomId, startDate);
        setAvailableRooms(available);
      } catch (error) {
        console.error('예약 가능 객실 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    if (roomId && startDate) {
      fetchAvailability();
    }
  }, [roomId, startDate]);

  return (
    <p>
      {loading
        ? '로딩 중...'
        : availableRooms > 0
          ? `예약 가능 객실: ${availableRooms}개`
          : '예약 불가'}
    </p>
  );
};

export default RoomAvailability;
