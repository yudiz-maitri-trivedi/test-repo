const AdminModel = require('../model')
const RolesModel = require('../roles/model')
const bcrypt = require('bcryptjs')
const saltRounds = 1
const salt = bcrypt.genSaltSync(saltRounds)
const { messages, status, jsonStatus } = require('../../../helper/api.responses')
const { removenull, catchError, pick, getIp, decryptValuePromise, encryptKeyPromise } = require('../../../helper/utilities.services')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const adminLogServices = require('../adminLogs/services')
const { validateFields } = require('./common')

class SubAdmin {
  /**
   * new version of get single sub-admin. populate roles
   * @param {*} req  sub-admin id
   * @param {*} res  response status code, sub-admin details
   * @returns sub-admin single entry
   */
  async getV1 (req, res) {
    try {
      const data = await AdminModel.findOne({ _id: new ObjectId(req.params.id) }, { sName: 1, sUsername: 1, eStatus: 1, sEmail: 1, sMobNum: 1, aPermissions: 1, aRole: 1 }).populate('aRole', ['sName']).lean()

      if (!data) return res.status(status.NotFound).jsonp({ status: jsonStatus.NotFound, message: messages[req.userLanguage].not_exist.replace('##', messages[req.userLanguage].subAdmin) })
      if (data.sEmail) data.sEmail = await decryptValuePromise(data.sEmail)
      if (data.sMobNum) data.sMobNum = await decryptValuePromise(data.sMobNum)
      return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].success.replace('##', messages[req.userLanguage].subAdmin), data })
    } catch (error) {
      return catchError('SubAdmin.getV2', error, req, res)
    }
  }

  /**
   * get all sub-admin. change role param name iRole to aRole
   * @param {*} req  search, short, limit, list filter
   * @param {*} res  response status code, sub-admin details
   * @returns sub-admin details
   */
  async listV1 (req, res) {
    try {
      const { start = 0, limit = 10, order, search, datefrom, dateto } = req.query
      const orderBy = order && order === 'asc' ? 1 : -1
      const sorting = { dCreatedAt: orderBy }

      let query = {}
      if (search) {
        query = {
          $or: [
            { sName: { $regex: new RegExp('^.*' + search + '.*', 'i') } },
            { sEmail: { $regex: new RegExp('^.*' + search + '.*', 'i') } },
            { sMobNum: { $regex: new RegExp('^.*' + search + '.*', 'i') } }
          ]
        }
      }
      const dateFilter = datefrom && dateto ? { dCreatedAt: { $gte: (datefrom), $lte: (dateto) } } : {}
      query = { ...query, eType: 'SUB', ...dateFilter }

      const [list, total] = await Promise.all([
        AdminModel
          .find(query, {
            sName: 1,
            sUsername: 1,
            sEmail: 1,
            sMobNum: 1,
            aPermissions: 1,
            aRole: 1,
            eStatus: 1,
            dCreatedAt: 1,
            dLoginAt: 1
          })
          .sort(sorting)
          .skip(Number(start))
          .limit(Number(limit))
          .lean(),
        AdminModel.countDocuments({ ...query })
      ])

      await Promise.all(list.map(async (data) => {
        if (data.sEmail) data.sEmail = await decryptValuePromise(data.sEmail)
        if (data.sMobNum) data.sMobNum = await decryptValuePromise(data.sMobNum)
      }))
      const data = [{ total, results: list }]
      return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].success.replace('##', messages[req.userLanguage].subAdmin), data })
    } catch (error) {
      return catchError('SubAdmin.listV2', error, req, res)
    }
  }

  /**
   * It'll update the Sub Admin details like to assign a new role, update the role param name, etc.
   * @returns Success or Failure messages according to the validation mismatch or match.
   */
  async updateV1 (req, res) {
    try {
      const roleCount = await RolesModel.countDocuments({ eStatus: 'Y' })
      const subadmin = await AdminModel.findOne({ _id: new ObjectId(req.params.id) })

      let { sUsername, sEmail, sMobNum, aRole, eStatus, sPassword } = req.body

      req.body = pick(req.body, ['aRole', 'sName', 'sUsername', 'sEmail', 'sMobNum', 'sPassword', 'eStatus'])
      removenull(req.body)

      if (eStatus) req.body.eStatus = eStatus

      if (sPassword) {
        req.body.sPassword = bcrypt.hashSync(sPassword, salt)
      }

      const { roles } = await validateFields(req, res, { aRole, roleCount, subadmin, sUsername, sMobNum, sPassword })

      const oOldFields = await AdminModel.findById(req.params.id, { aRole: 1, eStatus: 1, sName: 1, sUsername: 1, sEmail: 1, sMobNum: 1, aPermissions: 1, _id: 0 }).lean()

      sEmail = await encryptKeyPromise(sEmail)
      sMobNum = await encryptKeyPromise(sMobNum)
      const adminExist = await AdminModel.findOne({ $or: [{ sEmail }, { sMobNum }, { sUsername }], _id: { $ne: req.params.id } })
      if (adminExist) {
        let field = ''
        if (adminExist.sUsername === sUsername) field = messages[req.userLanguage].username
        else if (adminExist.sMobNum === sMobNum) field = messages[req.userLanguage].mobileNumber
        else if (adminExist.sEmail === sEmail) field = messages[req.userLanguage].email
        return res.status(status.ResourceExist).jsonp({ status: jsonStatus.ResourceExist, message: messages[req.userLanguage].already_exist.replace('##', field) })
      }

      const data = await AdminModel.findOneAndUpdate({ _id: new ObjectId(req.params.id), eType: 'SUB' }, { ...req.body, sEmail, sMobNum, aRole: roles, $set: { aJwtTokens: [], bLoggedOut: true } }, { new: true, runValidators: true }).lean()
      if (!data) return res.status(status.NotFound).jsonp({ status: jsonStatus.NotFound, message: messages[req.userLanguage].not_exist.replace('##', messages[req.userLanguage].subAdmin) })

      // Log the record for future purpose to know which admin has update sub admin details.
      const { _id: iAdminId } = req.admin

      const oNewFields = { ...oOldFields, ...req.body, sEmail, sMobNum }
      const logData = { oOldFields, oNewFields, iAdminId: new ObjectId(iAdminId), sIP: getIp(req), eKey: 'SUB', sLatitude: req.admin.sLatitude, sLongitude: req.admin.sLongitude }
      await adminLogServices.adminLog(req, res, logData)
      AdminModel.filterData(data)
      if (data.sEmail) {
        data.sEmail = await decryptValuePromise(sEmail)
      }
      if (data.sMobNum) {
        data.sMobNum = await decryptValuePromise(sMobNum)
      }

      return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].update_success.replace('##', messages[req.userLanguage].subAdmin), data })
    } catch (error) {
      return catchError('AdminAuth.updateV4', error, req, res)
    }
  }

  /**
   * getting all admin id name and email
   * @returns Success or Failure messages according to the validation mismatch or match.
   */
  async getAdminIds (req, res) {
    try {
      const data = await AdminModel.find({}, { _id: 1, sName: 1, sUsername: 1 }).lean()

      return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].success.replace('##', messages[req.userLanguage].subAdmin), data })
    } catch (error) {
      return catchError('SubAdmin.getAdminIds', error, req, res)
    }
  }
}

module.exports = new SubAdmin()
