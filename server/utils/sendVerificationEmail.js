const nodemailer = require('nodemailer');

//  이메일 발송 설정
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // SMTP 서버 (네이버: smtp.naver.com)
  port: 465, // SSL (보안 전송)
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 *  아이디 찾기 인증 코드 이메일 전송 함수
 * @param {string} email 수신자 이메일
 * @param {string} verificationCode 6자리 인증 코드
 */
const sendVerificationEmail = async (email, verificationCode) => {
  try {
    console.log(' [이메일 전송] 이메일:', email); //  이메일 주소 확인
    console.log(' [이메일 전송] 인증 코드:', verificationCode); //  인증 코드 확인

    const mailOptions = {
      from: `"Our Real Trip Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '아이디 찾기 인증 코드',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>아이디 찾기 인증 코드</h2>
          <p>안녕하세요.</p>
          <p>아래의 인증 코드를 입력하여 아이디를 확인하세요:</p>
          <h3 style="text-align: center; font-size: 24px; color: #ff6600;">
            ${verificationCode}
          </h3>
          <br />
          <p>이 코드는 <b>5분</b> 동안 유효합니다.</p>
          <p>감사합니다.<br>Our Real Trip 팀</p>
        </div>
      `
    };

    console.log(' [이메일 전송] 메일 옵션 생성 완료, 전송 시작...'); //  메일 옵션 확인

    // ✅ 이메일 전송
    const info = await transporter.sendMail(mailOptions);
    console.log(` [이메일 전송 성공] 전송 응답: ${info.response}`);
  } catch (error) {
    console.error(` [이메일 전송 실패] 오류 발생: ${error.message}`);
    throw new Error('이메일을 전송하는 중 오류가 발생했습니다.');
  }
};

module.exports = sendVerificationEmail;
