const express = require('express');
const { getPosts, getPost, getCatPosts, getUserPosts, createPost, editPost, removePost } = require('../controllers/postControllers');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Rotas públicas - http://localhost:5000/api/posts
router.get('/', getPosts);
router.get('/:id', getPost);
router.get('/categories/:category', getCatPosts);
router.get('/users/:id', getUserPosts);

// Rotas protegidas
router.post('/', authMiddleware, createPost);
router.patch('/:id', authMiddleware, editPost);
router.delete('/:id', authMiddleware, removePost);

module.exports = router;
