import { createDatabase } from './index';

describe('createDatabase', () => {
  it('survives an idle connection being reset by the server', async () => {
    // No query is run, so nothing connects to this address.
    const { pool } = createDatabase('postgres://user:pass@127.0.0.1:1/none');
    const reset = Object.assign(new Error('read ECONNRESET'), {
      code: 'ECONNRESET',
    });

    // Without an 'error' listener, EventEmitter throws here — in production that kills the process.
    expect(pool.listenerCount('error')).toBeGreaterThan(0);
    expect(() => pool.emit('error', reset)).not.toThrow();

    await pool.end();
  });
});
