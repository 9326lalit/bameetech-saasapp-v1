const express = require('express');
const { register, login, getProfile } = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', verifyToken, getProfile);

module.exports = router;