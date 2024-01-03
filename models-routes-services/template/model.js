const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { AdminsDBConnect } = require('../../database/mongoose')
const VendorModel = require('../vendor/model')
const { status } = require('../../data')

const Template = new Schema({
  iVendorId: { type: Schema.Types.ObjectId, ref: VendorModel },
  sImageUrl: { type: String },
  sMessage: { type: String, required: true },
  eStatus: { type: String, enum: status, default: 'Y' }
}, { timestamps: { createdAt: 'dCreatedAt', updatedAt: 'dUpdatedAt' } })

Template.index({ iVendorId: 1 })

const TemplateModel = AdminsDBConnect.model('templates', Template)

TemplateModel.syncIndexes().then(() => {
  console.log('Template Model Indexes Synced')
}).catch((err) => {
  console.log('Template Model Indexes Sync Error', err)
})

module.exports = TemplateModel
