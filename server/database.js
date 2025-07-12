const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuração da conexão com MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'knights_of_empress',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Criar pool de conexões
const pool = mysql.createPool(dbConfig);

// Função para inicializar o banco de dados
async function initializeDatabase() {
  try {
    // Conectar sem especificar o banco para criar se não existir
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });

    // Criar banco de dados se não existir
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await tempConnection.end();

    // Agora conectar ao banco específico
    const connection = await pool.getConnection();

    // Criar tabela de usuários
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        user_type ENUM('prestadora', 'empresa') NOT NULL,
        segment VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        profile_pic_url TEXT DEFAULT 'https://via.placeholder.com/120/CCCCCC/000000?text=Foto',
        contact_email VARCHAR(255),
        contact_whatsapp VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Criar tabela de curtidas
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        provider_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_like (company_id, provider_id)
      )
    `);

    // Criar tabela de notícias
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS news (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);

    // Inserir dados iniciais de notícias se a tabela estiver vazia
    const [newsRows] = await connection.execute('SELECT COUNT(*) as count FROM news');
    if (newsRows[0].count === 0) {
      await connection.execute(`
        INSERT INTO news (title, content, image_url, category) VALUES
        ('Feira de Empreendedoras 2025: Inscrições Abertas', 'A maior feira de negócios femininos do país está com inscrições abertas. Participe e expanda sua rede de contatos.', 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop', 'Eventos'),
        ('Curso Gratuito: Marketing Digital para Pequenos Negócios', 'Aprenda estratégias eficazes de marketing digital para impulsionar seu negócio nas redes sociais.', 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop', 'Educação'),
        ('Microcrédito para Mulheres Empreendedoras', 'Novo programa de microcrédito com juros especiais para mulheres que querem expandir seus negócios.', 'https://images.pexels.com/photos/259027/pexels-photo-259027.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop', 'Financiamento'),
        ('Workshop: Precificação Estratégica', 'Aprenda a precificar seus produtos e serviços de forma estratégica para maximizar seus lucros.', 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop', 'Capacitação'),
        ('Rede de Mentoria: Conectando Experiências', 'Programa de mentoria que conecta empreendedoras experientes com iniciantes no mundo dos negócios.', 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop', 'Mentoria'),
        ('Sustentabilidade nos Negócios: Tendências 2025', 'Como incorporar práticas sustentáveis em seu negócio e atrair consumidores conscientes.', 'https://images.pexels.com/photos/1181772/pexels-photo-1181772.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop', 'Sustentabilidade')
      `);
    }

    // Inserir usuários de exemplo se a tabela estiver vazia
    const [userRows] = await connection.execute('SELECT COUNT(*) as count FROM users');
    if (userRows[0].count === 0) {
      const bcrypt = require('bcryptjs');
      const empresaHash = await bcrypt.hash('123456', 10);
      const prestadoraHash = await bcrypt.hash('123456', 10);

      await connection.execute(`
        INSERT INTO users (email, password_hash, name, user_type, segment, description, profile_pic_url, contact_email, contact_whatsapp) VALUES
        ('empresa@example.com', ?, 'Loja Decoração Moderna', 'empresa', 'Decoração', 'Buscamos artesãs para parcerias em produtos exclusivos de decoração sustentável.', 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop', 'contato@lojadecor.com', '5511987651234'),
        ('prestadora@example.com', ?, 'Maria Silva', 'prestadora', 'Artesanato', 'Especialista em artesanato sustentável, criando peças únicas com materiais reciclados. Trabalho com decoração, joias e presentes personalizados.', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop', 'maria.artesanato@email.com', '5511987654321')
      `, [empresaHash, prestadoraHash]);
    }

    connection.release();
    console.log('✅ Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

module.exports = { pool, initializeDatabase };