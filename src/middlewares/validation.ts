import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const userRegistrationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).optional(),
  aadhaarNumber: Joi.string()
    .pattern(/^\d{12}$/)
    .message('Aadhaar number must be exactly 12 digits')
    .required(),
  mobile: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .message('Mobile number must be a valid 10-digit Indian mobile number')
    .required(),
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required(),
  role: Joi.string()
    .valid('superadmin', 'admin', 'user')
    .default('user'),
  password: Joi.string()
    .min(6)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .message('Password must contain at least one lowercase letter, one uppercase letter, and one number')
    .required(),
});

export const userLoginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

export const otpVerificationSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  otp: Joi.string()
    .pattern(/^\d{6}$/)
    .message('OTP must be exactly 6 digits')
    .required(),
});

export const resendOtpSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const createPostSchema = Joi.object({
  content: Joi.string()
    .trim()
    .min(1)
    .max(300)
    .required(),
  media: Joi.array()
    .items(Joi.string().uri())
    .max(5)
    .optional(),
  mediaType: Joi.array()
    .items(Joi.string().valid('image', 'video'))
    .optional(),
});

export const updatePostSchema = Joi.object({
  content: Joi.string()
    .trim()
    .min(1)
    .max(300)
    .optional(),
  media: Joi.array()
    .items(Joi.string().uri())
    .max(5)
    .optional(),
  mediaType: Joi.array()
    .items(Joi.string().valid('image', 'video'))
    .optional(),
});

export const createCommentSchema = Joi.object({
  content: Joi.string()
    .trim()
    .min(1)
    .max(500)
    .required(),
  postId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .message('Invalid post ID format')
    .required(),
});

export const sendMessageSchema = Joi.object({
  recipientId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .message('Invalid recipient ID format')
    .required(),
  content: Joi.string()
    .trim()
    .min(1)
    .max(1000)
    .required(),
});

export const idSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .message('Invalid ID format')
    .required(),
});

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    req.body = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors,
      });
      return;
    }

    req.params = value;
    next();
  };
};
