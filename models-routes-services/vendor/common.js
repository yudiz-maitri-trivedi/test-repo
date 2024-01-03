const { status, jsonStatus, messages } = require('../../helper/api.responses')
const bcrypt = require('bcryptjs')
const { checkAlphanumeric, validateMobile, catchError } = require('../../helper/utilities.services')
const { vendorStatus } = require('../../data')

function validateVendor (req, res, next) {
  try {
    const { sUsername, sMobNum, sPassword, sPriorNum, eStatus } = req.body
    if (!sUsername && !sMobNum && !sPassword && !sPriorNum && !eStatus) return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].fieldRequired })

    if (eStatus && !vendorStatus.includes(eStatus)) return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].invalid.replace('##', messages[req.userLanguage].status) })

    if (sPassword && (bcrypt.compareSync(sPassword, req.vendor.sPassword))) {
      return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].old_new_field_same.replace('##', messages[req.userLanguage].cpassword) })
    }
    if (sUsername && !checkAlphanumeric(sUsername)) {
      return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].must_alpha_num })
    }
    if (sMobNum && validateMobile(sMobNum)) return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].invalid.replace('##', messages[req.userLanguage].mobileNumber) })
    if (sPriorNum && validateMobile(sPriorNum)) return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].invalid.replace('##', messages[req.userLanguage].mobileNumber) })
    next()
  } catch (error) {
    return catchError('validation.error', error, req, res)
  }
}

module.exports = {
  validateVendor
}
