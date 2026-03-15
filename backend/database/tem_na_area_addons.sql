SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS product_option_groups (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  loja_id BIGINT UNSIGNED NOT NULL,
  nome VARCHAR(120) NOT NULL,
  descricao VARCHAR(255) NULL,
  tipo ENUM('single', 'multiple', 'text') NOT NULL DEFAULT 'single',
  obrigatorio TINYINT(1) NOT NULL DEFAULT 0,
  minimo_selecoes INT UNSIGNED NOT NULL DEFAULT 0,
  maximo_selecoes INT UNSIGNED NOT NULL DEFAULT 1,
  ordem_exibicao INT UNSIGNED NOT NULL DEFAULT 0,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_product_option_groups_loja (loja_id, ativo, ordem_exibicao),
  CONSTRAINT fk_product_option_groups_loja
    FOREIGN KEY (loja_id) REFERENCES lojas (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_option_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  group_id BIGINT UNSIGNED NOT NULL,
  nome VARCHAR(120) NOT NULL,
  descricao VARCHAR(255) NULL,
  preco_adicional DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ordem_exibicao INT UNSIGNED NOT NULL DEFAULT 0,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_product_option_items_group (group_id, ativo, ordem_exibicao),
  CONSTRAINT fk_product_option_items_group
    FOREIGN KEY (group_id) REFERENCES product_option_groups (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_group_links (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  group_id BIGINT UNSIGNED NOT NULL,
  ordem_exibicao INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_product_group_links (product_id, group_id),
  KEY idx_product_group_links_group (group_id),
  CONSTRAINT fk_product_group_links_product
    FOREIGN KEY (product_id) REFERENCES produtos (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_product_group_links_group
    FOREIGN KEY (group_id) REFERENCES product_option_groups (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
