const Redis = require('ioredis')
const config = require('../config/config')
const { handleCatchError } = require('./utilities.services')
const sanitizeHtml = require('sanitize-html')
const flatted = require('flatted')

const redisClient = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD
})

redisClient.on('error', function (error) {
  console.log('Error in Redis', error)
  handleCatchError(error)
  process.exit(1)
})

redisClient.on('connect', function () {
  console.log('redis connected')
})

async function cacheObject (key, object) {
  try {
    // Use flatted.stringify to handle circular references
    const jsonString = flatted.stringify(object)

    await redisClient.set(key, jsonString, 'EX', 3600)

    console.log(`Object cached successfully with key: ${key}`)
  } catch (error) {
    console.error('Error caching object:', error)
  }
}

async function getObjectFromCache (key) {
  try {
    // Retrieve the JSON string from Redis
    const jsonString = await redisClient.get(key)

    if (jsonString) {
      // Parse the JSON string, handling circular references
      const cachedObject = flatted.parse(jsonString)
      console.log(cachedObject, 22)
      console.log(`Object retrieved successfully with key: ${key}`)
      return cachedObject
    } else {
      console.log(`No object found in cache with key: ${key}`)
      return null
    }
  } catch (error) {
    console.error('Error retrieving object from cache:', error)
    return null
  }
}

// // Example usage
// const objectKey = 'obj1'
// const cachedObject = getObjectFromCache(objectKey).then((result) => console.log(result))

// if (cachedObject) {
//   // Now you can use the retrieved object
//   console.log(cachedObject)
// } else {
//   console.log('Object not found in cache.')
// }

const queueObject = {
  sendSms: { name: 'sendSms', client: null },
  SendMail: { name: 'SendMail', client: null }
}
async function asignClientToQueues (queues) {
  for (const queue in queues) {
    queues[queue].client = await new Redis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD
    })
  }
}
asignClientToQueues(queueObject)

module.exports = {
  cacheObject,
  getObjectFromCache,
  queueObject,

  cacheRoute: function (duration) {
    return async (req, res, next) => {
      const key = '__express__' + sanitizeHtml(req.originalUrl || req.url)
      if (process.env.NODE_ENV === 'dev') return next()
      const cachedBody = await redisClient.get(key)
      if (cachedBody) {
        res.setHeader('is-cache', 1)
        res.setHeader('content-type', 'application/json')
        return res.send(cachedBody)
      } else {
        res.sendResponse = res.send
        res.send = (body) => {
          redisClient.set(key, body, 'EX', duration)
          res.setHeader('content-type', 'application/json')
          res.sendResponse(body)
        }
        next()
      }
    }
  },

  checkRateLimit: async function (threshold, path, ip) {
    try {
      const ipLimit = await redisClient.incr(`${path}:${ip}`)

      if (ipLimit > threshold) {
        return 'LIMIT_REACHED'
      } else {
        const ttl = await redisClient.ttl(`${path}:${ip}`)
        if (ttl === -1) {
          await redisClient.expire(`${path}:${ip}`, 1800)
        }
      }
    } catch (error) {
      handleCatchError(error)
    }
  },

  queuePush: function (queueName, data) {
    if (queueObject[`${queueName}`]) {
      return queueObject[`${queueName}`].client.rpush(queueObject[`${queueName}`].name, JSON.stringify(data))
    }
    return redisClient.rpush(queueName, JSON.stringify(data))
  },

  checkRateLimitOTP: function (sLogin, sType, sAuth) {
    return new Promise((resolve, reject) => {
      if (process.env.NODE_ENV === 'dev') resolve()
      if (!sLogin || !sType || !sAuth) resolve()
      redisClient.incr(`rlotp:${sLogin}:${sType}:${sAuth}:${(new Date()).getHours()}`).then(data => {
        if (data > 5) {
          resolve('LIMIT_REACHED')
        } else {
          redisClient.expire(`rlotp:${sLogin}:${sType}:${sAuth}:${(new Date()).getHours()}`, 1800).then().catch()
          resolve()
        }
      }).catch(error => {
        handleCatchError(error)
        resolve()
      })
    })
  },
  redisClient
}
