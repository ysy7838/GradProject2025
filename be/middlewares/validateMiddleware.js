import {check, validationResult} from "express-validator";

export const validateMiddleware = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({errors: errors.array()[0].msg});
    return;
  }
  next();
};
