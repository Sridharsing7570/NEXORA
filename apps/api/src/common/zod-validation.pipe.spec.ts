import { BadRequestException } from '@nestjs/common';
import { registerSchema } from '@repo/api';

import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(registerSchema);

  it('returns the parsed, normalized value', () => {
    expect(
      pipe.transform({ email: '  Me@Example.COM ', password: 'longenough' }),
    ).toEqual({
      email: 'me@example.com',
      password: 'longenough',
    });
  });

  it('reports each invalid field', () => {
    try {
      pipe.transform({ email: 'nope', password: 'short' });
      fail('expected validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const body = (error as BadRequestException).getResponse() as {
        issues: { path: string }[];
      };
      expect(body.issues.map((issue) => issue.path).sort()).toEqual([
        'email',
        'password',
      ]);
    }
  });
});
