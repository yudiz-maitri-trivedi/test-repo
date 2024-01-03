const dbVar = {
  ADMINS_DB_URL: process.env.ADMINS_DB_URL || 'mongodb://localhost:27017/wp_web_admins',
  ADMINS_DB_POOLSIZE: process.env.ADMINS_DB_POOLSIZE || 10,

  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || 6379
}
module.exports = dbVar
