const path          = require('path');
const fs            = require('fs');
const { v4: uuid }  = require("uuid");
const HttpError     = require('../models/errorModel');

//============================== CREATE NEW POST
const createPost = async (req, res, next) => {
  try {
    let { title, category, description } = req.body;
    if (!title || !category || !description) {
      return next(new HttpError("Preencha todos os campos.", 422));
    }

    const db = req.app.locals.db;
    let newFilename;

    // Se não houver arquivo enviado, usa a thumb padrão mas gera nome único
    if (!req.files || !req.files.thumbnail) {
      let fileName = "default-thumbnail.png";
      let splittedFilename = fileName.split('.');
      newFilename = splittedFilename[0] + uuid() + "." + splittedFilename[splittedFilename.length - 1];

      // Copia o arquivo padrão para um novo nome dentro de uploads
      fs.copyFileSync(
        path.join(__dirname, '..', 'uploads', fileName),
        path.join(__dirname, '..', 'uploads', newFilename)
      );

      const [result] = await db.query(
        "INSERT INTO posts (title, category, content, thumbnail, user_id) VALUES (?, ?, ?, ?, ?)",
        [title, category, description, newFilename, req.user.id]
      );

      if (!result.insertId) {
        return next(new HttpError("Algo deu errado.", 422));
      }

      return res.status(201).json({
        id: result.insertId,
        title,
        category,
        description,
        thumbnail: newFilename,
        creator: req.user.id
      });
    }

    // Se houver thumbnail enviada
    const { thumbnail } = req.files;
    if (thumbnail.size > 2000000) {
      return next(new HttpError("Miniatura muito grande. O tamanho do arquivo deve ser inferior a 2 MB."));
    }

    let fileName = thumbnail.name;
    let splittedFilename = fileName.split('.');
    newFilename = splittedFilename[0] + uuid() + "." + splittedFilename[splittedFilename.length - 1];

    thumbnail.mv(path.join(__dirname, '..', 'uploads', newFilename), async (err) => {
      if (err) {
        return next(new HttpError(err));
      } else {
        const [result] = await db.query(
          "INSERT INTO posts (title, category, content, thumbnail, user_id) VALUES (?, ?, ?, ?, ?)",
          [title, category, description, newFilename, req.user.id]
        );

        if (!result.insertId) {
          return next(new HttpError("Algo deu errado.", 422));
        }

        res.status(201).json({
          id: result.insertId,
          title,
          category,
          description,
          thumbnail: newFilename,
          creator: req.user.id
        });
      }
    });
  } catch (error) {
    return next(new HttpError(error));
  }
};

//============================== GET ALL POSTS
const getPosts = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const [posts] = await db.query("SELECT * FROM posts ORDER BY updated_at DESC");
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//============================== GET SINGLE POST
const getPost = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const [rows] = await db.query("SELECT * FROM posts WHERE id = ?", [req.params.id]);

    if (rows.length === 0) {
      return next(new HttpError("Post não encontrado.", 404));
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//============================== GET POSTS BY CATEGORY
const getCatPosts = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const [rows] = await db.query("SELECT * FROM posts WHERE category = ? ORDER BY created_at DESC", [req.params.category]);
    res.json(rows);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//============================== GET POSTS BY AUTHOR
const getUserPosts = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const [rows] = await db.query("SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC", [req.params.id]);
    res.json(rows);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//============================== EDIT POST
const editPost = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const postID = req.params.id;
    let { title, category, content } = req.body;

    // Validação inteligente: só valida se content foi enviado
    if (content && content.length < 12) {
      return next(new HttpError("O conteúdo deve ter pelo menos 12 caracteres.", 422));
    }

    const [rows] = await db.query("SELECT * FROM posts WHERE id = ?", [postID]);
    const oldPost = rows[0];

    if (req.user.id != oldPost.user_id) {
      return next(new HttpError("Não foi possível atualizar o post.", 403));
    }

    // Mantém valores antigos se não forem enviados
    title       = title     || oldPost.title;
    category    = category  || oldPost.category;
    content     = content   || oldPost.content;

    let newFilename = oldPost.thumbnail;

    if (req.files && req.files.thumbnail) {
      fs.unlink(path.join(__dirname, '..', 'uploads', oldPost.thumbnail), (err) => {
        if (err) console.error(err);
      });

      const { thumbnail } = req.files;
      if (thumbnail.size > 2000000) {
        return next(new HttpError("Miniatura muito grande. Deve ter menos de 2 MB."));
      }

      let fileName          = thumbnail.name;
      let splittedFilename  = fileName.split('.');
      newFilename           = splittedFilename[0] + uuid() + "." + splittedFilename[splittedFilename.length - 1];
      thumbnail.mv(path.join(__dirname, '..', 'uploads', newFilename), (err) => {
        if (err) return next(new HttpError(err));
      });
    }

    await db.query(
      "UPDATE posts SET title = ?, category = ?, content = ?, thumbnail = ?, updated_at = NOW() WHERE id = ?",
      [title, category, content, newFilename, postID]
    );

    res.json({ message: "Post atualizado com sucesso!" });
  } catch (error) {
    return next(new HttpError(error));
  }
};

//============================== DELETE POST
const removePost = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const postID = req.params.id;

    const [rows] = await db.query("SELECT * FROM posts WHERE id = ?", [postID]);
    const post = rows[0];

    if (!post) {
      return next(new HttpError("Post indisponível"));
    }

    if (req.user.id == post.user_id) {
      fs.unlink(path.join(__dirname, '..', 'uploads', post.thumbnail), async (err) => {
        if (err) {
          return next(err);
        } else {
          await db.query("DELETE FROM posts WHERE id = ?", [postID]);
          res.json("Post deleted");
        }
      });
    } else {
      return next(new HttpError("Não foi possível deletar o post.", 403));
    }
  } catch (error) {
    return next(new HttpError(error));
  }
};

module.exports = { getPosts, getPost, getCatPosts, getUserPosts, createPost, editPost, removePost };
