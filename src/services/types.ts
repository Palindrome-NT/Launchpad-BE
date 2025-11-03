export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  author?: string;
}

export interface PaginationResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UserRegistrationData {
  name?: string;
  email: string;
  mobile: string;
  aadhaarNumber: string;
  password: string;
  role?: 'superadmin' | 'admin' | 'user';
}

export interface UserLoginData {
  email: string;
  password: string;
}

export interface UserUpdateData {
  name?: string;
  mobile?: string;
}

export interface PostCreationData {
  content: string;
  media?: string[];
  mediaType?: string[];
}

export interface CommentCreationData {
  content: string;
  postId: string;
}

export interface MessageCreationData {
  recipientId: string;
  content: string;
}

export interface OTPVerificationData {
  email: string;
  otp: string;
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  user: {
    _id: string;
    name?: string;
    email: string;
    mobile: string;
    role: string;
    isVerified: boolean;
    isActive: boolean;
  };
}
