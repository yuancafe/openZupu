/* eslint-disable */
describe('JwtStrategy', () => {
  const ORIGINAL_ENV = process.env;
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('fail-fast on missing JWT_SECRET', () => {
    it('should throw if JWT_SECRET is missing in production mode', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { JwtStrategy } = require('./jwt.strategy');
        new JwtStrategy();
      }).toThrow(/JWT_SECRET.*required/);
    });

    it('should NOT throw if NODE_ENV is "test"', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.JWT_SECRET;

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { JwtStrategy } = require('./jwt.strategy');
        new JwtStrategy();
      }).not.toThrow();
    });

    it('should NOT throw if NODE_ENV is "development" but JWT_SECRET is set', () => {
      process.env.NODE_ENV = 'development';
      process.env.JWT_SECRET = 'dev-secret';

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { JwtStrategy } = require('./jwt.strategy');
        new JwtStrategy();
      }).not.toThrow();
    });

    it('should NOT throw if NODE_ENV is unset (treated as production by guard)', () => {
      delete process.env.NODE_ENV;
      process.env.JWT_SECRET = 'some-secret';

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { JwtStrategy } = require('./jwt.strategy');
        new JwtStrategy();
      }).not.toThrow();
    });
  });

  describe('validate()', () => {
    it('should map JWT payload to user object', async () => {
      process.env.JWT_SECRET = 'dev-secret';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { JwtStrategy } = require('./jwt.strategy');
      const strategy = new JwtStrategy();
      const result = await strategy.validate({
        sub: 'user-123',
        username: 'admin',
        role: 'ADMIN',
      });
      expect(result).toEqual({
        userId: 'user-123',
        username: 'admin',
        role: 'ADMIN',
      });
    });
  });
});