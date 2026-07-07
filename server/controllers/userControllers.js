const bcrypt        = require('bcryptjs');
const jwt           = require('jsonwebtoken');
const { v4: uuid }  = require("uuid");
const fs            = require('fs');
const path          = require('path');
const HttpError     = require('../models/errorModel');

//============================== REGISTER USER
const registerUser = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { name, email, password, password2 } = req.body;
    if (!name || !email || !password) {
      return next(new HttpError("Preencha todos os campos.", 422));
    }

    const newEmail = email.toLowerCase();

    const [emailExists] = await db.query("SELECT * FROM users WHERE email = ?", [newEmail]);
    if (emailExists.length > 0) {
      return next(new HttpError("Este E-mail já esta cadastrado!", 422));
    }

    if (password.trim().length < 6) {
      return next(new HttpError("A senha não pode ter menos de 6 caracteres", 422));
    }

    if (password !== password2) {
      return next(new HttpError("As senhas não são iguais.", 422));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);

    // Avatar padrão
    const defaultAvatar = "default-avatar.png";

    await db.query("INSERT INTO users (name, email, password, avatar) VALUES (?, ?, ?, ?)", [name, newEmail, hashedPass, defaultAvatar]);

    res.status(201).json(`Novo usuário ${newEmail} cadastrado com sucesso!!`);
  } catch (error) {
    return next(new HttpError("Erro ao cadastrar o usuário.", 422));
  }
};

//============================== JWT GENERATOR
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });
};

//============================== LOGIN USER
const loginUser = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new HttpError("Preencha todos os campos.", 422));
    }

    const newEmail = email.toLowerCase();
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [newEmail]);
    const user = rows[0];

    if (!user) {
      return next(new HttpError("Credenciais inválidas.", 422));
    }

    const comparePass = await bcrypt.compare(password, user.password);
    if (!comparePass) {
      return next(new HttpError("Credenciais inválidas.", 422));
    }

    const { id, name } = user;
    const token = generateToken({ id, name });

    res.status(200).json({ token, id, name });
  } catch (error) {
    return next(new HttpError("Login falhou. Por favor verifique suas credenciais.", 422));
  }
};

//============================== GET USER PROFILE
const getUser = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, u.avatar, 
      u.created_at AS createdAt, 
      COUNT(p.id) AS total_posts
      FROM users u
      LEFT JOIN posts p ON u.id = p.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [req.params.id]);

    const user = rows[0];
    if (!user) {
      return next(new HttpError("Usuário não encontrado.", 404));
    }

    res.status(200).json(user);
  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};

//============================== LOGOUT USER
const logoutUser = (req, res, next) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.status(200).json('Usuário deslogado!');
};

//============================== CHANGE AVATAR
const changeAvatar = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    // Se não houver arquivo enviado, define avatar padrão
    if (!req.files || !req.files.avatar) {
      const defaultAvatar = "avatar.png";
      await db.query("UPDATE users SET avatar = ? WHERE id = ?", [defaultAvatar, req.user.id]);
      return res.status(200).json({ avatar: defaultAvatar });
    }

    // Se houver arquivo, segue fluxo normal
    const { avatar } = req.files;

    if (avatar.size > 500000) {
      return next(new HttpError("Foto de perfil muito grande. O tamanho do arquivo deve ser inferior a 500 KB."));
    }

    // Apaga avatar antigo se existir
    const [rows] = await db.query("SELECT avatar FROM users WHERE id = ?", [req.user.id]);
    const user = rows[0];
    if (user && user.avatar && user.avatar !== "avatar.png") {
      fs.unlink(path.join(__dirname, '..', 'uploads', user.avatar), (err) => {
        if (err) console.error(err);
      });
    }

    // Gera novo nome único
    let fileName = avatar.name;
    let splittedFilename = fileName.split('.');
    let newFilename = splittedFilename[0] + uuid() + "." + splittedFilename[splittedFilename.length - 1];

    // Move arquivo para pasta uploads
    avatar.mv(path.join(__dirname, '..', 'uploads', newFilename), async (err) => {
      if (err) return next(new HttpError(err));

      await db.query("UPDATE users SET avatar = ? WHERE id = ?", [newFilename, req.user.id]);
      res.status(200).json({ avatar: newFilename });
    });
  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};

//============================== EDIT USER
const editUser = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { name, email, currentPassword, newPassword, confirmNewPassword } = req.body;

    // Buscar usuário atual
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [req.user.id]);
    const user = rows[0];
    if (!user) {
      return next(new HttpError("Usuário não encontrado.", 403));
    }

    // Verificar se email já existe em outro usuário
    if (email) {
      const [emailRows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
      if (emailRows.length > 0 && emailRows[0].id !== req.user.id) {
        return next(new HttpError("Este E-mail já esta cadastrado.", 422));
      }
    }

    // Caso: apenas nome ou email
    if ((name || email) && !currentPassword && !newPassword && !confirmNewPassword) {
      await db.query("UPDATE users SET name = ?, email = ? WHERE id = ?", [
        name || user.name,
        email || user.email,
        req.user.id
      ]);
      return res.status(200).json({ id: req.user.id, name: name || user.name, email: email || user.email });
    }

    // Caso: troca de senha (com ou sem nome/email)
    if (currentPassword && newPassword && confirmNewPassword) {
      const validateUserPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validateUserPassword) {
        return next(new HttpError("Senha inválida."));
      }
      if (newPassword !== confirmNewPassword) {
        return next(new HttpError("New passwords do not match.", 422));
      }

      const newSalt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(newPassword, newSalt);

      await db.query("UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?", [
        name || user.name,
        email || user.email,
        newHash,
        req.user.id
      ]);

      return res.status(200).json({ id: req.user.id, name: name || user.name, email: email || user.email });
    }

    // Se não cair em nenhum dos casos
    return next(new HttpError("Preencha todos os campos.", 422));
  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};


//============================== GET AUTHORS
const getAuthors = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const [authors] = await db.query(`
      SELECT u.id, u.name, u.email, u.avatar, 
      u.created_at AS createdAt,  
      COUNT(p.id) AS total_posts
      FROM users u
      LEFT JOIN posts p ON u.id = p.user_id
      GROUP BY u.id
    `);
    res.json(authors);
  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};

module.exports = { registerUser, loginUser, logoutUser, getUser, changeAvatar, editUser, getAuthors };
