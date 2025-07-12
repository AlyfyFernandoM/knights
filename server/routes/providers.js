const express = require('express');
const { pool } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Rota para obter prestadoras (para empresas)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Verificar se é empresa
    if (req.user.userType !== 'empresa') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Buscar prestadoras que ainda não foram curtidas por esta empresa
    const [providers] = await pool.execute(`
      SELECT u.id, u.name, u.segment, u.description, u.profile_pic_url, u.contact_email, u.contact_whatsapp
      FROM users u
      WHERE u.user_type = 'prestadora'
      AND u.id NOT IN (
        SELECT provider_id FROM likes WHERE company_id = ?
      )
      ORDER BY u.created_at DESC
    `, [req.user.userId]);

    res.json(providers);
  } catch (error) {
    console.error('Erro ao buscar prestadoras:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para curtir prestadora
router.post('/like', authenticateToken, async (req, res) => {
  try {
    const { providerId } = req.body;

    // Verificar se é empresa
    if (req.user.userType !== 'empresa') {
      return res.status(403).json({ error: 'Apenas empresas podem curtir prestadoras' });
    }

    // Verificar se a prestadora existe
    const [providers] = await pool.execute(
      'SELECT id FROM users WHERE id = ? AND user_type = "prestadora"',
      [providerId]
    );

    if (providers.length === 0) {
      return res.status(404).json({ error: 'Prestadora não encontrada' });
    }

    // Inserir curtida (ou ignorar se já existe)
    await pool.execute(
      'INSERT IGNORE INTO likes (company_id, provider_id) VALUES (?, ?)',
      [req.user.userId, providerId]
    );

    res.json({ message: 'Prestadora curtida com sucesso' });
  } catch (error) {
    console.error('Erro ao curtir prestadora:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para obter prestadoras curtidas (para empresas)
router.get('/liked', authenticateToken, async (req, res) => {
  try {
    // Verificar se é empresa
    if (req.user.userType !== 'empresa') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const [likedProviders] = await pool.execute(`
      SELECT u.id, u.name, u.segment, u.description, u.profile_pic_url, u.contact_email, u.contact_whatsapp
      FROM users u
      INNER JOIN likes l ON u.id = l.provider_id
      WHERE l.company_id = ? AND u.user_type = 'prestadora'
      ORDER BY l.created_at DESC
    `, [req.user.userId]);

    res.json(likedProviders);
  } catch (error) {
    console.error('Erro ao buscar prestadoras curtidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para obter empresas que curtiram a prestadora
router.get('/liked-by', authenticateToken, async (req, res) => {
  try {
    // Verificar se é prestadora
    if (req.user.userType !== 'prestadora') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const [companies] = await pool.execute(`
      SELECT u.id, u.name, u.segment, u.description, u.profile_pic_url, u.contact_email, u.contact_whatsapp
      FROM users u
      INNER JOIN likes l ON u.id = l.company_id
      WHERE l.provider_id = ? AND u.user_type = 'empresa'
      ORDER BY l.created_at DESC
    `, [req.user.userId]);

    res.json(companies);
  } catch (error) {
    console.error('Erro ao buscar empresas que curtiram:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;