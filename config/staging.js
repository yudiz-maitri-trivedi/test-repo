const staging = {
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

  CACHE_2: 60, // 1 minute

  LOGIN_HARD_LIMIT: 5, // 0 = unlimited
  LOGIN_HARD_LIMIT_ADMIN: 10, // 0 = unlimited
  WP_ACC_HARD_LIMIT: process.env.WP_ACC_HARD_LIMIT || 10,
  JWT_VALIDITY: process.env.JWT_VALIDITY || '90d',
  JWT_SECRET: process.env.JWT_SECRET || 'aAbBcC@test_123',
  JWT_SECRET_USER: process.env.JWT_SECRET_USER || 'aAbBcC@test_123_User',
  REFRESH_TOKEN_VALIDITY: process.env.REFRESH_TOKEN_VALIDITY || '30d',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'aAbBcC@test_123',

  PRIVATE_KEY: `-----BEGIN RSA PRIVATE KEY-----
MIICXQIBAAKBgQDUH3YJ9lSOPsof/8qyHKPG1kuAQXNLEWE4bd+VLBgbEitOwm9+
TLpzcnzweaiVfr9NIoaEydxP4ZlJF/h/7fhOuazSQRld429/k+ZzyfmpDkGIPbgK
OndPdy0AuWZoiEMXKQvSbtmbCN0isWlquW1vU7FnSJi4Dm1LbgpnL6FLgwIDAQAB
AoGBAIbHaq/PxVAQU0tbssXS7rkDJjva2k/DPjuljF9zAeoJdFz5q+/a/skl4H7H
PjemrhRrsH8k54gV9th7k5htcswhjs+beqAAS2gbkfM2gyE1py3eMW+9o7B+iurd
anml/SQburJEOqHnavIH33IfqDL21ikNo++3CIfMobKcGbhRAkEA/MrF8V4JEhWH
RYp5dl4Ykeu6+yP71Yg1ZWAqRRBzU+Mvei4I2zO/wjYiBmSY/1R++bBRLV+uybfO
eAXzq49xSQJBANbQkaSTcQfMxXB/YmADBWSxzNuxeUqhkKvUlmrC9r6tMcPDjgkw
I02bPsrkZVWtb1JUvwF2sK9j1ZFsmwXXYmsCQC3BLe6wDIg/aUqG89Ee2ueeeSt3
qd9OVgvRShVSEu2+ExvUNTonta+bSLFLh/2+93SOG0NRLDvKjw5eVWpZ/jECQQC1
bWxEun5RXyI2NHAqtQJ+HCjwOAFABhrA9Yig3M83FeIc+/HfUrfOWNr800++v/9w
YsD7hHoPd9sturNniJTHAkAY27gpCsXkQ4mBYNMmyW7SvP0u7D4J39CpM1vLBInM
SSMOg2rBkjg7SFp1Y+xtRNv6V/fYLQq2ohILPu1KkHIf
-----END RSA PRIVATE KEY-----`,
  PUBLIC_KEY: `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDUH3YJ9lSOPsof/8qyHKPG1kuA
QXNLEWE4bd+VLBgbEitOwm9+TLpzcnzweaiVfr9NIoaEydxP4ZlJF/h/7fhOuazS
QRld429/k+ZzyfmpDkGIPbgKOndPdy0AuWZoiEMXKQvSbtmbCN0isWlquW1vU7Fn
SJi4Dm1LbgpnL6FLgwIDAQAB
-----END PUBLIC KEY-----`,
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
  IV_VALUE: process.env.IV_VALUE || 'abcdef9876543210abcdef9876543210'
}

module.exports = staging
