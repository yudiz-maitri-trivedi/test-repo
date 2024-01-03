/* eslint-disable no-console */
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const { AdminsDBConnect } = require('../../database/mongoose')
const jwt = require('jsonwebtoken')
const config = require('../../config/config')
const bcrypt = require('bcryptjs')
const saltRounds = 1
const salt = bcrypt.genSaltSync(saltRounds)
const Schema = mongoose.Schema
const RoleModel = require('./roles/model')
const data = require('../../data')

const Admin = new Schema({
  sName: { type: String, trim: true, required: true },
  sUsername: { type: String, trim: true, required: true, unique: true },
  sEmail: { type: String, trim: true, required: true, unique: true },
  sMobNum: { type: String, trim: true, required: true },
  sProPic: { type: String, trim: true }, // not in used
  eType: { type: String, enum: data.adminType, required: true },
  aPermissions: [{ // Deprecated field, not in used
    eKey: { type: String, enum: data.adminPermission },
    eType: { type: String, enum: data.adminPermissionType } // R = READ W = WRITE N = NONE
  }],
  iRoleId: { type: ObjectId, ref: RoleModel }, // deprecated not in use
  aRole: [{ type: ObjectId, ref: RoleModel }],
  sPassword: { type: String, trim: true, required: true },
  eStatus: { type: String, enum: data.adminStatus, default: 'Y' },
  aJwtTokens: [{
    sToken: { type: String },
    sPushToken: { type: String, trim: true },
    sLatitude: { type: String },
    sLongitude: { type: String },
    dTimeStamp: { type: Date, default: Date.now }
  }],
  dLoginAt: { type: Date },
  dPasswordchangeAt: { type: Date },
  sVerificationToken: { type: String },
  sExternalId: { type: String },
  sDepositToken: { type: String },
  bLoggedOut: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'dCreatedAt', updatedAt: 'dUpdatedAt' } })

Admin.index({ sEmail: 1, sUsername: 1 })
Admin.index({ eStatus: 1 })

Admin.pre('save', function (next) {
  const admin = this
  let i
  if (admin.isModified('sName')) {
    const sName = admin.sName
    const splitFullName = sName.toLowerCase().split(' ')
    for (i = 0; i < splitFullName.length; i++) {
      splitFullName[i] = splitFullName[i].charAt(0).toUpperCase() + splitFullName[i].substring(1)
    }
    admin.sName = splitFullName.join(' ')
  }
  if (admin.isModified('sPassword')) {
    admin.sPassword = bcrypt.hashSync(admin.sPassword, salt)
  }
  next()
})

Admin.statics.filterData = function (admin) {
  admin.__v = undefined
  admin.sVerificationToken = undefined
  admin.aJwtTokens = undefined
  admin.sDepositToken = undefined
  admin.sPassword = undefined
  admin.dUpdatedAt = undefined
  return admin
}

Admin.statics.findByToken = async function (token) {
  const admin = this
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

  const adminObj = await admin.findOne(query)
  if (adminObj) {
    adminObj.sLatitude = decoded?.sLatitude
    adminObj.sLongitude = decoded?.sLongitude
  }
  return adminObj
}

Admin.statics.findByRefreshToken = async function (token) {
  const admin = this
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

  const adminObj = await admin.findOne(query)
  if (adminObj) {
    adminObj.sLatitude = decoded?.sLatitude
    adminObj.sLongitude = decoded?.sLongitude
  }
  return adminObj
}

Admin.statics.findByDepositToken = function (token) {
  const admin = this
  let decoded
  try {
    decoded = jwt.verify(token, config.JWT_SECRET)
  } catch (e) {
    return Promise.reject(e)
  }
  const query = {
    _id: decoded._id,
    sDepositToken: token,
    eStatus: 'Y'
  }
  return admin.findOne(query)
}
const AdminsModel = AdminsDBConnect.model('admins', Admin)

AdminsModel.syncIndexes().then(() => {
  console.log('Admin Model Indexes Synced')
}).catch((err) => {
  console.log('Admin Model Indexes Sync Error', err)
})
module.exports = AdminsModel
