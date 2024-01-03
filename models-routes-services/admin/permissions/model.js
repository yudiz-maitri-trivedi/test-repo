/* eslint-disable no-console */
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { AdminsDBConnect } = require('../../../database/mongoose')
const { permissionModule, status } = require('../../../data')

const Permissions = new Schema({
  sName: { type: String, required: true },
  sKey: { type: String, required: true },
  sModuleName: { type: String, enum: permissionModule, required: true }, // every permission belongs to specific module, to make things dynamic we are adding this field.
  eStatus: { type: String, enum: status, default: 'Y' },
  sExternalId: { type: String }
}, { timestamps: { createdAt: 'dCreatedAt', updatedAt: 'dUpdatedAt' } })

Permissions.index({ sKey: 1 })
Permissions.index({ eStatus: 1 })

const PermissionsModel = AdminsDBConnect.model('permissions', Permissions)
PermissionsModel.syncIndexes().then(() => {
  console.log('Permissons Model Indexes Synced')
}).catch((err) => {
  console.log('Permissons Model Indexes Sync Error', err)
})
module.exports = PermissionsModel
