import useChannelTalk from '../../hooks/useChannelTalk';

const ChannelTalk = () => {
  useChannelTalk(); //  Hook 실행 (이 컴포넌트가 존재하면 채널톡 초기화됨
  return null; //  화면에 아무것도 렌더링하지 않음
};

export default ChannelTalk;
