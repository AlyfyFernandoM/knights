const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./database');
const { router: authRoutes } = require('./routes/auth');
const providersRoutes = require('./routes/providers');
const newsRoutes = require('./routes/news');

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../Knights')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/news', newsRoutes);

// Rota para servir as páginas HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Knights/siteprovisorio.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../Knights/login.html'));
});

app.get('/cadastro', (req, res) => {
  res.sendFile(path.join(__dirname, '../Knights/tela-cadastro.html'));
});

app.get('/empresa', (req, res) => {
  res.sendFile(path.join(__dirname, '../Knights/empresa.html'));
});

app.get('/prestadora', (req, res) => {
  res.sendFile(path.join(__dirname, '../Knights/prestadora.html'));
});

// Inicializar banco de dados e servidor
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📱 Acesse: http://localhost:${PORT}`);
      console.log(`🗄️  Banco MySQL conectado`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();