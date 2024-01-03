const AdminLogModel = require('./logs.model')
const ObjectId = require('mongoose').Types.ObjectId
const { catchError, decryptValuePromise, decryptIfExist, maskIfExist } = require('../../../helper/utilities.services')
const { decryption } = require('../../../middlewares/middleware')
const { status, jsonStatus, messages } = require('../../../helper/api.responses')

const { checkAdminAuthorization } = require('../../../helper/authorization')

class AdminLogs {
  /**
   * Update verson of AdminLogs. It'll list logs of which super admin has create or update sub admin.
   * @param {*} req  searching, sorting and limit params
   * @param {*} res  response code, super admin has create or update sub admin log
   * @returns super admin has create or update sub admin logs
   */
  async AdminLogsV2 (req, res) {
    try {
      const { nStart = 0, nLimit = 10, order, search, operation, datefrom, dateto, iAdminId } = req.query

      const orderBy = order && order === 'asc' ? 1 : -1
      const sorting = { dCreatedAt: orderBy }

      let query = iAdminId ? { iAdminId: new ObjectId(iAdminId) } : {}

      query = operation ? { ...query, eKey: operation } : query
      query = datefrom && dateto ? { ...query, dCreatedAt: { $gte: (datefrom), $lte: (dateto) } } : query

      if (search) {
        const userQuery = await getQueryValues(operation, search)
        query = { ...query, ...userQuery }
      }
      const [list, nTotal] = await Promise.all([
        AdminLogModel
          .find(query, {
            eKey: 1,
            iUserId: 1,
            'oOldFields.sName': 1,
            oDetails: 1,
            sIP: 1,
            iAdminId: 1,
            dCreatedAt: 1,
            sLatitude: 1,
            sLongitude: 1
          })
          .sort(sorting)
          .skip(Number(nStart))
          .limit(Number(nLimit))
          .populate('iAdminId', ['sName', 'sUsername', 'sEmail', 'sProPic', 'eStatus', 'dLoginAt', 'eType'])
          .lean(),
        AdminLogModel.countDocuments(query)
      ])

      const aUserId = []

      const promises = []
      // In this loop, if admin is there then decrypting email else showing CRON as a admin
      for (const log of list) {
        if (log.iUserId) aUserId.push(log.iUserId)
        if (log.iAdminId) {
          const decEmailPromise = log.iAdminId.sEmail ? decryptValuePromise(log.iAdminId.sEmail) : null
          promises.push(decEmailPromise)
        } else {
          log.iAdminId = { sName: log?.oDetails?.sOperationBy, eType: 'CRON' }
        }
      }
      const decryptedEmails = await Promise.all(promises)
      let i = 0
      for (const log of list) {
        if (log.iAdminId && log.iAdminId.sEmail) {
          log.iAdminId.sEmail = decryptedEmails[i]
          i++
        }
      }
      if (aUserId.length) {
        const response = await checkAdminAuthorization('USERS_PERSONAL_INFO', 'R', req)
        const aUsers = await findUsers({ _id: { $in: aUserId } }, { _id: 1, sName: 1, sUsername: 1, sEmail: 1, sProPic: 1, eType: 1 })

        const userLookup = aUsers.reduce((acc, user) => {
          acc[user._id.toString()] = user
          return acc
        }, {})
        const promises = list.map(async (p) => {
          if (p.iUserId) {
            const iUserId = userLookup[p.iUserId.toString()]
            if (response.status === 200) {
              iUserId.sEmail = iUserId.sEmail ? await decryptValuePromise(iUserId.sEmail) : iUserId.sEmail
            } else {
              iUserId.sEmail = ''
            }
            p.iUserId = iUserId
          }
        })
        await Promise.all(promises)
      }
      const data = { nTotal, aResult: list }

      return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].success.replace('##', messages[req.userLanguage].cAdminlog), data })
    } catch (error) {
      return catchError('SubAdmin.AdminLogsV2', error, req, res)
    }
  }

  /**
   * get single admin log.
   * @param {*} req  logs id
   * @param {*} res  response status code, admin log
   * @returns admin single log entry
   */
  async getAdminLog (req, res) {
    try {
      const logs = await AdminLogModel
        .findOne({ _id: new ObjectId(req.params.id) }, {
          eKey: 1,
          oOldFields: 1,
          oNewFields: 1,
          iUserId: 1
        })
        .lean()
      if (logs.eKey === 'BD') {
        const { oOldFields, oNewFields } = logs

        // Here eKey = BD means, Bank Details
        // We'll store encrypted bank account no. in our db. so, for that reason we'll need to decrypt to show admin
        if (oNewFields?.sAccountNo) logs.oNewFields.sAccountNo = decryption(oNewFields.sAccountNo)
        if (oOldFields?.sAccountNo) logs.oOldFields.sAccountNo = decryption(oOldFields.sAccountNo)
      }

      const response = await checkAdminAuthorization('USERS_PERSONAL_INFO', 'R', req)
      if (logs.iUserId && response.status === 200) {
        // Decrypt personal info if authorized
        await Promise.all([
          decryptIfExist(logs.oOldFields, ['sEmail', 'sMobNum']),
          decryptIfExist(logs.oNewFields, ['sEmail', 'sMobNum'])
        ])
      } else {
        // Mask personal info if not authorized
        maskIfExist(logs.oOldFields, ['sEmail', 'sMobNum'])
        maskIfExist(logs.oNewFields, ['sEmail', 'sMobNum'])
      }
      await Promise.all([
        decryptIfExist(logs.oOldFields, ['sAddress', 'dDob']),
        decryptIfExist(logs.oNewFields, ['sAddress', 'dDob'])
      ])
      const data = logs

      return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].success.replace('##', messages[req.userLanguage].cAdminlog), data })
    } catch (error) {
      return catchError('SubAdmin.getAdminLog', error, req, res)
    }
  }

  /**
   * create admin logs.
   * @param {*} req  log data
   * @param {*} res
   * @returns
   */
  async adminLog (req, res, logData) {
    try {
      await AdminLogModel.create({ ...logData })
    } catch (error) {
      return catchError('AdminLog.adminLog', error, req, res)
    }
  }
}

/**
   * create search query for geting admin logs.
   * @param {*} req  operation, search
   * @param {*} res  query
   * @returns query value
   */
async function getQueryValues (operation, search) {
  let query = {}
  let commonQuery = {}

  if (ObjectId.isValid(search) && new ObjectId(search).toString() === search) {
    commonQuery = { ...query, iUserId: new ObjectId(search) }
  } else {
    commonQuery = { ...query, 'oOldFields.sName': { $regex: new RegExp('^.*' + search + '.*', 'i') } }
  }

  if (search) {
    switch (operation) {
      case 'CR':
        query = {
          $or: [
            { ...query, 'oOldFields.sRuleName': { $regex: new RegExp('^.*' + search + '.*', 'i') } },
            { ...query, 'oOldFields.eRule': { $regex: new RegExp('^.*' + search + '.*', 'i') } }
          ]
        }
        break

      case 'S':
        query = {
          $or: [
            { ...query, 'oOldFields.sTitle': { $regex: new RegExp('^.*' + search + '.*', 'i') } },
            { ...query, 'oOldFields.sKey': { $regex: new RegExp('^.*' + search + '.*', 'i') } }]
        }
        break

      case 'L':
        query = {
          $or: [
            { ...query, 'oOldFields.sName': { $regex: new RegExp('^.*' + search + '.*', 'i') } },
            { ...query, 'oOldFields.sLeagueCategory': { $regex: new RegExp('^.*' + search + '.*', 'i') } },
            { ...query, 'oOldFields.sFilterCategory': { $regex: new RegExp('^.*' + search + '.*', 'i') } }
          ]
        }
        break
      case 'PC':
        query = {
          $or: [
            { ...query, 'oNewFields.sName': { $regex: new RegExp('^.*' + search + '.*', 'i') } },
            { ...query, 'oNewFields.sCode': { $regex: new RegExp('^.*' + search + '.*', 'i') } }
          ]
        }
        break

      case 'ML':
      case 'MP':
      case 'M':
        if (['ML', 'MP', 'M'].includes(operation)) {
          const matches = await findMatches({ sName: search }, { _id: 1, sName: 1 })

          if (matches.length) {
            const matchIds = matches.map(match => match._id)
            query = {
              ...query,
              $or: [
                { 'oOldFields.sName': { $regex: new RegExp('^.*' + search + '.*', 'i') } },
                { 'oNewFields.sName': { $regex: new RegExp('^.*' + search + '.*', 'i') } },
                { 'oOldFields.iMatchId': { $in: matchIds } }
              ]
            }
          }
        }
        break
      default:
        query = commonQuery
    }
  }
  return query
}

module.exports = new AdminLogs()
