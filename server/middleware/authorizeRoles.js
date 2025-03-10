const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // console.log(' [authorizeRoles] 요청한 사용자 정보:', req.user);

    if (!req.user || !req.user.roles) {
      return res.status(403).json({message: '권한이 없습니다.'});
    }

    if (!roles.some(role => req.user.roles.includes(role))) {
      return res.status(403).json({message: '접근 권한이 없습니다.'});
    }

    next();
  };
};

module.exports = authorizeRoles;
