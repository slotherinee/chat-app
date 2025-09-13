export const config = {
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://postgres:password@localhost:5432/chat_app',
  JWT_SECRET: process.env.JWT_SECRET || 'secret',
};
