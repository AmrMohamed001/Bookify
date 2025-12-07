const router = require('express').Router()
const controller = require('../controllers/categoryConteroller')
router.route('/').post(controller.AddCategory)

module.exports = router;