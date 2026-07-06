require('dotenv').config();
const express        = require('express');
const cors           = require('cors');
const upload         = require('express-fileupload');
const path           = require('path');

const postRoutes     = require('./routes/postRoutes');
const userRoutes     = require('./routes/userRoutes');
const commentRoutes  = require('./routes/commentRoutes');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const mysql = require("mysql2/promise");

const app   = express();

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(upload());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
app.use('/api/users',    userRoutes);
app.use('/api/posts',    postRoutes);
app.use('/api/comments', commentRoutes);

// Middlewares de erro
app.use(notFound);
app.use(errorHandler);

async function startServer() {
  try {
    // Conexão com MySQL
    const connection = await mysql.createConnection({
      host    : "localhost",
      user    : "root",
      password: "Pgminfo1",
      database: "mern_blog"
    });

    console.log("Conectado ao MySQL!");

    // Disponibiliza a conexão para uso nos controllers
    app.locals.db = connection;

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("Erro ao conectar ao MySQL:", error);
  }
}

startServer();
