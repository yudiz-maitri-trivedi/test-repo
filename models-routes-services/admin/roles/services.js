const RolesModel = require('./model')
const PermissionsModel = require('../permissions/model')
const { messages, status, jsonStatus } = require('../../../helper/api.responses')
const { removenull, catchError, pick, getPaginationValues } = require('../../../helper/utilities.services')
const AdminsModel = require('../model')

class Role {
  /**
   * add roles in database
   * @body {*} req 'sName', 'aPermissions', 'eStatus'
   * @param {*} res roles details with message
   * @returns message with roles details
   */
  async add (req, res) {
    try {
      req.body = pick(req.body, ['sName', 'aPermissions', 'eStatus'])
      removenull(req.body)
      let { aPermissions, sName } = req.body
      sName = sName.trim()
      const eKeyArray = aPermissions.map(({ sKey }) => sKey)

      const isNameExist = await RolesModel.findOne({ sName: { $regex: `^${sName}$`, $options: 'i' } }, { _id: 1 }).lean() // finding role with case insensitive name
      if (isNameExist) return res.status(status.ResourceExist).jsonp({ status: jsonStatus.ResourceExist, message: messages[req.userLanguage].already_exist.replace('##', messages[req.userLanguage].cRoleName) })

      const permissions = await PermissionsModel.find({ eStatus: 'Y' }, { sKey: 1, _id: 0 }).lean()
      if (!permissions.length) return res.status(status.NotFound).jsonp({ status: jsonStatus.NotFound, message: messages[req.userLanguage].not_exist.replace('##', messages[req.userLanguage].permission) })

      //  We'll check that all permission includes in our db are exist inside given role permission.
      const isValid = permissions.every(({ sKey }) => eKeyArray.includes(sKey))
      if (!isValid) return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].invalid.replace('##', messages[req.userLanguage].permissions) })

      const data = await RolesModel.create({ ...req.body, sName })

      return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].add_success.replace('##', messages[req.userLanguage].role), data })
    } catch (error) {
      return catchError('Role.add', error, req, res)
    }
  }

  /**
   * getting All roles from database
   * @param {*} res all roles details with message
   * @returns message with all roles details
   */
  async adminList (req, res) {
    try {
      let { start, limit, sorting, search } = getPaginationValues(req.query)
      start = parseInt(start)
      limit = parseInt(limit)

      const query = {}
      if (search) query.sName = { $regex: new RegExp('^.*' + search + '.*', 'i') }

      const [total, results] = await Promise.all([
        RolesModel.countDocuments(query),
        RolesModel.find(query).sort(sorting).skip(start).limit(limit).lean()
      ])

      return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].success.replace('##', messages[req.userLanguage].roles), data: { total, results } })
    } catch (error) {
      return catchError('Role.adminList', error, req, res)
    }
  }

  /**
   * getting All active roles from database
   * @param {*} res all active roles details with message
   * @returns message with all active roles details
   */
  async list (req, res) {
    try {
      const data = await RolesModel.find({ eStatus: 'Y' }).lean()

      return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].success.replace('##', messages[req.userLanguage].roles), data })
    } catch (error) {
      return catchError('Role.list', error, req, res)
    }
  }

  /**
   * get single roles from database
   * @param {*} req role id
   * @param {*} res single role detail with message
   * @returns message with single role detail
   */
  async get (req, res) {
    try {
      const data = await RolesModel.findById(req.params.id).lean()

      if (!data) return res.status(status.NotFound).jsonp({ status: jsonStatus.NotFound, message: messages[req.userLanguage].not_exist.replace('##', messages[req.userLanguage].role) })

      return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].success.replace('##', messages[req.userLanguage].role), data })
    } catch (error) {
      return catchError('Role.list', error, req, res)
    }
  }

  /**
   * update single role from database
   * @param {*} req role id
   * @body  {*} req 'sName', 'aPermissions', 'eStatus'
   * @param {*} res update role detail with message
   * @returns message with update role detail
   */
  async update (req, res) {
    try {
      req.body = pick(req.body, ['sName', 'aPermissions', 'eStatus'])
      let { aPermissions, sName } = req.body
      sName = sName.trim()

      const eKeyArray = aPermissions.map(({ sKey }) => sKey)

      const isNameExist = await RolesModel.findOne({ sName: { $regex: `^${sName}$`, $options: 'i' }, _id: { $ne: req.params.id } }, { _id: 1 }).lean()
      if (isNameExist) return res.status(status.ResourceExist).jsonp({ status: jsonStatus.ResourceExist, message: messages[req.userLanguage].already_exist.replace('##', messages[req.userLanguage].cRoleName) })

      const permissions = await PermissionsModel.find({ eStatus: 'Y' }, { sKey: 1, _id: 0 }).lean()
      if (!permissions.length) return res.status(status.NotFound).jsonp({ status: jsonStatus.NotFound, message: messages[req.userLanguage].not_exist.replace('##', messages[req.userLanguage].role) })

      //  We'll check that all permission includes in our db are exist inside given role permission.
      const isValid = permissions.every(({ sKey }) => eKeyArray.includes(sKey))
      if (!isValid) return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].invalid.replace('##', messages[req.userLanguage].roles) })

      const data = await RolesModel.findByIdAndUpdate(req.params.id, { ...req.body, sName }, { new: true, runValidators: true }).lean()
      if (!data) return res.status(status.NotFound).jsonp({ status: jsonStatus.NotFound, message: messages[req.userLanguage].not_exist.replace('##', messages[req.userLanguage].role) })

      return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].update_success.replace('##', messages[req.userLanguage].role), data })
    } catch (error) {
      return catchError('Role.update', error, req, res)
    }
  }

  /**
   * delete single role from database
   * @param {*} req role id
   * @param {*} res delete message
   * @returns delete message
   */
  async delete (req, res) {
    try {
      const role = await RolesModel.findById(req.params.id, { _id: 1 }).lean()
      if (!role) return res.status(status.NotFound).jsonp({ status: jsonStatus.NotFound, message: messages[req.userLanguage].not_exist.replace('##', messages[req.userLanguage].role) })
      const bRoleExist = await AdminsModel.findOne({ aRole: role._id }, { _id: 1 }).lean()
      if (bRoleExist) {
        return res.status(status.NotFound).jsonp({ status: jsonStatus.NotFound, message: messages[req.userLanguage].role_exist.replace('##', messages[req.userLanguage].role) })
      }
      const data = await RolesModel.findByIdAndDelete(req.params.id).lean()
      if (!data) return res.status(status.NotFound).jsonp({ status: jsonStatus.NotFound, message: messages[req.userLanguage].not_exist.replace('##', messages[req.userLanguage].role) })

      return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].del_success.replace('##', messages[req.userLanguage].role), data })
    } catch (error) {
      return catchError('Role.delete', error, req, res)
    }
  }
}

module.exports = new Role()
