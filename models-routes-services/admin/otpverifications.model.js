const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { AdminsDBConnect } = require('../../database/mongoose')
const data = require('../../data')
const AdminModel = require('./model')
const VendorModel = require('../vendor/model')

const OTPVerifications = new Schema({
  sLogin: { type: String, trim: true, required: true },
  sCode: { type: Number, required: true },
  sType: { type: String, enum: data.otpType, required: true }, // E = Email | M = Mobile
  sAuth: { type: String, enum: data.otpAuth, required: true }, // R = Register | F = ForgotPass | V = Verification | L = Login
  sDeviceToken: { type: String },
  iAdminId: { type: Schema.Types.ObjectId, ref: AdminModel },
  iVendorId: { type: Schema.Types.ObjectId, ref: VendorModel },
  bIsVerify: { type: Boolean, default: false },
  dUpdatedAt: { type: Date },
  dCreatedAt: { type: Date, default: Date.now },
  sExternalId: { type: String }
})
OTPVerifications.index({ sLogin: 1, sCode: 1, sType: 1 })

module.exports = AdminsDBConnect.model('otpverifications', OTPVerifications)
