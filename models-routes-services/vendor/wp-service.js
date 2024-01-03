const { Client, MessageMedia, RemoteAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const { MongoStore } = require('wwebjs-mongo')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const config = require('../../config/config')
const VendorModel = require('./model')
const MessageLogsModel = require('./messageLogs.model')
const TemplateModel = require('../template/model')
const { status, jsonStatus, messages } = require('../../helper/api.responses')
const { catchError, loadTemplate } = require('../../helper/utilities.services')
const data = require('../../data')

let store
mongoose.connect(config.ADMINS_DB_URL)
  .then(async () => {
    store = new MongoStore({ mongoose })
    console.log('MongoDB connected!')
  })
  .catch((error) => {
    console.log('MongoDB connection error:', error)
  })

const createClientSession = async (id) => {
  try {
    const client = new Client({
      puppeteer: {
        headless: false
      },
      authStrategy: new RemoteAuth({
        store,
        clientId: id,
        backupSyncIntervalMs: 300000
      })
    })

    client.on('qr', (qrCode) => {
      qrcode.generate(qrCode, { small: true })
    })

    client.on('ready', async () => {
      console.log('Client ready')
    })

    client.on('disconnected', (reason) => {
      console.log('Client disconnected', reason)
    })

    client.on('change_state', () => {
      console.log('state changed', client.getState())
    })

    client.on('remote_session_saved', async () => {
      console.log('Remote session saved')
    })

    client.on('authenticated', () => {
      console.log('client authenticated.')
    })

    await client.initialize()
    console.log('Client state:', await client.getState())
    return client
  } catch (error) {
    console.log('Error creating client session:', error)
  }
}

const linkWhatsAppAccount = async (req, res) => {
  const { sMobNum } = req.body
  try {
    const oVendorExist = await VendorModel.findOne({
      _id: req.vendor._id
    }).lean()

    if (oVendorExist?.aWpAccounts?.length > config.WP_ACC_HARD_LIMIT) {
      return res.status(status.BadRequest).jsonp({
        status: jsonStatus.BadRequest,
        message: messages[req.userLanguage].wp_conn_limit_reached
      })
    }

    if (oVendorExist?.aWpAccounts?.length) {
      const wpAcc = req.vendor?.aWpAccounts?.find((data) => data.sMobNum === sMobNum)
      if (wpAcc) return res.status(status.ResourceExist).jsonp({ status: jsonStatus.ResourceExist, message: messages[req.userLanguage].wp_acc_exist })
    }

    const client = await createClientSession(sMobNum)
    const ePlatform = data.ePlatform.map[client?.info?.platform] || 'O'
    oVendorExist?.aWpAccounts?.push({
      sMobNum,
      sClientId: sMobNum,
      ePlatform
    })
    await VendorModel.findByIdAndUpdate(oVendorExist?._id, {
      aWpAccounts: oVendorExist.aWpAccounts
    }).lean()
    return res.status(status.OK).jsonp({ status: status.OK, message: messages[req.userLanguage].link_acc_succ })
  } catch (error) {
    return catchError('Linking.error', error, req, res)
  }
}

const sendMessage = async (req, res) => {
  const { aReceiver, isImage, iTemplateId, sMobNum } = req.body
  try {
    const wpAcc = req.vendor?.aWpAccounts?.find((data) => data.sMobNum === sMobNum)
    if (!wpAcc) return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].wp_acc_not_found })
    const template = await TemplateModel.findOne({ _id: new ObjectId(iTemplateId), iVendorId: new ObjectId(req.vendor._id), eStatus: 'Y' }).lean()
    if (!template) return res.status(status.NotFound).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].not_exist.replace('##', messages[req.userLanguage].template) })
    const sessionExist = await store.sessionExists({ session: `RemoteAuth-${sMobNum}` })
    if (sessionExist === true) {
      const client = await createClientSession(sMobNum)
      const isConnected = await client.getState()
      if (isConnected !== 'CONNECTED') return res.status(status.UnprocessableEntity).jsonp({ status: status.UnprocessableEntity, message: messages[req.userLanguage].notConnected })
      for (const obj of aReceiver) {
        const iChatId = obj.number + '@c.us'
        const oLogData = { iTemplateId, sClientId: wpAcc.sClientId, sSenderNum: sMobNum, isImage, sReceiverNum: obj.number }
        const isRegistered = await client.isRegisteredUser(iChatId)
        if (!isRegistered) return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].not_exist.replace('##', messages[req.userLanguage].user) })
        if (isImage) {
          const media = await MessageMedia.fromUrl(template.sImageUrl, {
            unsafeMime: true
          })
          await client.sendMessage(iChatId, media, { caption: loadTemplate(template.sMessage, obj.Param) })
          await MessageLogsModel.create(oLogData)
        } else {
          await client.sendMessage(iChatId, loadTemplate(template.sMessage, obj.Param))
          await MessageLogsModel.create(oLogData)
        }
      }
      return res.status(status.OK).jsonp({ status: status.OK, message: messages[req.userLanguage].msg_sent })
    }
    return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].not_exist.replace('##', messages[req.userLanguage].session) })
  } catch (error) {
    return catchError('sendMessage.error', error, req, res)
  }
}

const logoutWp = async (req, res) => {
  try {
    const { sMobNum } = req.body
    const wpAcc = req.vendor?.aWpAccounts?.find((data) => data.sMobNum === sMobNum)
    if (!wpAcc) return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].wp_acc_not_found })
    const client = await createClientSession(sMobNum)
    const isConnected = await client.getState()
    if (isConnected !== 'CONNECTED') return res.status(status.UnprocessableEntity).jsonp({ jsonStatus: status.UnprocessableEntity, message: messages[req.userLanguage].notConnected })
    await client.logout()
    const oVendor = await VendorModel.findOneAndUpdate({ _id: new ObjectId(req.vendor._id), 'aWpAccounts.sMobNum': sMobNum }, { $pull: { aWpAccounts: { sMobNum } } })
    if (!oVendor) return res.status(status.BadRequest).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].wp_acc_not_found })
    return res.status(status.OK).jsonp({ status: jsonStatus.OK, message: messages[req.userLanguage].wp_logout_succ })
  } catch (error) {
    return catchError('logoutWp.error', error, req, res)
  }
}

module.exports = { linkWhatsAppAccount, sendMessage, logoutWp }
