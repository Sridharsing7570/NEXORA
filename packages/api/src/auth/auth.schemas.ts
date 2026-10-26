import { z } from 'zod';

/**
 * Request/response contracts for the authentication API, shared by the API (validation)
 * and clients (typing and form validation).
 */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Enter a valid email address.' }).max(254));

export const passwordSchema = z
  .string()
  .min(8, { error: 'Password must be at least 8 characters.' })
  .max(128, { error: 'Password must be at most 128 characters.' });

/** E.164 phone number, e.g. +919876543210. */
export const phoneSchema = z
  .string()
  .transform((value) => value.replace(/[\s()-]/g, ''))
  .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, { error: 'Enter the number with its country code, e.g. +919876543210.' }));

export const otpCodeSchema = z.string().regex(/^\d{6}$/, { error: 'Enter the 6-digit code.' });

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(100).optional(),
});
export type RegisterRequest = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
export type LoginRequest = z.infer<typeof loginSchema>;

export const googleSignInSchema = z.object({
  /** ID token returned by Google Sign-In on the device. */
  idToken: z.string().min(1),
});
export type GoogleSignInRequest = z.infer<typeof googleSignInSchema>;

export const phoneRequestCodeSchema = z.object({ phone: phoneSchema });
export type PhoneRequestCodeRequest = z.infer<typeof phoneRequestCodeSchema>;

export const phoneVerifySchema = z.object({ phone: phoneSchema, code: otpCodeSchema });
export type PhoneVerifyRequest = z.infer<typeof phoneVerifySchema>;

export const refreshSchema = z.object({ refreshToken: z.string().min(1) });
export type RefreshRequest = z.infer<typeof refreshSchema>;

export const verifyEmailSchema = z.object({ code: otpCodeSchema });
export type VerifyEmailRequest = z.infer<typeof verifyEmailSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
  newPassword: passwordSchema,
});
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  /** Omit when the account has no password yet (Google or phone sign-up). */
  currentPassword: z.string().min(1).max(128).optional(),
  newPassword: passwordSchema,
});
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(100).nullable().optional(),
    avatarUrl: z.url({ protocol: /^https$/ }).max(2048).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { error: 'Nothing to update.' });
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;

export type WorkspaceRole = 'owner' | 'admin' | 'member';

export type UserProfile = {
  id: string;
  email: string | null;
  emailVerified: boolean;
  phone: string | null;
  phoneVerified: boolean;
  name: string | null;
  avatarUrl: string | null;
  hasPassword: boolean;
  createdAt: string;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  kind: 'personal' | 'team';
  role: WorkspaceRole;
};

export type AuthTokens = {
  accessToken: string;
  /** Seconds until the access token expires. */
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

export type AuthResponse = {
  user: UserProfile;
  tokens: AuthTokens;
  /** True when this request created the account. */
  isNewUser: boolean;
};

export type MeResponse = {
  user: UserProfile;
  workspaces: WorkspaceSummary[];
};
