const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const { AdminsDBConnect } = require('../../database/mongoose')
const TemplateModel = require('../template/model')
const VendorModel = require('./model')

const MessageLogs = new mongoose.Schema({
  iTemplateId: { type: ObjectId, ref: TemplateModel },
  isImage: { type: Boolean },
  sClientId: { type: String, required: true },
  iVendorId: { type: ObjectId, ref: VendorModel },
  sSenderNum: { type: String, required: true, trim: true },
  sReceiverNum: { type: String }
}, { timestamps: { createdAt: 'dCreatedAt', updatedAt: 'dUpdatedAt' } })

MessageLogs.index({ iVendorId: 1, iTemplateId: 1 })

const MessageLogsModel = AdminsDBConnect.model('messages', MessageLogs)

module.exports = MessageLogsModel
