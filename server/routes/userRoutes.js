const express = require('express');
const { registerUser, loginUser, logoutUser, getUser, changeAvatar, editUser, getAuthors } = require('../controllers/userControllers');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Defina suas rotas - http://localhost:5000/api/users
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/logout', logoutUser);
router.get('/:id', getUser);
router.patch('/edit', authMiddleware, editUser);
router.patch('/avatar', changeAvatar);
router.get('/', getAuthors);

module.exports = router;
