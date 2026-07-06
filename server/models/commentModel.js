async function createComment(db, { post_id, user_id, content }) {
  const status = "A"; // status inicial

  const [result] = await db.query(
    "INSERT INTO comments (post_id, user_id, content, status) VALUES (?, ?, ?, ?)",
    [post_id, user_id, content, status]
  );

  return {
    id: result.insertId,
    post_id,
    user_id,
    content,
    status,
    created_at: new Date()
  };
}

async function updateComment(db, id, { content, status }) {
  await db.query(
    "UPDATE comments SET content = ?, status = ?, updated_at = NOW() WHERE id = ?",
    [content, status, id]
  );
}

async function getCommentById(db, id) {
  const [rows] = await db.query("SELECT * FROM comments WHERE id = ?", [id]);
  return rows[0];
}

async function getAllComments(db) {
  const [rows] = await db.query("SELECT * FROM comments ORDER BY created_at DESC");
  return rows;
}

async function deleteComment(db, id) {
  await db.query("DELETE FROM comments WHERE id = ?", [id]);
}

module.exports = { createComment, getCommentById, getAllComments, deleteComment, updateComment };
