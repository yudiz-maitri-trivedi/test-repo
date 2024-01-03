/* eslint-disable no-useless-escape */
/* eslint-disable no-prototype-builtins */
/**
 * Utilities Services is for common, simple & reusable methods,
 * @method {removenull} is for removing null key:value pair from the passed object
 * @method {sendmail} is for generating trasport and sending mail with specified mailOptions Object And returns a promise ex: { from:'', to:'',subject: '', html: '' }
 */

const { messages, status, jsonStatus } = require('./api.responses')
const { PUBLIC_KEY, ENCRYPTION_KEY, IV_VALUE } = require('../config/config')
const Crypt = require('hybrid-crypto-js').Crypt
const crypt = new Crypt()
const Sentry = require('@sentry/node')
const { imageFormat } = require('../data')
const { randomInt } = require('crypto')
const CryptoJS = require('crypto-js')
const encryptedKey = CryptoJS.enc.Hex.parse(ENCRYPTION_KEY)
const iv = CryptoJS.enc.Hex.parse(IV_VALUE)

/**
  * It'll remove all nullish, not defined and blank properties of input object.
  * @param {object}
  */
const removenull = (obj) => {
  for (const propName in obj) {
    if (obj[propName] === null || obj[propName] === undefined || obj[propName] === '') {
      delete obj[propName]
    }
  }
}

const catchError = (name, error, req, res) => {
  handleCatchError(error)
  return res.status(status.InternalServerError).jsonp({
    status: jsonStatus.InternalServerError,
    message: messages[req.userLanguage].error
  })
}

const handleCatchError = (error) => {
  if (process.env.NODE_ENV === 'production') Sentry.captureMessage(error)
  console.log('**********ERROR***********', error)
}

const pick = (object, keys) => {
  return keys.reduce((obj, key) => {
    if (object && object.hasOwnProperty(key)) {
      obj[key] = object[key]
    }
    return obj
  }, {})
}

const checkAlphanumeric = (input) => {
  const letters = /^[0-9a-zA-Z]+$/
  return !!(input?.match(letters))
}

const randomStr = (len, type) => {
  let char = ''
  if (type === 'referral' || type === 'private') {
    char = '0123456789abcdefghijklmnopqrstuvwxyz'
  } else if (type === 'otp') {
    char = '0123456789'
  }
  let val = ''
  for (let i = len; i > 0; i--) {
    val += char[generateNumber(0, char.length)]
  }

  if (val.length === len) {
    return val
  } else {
    randomStr(len, type)
  }
}

const defaultSearch = (val) => {
  let search
  if (val) {
    search = val.replace(/\\/g, '\\\\')
      .replace(/\$/g, '\\$')
      .replace(/\*/g, '\\*')
      .replace(/\+/g, '\\+')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\)/g, '\\)')
      .replace(/\(/g, '\\(')
      .replace(/'/g, '\\\'')
      .replace(/"/g, '\\"')
    return search
  } else {
    return ''
  }
}

const getPaginationValues = (obj) => {
  let { start = 0, limit = 10, sort = 'dCreatedAt', order, search } = obj

  start = parseInt(start)
  limit = parseInt(limit)

  const orderBy = order && order === 'asc' ? 1 : -1

  const sorting = { [sort]: orderBy }

  search = defaultSearch(search)

  return { start, limit, sorting, search }
}

const encryption = function (field) {
  const encrypted = crypt.encrypt(PUBLIC_KEY, field)
  return encrypted.toString()
}

const getIp = function (req) {
  try {
    let ip = req.header('x-forwarded-for') ? req.header('x-forwarded-for').split(',') : []
    ip = ip[0] || req.socket.remoteAddress
    return ip
  } catch (error) {
    handleCatchError(error)
    return req.socket.remoteAddress
  }
}

/**
  * This function will validate mobile number that is 10 digit or not.
  * @param {*} 1234567890 Mobile Number
  * return true if matched result of mobile number otherwise return false.
  */
function validateMobile (mobile) {
  return !mobile?.match(/^\+?[1-9][0-9]{8,12}$/) // !mobile.match(/^\d{10}$/)
}
const getPaginationValues2 = (obj) => {
  const { start = 0, limit = 10, sort = 'dCreatedAt', order, search } = obj

  const orderBy = order && order === 'asc' ? 1 : -1

  const sorting = { [sort]: orderBy }

  return { start, limit, sorting, search }
}
function checkValidImageType (sFileName, sContentType) {
  const extension = sFileName.split('.').pop().toLowerCase()
  const valid = imageFormat.find(format => format.extension === extension && format.type === sContentType)
  return !!valid
}

const generateOTP = (nLength) => {
  const digits = '0123456789'
  let OTP = ''
  for (let i = 0; i < nLength; i++) {
    OTP += digits[generateNumber(0, 10)]
  }
  if (Number(OTP).toString().length !== nLength) {
    return generateOTP(nLength)
  }
  return OTP
}

// this function is generate random number between min and max value
// min, max value should be safe Integer
function generateNumber (min, max) {
  return randomInt(min, max)
}

function encryptKey (value) {
  if (value) {
    const message = CryptoJS.enc.Utf8.parse(value)
    const encrypted = CryptoJS.AES.encrypt(message, encryptedKey, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    })
    const cipherText = encrypted.toString()
    return cipherText
  }
}

function encryptKeyPromise (value) {
  return new Promise((resolve, reject) => {
    try {
      if (value) {
        const message = CryptoJS.enc.Utf8.parse(value)
        const encrypted = CryptoJS.AES.encrypt(message, encryptedKey, {
          iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        })
        const cipherText = encrypted.toString()
        resolve(cipherText)
      }
    } catch (error) {
      reject(error)
    }
  })
}

function decryptValue (key) {
  if (key) {
    const decrypted = CryptoJS.AES.decrypt(key, encryptedKey, { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 })
    const decryptedMessage = decrypted?.toString(CryptoJS.enc.Utf8)
    if (decryptedMessage.length) { return decryptedMessage }

    return key
  }
}

function decryptValuePromise (key) {
  return new Promise((resolve, reject) => {
    try {
      if (key) {
        const decrypted = CryptoJS.AES.decrypt(key, encryptedKey, { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 })
        const decryptedMessage = decrypted?.toString(CryptoJS.enc.Utf8)
        if (decryptedMessage.length) { resolve(decryptedMessage) } else { resolve(key) }
      }
    } catch (error) {
      reject(error)
    }
  })
}

function loadTemplate (template, data) {
  return template.replace(/\#\#(\w+)\#\#/g, function (match, key) {
    return data[key]
  })
}

async function decryptIfExist (object, fields) {
  await Promise.all(
    fields.map(async field => {
      if (object?.[field]) object[field] = await decryptValuePromise(object[field])
    })
  )
}

function maskIfExist (object, fields) {
  fields.forEach(field => {
    if (object?.[field]) object[field] = ''
  })
}

module.exports = {
  removenull,
  catchError,
  handleCatchError,
  pick,
  generateOTP,
  checkAlphanumeric,
  getIp,
  randomStr,
  getPaginationValues,
  encryption,
  defaultSearch,
  validateMobile,
  getPaginationValues2,
  checkValidImageType,
  generateNumber,
  encryptKey,
  decryptValue,
  encryptKeyPromise,
  decryptValuePromise,
  decryptIfExist,
  maskIfExist,
  loadTemplate
}
