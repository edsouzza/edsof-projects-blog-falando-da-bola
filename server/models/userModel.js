async function createUser(db, { name, email, password }) {
  const [result] = await db.query(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, password]
  );
  return result.insertId;
}

async function getUserByEmail(db, email) {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0];
}

async function getUserById(db, id) {
  const [rows] = await db.query("SELECT id, name, email, avatar, posts, created_at FROM users WHERE id = ?", [id]);
  return rows[0];
}

async function updateUser(db, id, { name, email, password }) {
  await db.query(
    "UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?",
    [name, email, password, id]
  );
}

async function updateAvatar(db, id, avatar) {
  await db.query("UPDATE users SET avatar = ? WHERE id = ?", [avatar, id]);
}

async function getAllUsers(db) {
  const [rows] = await db.query("SELECT id, name, email, avatar, posts, created_at FROM users");
  return rows;
}

module.exports = { createUser, getUserByEmail, getUserById, updateUser, updateAvatar, getAllUsers };
