const dev = {
  PORT: process.env.PORT || 3000,

  DISABLE_ADMIN_ROUTES: process.env.DISABLE_ADMIN_ROUTES === 'true',

  ADMINS_DB_URL: process.env.ADMINS_DB_URL || 'mongodb://localhost:27017/wp-_web_admins',
  ADMINS_DB_POOLSIZE: process.env.ADMINS_DB_POOLSIZE || 10,
  ADMIN_LOGIN_AUTHENTICATION: process.env.ADMIN_LOGIN_AUTHENTICATION || 'password',
  USERS_DB_URL: process.env.USERS_DB_URL || 'mongodb://localhost:27017/vendors',
  USERS_DB_POOLSIZE: process.env.USERS_DB_POOLSIZE || 50,

  STATISTICS_DB_URL: process.env.STATISTICS_DB_URL || 'mongodb://localhost:27017/fantasy_statistics',
  STATISTICS_DB_POOLSIZE: process.env.STATISTICS_DB_POOLSIZE || 10,

  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || 6379,

  OTP_PROVIDER: process.env.OTP_PROVIDER || 'TEST',
  LOGIN_HARD_LIMIT: process.env.LOGIN_HARD_LIMIT || '5',
  CACHE_2: 60, // 1 minute

  // LOGIN_HARD_LIMIT: 5, // 0 = unlimited
  LOGIN_HARD_LIMIT_ADMIN: 10, // 0 = unlimited
  WP_ACC_HARD_LIMIT: process.env.WP_ACC_HARD_LIMIT || 10,
  JWT_VALIDITY: process.env.JWT_VALIDITY || '90d',
  JWT_SECRET: process.env.JWT_SECRET || 'aAbBcC@test_123',
  JWT_SECRET_USER: process.env.JWT_SECRET_USER || 'aAbBcC@test_123_User',
  REFRESH_TOKEN_VALIDITY: process.env.REFRESH_TOKEN_VALIDITY || '30d',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'aAbBcC@test_123',

  PRIVATE_KEY: process.env.PRIVATE_KEY,
  PUBLIC_KEY: process.env.PUBLIC_KEY,
  bAllowDiskUse: process.env.MONGODB_ALLOW_DISK_USE || false,

  SENTRY_DSN: process.env.SENTRY_DSN || 'https://public@sentry.example.com/',

  NODE_ENV: process.env.NODE_ENV || 'dev',

  CLOUD_STORAGE_PROVIDER: process.env.CLOUD_STORAGE_PROVIDER || 'AWS',

  AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY || 'your aws access key',
  AWS_SECRET_KEY: process.env.AWS_SECRET_KEY || 'your aws secretAccessKey',
  AWS_REGION: process.env.AWS_REGION || 'your aws region',
  SMTP_FROM: process.env.SMTP_FROM || 'fwl47576@gmail.com',
  AWS_BUCKET_NAME: process.env.S3_BUCKET_NAME || 'your bucket name',
  S3_BUCKET_URL: process.env.S3_BUCKET_URL || 'https://wp-web-image.s3.ap-southeast-1.amazonaws.com/',

  CRON_AUTH_ENABLED: process.env.CRON_AUTH_ENABLED || false,
  CRON_AUTH_TOKEN: process.env.CRON_AUTH_TOKEN || 'test-secret',

  SWAGGER_AUTH_TOKEN: process.env.SWAGGER_AUTH_TOKEN || 'abab1234KI',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef',
  IV_VALUE: process.env.IV_VALUE || 'abcdef9876543210abcdef9876543210',
  MONGO_URI: 'mongodb+srv://maitri_trivedi24:mAitri_129@cluster0.u7rxpf0.mongodb.net/wp_web_dev_admins',
  ENGINE: 'redis',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379'
}

module.exports = dev
