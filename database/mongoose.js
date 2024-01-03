const mongoose = require('mongoose')
const { handleCatchError } = require('../helper/utilities.services')

const config = require('../config/config')

const AdminsDBConnect = connection(config.ADMINS_DB_URL, 'Admins')

function connection (DB_URL, DB) {
  try {
    const dbConfig = { useNewUrlParser: true, useUnifiedTopology: true, readPreference: 'secondaryPreferred' }

    const conn = mongoose.createConnection(DB_URL, dbConfig)
    // eslint-disable-next-line no-console
    conn.on('connected', () => console.log(`Connected to ${DB} database...`))
    return conn
  } catch (error) {
    handleCatchError(error)
  }
}

module.exports = {
  AdminsDBConnect
}
