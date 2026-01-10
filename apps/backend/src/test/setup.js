import { beforeAll, afterAll } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-12345';
process.env.PORT = '3001';

beforeAll(() => {
  console.log('Setting up test environment...');
});

afterAll(() => {
  console.log('Cleaning up test environment...');
});
