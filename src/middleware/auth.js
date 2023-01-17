const passport = require('passport');
const httpStatus = require('http-status');
const { roleRights } = require('../config/roles');
const ApiError = require('../utils/ApiError');
const { User } = require('../models/User');

const verifyCallback = (req, resolve, reject, requiredRights) => async (err, user, info) => {
  if (err || info || !user) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }
  req.userId = user.id;

  const userInfo = await User.findByPk(user.id);

  if (requiredRights.length) {
    const userRights = roleRights.get(userInfo.type);
    const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
    if (!hasRequiredRights && req.params.userId !== user.id) {
      return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
    }
  }

  resolve();
};

exports.auth =
  (...requiredRights) =>
  async (req, res, next) => {
    return new Promise((resolve, reject) => {
      passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(req, res, next);
    })
      .then(() => next())
      .catch((err) => next(err));
  };
