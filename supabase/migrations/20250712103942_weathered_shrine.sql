/*
  # Schema inicial para Knights of Empress

  1. Novas Tabelas
    - `users` - Usuários do sistema (prestadoras e empresas)
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text)
      - `name` (text)
      - `user_type` (text) - 'prestadora' ou 'empresa'
      - `segment` (text)
      - `description` (text)
      - `profile_pic_url` (text)
      - `contact_email` (text)
      - `contact_whatsapp` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `likes` - Sistema de curtidas entre empresas e prestadoras
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key)
      - `provider_id` (uuid, foreign key)
      - `created_at` (timestamp)

    - `news` - Portal de notícias e oportunidades
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `image_url` (text)
      - `category` (text)
      - `created_at` (timestamp)
      - `is_active` (boolean)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para usuários autenticados acessarem seus próprios dados
    - Políticas para visualização de perfis públicos
*/

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('prestadora', 'empresa')),
  segment text NOT NULL,
  description text NOT NULL,
  profile_pic_url text DEFAULT 'https://via.placeholder.com/120/CCCCCC/000000?text=Foto',
  contact_email text,
  contact_whatsapp text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de curtidas
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, provider_id)
);

-- Criar tabela de notícias
CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  image_url text NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can read all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Políticas para likes
CREATE POLICY "Users can read likes involving them"
  ON likes
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = company_id OR 
    auth.uid() = provider_id
  );

CREATE POLICY "Companies can create likes"
  ON likes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = company_id AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND user_type = 'empresa'
    )
  );

CREATE POLICY "Users can delete their own likes"
  ON likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = company_id);

-- Políticas para news
CREATE POLICY "Anyone can read active news"
  ON news
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Inserir dados iniciais de notícias
INSERT INTO news (title, content, image_url, category) VALUES
('Feira de Empreendedoras 2025: Inscrições Abertas', 'A maior feira de negócios femininos do país está com inscrições abertas. Participe e expanda sua rede de contatos.', 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop', 'Eventos'),
('Curso Gratuito: Marketing Digital para Pequenos Negócios', 'Aprenda estratégias eficazes de marketing digital para impulsionar seu negócio nas redes sociais.', 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop', 'Educação'),
('Microcrédito para Mulheres Empreendedoras', 'Novo programa de microcrédito com juros especiais para mulheres que querem expandir seus negócios.', 'https://images.pexels.com/photos/259027/pexels-photo-259027.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop', 'Financiamento'),
('Workshop: Precificação Estratégica', 'Aprenda a precificar seus produtos e serviços de forma estratégica para maximizar seus lucros.', 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop', 'Capacitação'),
('Rede de Mentoria: Conectando Experiências', 'Programa de mentoria que conecta empreendedoras experientes com iniciantes no mundo dos negócios.', 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop', 'Mentoria'),
('Sustentabilidade nos Negócios: Tendências 2025', 'Como incorporar práticas sustentáveis em seu negócio e atrair consumidores conscientes.', 'https://images.pexels.com/photos/1181772/pexels-photo-1181772.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop', 'Sustentabilidade');

-- Inserir usuários de exemplo
INSERT INTO users (email, password_hash, name, user_type, segment, description, profile_pic_url, contact_email, contact_whatsapp) VALUES
('empresa@example.com', '$2a$10$example_hash_empresa', 'Loja Decoração Moderna', 'empresa', 'Decoração', 'Buscamos artesãs para parcerias em produtos exclusivos de decoração sustentável.', 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop', 'contato@lojadecor.com', '5511987651234'),
('prestadora@example.com', '$2a$10$example_hash_prestadora', 'Maria Silva', 'prestadora', 'Artesanato', 'Especialista em artesanato sustentável, criando peças únicas com materiais reciclados. Trabalho com decoração, joias e presentes personalizados.', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop', 'maria.artesanato@email.com', '5511987654321'),
('ana.makeup@email.com', '$2a$10$example_hash_ana', 'Ana Beatriz', 'prestadora', 'Beleza', 'Maquiadora profissional com 8 anos de experiência. Especializada em maquiagem para noivas, eventos e ensaios fotográficos.', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop', 'ana.makeup@email.com', '5511998765432'),
('carla.doces@email.com', '$2a$10$example_hash_carla', 'Carla Santos', 'prestadora', 'Alimentação', 'Chef especializada em doces artesanais e bolos personalizados. Atendo eventos, festas e encomendas especiais com ingredientes selecionados.', 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop', 'carla.doces@email.com', '5511976543210');

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();