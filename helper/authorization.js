const { messages, jsonStatus } = require('../helper/api.responses')
const { decryptValue } = require('../helper/utilities.services')
const RolesModel = require('../models-routes-services/admin/roles/model')

const checkAdminAuthorization = (sKey, eType, req) => {
  return new Promise(async function (resolve, reject) {
    try {
      if (req.admin.eType === 'SUPER') {
        return resolve({ status: jsonStatus.OK, message: '' })
      } else {
        if (!req.admin.aRole) {
          return resolve({ status: jsonStatus.Unauthorized, message: messages[req.userLanguage].access_denied })
        }

        const role = await RolesModel.find({ _id: { $in: req.admin.aRole }, eStatus: 'Y' }, { aPermissions: 1 }).lean()
        if (!role.length) return resolve({ status: jsonStatus.Unauthorized, message: messages[req.userLanguage].access_denied })
        let aPermissions = role.map(role => role.aPermissions)
        aPermissions = [].concat.apply([], aPermissions)
        const hasPermission = aPermissions.find((permission) => {
          return (
            permission.sKey === sKey &&
              (permission.eType === eType ||
                (eType === 'R' && permission.eType === 'W'))
          )
        })

        if (!hasPermission) {
          let message
          switch (eType) {
            case 'R':
              message = messages[req.userLanguage].read_access_denied.replace('##', sKey)
              break
            case 'W':
              message = messages[req.userLanguage].write_access_denied.replace('##', sKey)
              break
            case 'N':
              message = messages[req.userLanguage].access_denied
              break
            default :
              message = messages[req.userLanguage].error
          }
          return resolve({ status: jsonStatus.Unauthorized, message })
        }
        return resolve({ status: jsonStatus.OK, message: '' })
      }
    } catch (error) {
      return reject(error)
    }
  })
}

const decryptValueIfPresent = (data) => {
  if (data) {
    return decryptValue(data)
  }
  return data
}

const decryptUserInfoAsPerPermission = (usersList, allData = true) => {
  return new Promise(function (resolve, reject) {
    try {
      usersList = usersList.map(data => {
        data.dDob = decryptValueIfPresent(data.dDob)
        data.sAddress = decryptValueIfPresent(data.sAddress)
        if (!allData) {
          data.sEmail = ''
          data.sMobNum = ''
          data.sLogin = ''
        } else {
          data.sEmail = decryptValueIfPresent(data.sEmail)
          data.sMobNum = decryptValueIfPresent(data.sMobNum)
          data.sLogin = decryptValueIfPresent(data.sLogin)
        }

        return data
      })

      resolve(usersList)
    } catch (error) {
      reject(error)
    }
  })
}

module.exports = {
  checkAdminAuthorization,
  decryptUserInfoAsPerPermission
}
