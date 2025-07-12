const express = require('express');
const { pool } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Rota para obter notícias
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [news] = await pool.execute(`
      SELECT id, title, content, image_url, category, created_at
      FROM news
      WHERE is_active = TRUE
      ORDER BY created_at DESC
    `);

    res.json(news);
  } catch (error) {
    console.error('Erro ao buscar notícias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;