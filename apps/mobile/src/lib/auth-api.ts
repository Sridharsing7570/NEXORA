import type {
  AuthResponse,
  AuthTokens,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  MeResponse,
  PhoneVerifyRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  UserProfile,
  VerifyEmailRequest,
} from '@repo/api/auth/auth.schemas';

import { api } from '@/lib/api';

/** Typed calls to the Nexora auth API. Request bodies are validated by the caller with the shared schemas. */
export const authApi = {
  login: (body: LoginRequest) => api<AuthResponse>('/auth/login', { method: 'POST', body, auth: false }),

  register: (body: RegisterRequest) => api<AuthResponse>('/auth/register', { method: 'POST', body, auth: false }),

  google: (idToken: string) =>
    api<AuthResponse>('/auth/google', { method: 'POST', body: { idToken }, auth: false }),

  requestPhoneCode: (phone: string) =>
    api<void>('/auth/phone/request-code', { method: 'POST', body: { phone }, auth: false }),

  verifyPhone: (body: PhoneVerifyRequest) =>
    api<AuthResponse>('/auth/phone/verify', { method: 'POST', body, auth: false }),

  forgotPassword: (body: ForgotPasswordRequest) =>
    api<void>('/auth/password/forgot', { method: 'POST', body, auth: false }),

  resetPassword: (body: ResetPasswordRequest) =>
    api<void>('/auth/password/reset', { method: 'POST', body, auth: false }),

  logout: (refreshToken: string) =>
    api<void>('/auth/logout', { method: 'POST', body: { refreshToken }, auth: false }),

  me: () => api<MeResponse>('/users/me'),

  updateProfile: (body: UpdateProfileRequest) => api<UserProfile>('/users/me', { method: 'PATCH', body }),

  requestEmailVerification: () => api<void>('/auth/email/request-verification', { method: 'POST' }),

  verifyEmail: (body: VerifyEmailRequest) => api<void>('/auth/email/verify', { method: 'POST', body }),

  /** Signs out every other session and returns fresh tokens for this one. */
  changePassword: (body: ChangePasswordRequest) =>
    api<{ tokens: AuthTokens }>('/auth/password/change', { method: 'POST', body }),

  logoutAll: () => api<void>('/auth/logout-all', { method: 'POST' }),
};
