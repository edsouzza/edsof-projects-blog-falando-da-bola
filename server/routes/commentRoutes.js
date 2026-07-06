const express        = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getComments, getComment, getUserComments, createComment, removeComment, editComment } = require('../controllers/commentControllers');

const router = express.Router();

// Rotas públicas - http://localhost:5000/api/comments
router.get('/',          getComments);
router.get('/:id',       getComment);
router.get('/users/:id', getUserComments);

// Rotas protegidas
router.post('/',        authMiddleware, createComment);
router.patch('/:id',    authMiddleware, editComment);
router.delete('/:id',   authMiddleware, removeComment);

module.exports = router;
