import { Inject, Injectable, Logger } from '@nestjs/common';

import { ENV, type Env } from '../config/env';

export type CodePurpose =
  'verify_email' | 'verify_phone' | 'login_otp' | 'reset_password';

const subjects: Record<CodePurpose, string> = {
  verify_email: 'Verify your email',
  verify_phone: 'Verify your phone number',
  login_otp: 'Your sign-in code',
  reset_password: 'Reset your password',
};

/**
 * Delivers one-time codes. Only the development `log` transport exists today; it writes codes to
 * the server log and is refused in production by `loadEnv`. Add an email/SMS provider here when
 * one is chosen — callers do not change.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(@Inject(ENV) private readonly env: Env) {}

  async sendEmailCode(
    to: string,
    purpose: CodePurpose,
    code: string,
  ): Promise<void> {
    switch (this.env.MAIL_TRANSPORT) {
      case 'log':
        this.logger.log(
          `[dev mail] to=${to} subject="${subjects[purpose]}" code=${code}`,
        );
        return;
    }
  }

  async sendSmsCode(
    to: string,
    purpose: CodePurpose,
    code: string,
  ): Promise<void> {
    switch (this.env.SMS_TRANSPORT) {
      case 'log':
        this.logger.log(`[dev sms] to=${to} purpose=${purpose} code=${code}`);
        return;
    }
  }
}
