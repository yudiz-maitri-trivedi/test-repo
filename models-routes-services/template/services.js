const TemplateModel = require('./model')
const { catchError, pick, removenull } = require('../../helper/utilities.services')
const { status, jsonStatus, messages } = require('../../helper/api.responses')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

class Template {
  async create (req, res) {
    try {
      req.body = pick(req.body, ['sImageUrl', 'sMessage'])
      const { sImageUrl, sMessage } = req.body
      removenull(req.body)
      const template = await TemplateModel.create({
        sImageUrl,
        sMessage,
        iVendorId: req.vendor._id
      })
      return res.status(status.OK).jsonp({
        status: jsonStatus.OK,
        message: messages[req.userLanguage].add_success.replace(
          '##',
          messages[req.userLanguage].template
        ),
        template
      })
    } catch (error) {
      return catchError('Template.create', error, req, res)
    }
  }

  async get (req, res) {
    try {
      const template = await TemplateModel.findOne({ _id: new ObjectId(req.params.id), eStatus: 'Y' }, { iVendorId: 1, sMessage: 1, sImageUrl: 1 }).lean()
      if (!template) {
        return res.status(status.NotFound).jsonp({
          status: jsonStatus.NotFound,
          message: messages[req.userLanguage].not_exist.replace(
            '##',
            messages[req.userLanguage].template
          )
        })
      }
      return res.status(status.OK).jsonp({
        status: jsonStatus.OK,
        message: messages[req.userLanguage].success.replace(
          '##',
          messages[req.userLanguage].template
        ),
        template
      })
    } catch (error) {
      return catchError('Template.get', error, req, res)
    }
  }

  async update (req, res) {
    try {
      const { sMessage, eStatus } = req.body
      req.body = pick(req.body, ['sMessage', 'eStatus'])
      removenull(req.body)
      if (!sMessage || !eStatus) return res.status(status.BadRequest).jsonp({ status: jsonStatus.BadRequest, message: messages[req.userLanguage].fieldRequired })
      const template = await TemplateModel.findByIdAndUpdate(
        req.params.id,
        { ...req.body },
        { new: true, runValidators: true }
      ).lean()
      if (!template) {
        return res.status(status.NotFound).jsonp({
          status: jsonStatus.NotFound,
          message: messages[req.userLanguage].not_exist.replace(
            '##',
            messages[req.userLanguage].template
          )
        })
      }
      return res.status(status.OK).jsonp({
        status: jsonStatus.OK,
        message: messages[req.userLanguage].update_success.replace(
          '##',
          messages[req.userLanguage].template
        ),
        template
      })
    } catch (error) {
      return catchError('Template.update', error, req, res)
    }
  }

  async list (req, res) {
    try {
      const template = await TemplateModel.find({ iVendorId: req.vendor._id, eStatus: 'Y' }).lean()
      console.log(template)
      return res.status(status.OK).jsonp({
        status: jsonStatus.OK,
        message: messages[req.userLanguage].success.replace(
          '##',
          messages[req.userLanguage].templates
        ),
        template
      })
    } catch (error) {
      return catchError('Template.list', error, req, res)
    }
  }

  async adminList (req, res) {
    try {
      const template = await TemplateModel.find({ eStatus: 'Y' }).lean()
      return res.status(status.OK).jsonp({
        status: jsonStatus.OK,
        message: messages[req.userLanguage].success.replace(
          '##',
          messages[req.userLanguage].templates
        ),
        template
      })
    } catch (error) {
      return catchError('Template.list', error, req, res)
    }
  }

  async delete (req, res) {
    try {
      const data = await TemplateModel.findOneAndUpdate({ _id: req.params.id, eStatus: 'Y' }, { eStatus: 'N' }).lean()
      if (!data) return res.status(status.NotFound).jsonp({ status: jsonStatus.NotFound, message: messages[req.userLanguage].not_exist.replace('##', messages[req.userLanguage].template) })

      return res.status(status.OK).jsonp({
        status: jsonStatus.OK,
        message: messages[req.userLanguage].del_success.replace(
          '##',
          messages[req.userLanguage].template
        )
      })
    } catch (error) {
      return catchError('Template.delete', error, req, res)
    }
  }
}

module.exports = new Template()
