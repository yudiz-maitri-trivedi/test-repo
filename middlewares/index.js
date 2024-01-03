const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')
const cachegoose = require('recachegoose')
const helmet = require('helmet')
const Sentry = require('@sentry/node')
const compression = require('compression')
const hpp = require('hpp')
const fileUpload = require('express-fileupload')

const config = require('../config/config')

module.exports = (app) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: config.SENTRY_DSN,
      tracesSampleRate: 1.0
    })
  }
  cachegoose(mongoose, {
    engine: 'redis',
    host: config.REDIS_HOST,
    port: config.REDIS_PORT
  })

  app.use(morgan('dev'))
  app.use(cors())
  app.use(helmet())
  app.disable('x-powered-by')
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(hpp())

  /* global appRootPath */
  app.use(express.static(path.join(appRootPath, 'public')))
  app.set('view engine', 'ejs')
  app.use(fileUpload())
  app.use(compression({
    filter: function (req, res) {
      if (req.headers['x-no-compression']) {
        // don't compress responses with this request header
        return false
      }
      // fallback to standard filter function
      return compression.filter(req, res)
    }
  }))

  // set language in request object
  app.use((req, res, next) => {
    switch (req.header('Language')) {
      case 'hi':
        req.userLanguage = 'Hindi'
        break

      case 'en-us':
        req.userLanguage = 'English'
        break

      case 'pt-br':
        req.userLanguage = 'Portuguese'
        break

      default :
        req.userLanguage = 'English'
    }
    next()
  })
}
