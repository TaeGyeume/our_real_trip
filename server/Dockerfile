# Node.js 공식 이미지 사용
FROM node:18

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사 후 의존성 설치
COPY package.json ./
COPY package-lock.json ./
RUN npm install

# 전체 프로젝트 복사
COPY . .

# 서버 실행 포트
EXPOSE 5000

# 서버 실행
CMD ["node", "index.js"]
