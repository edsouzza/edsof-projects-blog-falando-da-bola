async function createPost(db, { title, category, description, thumbnail, user_id }) {
  const [result] = await db.query(
    "INSERT INTO posts (title, category, description, thumbnail, user_id) VALUES (?, ?, ?, ?, ?)",
    [title, category, description, thumbnail, user_id]
  );
  return result.insertId;
}

async function getPostById(db, id) {
  const [rows] = await db.query("SELECT * FROM posts WHERE id = ?", [id]);
  return rows[0];
}

async function getAllPosts(db) {
  const [rows] = await db.query("SELECT * FROM posts ORDER BY updated_at DESC");
  return rows;
}

async function updatePost(db, id, { title, category, description, thumbnail }) {
  await db.query(
    "UPDATE posts SET title = ?, category = ?, description = ?, thumbnail = ?, updated_at = NOW() WHERE id = ?",
    [title, category, description, thumbnail, id]
  );
}

async function deletePost(db, id) {
  await db.query("DELETE FROM posts WHERE id = ?", [id]);
}

module.exports = { createPost, getPostById, getAllPosts, updatePost, deletePost };
