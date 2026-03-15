-- Tem na Area
-- Estrutura completa MySQL 8.0+ para importacao no phpMyAdmin / Hostinger

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS tem_na_area
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE tem_na_area;

DROP TABLE IF EXISTS relatorios;
DROP TABLE IF EXISTS metricas;
DROP TABLE IF EXISTS vendas;
DROP TABLE IF EXISTS historico_status_pedido;
DROP TABLE IF EXISTS itens_pedido;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS itens_carrinho;
DROP TABLE IF EXISTS carrinhos;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS cardapios;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS banners_loja;
DROP TABLE IF EXISTS cards_home;
DROP TABLE IF EXISTS configuracoes_loja;
DROP TABLE IF EXISTS pagamentos;
DROP TABLE IF EXISTS solicitacoes_cadastro;
DROP TABLE IF EXISTS lojas;
DROP TABLE IF EXISTS donos_loja;
DROP TABLE IF EXISTS administradores;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS planos;

CREATE TABLE planos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(120) NOT NULL,
  descricao TEXT NULL,
  tipo_exibicao ENUM('WHATSAPP_ONLY', 'LOJA_COMPLETA') NOT NULL,
  preco_mensal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  permite_cardapio TINYINT(1) NOT NULL DEFAULT 0,
  permite_produtos TINYINT(1) NOT NULL DEFAULT 0,
  permite_pedidos TINYINT(1) NOT NULL DEFAULT 0,
  permite_relatorios TINYINT(1) NOT NULL DEFAULT 0,
  limite_produtos INT UNSIGNED NULL,
  limite_banners INT UNSIGNED NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_planos_codigo (codigo),
  KEY idx_planos_tipo_ativo (tipo_exibicao, ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuarios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid CHAR(36) NOT NULL,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  telefone VARCHAR(30) NULL,
  whatsapp VARCHAR(30) NULL,
  senha_hash VARCHAR(255) NOT NULL,
  tipo_usuario ENUM('ADMINISTRADOR', 'DONO_LOJA', 'CLIENTE') NOT NULL,
  status ENUM('ATIVO', 'PENDENTE', 'BLOQUEADO', 'INATIVO') NOT NULL DEFAULT 'PENDENTE',
  ultimo_login_em DATETIME NULL,
  email_verificado_em DATETIME NULL,
  telefone_verificado_em DATETIME NULL,
  avatar_url VARCHAR(255) NULL,
  observacoes_internas TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_uuid (uuid),
  UNIQUE KEY uq_usuarios_email (email),
  UNIQUE KEY uq_usuarios_telefone (telefone),
  KEY idx_usuarios_tipo_status (tipo_usuario, status),
  KEY idx_usuarios_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE clientes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id BIGINT UNSIGNED NOT NULL,
  cpf_cnpj VARCHAR(20) NULL,
  data_nascimento DATE NULL,
  genero VARCHAR(30) NULL,
  endereco_principal_cep VARCHAR(12) NULL,
  endereco_principal_logradouro VARCHAR(180) NULL,
  endereco_principal_numero VARCHAR(20) NULL,
  endereco_principal_complemento VARCHAR(120) NULL,
  endereco_principal_bairro VARCHAR(120) NULL,
  endereco_principal_cidade VARCHAR(120) NULL,
  endereco_principal_estado CHAR(2) NULL,
  referencia_endereco VARCHAR(180) NULL,
  aceita_marketing TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clientes_usuario (usuario_id),
  KEY idx_clientes_cidade_estado (endereco_principal_cidade, endereco_principal_estado),
  CONSTRAINT fk_clientes_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE administradores (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id BIGINT UNSIGNED NOT NULL,
  nivel_acesso ENUM('SUPER_ADMIN', 'OPERADOR', 'FINANCEIRO', 'SUPORTE') NOT NULL DEFAULT 'OPERADOR',
  departamento VARCHAR(100) NULL,
  ultimo_acesso_painel_em DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_administradores_usuario (usuario_id),
  KEY idx_administradores_nivel (nivel_acesso),
  CONSTRAINT fk_administradores_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE donos_loja (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id BIGINT UNSIGNED NOT NULL,
  nome_fantasia VARCHAR(180) NULL,
  razao_social VARCHAR(180) NULL,
  cpf_cnpj VARCHAR(20) NULL,
  inscricao_estadual VARCHAR(30) NULL,
  data_adesao DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_donos_loja_usuario (usuario_id),
  UNIQUE KEY uq_donos_loja_cpf_cnpj (cpf_cnpj),
  CONSTRAINT fk_donos_loja_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE solicitacoes_cadastro (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  protocolo VARCHAR(30) NOT NULL,
  tipo_solicitacao ENUM('LOJA_GRATIS', 'LOJA_PAGA') NOT NULL,
  nome_empresa VARCHAR(180) NOT NULL,
  nome_responsavel VARCHAR(150) NULL,
  email VARCHAR(190) NULL,
  telefone VARCHAR(30) NULL,
  whatsapp VARCHAR(30) NOT NULL,
  cpf_cnpj VARCHAR(20) NULL,
  categoria_principal VARCHAR(100) NOT NULL,
  descricao_resumida VARCHAR(255) NULL,
  cidade VARCHAR(120) NULL,
  estado CHAR(2) NULL,
  endereco_logradouro VARCHAR(180) NULL,
  endereco_numero VARCHAR(20) NULL,
  endereco_bairro VARCHAR(120) NULL,
  endereco_complemento VARCHAR(120) NULL,
  cep VARCHAR(12) NULL,
  horario_funcionamento VARCHAR(180) NULL,
  logo_url VARCHAR(255) NULL,
  capa_url VARCHAR(255) NULL,
  observacoes TEXT NULL,
  plano_id BIGINT UNSIGNED NOT NULL,
  usuario_id BIGINT UNSIGNED NULL,
  dono_loja_id BIGINT UNSIGNED NULL,
  status_solicitacao ENUM('PENDENTE', 'EM_ANALISE', 'AGUARDANDO_PAGAMENTO', 'PAGO', 'APROVADA', 'REJEITADA', 'CANCELADA') NOT NULL DEFAULT 'PENDENTE',
  status_pagamento ENUM('NAO_APLICAVEL', 'PENDENTE', 'EM_PROCESSAMENTO', 'APROVADO', 'RECUSADO', 'ESTORNADO', 'CANCELADO') NOT NULL DEFAULT 'NAO_APLICAVEL',
  analisado_por_admin_id BIGINT UNSIGNED NULL,
  analisado_em DATETIME NULL,
  motivo_rejeicao TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_solicitacoes_protocolo (protocolo),
  KEY idx_solicitacoes_status (status_solicitacao, status_pagamento),
  KEY idx_solicitacoes_plano (plano_id),
  KEY idx_solicitacoes_whatsapp (whatsapp),
  CONSTRAINT fk_solicitacoes_plano
    FOREIGN KEY (plano_id) REFERENCES planos (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_solicitacoes_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_solicitacoes_dono_loja
    FOREIGN KEY (dono_loja_id) REFERENCES donos_loja (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_solicitacoes_admin
    FOREIGN KEY (analisado_por_admin_id) REFERENCES administradores (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pagamentos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  solicitacao_cadastro_id BIGINT UNSIGNED NOT NULL,
  usuario_id BIGINT UNSIGNED NULL,
  plano_id BIGINT UNSIGNED NOT NULL,
  gateway_pagamento VARCHAR(80) NULL,
  referencia_gateway VARCHAR(120) NULL,
  codigo_transacao VARCHAR(120) NULL,
  metodo_pagamento ENUM('PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO', 'TRANSFERENCIA', 'OUTRO') NOT NULL,
  status_pagamento ENUM('PENDENTE', 'EM_PROCESSAMENTO', 'APROVADO', 'RECUSADO', 'ESTORNADO', 'EXPIRADO', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',
  valor_bruto DECIMAL(10,2) NOT NULL,
  valor_desconto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valor_liquido DECIMAL(10,2) NOT NULL,
  moeda CHAR(3) NOT NULL DEFAULT 'BRL',
  data_vencimento DATETIME NULL,
  pago_em DATETIME NULL,
  comprovante_url VARCHAR(255) NULL,
  payload_gateway JSON NULL,
  observacoes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pagamentos_codigo_transacao (codigo_transacao),
  KEY idx_pagamentos_status (status_pagamento, metodo_pagamento),
  KEY idx_pagamentos_solicitacao (solicitacao_cadastro_id),
  KEY idx_pagamentos_usuario (usuario_id),
  CONSTRAINT fk_pagamentos_solicitacao
    FOREIGN KEY (solicitacao_cadastro_id) REFERENCES solicitacoes_cadastro (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_pagamentos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_pagamentos_plano
    FOREIGN KEY (plano_id) REFERENCES planos (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lojas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid CHAR(36) NOT NULL,
  dono_loja_id BIGINT UNSIGNED NOT NULL,
  plano_id BIGINT UNSIGNED NOT NULL,
  solicitacao_cadastro_id BIGINT UNSIGNED NULL,
  nome VARCHAR(180) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  categoria_principal VARCHAR(100) NOT NULL,
  descricao_curta VARCHAR(255) NULL,
  descricao_completa TEXT NULL,
  email_contato VARCHAR(190) NULL,
  telefone VARCHAR(30) NULL,
  whatsapp VARCHAR(30) NOT NULL,
  website_url VARCHAR(255) NULL,
  instagram_url VARCHAR(255) NULL,
  facebook_url VARCHAR(255) NULL,
  logo_url VARCHAR(255) NULL,
  capa_url VARCHAR(255) NULL,
  endereco_cep VARCHAR(12) NULL,
  endereco_logradouro VARCHAR(180) NULL,
  endereco_numero VARCHAR(20) NULL,
  endereco_complemento VARCHAR(120) NULL,
  endereco_bairro VARCHAR(120) NULL,
  endereco_cidade VARCHAR(120) NULL,
  endereco_estado CHAR(2) NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  horario_funcionamento VARCHAR(180) NULL,
  modo_operacao ENUM('WHATSAPP_ONLY', 'LOJA_COMPLETA') NOT NULL,
  status_loja ENUM('PENDENTE', 'ATIVA', 'INATIVA', 'BLOQUEADA', 'REJEITADA', 'SUSPENSA') NOT NULL DEFAULT 'PENDENTE',
  destaque_home TINYINT(1) NOT NULL DEFAULT 0,
  aceita_pedidos TINYINT(1) NOT NULL DEFAULT 1,
  aprovado_por_admin_id BIGINT UNSIGNED NULL,
  aprovado_em DATETIME NULL,
  bloqueado_em DATETIME NULL,
  motivo_status TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lojas_uuid (uuid),
  UNIQUE KEY uq_lojas_slug (slug),
  KEY idx_lojas_dono (dono_loja_id),
  KEY idx_lojas_plano (plano_id),
  KEY idx_lojas_status_modo (status_loja, modo_operacao),
  KEY idx_lojas_localizacao (endereco_cidade, endereco_estado),
  CONSTRAINT fk_lojas_dono
    FOREIGN KEY (dono_loja_id) REFERENCES donos_loja (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_lojas_plano
    FOREIGN KEY (plano_id) REFERENCES planos (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_lojas_solicitacao
    FOREIGN KEY (solicitacao_cadastro_id) REFERENCES solicitacoes_cadastro (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_lojas_admin_aprovacao
    FOREIGN KEY (aprovado_por_admin_id) REFERENCES administradores (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cards_home (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  loja_id BIGINT UNSIGNED NOT NULL,
  titulo_exibicao VARCHAR(150) NOT NULL,
  subtitulo_exibicao VARCHAR(180) NULL,
  descricao_curta VARCHAR(255) NULL,
  imagem_url VARCHAR(255) NULL,
  botao_label VARCHAR(60) NOT NULL DEFAULT 'Ver loja',
  link_destino VARCHAR(255) NULL,
  tipo_card ENUM('WHATSAPP', 'LOJA', 'PROMOCAO') NOT NULL DEFAULT 'LOJA',
  ordem_exibicao INT UNSIGNED NOT NULL DEFAULT 0,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  data_inicio DATETIME NULL,
  data_fim DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cards_home_loja (loja_id),
  KEY idx_cards_home_ativo_periodo (ativo, data_inicio, data_fim),
  KEY idx_cards_home_tipo_ordem (tipo_card, ordem_exibicao),
  CONSTRAINT fk_cards_home_loja
    FOREIGN KEY (loja_id) REFERENCES lojas (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categorias (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  loja_id BIGINT UNSIGNED NOT NULL,
  nome VARCHAR(120) NOT NULL,
  slug VARCHAR(150) NOT NULL,
  descricao VARCHAR(255) NULL,
  tipo_categoria ENUM('PRODUTO', 'CARDAPIO', 'AMBOS') NOT NULL DEFAULT 'AMBOS',
  ordem_exibicao INT UNSIGNED NOT NULL DEFAULT 0,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categorias_loja_slug (loja_id, slug),
  KEY idx_categorias_loja_ativo (loja_id, ativo, ordem_exibicao),
  CONSTRAINT fk_categorias_loja
    FOREIGN KEY (loja_id) REFERENCES lojas (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cardapios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  loja_id BIGINT UNSIGNED NOT NULL,
  categoria_id BIGINT UNSIGNED NULL,
  nome VARCHAR(120) NOT NULL,
  descricao VARCHAR(255) NULL,
  status_cardapio ENUM('RASCUNHO', 'ATIVO', 'INATIVO', 'ARQUIVADO') NOT NULL DEFAULT 'ATIVO',
  ordem_exibicao INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cardapios_loja_status (loja_id, status_cardapio),
  KEY idx_cardapios_categoria (categoria_id),
  CONSTRAINT fk_cardapios_loja
    FOREIGN KEY (loja_id) REFERENCES lojas (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_cardapios_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE produtos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  loja_id BIGINT UNSIGNED NOT NULL,
  categoria_id BIGINT UNSIGNED NULL,
  cardapio_id BIGINT UNSIGNED NULL,
  sku VARCHAR(60) NULL,
  nome VARCHAR(150) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  descricao TEXT NULL,
  descricao_curta VARCHAR(255) NULL,
  imagem_url VARCHAR(255) NULL,
  preco DECIMAL(10,2) NOT NULL,
  preco_promocional DECIMAL(10,2) NULL,
  custo DECIMAL(10,2) NULL,
  estoque_atual INT NOT NULL DEFAULT 0,
  estoque_minimo INT NOT NULL DEFAULT 0,
  controla_estoque TINYINT(1) NOT NULL DEFAULT 1,
  permite_venda_sem_estoque TINYINT(1) NOT NULL DEFAULT 0,
  destaque_home TINYINT(1) NOT NULL DEFAULT 0,
  peso_gramas INT UNSIGNED NULL,
  status_produto ENUM('ATIVO', 'INATIVO', 'RASCUNHO', 'ESGOTADO') NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_produtos_loja_slug (loja_id, slug),
  UNIQUE KEY uq_produtos_loja_sku (loja_id, sku),
  KEY idx_produtos_loja_status (loja_id, status_produto),
  KEY idx_produtos_categoria (categoria_id),
  KEY idx_produtos_cardapio (cardapio_id),
  KEY idx_produtos_destaque (loja_id, destaque_home),
  CONSTRAINT fk_produtos_loja
    FOREIGN KEY (loja_id) REFERENCES lojas (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_produtos_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_produtos_cardapio
    FOREIGN KEY (cardapio_id) REFERENCES cardapios (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE carrinhos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid CHAR(36) NOT NULL,
  cliente_id BIGINT UNSIGNED NULL,
  loja_id BIGINT UNSIGNED NOT NULL,
  status_carrinho ENUM('ABERTO', 'CONVERTIDO', 'ABANDONADO', 'CANCELADO') NOT NULL DEFAULT 'ABERTO',
  canal_origem ENUM('SITE', 'APP', 'WHATSAPP', 'ADMIN') NOT NULL DEFAULT 'SITE',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  desconto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  taxa_entrega DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  observacoes TEXT NULL,
  expira_em DATETIME NULL,
  convertido_em DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_carrinhos_uuid (uuid),
  KEY idx_carrinhos_cliente_status (cliente_id, status_carrinho),
  KEY idx_carrinhos_loja_status (loja_id, status_carrinho),
  CONSTRAINT fk_carrinhos_cliente
    FOREIGN KEY (cliente_id) REFERENCES clientes (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_carrinhos_loja
    FOREIGN KEY (loja_id) REFERENCES lojas (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE itens_carrinho (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  carrinho_id BIGINT UNSIGNED NOT NULL,
  produto_id BIGINT UNSIGNED NOT NULL,
  quantidade INT UNSIGNED NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  observacoes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_itens_carrinho (carrinho_id, produto_id),
  KEY idx_itens_carrinho_produto (produto_id),
  CONSTRAINT fk_itens_carrinho_carrinho
    FOREIGN KEY (carrinho_id) REFERENCES carrinhos (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_itens_carrinho_produto
    FOREIGN KEY (produto_id) REFERENCES produtos (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pedidos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(30) NOT NULL,
  carrinho_id BIGINT UNSIGNED NULL,
  loja_id BIGINT UNSIGNED NOT NULL,
  cliente_id BIGINT UNSIGNED NOT NULL,
  numero_pedido_loja INT UNSIGNED NULL,
  status_pedido ENUM('NOVO', 'ACEITO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA', 'CONCLUIDO', 'CANCELADO', 'RECUSADO') NOT NULL DEFAULT 'NOVO',
  status_pagamento ENUM('PENDENTE', 'PAGO', 'PARCIAL', 'ESTORNADO', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',
  tipo_entrega ENUM('ENTREGA', 'RETIRADA', 'DIGITAL') NOT NULL DEFAULT 'ENTREGA',
  canal_venda ENUM('SITE', 'APP', 'WHATSAPP', 'ADMIN') NOT NULL DEFAULT 'SITE',
  nome_cliente VARCHAR(150) NOT NULL,
  telefone_cliente VARCHAR(30) NOT NULL,
  email_cliente VARCHAR(190) NULL,
  endereco_entrega_cep VARCHAR(12) NULL,
  endereco_entrega_logradouro VARCHAR(180) NULL,
  endereco_entrega_numero VARCHAR(20) NULL,
  endereco_entrega_complemento VARCHAR(120) NULL,
  endereco_entrega_bairro VARCHAR(120) NULL,
  endereco_entrega_cidade VARCHAR(120) NULL,
  endereco_entrega_estado CHAR(2) NULL,
  referencia_entrega VARCHAR(180) NULL,
  observacoes_cliente TEXT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  desconto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  taxa_entrega DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  data_confirmacao DATETIME NULL,
  data_saida_entrega DATETIME NULL,
  data_conclusao DATETIME NULL,
  cancelado_em DATETIME NULL,
  motivo_cancelamento TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pedidos_codigo (codigo),
  UNIQUE KEY uq_pedidos_loja_numero (loja_id, numero_pedido_loja),
  KEY idx_pedidos_loja_status (loja_id, status_pedido, created_at),
  KEY idx_pedidos_cliente (cliente_id, created_at),
  KEY idx_pedidos_carrinho (carrinho_id),
  KEY idx_pedidos_pagamento (status_pagamento),
  CONSTRAINT fk_pedidos_carrinho
    FOREIGN KEY (carrinho_id) REFERENCES carrinhos (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_pedidos_loja
    FOREIGN KEY (loja_id) REFERENCES lojas (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_pedidos_cliente
    FOREIGN KEY (cliente_id) REFERENCES clientes (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE itens_pedido (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  pedido_id BIGINT UNSIGNED NOT NULL,
  produto_id BIGINT UNSIGNED NOT NULL,
  produto_nome VARCHAR(150) NOT NULL,
  sku_produto VARCHAR(60) NULL,
  quantidade INT UNSIGNED NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL,
  desconto_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  subtotal DECIMAL(10,2) NOT NULL,
  observacoes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_itens_pedido_pedido (pedido_id),
  KEY idx_itens_pedido_produto (produto_id),
  CONSTRAINT fk_itens_pedido_pedido
    FOREIGN KEY (pedido_id) REFERENCES pedidos (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_itens_pedido_produto
    FOREIGN KEY (produto_id) REFERENCES produtos (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE historico_status_pedido (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  pedido_id BIGINT UNSIGNED NOT NULL,
  status_anterior ENUM('NOVO', 'ACEITO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA', 'CONCLUIDO', 'CANCELADO', 'RECUSADO') NULL,
  status_novo ENUM('NOVO', 'ACEITO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA', 'CONCLUIDO', 'CANCELADO', 'RECUSADO') NOT NULL,
  alterado_por_usuario_id BIGINT UNSIGNED NULL,
  observacao VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_historico_pedido (pedido_id, created_at),
  KEY idx_historico_usuario (alterado_por_usuario_id),
  CONSTRAINT fk_historico_status_pedido
    FOREIGN KEY (pedido_id) REFERENCES pedidos (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_historico_status_usuario
    FOREIGN KEY (alterado_por_usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vendas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  pedido_id BIGINT UNSIGNED NOT NULL,
  loja_id BIGINT UNSIGNED NOT NULL,
  cliente_id BIGINT UNSIGNED NULL,
  pagamento_id BIGINT UNSIGNED NULL,
  data_venda DATETIME NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  desconto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  taxa_entrega DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_bruto DECIMAL(10,2) NOT NULL,
  total_liquido DECIMAL(10,2) NOT NULL,
  custo_total DECIMAL(10,2) NULL,
  lucro_estimado DECIMAL(10,2) NULL,
  status_venda ENUM('ABERTA', 'FATURADA', 'CANCELADA', 'ESTORNADA') NOT NULL DEFAULT 'FATURADA',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vendas_pedido (pedido_id),
  KEY idx_vendas_loja_data (loja_id, data_venda),
  KEY idx_vendas_cliente (cliente_id),
  KEY idx_vendas_pagamento (pagamento_id),
  CONSTRAINT fk_vendas_pedido
    FOREIGN KEY (pedido_id) REFERENCES pedidos (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_vendas_loja
    FOREIGN KEY (loja_id) REFERENCES lojas (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_vendas_cliente
    FOREIGN KEY (cliente_id) REFERENCES clientes (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_vendas_pagamento
    FOREIGN KEY (pagamento_id) REFERENCES pagamentos (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE relatorios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  loja_id BIGINT UNSIGNED NOT NULL,
  tipo_relatorio ENUM('VENDAS', 'PEDIDOS', 'PRODUTOS', 'FINANCEIRO', 'MARKETING', 'OPERACIONAL', 'CUSTOMIZADO') NOT NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  titulo VARCHAR(180) NOT NULL,
  formato ENUM('JSON', 'CSV', 'PDF', 'HTML') NOT NULL DEFAULT 'JSON',
  status_geracao ENUM('PENDENTE', 'PROCESSANDO', 'CONCLUIDO', 'ERRO') NOT NULL DEFAULT 'PENDENTE',
  gerado_por_usuario_id BIGINT UNSIGNED NULL,
  arquivo_url VARCHAR(255) NULL,
  parametros JSON NULL,
  resumo JSON NULL,
  gerado_em DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_relatorios_loja_tipo (loja_id, tipo_relatorio, periodo_inicio, periodo_fim),
  KEY idx_relatorios_status (status_geracao),
  KEY idx_relatorios_usuario (gerado_por_usuario_id),
  CONSTRAINT fk_relatorios_loja
    FOREIGN KEY (loja_id) REFERENCES lojas (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_relatorios_usuario
    FOREIGN KEY (gerado_por_usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE banners_loja (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  loja_id BIGINT UNSIGNED NOT NULL,
  titulo VARCHAR(150) NULL,
  subtitulo VARCHAR(180) NULL,
  imagem_url VARCHAR(255) NOT NULL,
  link_url VARCHAR(255) NULL,
  ordem_exibicao INT UNSIGNED NOT NULL DEFAULT 0,
  status_banner ENUM('ATIVO', 'INATIVO', 'AGENDADO', 'ENCERRADO') NOT NULL DEFAULT 'ATIVO',
  data_inicio DATETIME NULL,
  data_fim DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_banners_loja_status (loja_id, status_banner),
  KEY idx_banners_loja_periodo (data_inicio, data_fim),
  CONSTRAINT fk_banners_loja_loja
    FOREIGN KEY (loja_id) REFERENCES lojas (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE configuracoes_loja (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  loja_id BIGINT UNSIGNED NOT NULL,
  cor_primaria VARCHAR(20) NULL,
  cor_secundaria VARCHAR(20) NULL,
  taxa_entrega_padrao DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  pedido_minimo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tempo_medio_preparo_minutos INT UNSIGNED NULL,
  tempo_medio_entrega_minutos INT UNSIGNED NULL,
  aceita_retirada TINYINT(1) NOT NULL DEFAULT 1,
  aceita_entrega TINYINT(1) NOT NULL DEFAULT 1,
  exibir_produtos_esgotados TINYINT(1) NOT NULL DEFAULT 0,
  exibir_whatsapp TINYINT(1) NOT NULL DEFAULT 1,
  mensagem_boas_vindas VARCHAR(255) NULL,
  politica_troca TEXT NULL,
  politica_entrega TEXT NULL,
  seo_title VARCHAR(180) NULL,
  seo_description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_configuracoes_loja_loja (loja_id),
  CONSTRAINT fk_configuracoes_loja
    FOREIGN KEY (loja_id) REFERENCES lojas (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE metricas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  loja_id BIGINT UNSIGNED NOT NULL,
  data_referencia DATE NOT NULL,
  visitas_loja INT UNSIGNED NOT NULL DEFAULT 0,
  visualizacoes_card_home INT UNSIGNED NOT NULL DEFAULT 0,
  cliques_whatsapp INT UNSIGNED NOT NULL DEFAULT 0,
  cliques_ligacao INT UNSIGNED NOT NULL DEFAULT 0,
  cliques_site INT UNSIGNED NOT NULL DEFAULT 0,
  produtos_visualizados INT UNSIGNED NOT NULL DEFAULT 0,
  carrinhos_criados INT UNSIGNED NOT NULL DEFAULT 0,
  pedidos_recebidos INT UNSIGNED NOT NULL DEFAULT 0,
  pedidos_concluidos INT UNSIGNED NOT NULL DEFAULT 0,
  pedidos_cancelados INT UNSIGNED NOT NULL DEFAULT 0,
  faturamento_bruto DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  faturamento_liquido DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ticket_medio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  taxa_conversao DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_metricas_loja_data (loja_id, data_referencia),
  KEY idx_metricas_data (data_referencia),
  CONSTRAINT fk_metricas_loja
    FOREIGN KEY (loja_id) REFERENCES lojas (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO planos
  (codigo, nome, descricao, tipo_exibicao, preco_mensal, permite_cardapio, permite_produtos, permite_pedidos, permite_relatorios, limite_produtos, limite_banners, ativo)
VALUES
  ('FREE', 'Plano Gratis', 'Card simples na home com redirecionamento para WhatsApp.', 'WHATSAPP_ONLY', 0.00, 0, 0, 0, 0, NULL, 1, 1),
  ('PRO', 'Plano Pago', 'Loja completa com catalogo, carrinho, pedidos, vendas e relatorios.', 'LOJA_COMPLETA', 49.90, 1, 1, 1, 1, NULL, 10, 1);

SET FOREIGN_KEY_CHECKS = 1;
