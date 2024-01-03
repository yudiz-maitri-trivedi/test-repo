/* eslint-disable no-console */
const express = require('express')

const config = require('./config/config')

const app = express()
global.appRootPath = __dirname

require('./database/mongoose')

require('./middlewares/index')(app)

require('./middlewares/routes')(app)

app.listen(config.PORT, () => {
  console.log('Magic happens on port :' + config.PORT)
})

module.exports = app
