import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AUTH_MESSAGES } from '../constants/message.js';

export const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).send({error: AUTH_MESSAGES.INVALID_TOKEN});
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id });

    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication Error:', error);
    res.status(401).send({error: AUTH_MESSAGES.INVALID_TOKEN});
  }
};