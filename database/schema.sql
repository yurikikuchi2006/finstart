PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS usuarios (
 id INTEGER PRIMARY KEY,
 nome TEXT NOT NULL CHECK(length(nome) BETWEEN 3 AND 50),
 email TEXT NOT NULL UNIQUE COLLATE NOCASE,
 senha_hash TEXT NOT NULL,
 email_verificado_em INTEGER,
 criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS simulacoes (
 id INTEGER PRIMARY KEY,
 usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 renda_centavos INTEGER NOT NULL CHECK(renda_centavos BETWEEN 1 AND 100000000000),
 criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_simulacoes_usuario ON simulacoes(usuario_id, id);
CREATE TABLE IF NOT EXISTS sessoes (
 id TEXT PRIMARY KEY,
 usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 expira_em INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS desafios_email (
 id TEXT PRIMARY KEY, finalidade TEXT NOT NULL, email TEXT NOT NULL COLLATE NOCASE,
 nome TEXT NOT NULL, senha_hash TEXT, usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
 codigo_hash TEXT NOT NULL, expira_em INTEGER NOT NULL, enviado_em INTEGER NOT NULL,
 tentativas INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS email_limites (
 chave TEXT PRIMARY KEY, janela INTEGER NOT NULL, usados INTEGER NOT NULL, proximo_envio INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS metas (
 prazo_meses INTEGER CHECK(prazo_meses BETWEEN 1 AND 600),
 data_inicio TEXT,
 status TEXT NOT NULL DEFAULT 'em_andamento',
 id INTEGER PRIMARY KEY,
 usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 titulo TEXT NOT NULL CHECK(length(titulo) BETWEEN 3 AND 80),
 alvo_centavos INTEGER NOT NULL CHECK(alvo_centavos BETWEEN 1 AND 100000000000),
 guardado_centavos INTEGER NOT NULL DEFAULT 0 CHECK(guardado_centavos>=0 AND guardado_centavos<=alvo_centavos),
 criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_metas_usuario ON metas(usuario_id);
CREATE TABLE IF NOT EXISTS juros (
 id INTEGER PRIMARY KEY,
 usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 inicial_centavos INTEGER NOT NULL CHECK(inicial_centavos BETWEEN 0 AND 100000000000),
 aporte_centavos INTEGER NOT NULL CHECK(aporte_centavos BETWEEN 0 AND 100000000000),
 taxa REAL NOT NULL CHECK(taxa BETWEEN 0 AND 10),
 meses INTEGER NOT NULL CHECK(meses BETWEEN 1 AND 600),
 criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_juros_usuario ON juros(usuario_id);
CREATE TABLE IF NOT EXISTS categoria (
 id INTEGER PRIMARY KEY, nome TEXT NOT NULL UNIQUE, descricao TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS conteudo (
 id INTEGER PRIMARY KEY, categoria_id INTEGER NOT NULL REFERENCES categoria(id),
 titulo TEXT NOT NULL, texto TEXT NOT NULL, nivel TEXT NOT NULL DEFAULT 'basico',
 fontes_json TEXT NOT NULL DEFAULT '[]',
 data_publicacao TEXT NOT NULL DEFAULT CURRENT_DATE
);
CREATE TABLE IF NOT EXISTS tipo_investimento (
 id INTEGER PRIMARY KEY, nome TEXT NOT NULL UNIQUE, descricao TEXT NOT NULL,
 taxa_anual_padrao REAL NOT NULL CHECK(taxa_anual_padrao BETWEEN 0 AND 100)
);
CREATE TABLE IF NOT EXISTS simulacao_investimento (
 juros_id INTEGER NOT NULL REFERENCES juros(id) ON DELETE CASCADE,
 tipo_investimento_id INTEGER NOT NULL REFERENCES tipo_investimento(id),
 taxa_anual_aplicada REAL NOT NULL, valor_final_centavos INTEGER NOT NULL,
 PRIMARY KEY(juros_id,tipo_investimento_id)
);
CREATE TABLE IF NOT EXISTS progresso_meta (
 id INTEGER PRIMARY KEY, meta_id INTEGER NOT NULL REFERENCES metas(id) ON DELETE CASCADE,
 variacao_centavos INTEGER NOT NULL, saldo_centavos INTEGER NOT NULL CHECK(saldo_centavos>=0),
 data_registro TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_progresso_meta ON progresso_meta(meta_id,id);
