-- MySQL 8.0.16+: banco selecionado por DB_NAME, não substitui configuração do servidor.

CREATE TABLE IF NOT EXISTS usuarios (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(255) NOT NULL CHECK(length(nome) BETWEEN 3 AND 50),
 email VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
 senha_hash VARCHAR(255) NOT NULL,
 email_verificado_em BIGINT,
 criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS simulacoes (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 usuario_id INT NOT NULL, FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
 renda_centavos BIGINT NOT NULL CHECK(renda_centavos BETWEEN 1 AND 100000000000),
 criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessoes (
 id VARCHAR(255) PRIMARY KEY,
 usuario_id INT NOT NULL, FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
 expira_em BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS metas (
 prazo_meses INT CHECK(prazo_meses BETWEEN 1 AND 600),
 data_inicio DATE,
 status VARCHAR(255) NOT NULL DEFAULT 'em_andamento',
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 usuario_id INT NOT NULL, FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
 titulo VARCHAR(255) NOT NULL CHECK(length(titulo) BETWEEN 3 AND 80),
 alvo_centavos BIGINT NOT NULL CHECK(alvo_centavos BETWEEN 1 AND 100000000000),
 guardado_centavos BIGINT NOT NULL DEFAULT 0, CHECK(guardado_centavos>=0 AND guardado_centavos<=alvo_centavos),
 criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS juros (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 usuario_id INT NOT NULL, FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
 inicial_centavos BIGINT NOT NULL CHECK(inicial_centavos BETWEEN 0 AND 100000000000),
 aporte_centavos BIGINT NOT NULL CHECK(aporte_centavos BETWEEN 0 AND 100000000000),
 taxa DOUBLE NOT NULL CHECK(taxa BETWEEN 0 AND 10),
 meses INT NOT NULL CHECK(meses BETWEEN 1 AND 600),
 criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categoria (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(255) NOT NULL UNIQUE, descricao VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS conteudo (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, categoria_id INT NOT NULL, FOREIGN KEY (categoria_id) REFERENCES categoria(id),
 titulo VARCHAR(255) NOT NULL, texto LONGTEXT NOT NULL, nivel VARCHAR(255) NOT NULL DEFAULT 'basico',
 fontes_json LONGTEXT NOT NULL DEFAULT ('[]'),
 data_publicacao DATE NOT NULL DEFAULT (CURRENT_DATE)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS tipo_investimento (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(255) NOT NULL UNIQUE, descricao VARCHAR(255) NOT NULL,
 taxa_anual_padrao DOUBLE NOT NULL CHECK(taxa_anual_padrao BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS simulacao_investimento (
 juros_id INT NOT NULL, FOREIGN KEY (juros_id) REFERENCES juros(id) ON DELETE CASCADE,
 tipo_investimento_id INT NOT NULL, FOREIGN KEY (tipo_investimento_id) REFERENCES tipo_investimento(id),
 taxa_anual_aplicada DOUBLE NOT NULL, valor_final_centavos BIGINT NOT NULL,
 PRIMARY KEY(juros_id,tipo_investimento_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS progresso_meta (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, meta_id INT NOT NULL, FOREIGN KEY (meta_id) REFERENCES metas(id) ON DELETE CASCADE,
 variacao_centavos BIGINT NOT NULL, saldo_centavos BIGINT NOT NULL CHECK(saldo_centavos>=0),
 data_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS desafios_email (
 id VARCHAR(64) PRIMARY KEY, finalidade VARCHAR(16) NOT NULL,
 email VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL, nome VARCHAR(255) NOT NULL,
 senha_hash VARCHAR(255), usuario_id INT,
 codigo_hash VARCHAR(64) NOT NULL, expira_em BIGINT NOT NULL,
 enviado_em BIGINT NOT NULL, tentativas INT NOT NULL DEFAULT 0,
 FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS email_limites (
 chave VARCHAR(64) PRIMARY KEY, janela BIGINT NOT NULL,
 usados INT NOT NULL, proximo_envio BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
