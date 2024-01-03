const { status, jsonStatus, messages } = require('../../../helper/api.responses')
const bcrypt = require('bcryptjs')
const { checkAlphanumeric, validateMobile } = require('../../../helper/utilities.services')
const RolesModel = require('../roles/model')

function validateFields (req, res, body) {
  return new Promise(async (resolve, reject) => {
    try {
      const { aRole, roleCount, subadmin, sUsername, sMobNum, sPassword } = body
      // if we have 10 roles in collection and if we get more than 10 roles in request then we will send error
      const roleLength = aRole?.length
      if (roleLength > roleCount) { return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].invalid.replace('##', messages[req.userLanguage].role) }) }

      const isSamePassword = bcrypt.compareSync(sPassword, subadmin.sPassword)
      if (isSamePassword) {
        return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].old_new_field_same.replace('##', messages[req.userLanguage].cpassword) })
      }

      if (!checkAlphanumeric(sUsername)) {
        return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].must_alpha_num })
      }

      if (validateMobile(sMobNum)) {
        return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].invalid.replace('##', messages[req.userLanguage].mobileNumber) })
      }

      const roles = await RolesModel.find({ _id: { $in: aRole }, eStatus: 'Y' }, { _id: 1 }).lean()
      if (!roles.length) {
        return res.status(status.NotFound).jsonp({ status: jsonStatus.NotFound, message: messages[req.userLanguage].do_not_exist.replace('##', messages[req.userLanguage].croles) })
      }
      return resolve({ roles })
    } catch (error) {
      return reject(error)
    }
  })
}

module.exports = {
  validateFields
}
