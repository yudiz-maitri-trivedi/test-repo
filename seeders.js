/* eslint-disable no-console */
const mongoose = require('mongoose')
const cachegoose = require('recachegoose')
const fs = require('fs')
const jwt = require('jsonwebtoken')
// const bcrypt = require('bcryptjs')
// const saltRounds = 1
// const salt = bcrypt.genSaltSync(saltRounds)
const { JWT_SECRET, REDIS_HOST, REDIS_PORT } = require('./config/config')
const permissionsPath = '../fantasy-seeders/permissions.json'
const AdminModel = require('./models-routes-services/admin/model')
// const CredentialModel = require('./models-routes-services/admin/credential.model')
const PermissionsModel = require('./models-routes-services/admin/permissions/model')
const { handleCatchError, encryptKey, encryption } = require('./helper/utilities.services')

const adminPlayloads = [
  {
    sName: 'super admin 1',
    sUsername: 'superadmin',
    sEmail: 'maitri.trivedi@yudiz.com',
    sMobNum: '9979132145',
    sPassword: 'Super@123',
    eType: 'SUPER',
    ePlatform: 'O'
  }, {
    sName: 'super admin 2',
    sUsername: 'admin123',
    sEmail: 'maitri.triv@yudiz.com',
    sMobNum: '9785577535',
    sPassword: 'yudiz@123',
    eType: 'SUPER',
    ePlatform: 'O'
  }]

// const credentialPlayload = {
//   eKey: 'PAY',
//   sPassword: 'fantasy@321'
// }

require('./database/mongoose')
cachegoose(mongoose, {
  engine: 'redis',
  host: REDIS_HOST,
  port: REDIS_PORT
})

function executeFeeder (flag) {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        syncModelsUniqueIndexes()
        await fileExist(permissionsPath, PermissionsModel, flag)

        for (const adminPlayload of adminPlayloads) {
          adminPlayload.sEmail = encryptKey(adminPlayload.sEmail)
          adminPlayload.sMobNum = encryptKey(adminPlayload.sMobNum)
          // adminPlayload.sPassword = encryption(adminPlayload.sPassword)
          await addNormalSeeds(adminPlayload, AdminModel, flag)
        }

        // credentialPlayload.sPassword = bcrypt.hashSync(credentialPlayload.sPassword, salt)
        // await addNormalSeeds(credentialPlayload, CredentialModel, flag)

        resolve()
      } catch (error) {
        handleCatchError(error)
      }
    })()
  })
}

function fileExist (path, Model, flag) {
  fs.stat(path, async function (err, stat) {
    if (err == null) {
      await globeFeeder(path, Model, flag)
    } else if (err.code === 'ENOENT') {
      console.log(`File does not exist at this location ${path}`)
    } else {
      throw new Error(err)
    }
  })
}

async function addNormalSeeds (seed, Model, flag) {
  try {
    if (flag) {
      await Model.deleteMany(seed)
      // await Model.create(seed)
      const admin = new Model(seed)
      admin.sDepositToken = jwt.sign({ _id: (admin._id).toHexString() }, JWT_SECRET)
      admin.sPassword = encryption(admin.sPassword)
      await admin.save()
    } else {
      const data = await Model.findOne(seed).lean()
      if (!data) {
        const admin = new Model(seed)
        admin.sDepositToken = jwt.sign({ _id: (admin._id).toHexString() }, JWT_SECRET)
        await admin.save()
      }
    }
    console.log('addNormalSeeds', seed)
  } catch (error) {
    throw new Error(error)
  }
}

async function globeFeeder (sFilePath, Model, flag) {
  try {
    if (flag) {
      const feedData = fs.readFileSync(sFilePath)
      const parsedData = JSON.parse(feedData)
      await Model.deleteMany()
      await Model.insertMany(parsedData)
    } else {
      const feedData = fs.readFileSync(sFilePath)
      const parsedData = JSON.parse(feedData)
      const data = await Model.find({}).lean()
      if (!data.length) {
        await Model.insertMany(parsedData)
      }
    }
  } catch (error) {
    throw new Error(error)
  }
}

function syncModelsUniqueIndexes () {
  // SyncIndex(CredentialModel, 'Credential')
  SyncIndex(AdminModel, 'Admin')
}

function SyncIndex (Model, sName) {
  Model.syncIndexes().then(() => {
    console.log(`${sName} Model Indexes Synced`)
  }).catch((err) => {
    console.log(`${sName} Model Indexes Sync Error`, err)
  })
}

executeFeeder()
