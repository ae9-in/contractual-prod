const express = require('express');
const fileController = require('../controllers/fileController');
const fileAuthMiddleware = require('../middleware/fileAuthMiddleware');

const router = express.Router();

router.get('/:filename', fileAuthMiddleware, fileController.getUploadedFile);

module.exports = router;
