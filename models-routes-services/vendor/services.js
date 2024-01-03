const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const VendorsModel = require('./model')
const { messages, status, jsonStatus } = require('../../helper/api.responses')
const { removenull, catchError, pick, checkAlphanumeric, getIp, validateMobile, generateOTP, encryptKeyPromise, decryptValuePromise, randomStr, decryptIfExist } = require('../../helper/utilities.services')
const config = require('../../config/config')
const { checkRateLimit, queuePush, checkRateLimitOTP } = require('../../helper/redis')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const OTPVerificationsModel = require('../admin/otpverifications.model')
const adminLogServices = require('../admin/adminLogs/services')
const { checkCodeValidity } = require('../admin/auth/common')
const saltRounds = 1
const salt = bcrypt.genSaltSync(saltRounds)

class Vendor {
  async createVendor (req, res) {
    try {
      req.body = pick(req.body, ['sName', 'sUsername', 'sEmail', 'sMobNum', 'sPassword', 'eStatus', 'sPriorNum'])

      let { sName, sUsername, sEmail, sMobNum, eStatus, sPriorNum } = req.body
      const sApiToken = randomStr(16, 'private')
      sEmail = sEmail.toLowerCase().trim()

      // only super admin has rights to create vendor
      if (req.admin.eType !== 'SUPER') return res.status(status.Unauthorized).jsonp({ status: jsonStatus.Unauthorized, message: messages[req.userLanguage].access_denied })

      if (!checkAlphanumeric(sUsername)) return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].must_alpha_num })

      if (validateMobile(sMobNum)) return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].invalid.replace('##', messages[req.userLanguage].mobileNumber) })
      sEmail = await encryptKeyPromise(sEmail)
      sMobNum = await encryptKeyPromise(sMobNum)
      if (sPriorNum) sPriorNum = await encryptKeyPromise(sPriorNum)

      const vendorExist = await VendorsModel.findOne({ $or: [{ sEmail }, { sMobNum }, { sUsername }] }).lean()
      if (vendorExist && vendorExist.sUsername === sUsername) return res.status(status.ResourceExist).jsonp({ status: jsonStatus.ResourceExist, message: messages[req.userLanguage].already_exist.replace('##', messages[req.userLanguage].username) })
      if (vendorExist && vendorExist.sMobNum === sMobNum) return res.status(status.ResourceExist).jsonp({ status: jsonStatus.ResourceExist, message: messages[req.userLanguage].already_exist.replace('##', messages[req.userLanguage].mobileNumber) })
      if (vendorExist && vendorExist.sEmail === sEmail) return res.status(status.ResourceExist).jsonp({ status: jsonStatus.ResourceExist, message: messages[req.userLanguage].already_exist.replace('##', messages[req.userLanguage].email) })
      const newVendor = new VendorsModel({ ...req.body, sEmail, sMobNum, sApiToken })
      await newVendor.save()

      // Log the record for future purpose to know which super admin has create vendor
      const { _id: iAdminId } = req.admin
      const oNewFields = { sName, sUsername, sEmail, sMobNum, eStatus }
      const logData = { oOldFields: {}, oNewFields, iAdminId: new ObjectId(iAdminId), sIP: getIp(req), eKey: 'V' }
      await adminLogServices.adminLog(req, res, logData)

      return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].add_success.replace('##', messages[req.userLanguage].vendor), newVendor })
    } catch (error) {
      return catchError('Vendor.createVendor', error, req, res)
    }
  }

  async loginV1 (req, res) {
    try {
      if (config.ADMIN_LOGIN_AUTHENTICATION === 'otp') {
        req.body = pick(req.body, ['sLogin', 'sDeviceToken'])
        removenull(req.body)
        let { sLogin, sDeviceToken } = req.body

        const sType = validateMobile(sLogin) ? 'E' : 'M'
        sLogin = sLogin.toLowerCase().trim()
        sLogin = await encryptKeyPromise(sLogin)
        const vendor = await VendorsModel.findOne({ $or: [{ sEmail: sLogin }, { sMobNum: sLogin }], eStatus: 'Y' }).populate({ path: 'aRole' })
        if (!vendor) {
          return res.status(status.NotFound).jsonp({
            status: jsonStatus.NotFound,
            message: messages[req.userLanguage].auth_failed
          })
        }
        if (process.env.NODE_ENV === 'production') {
          const d = new Date()
          d.setSeconds(d.getSeconds() - 30)
          const exist = await OTPVerificationsModel.findOne({ sLogin, sType, sAuth: 'L', dCreatedAt: { $gt: d } }, null, { readPreference: 'primary' }).sort({ dCreatedAt: -1 })
          if (exist) return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].err_resend_otp.replace('##', messages[req.userLanguage].nThirty) })
        }
        let sCode = 8697
        if (['production', 'staging'].includes(process.env.NODE_ENV) && config.OTP_PROVIDER !== 'TEST') sCode = generateOTP(4)
        if (sType === 'E') {
          const decEmail = await decryptValuePromise(vendor.sEmail)
          await Promise.all([
            OTPVerificationsModel.create({ sLogin, sCode, sType, sAuth: 'L', sDeviceToken, iVendorId: vendor._id }),
            queuePush('SendMail', {
              sSlug: 'send-otp-email',
              replaceData: {
                email: vendor.sUsername,
                otp: sCode,
                from: config.SMTP_FROM
              },
              to: decEmail
            })
          ])
        } else if (sType === 'M' && ['production', 'staging'].includes(process.env.NODE_ENV) && config.OTP_PROVIDER !== 'TEST') {
          const decLogin = await decryptValuePromise(sLogin)
          await Promise.all([
            OTPVerificationsModel.create({ sLogin, sCode, sType, sAuth: 'L', sDeviceToken, iAdminId: vendor._id }),
            queuePush('sendSms', {
              sProvider: config.OTP_PROVIDER,
              oUser: {
                sPhone: decLogin,
                sOTP: sCode
              }
            })
          ])
        }

        return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].OTP_sent_succ })
      } else {
        req.body = pick(req.body, ['sLogin', 'sPassword', 'sDeviceToken'])
        removenull(req.body)
        let { sLogin, sPushToken, sPassword } = req.body
        // check rate limit for password sending from same ip at multiple time. we'll make sure not too many request from same ip will occurs.
        const rateLimit = await checkRateLimit(5, `rlpassword:${sLogin}`, getIp(req))
        if (rateLimit === 'LIMIT_REACHED') return res.status(status.TooManyRequest).jsonp({ status: jsonStatus.TooManyRequest, message: messages[req.userLanguage].limit_reached.replace('##', messages[req.userLanguage].cpassword) })

        sLogin = sLogin.toLowerCase().trim()
        sLogin = await encryptKeyPromise(sLogin)
        let vendor = await VendorsModel.findOne({ $or: [{ sEmail: sLogin }, { sMobNum: sLogin }], eStatus: 'Y' })
        if (!vendor) {
          return res.status(status.NotFound).jsonp({
            status: jsonStatus.NotFound,
            message: messages[req.userLanguage].auth_failed
          })
        }

        if (!bcrypt.compareSync(sPassword, vendor.sPassword)) {
          return res.status(status.BadRequest).jsonp({
            status: jsonStatus.BadRequest,
            message: messages[req.userLanguage].auth_failed
          })
        }
        if (rateLimit === 'LIMIT_REACHED') {
          return res.status(status.TooManyRequest).jsonp({ status: jsonStatus.TooManyRequest, message: messages[req.userLanguage].limit_reached.replace('##', messages[req.userLanguage].cpassword) })
        }

        const sRefreshToken = jwt.sign({ _id: (vendor._id), eType: vendor.eType }, config.REFRESH_TOKEN_SECRET, { expiresIn: config.REFRESH_TOKEN_VALIDITY })

        const newToken = {
          sToken: jwt.sign({ _id: (vendor._id).toHexString(), eType: vendor.eType }, config.JWT_SECRET, { expiresIn: config.JWT_VALIDITY }),
          sIpAddress: getIp(req),
          sPushToken
        }
        // vendor can login in LOGIN_HARD_LIMIT time.
        // for e.g. LOGIN_HARD_LIMIT=5 -> Admin can login only for 5 times, After that we'll remove first login token from db.
        if (vendor.aJwtTokens.length < config.LOGIN_HARD_LIMIT || config.LOGIN_HARD_LIMIT === 0) {
          vendor.aJwtTokens.push(newToken)
        } else {
          vendor.aJwtTokens.splice(0, 1)
          vendor.aJwtTokens.push(newToken)
        }
        vendor.dLoginAt = new Date()
        vendor.bLoggedOut = false
        await vendor.save()
        vendor = VendorsModel.filterData(vendor)
        if (vendor.sEmail) vendor.sEmail = await decryptValuePromise(vendor.sEmail)
        if (vendor.sMobNum) vendor.sMobNum = await decryptValuePromise(vendor.sMobNum)

        return res.status(status.OK).set({ Authorization: newToken.sToken, RefreshToken: sRefreshToken }).jsonp({
          status: jsonStatus.OK,
          message: messages[req.userLanguage].succ_login,
          data: vendor,
          Authorization: newToken.sToken,
          RefreshToken: sRefreshToken
        })
      }
    } catch (error) {
      return catchError('Vendor.loginV1', error, req, res)
    }
  }

  async verifyOTPV1 (req, res) {
    try {
      req.body = pick(req.body, ['sLogin', 'sType', 'sAuth', 'sCode', 'sDeviceToken', 'sLatitude', 'sLongitude'])
      let { sLogin, sType, sAuth, sCode, sPushToken, sLatitude, sLongitude } = req.body
      removenull(req.body)

      // const isLocationValid = await checkLocationValidity(req, res, sLatitude, sLongitude)
      // if (isLocationValid) {
      //   return res.status(status.BadRequest).jsonp({
      //     status: jsonStatus.BadRequest,
      //     message: messages[req.userLanguage].location_details_required
      //   })
      // }

      sCode = parseInt(sCode)
      const isCodeValid = await checkCodeValidity(req, res, sCode)
      if (isCodeValid) {
        const errorMessage = messages[req.userLanguage].verify_otp_err
        return res.status(status.BadRequest).jsonp({
          status: jsonStatus.BadRequest,
          message: errorMessage
        })
      }

      const envs = ['production', 'staging']
      const checkEnv = envs.includes(process.env.NODE_ENV)
      // check rate limit for otp verify from same ip at multiple time. we'll make sure not too many request from same ip will occurs.
      if (checkEnv) {
        const rateLimit = await checkRateLimitOTP(sLogin, sType, `${sAuth}-V`)
        if (rateLimit === 'LIMIT_REACHED') return res.status(status.TooManyRequest).jsonp({ status: jsonStatus.TooManyRequest, message: messages[req.userLanguage].limit_reached.replace('##', messages[req.userLanguage].cotpVerification) })
      }
      sLogin = await encryptKeyPromise(sLogin)
      const exist = await OTPVerificationsModel.findOne({ sLogin }, null, { readPreference: 'primary' }).sort({ dCreatedAt: -1 }).lean()
      const checkExist = (!exist || (exist.sCode !== sCode))
      if (checkExist) return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].verify_otp_err })

      const [, VendorDetails = {}] = await Promise.all([
        OTPVerificationsModel.findByIdAndUpdate(exist._id, { bIsVerify: true }, { runValidators: true, readPreference: 'primary' }).lean(),
        VendorsModel.findById(exist.iVendorId, null, { readPreference: 'primary' }).lean()
      ])

      const sNewLatitude = sLatitude || ''
      const sNewLongitude = sLongitude || ''

      const sRefreshToken = jwt.sign({ _id: (VendorDetails._id).toHexString(), eType: VendorDetails.eType, sLatitude: sNewLatitude, sLongitude: sNewLongitude }, config.REFRESH_TOKEN_SECRET, { expiresIn: config.REFRESH_TOKEN_VALIDITY })

      const newToken = {
        sToken: jwt.sign({ _id: (VendorDetails._id).toHexString(), eType: VendorDetails.eType, sLatitude: sNewLatitude, sLongitude: sNewLongitude }, config.JWT_SECRET, { expiresIn: config.JWT_VALIDITY }),
        sPushToken,
        sLatitude,
        sLongitude
      }
      const isLoginHardLimitVendor = ((VendorDetails.aJwtTokens.length < config.LOGIN_HARD_LIMIT) || config.LOGIN_HARD_LIMIT === 0)
      if (isLoginHardLimitVendor) {
        VendorDetails.aJwtTokens.push(newToken)
      } else {
        VendorDetails.aJwtTokens.splice(0, 1)
        VendorDetails.aJwtTokens.push(newToken)
      }
      await Promise.all([
        VendorsModel.updateOne({ _id: new ObjectId(VendorDetails._id) }, { aJwtTokens: VendorDetails.aJwtTokens, dLoginAt: new Date(), bLoggedOut: false })
      ])

      VendorsModel.filterData(VendorDetails)
      await decryptIfExist(VendorDetails, ['sEmail', 'sMobNum'])

      return res.status(status.OK).set({ Authorization: newToken.sToken, RefreshToken: sRefreshToken }).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].verification_success, data: VendorDetails, Authorization: newToken.sToken, RefreshToken: sRefreshToken })
    } catch (error) {
      return catchError('Vendor.verifyOTPV1', error, req, res)
    }
  }

  async update (req, res) {
    try {
      let { sUsername, sEmail, sMobNum, eStatus, sPassword, sPriorNum } = req.body

      req.body = pick(req.body, ['sName', 'sUsername', 'sEmail', 'sMobNum', 'sPassword', 'eStatus', 'sPriorNum'])
      removenull(req.body)

      if (eStatus) req.body.eStatus = eStatus

      if (sPassword) req.body.sPassword = bcrypt.hashSync(sPassword, salt)

      if (sPriorNum) sPriorNum = await encryptKeyPromise(sPriorNum)
      if (sMobNum) sMobNum = await encryptKeyPromise(sMobNum)
      if (sEmail) sEmail = await encryptKeyPromise(sEmail)
      const vendorExist = await VendorsModel.findOne({ $or: [{ sEmail }, { sMobNum }, { sUsername }], _id: { $ne: req.params.id } })
      if (vendorExist) {
        let field = ''
        if (vendorExist.sUsername === sUsername) field = messages[req.userLanguage].username
        else if (vendorExist.sMobNum === sMobNum) field = messages[req.userLanguage].mobileNumber
        else if (vendorExist.sEmail === sEmail) field = messages[req.userLanguage].email
        return res.status(status.ResourceExist).jsonp({ status: jsonStatus.ResourceExist, message: messages[req.userLanguage].already_exist.replace('##', field) })
      }

      const data = await VendorsModel.findOneAndUpdate({ _id: new ObjectId(req.params.id), eStatus: 'Y' }, { ...req.body, sEmail, sMobNum, $set: { aJwtTokens: [], bLoggedOut: true } }, { new: true, runValidators: true }).lean()
      if (!data) return res.status(status.NotFound).jsonp({ status: jsonStatus.NotFound, message: messages[req.userLanguage].not_exist.replace('##', messages[req.userLanguage].vendor) })

      VendorsModel.filterData(data)
      if (data.sEmail) {
        data.sEmail = await decryptValuePromise(data.sEmail)
      }
      if (data.sMobNum) {
        data.sMobNum = await decryptValuePromise(data.sMobNum)
      }
      return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].update_success.replace('##', messages[req.userLanguage].vendor), data })
    } catch (error) {
      return catchError('Vendor.update', error, req, res)
    }
  }

  async getV1 (req, res) {
    try {
      const data = await VendorsModel.findOne({ _id: new ObjectId(req.params.id) }, { sName: 1, sUsername: 1, eStatus: 1, sEmail: 1, sMobNum: 1, sPriorNum: 1 }).lean()

      if (!data) return res.status(status.NotFound).jsonp({ status: jsonStatus.NotFound, message: messages[req.userLanguage].not_exist.replace('##', messages[req.userLanguage].vendor) })
      if (data.sEmail) data.sEmail = await decryptValuePromise(data.sEmail)
      if (data.sMobNum) data.sMobNum = await decryptValuePromise(data.sMobNum)
      return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].success.replace('##', messages[req.userLanguage].vendor), data })
    } catch (error) {
      return catchError('SubAdmin.getV2', error, req, res)
    }
  }

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
      query = { ...query, ...dateFilter }

      const [list, total] = await Promise.all([
        VendorsModel
          .find(query, {
            sName: 1,
            sUsername: 1,
            sEmail: 1,
            sMobNum: 1,
            aWpAccounts: 1,
            sPriorNum: 1,
            eStatus: 1,
            dCreatedAt: 1,
            dLoginAt: 1
          })
          .sort(sorting)
          .skip(Number(start))
          .limit(Number(limit))
          .lean(),
        VendorsModel.countDocuments({ ...query })
      ])

      await Promise.all(list.map(async (data) => {
        data.sEmail = await decryptValuePromise(data.sEmail)
        data.sMobNum = await decryptValuePromise(data.sMobNum)
      }))
      const data = [{ total, results: list }]
      return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].success.replace('##', messages[req.userLanguage].vendor), data })
    } catch (error) {
      return catchError('Vendor.list', error, req, res)
    }
  }

  async logout (req, res) {
    try {
      // We'll remove auth token from db at logout time
      await VendorsModel.updateOne({ _id: new ObjectId(req.vendor._id) }, { $pull: { aJwtTokens: { sToken: req.header('Authorization') } } })
      return res.status(status.OK).jsonp({
        status: jsonStatus.OK,
        message: messages[req.userLanguage].succ_logout
      })
    } catch (error) {
      return catchError('Vendor.logout', error, req, res)
    }
  }

  async delete (req, res) {
    try {
      const iVendorId = req.params.id
      const oVendor = await VendorsModel.findByIdAndUpdate(iVendorId, { eStatus: 'D', dDeletedAt: new Date() }).lean()
      if (!oVendor) return res.status(status.NotFound).jsonp({ status: jsonStatus.NotFound, message: messages[req.userLanguage].not_exist.replace('##', messages[req.userLanguage].vendor) })
      return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].del_success.replace('##', messages[req.userLanguage].vendor) })
    } catch (error) {
      return catchError('Vendor.delete', error, req, res)
    }
  }
}
module.exports = new Vendor()
