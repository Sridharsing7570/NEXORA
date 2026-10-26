import type {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  MeResponse,
  PhoneVerifyRequest,
  RegisterRequest,
  ResetPasswordRequest,
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
};
