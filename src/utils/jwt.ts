import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  userName: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

export function generateAccessToken(userId: string, email: string, role: string, userName: string): string {
  const payload: JWTPayload = {
    userId,
    email,
    role,
    userName,
  };

  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, secretKey, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  } as jwt.SignOptions);
}

export function generateRefreshToken(userId: string): string {
  const payload: RefreshTokenPayload = {
    userId,
    tokenId: generateTokenId(),
  };

  const secretKey = process.env.JWT_REFRESH_SECRET;
  if (!secretKey) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, secretKey, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const decoded = jwt.verify(token, secretKey) as JWTPayload;
    return decoded;
  } catch (err) {
    return null;
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const secretKey = process.env.JWT_REFRESH_SECRET;
    if (!secretKey) {
      throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
    }

    const decoded = jwt.verify(token, secretKey) as RefreshTokenPayload;
    return decoded;
  } catch (err) {
    return null;
  }
}

function generateTokenId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
