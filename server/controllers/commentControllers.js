const HttpError     = require('../models/errorModel');

//============================== CREATE NEW Comment
const createComment = async (req, res, next) => {
  try {
    
    const { post_id, content } = req.body;
    if (!post_id || !content) {
      return next(new HttpError("Preencha todos os campos.", 422));
    }

    const db = req.app.locals.db;

    // Pegando o user_id do usuário autenticado
    const user_id = req.user?.id; 
    if (!user_id) {
      return next(new HttpError("Usuário não autenticado.", 401));
    }
   
    const [result] = await db.query(
      "INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)",
      [post_id, user_id, content]
    );

    if (!result.insertId) {
      return next(new HttpError("Algo deu errado.", 422));
    }

    return res.status(201).json({
      id: result.insertId,
      post_id,
      user_id,
      content,
      created_at: new Date()
    });

  } catch (error) {
    return next(new HttpError(error.message || error, 500));
  }
};

//============================== EDIT COMMENT
const editComment = async (req, res, next) => {
  try {
    const db                  = req.app.locals.db;
    const commentID           = req.params.id;
    let { content, status  }  = req.body;   

    const [rows]     = await db.query("SELECT * FROM comments WHERE id = ?", [commentID]);
    const oldComment = rows[0];
    
    if (req.user.id != oldComment.user_id) {
      return next(new HttpError("Não foi possível atualizar o comentário.", 403));
    }

    // Mantém valores antigos se não forem enviados | tipos : moderado | aprovado | reprovado
    // se o comentario foi alterado seu status volta para moderado
    content = content || oldComment.content;

    // Se o conteúdo mudou, volta para "moderado" caso contrario, mantém o status antigo
    if (content !== oldComment.content) {
      status = 'moderado';
    } else {
      status = oldComment.status;
    }
   
    await db.query(
      "UPDATE comments SET content = ?, status = ?, updated_at = NOW() WHERE id = ?",
      [content, status, commentID]
    );

    res.json({ message: "Comentário atualizado com sucesso!" });
  } catch (error) {
    return next(new HttpError(error));
  }
};


//============================== GET ALL CommentS
const getComments = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const [Comments] = await db.query("SELECT * FROM comments ORDER BY created_at DESC");
    res.status(200).json(Comments);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//============================== GET SINGLE Comment
const getComment = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const [rows] = await db.query("SELECT * FROM comments WHERE id = ?", [req.params.id]);

    if (rows.length === 0) {
      return next(new HttpError("Comentário não encontrado.", 404));
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//============================== GET CommentS BY AUTHOR
const getUserComments = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const [rows] = await db.query("SELECT * FROM comments WHERE user_id = ? ORDER BY created_at DESC", [req.params.id]);
    res.json(rows);
  } catch (error) {
    return next(new HttpError(error));
  }
};

//============================== DELETE Comment
const removeComment = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const CommentID = req.params.id;

    const [rows] = await db.query("SELECT * FROM comments WHERE id = ?", [CommentID]);
    const Comment = rows[0];

    if (!Comment) {
      return next(new HttpError("Comentário indisponível"));
    }

    if (req.user.id == Comment.user_id) {     
      await db.query("DELETE FROM comments WHERE id = ?", [CommentID]);
      res.json("Comentário deletado com sucesso!");
    }else {
      return next(new HttpError("Não foi possível deletar o comentário.", 403));
    }
  } catch (error) {
    return next(new HttpError(error));
  }
};

module.exports = { getComments, getComment, getUserComments, createComment, removeComment, editComment };
