/* eslint-disable no-console */
const mongoose = require('mongoose')
const { AdminsDBConnect } = require('../../database/mongoose')
const jwt = require('jsonwebtoken')
const config = require('../../config/config')
const bcrypt = require('bcryptjs')
const saltRounds = 1
const salt = bcrypt.genSaltSync(saltRounds)
const Schema = mongoose.Schema
// const RoleModel = require('./roles/model')
const data = require('../../data')

const Vendor = new Schema({
  sName: { type: String, trim: true, required: true },
  sUsername: { type: String, trim: true, required: true, unique: true },
  sEmail: { type: String, trim: true, required: true, unique: true },
  sMobNum: { type: String, trim: true, required: true },
  sPassword: { type: String, trim: true, required: true },
  eStatus: { type: String, enum: data.vendorStatus, default: 'Y' },
  sPriorNum: { type: String }, // set prior num to send message if user have linked multiple wp acc
  sApiToken: { type: String, required: true },
  aJwtTokens: [{
    sToken: { type: String },
    dTimeStamp: { type: Date, default: Date.now }
  }],
  aWpAccounts: [{
    sMobNum: { type: String, trim: true },
    sClientId: { type: String },
    dLinkedAt: { type: Date, default: Date.now },
    ePlatform: { type: String, enum: data.ePlatform, map: { android: 'A', iOS: 'I' } },
    eStatus: { type: String, enum: data.status, default: 'Y' }
  }],
  dLoginAt: { type: Date },
  dPasswordchangeAt: { type: Date },
  bLoggedOut: { type: Boolean, default: false },
  dDeletedAt: { type: Date }
}, { timestamps: { createdAt: 'dCreatedAt', updatedAt: 'dUpdatedAt' } })

Vendor.index({ sEmail: 1, sUsername: 1 })
Vendor.index({ eStatus: 1 })

Vendor.pre('save', function (next) {
  const vendor = this
  let i
  if (vendor.isModified('sName')) {
    const sName = vendor.sName
    const splitFullName = sName.toLowerCase().split(' ')
    for (i = 0; i < splitFullName.length; i++) {
      splitFullName[i] = splitFullName[i].charAt(0).toUpperCase() + splitFullName[i].substring(1)
    }
    vendor.sName = splitFullName.join(' ')
  }
  if (vendor.isModified('sPassword')) {
    vendor.sPassword = bcrypt.hashSync(vendor.sPassword, salt)
  }
  next()
})

Vendor.statics.filterData = function (vendor) {
  vendor.__v = undefined
  vendor.aJwtTokens = undefined
  vendor.sPassword = undefined
  vendor.dUpdatedAt = undefined
  return vendor
}

Vendor.statics.findByToken = async function (token) {
  const vendor = this
  let decoded
  try {
    decoded = jwt.verify(token, config.JWT_SECRET)
  } catch (e) {
    return Promise.reject(e)
  }
  const query = {
    _id: decoded._id,
    'aJwtTokens.sToken': token,
    eStatus: 'Y',
    bLoggedOut: false
  }
  const vendorObj = await vendor.findOne(query)
  return vendorObj
}

Vendor.statics.findByRefreshToken = async function (token) {
  const vendor = this
  let decoded
  try {
    decoded = jwt.verify(token, config.REFRESH_TOKEN_SECRET)
  } catch (e) {
    return Promise.reject(e)
  }
  const query = {
    _id: decoded._id,
    eStatus: 'Y',
    bLoggedOut: false
  }

  const vendorObj = await vendor.findOne(query)
  return vendorObj
}

const VendorsModel = AdminsDBConnect.model('vendors', Vendor)

VendorsModel.syncIndexes().then(() => {
  console.log('vendor Model Indexes Synced')
}).catch((err) => {
  console.log('vendor Model Indexes Sync Error', err)
})
module.exports = VendorsModel
