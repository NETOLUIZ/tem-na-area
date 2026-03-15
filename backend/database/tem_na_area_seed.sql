-- Tem na Area
-- Dados de teste para demonstracao local e importacao no phpMyAdmin

USE tem_na_area;

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM relatorios;
DELETE FROM metricas;
DELETE FROM vendas;
DELETE FROM historico_status_pedido;
DELETE FROM itens_pedido;
DELETE FROM pedidos;
DELETE FROM itens_carrinho;
DELETE FROM carrinhos;
DELETE FROM produtos;
DELETE FROM cardapios;
DELETE FROM categorias;
DELETE FROM banners_loja;
DELETE FROM cards_home;
DELETE FROM configuracoes_loja;
DELETE FROM pagamentos;
DELETE FROM lojas;
DELETE FROM solicitacoes_cadastro;
DELETE FROM donos_loja;
DELETE FROM administradores;
DELETE FROM clientes;
DELETE FROM usuarios;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO usuarios (id, uuid, nome, email, telefone, whatsapp, senha_hash, tipo_usuario, status, email_verificado_em, telefone_verificado_em)
VALUES
  (1, '11111111-1111-1111-1111-111111111111', 'Administrador Master', 'admin@temnaarea.com', '11999990000', '11999990000', SHA2('admin123', 256), 'ADMINISTRADOR', 'ATIVO', NOW(), NOW()),
  (2, '22222222-2222-2222-2222-222222222222', 'Joao Silva', 'joao@burgernaarea.com', '11988887777', '11988887777', SHA2('123456', 256), 'DONO_LOJA', 'ATIVO', NOW(), NOW()),
  (3, '33333333-3333-3333-3333-333333333333', 'Maria Souza', 'maria@temnaarea.com', '11977776666', '11977776666', SHA2('123456', 256), 'CLIENTE', 'ATIVO', NOW(), NOW()),
  (4, '44444444-4444-4444-4444-444444444444', 'Carlos Lima', 'carlos@temnaarea.com', '11966665555', '11966665555', SHA2('123456', 256), 'CLIENTE', 'ATIVO', NOW(), NOW()),
  (5, '55555555-5555-5555-5555-555555555555', 'Ana Costa', 'ana@docenaarea.com', '11955554444', '11955554444', SHA2('123456', 256), 'DONO_LOJA', 'PENDENTE', NOW(), NOW());

INSERT INTO administradores (id, usuario_id, nivel_acesso, departamento, ultimo_acesso_painel_em)
VALUES
  (1, 1, 'SUPER_ADMIN', 'OPERACOES', NOW());

INSERT INTO donos_loja (id, usuario_id, nome_fantasia, razao_social, cpf_cnpj, data_adesao)
VALUES
  (1, 2, 'Burger na Area', 'Burger na Area LTDA', '12345678000190', NOW()),
  (2, 5, 'Doce na Area', 'Doce na Area ME', '98765432000110', NOW());

INSERT INTO clientes (
  id, usuario_id, cpf_cnpj, data_nascimento, endereco_principal_cep, endereco_principal_logradouro,
  endereco_principal_numero, endereco_principal_bairro, endereco_principal_cidade, endereco_principal_estado,
  referencia_endereco, aceita_marketing
)
VALUES
  (1, 3, '12345678900', '1995-04-12', '01001-000', 'Rua das Flores', '120', 'Centro', 'Sao Paulo', 'SP', 'Apto 12', 1),
  (2, 4, '98765432100', '1992-09-23', '01310-100', 'Avenida Paulista', '900', 'Bela Vista', 'Sao Paulo', 'SP', 'Proximo ao metro', 0);

INSERT INTO solicitacoes_cadastro (
  id, protocolo, tipo_solicitacao, nome_empresa, nome_responsavel, email, telefone, whatsapp, cpf_cnpj,
  categoria_principal, descricao_resumida, cidade, estado, endereco_logradouro, endereco_numero, endereco_bairro,
  cep, horario_funcionamento, logo_url, capa_url, observacoes, plano_id, usuario_id, dono_loja_id,
  status_solicitacao, status_pagamento, analisado_por_admin_id, analisado_em
)
VALUES
  (1, 'SOL-20260314-0001', 'LOJA_PAGA', 'Burger na Area', 'Joao Silva', 'joao@burgernaarea.com', '11988887777', '11988887777', '12345678000190',
   'comida', 'Hamburgueria artesanal com entrega rapida.', 'Sao Paulo', 'SP', 'Rua dos Sabores', '45', 'Centro',
   '01010-000', 'Seg-Dom 18h as 23h', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80',
   'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
   'Pagamento aprovado e cadastro liberado.', 2, 2, 1, 'APROVADA', 'APROVADO', 1, NOW()),
  (2, 'SOL-20260314-0002', 'LOJA_GRATIS', 'Doce na Area', 'Ana Costa', 'ana@docenaarea.com', '11955554444', '11955554444', '98765432000110',
   'loja', 'Doces e bolos por encomenda com atendimento via WhatsApp.', 'Guarulhos', 'SP', 'Rua do Acucar', '88', 'Vila Augusta',
   '07023-010', 'Seg-Sab 09h as 18h', 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=700&q=80',
   'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1200&q=80',
   'Aguardando aprovacao do admin.', 1, 5, 2, 'PENDENTE', 'NAO_APLICAVEL', NULL, NULL);

INSERT INTO pagamentos (
  id, solicitacao_cadastro_id, usuario_id, plano_id, gateway_pagamento, referencia_gateway, codigo_transacao,
  metodo_pagamento, status_pagamento, valor_bruto, valor_desconto, valor_liquido, moeda, pago_em, observacoes
)
VALUES
  (1, 1, 2, 2, 'MercadoPago', 'MP-000001', 'TXN-000001', 'PIX', 'APROVADO', 49.90, 0.00, 49.90, 'BRL', NOW(), 'Assinatura inicial aprovada.');

INSERT INTO lojas (
  id, uuid, dono_loja_id, plano_id, solicitacao_cadastro_id, nome, slug, categoria_principal, descricao_curta,
  descricao_completa, email_contato, telefone, whatsapp, website_url, instagram_url, facebook_url, logo_url, capa_url,
  endereco_cep, endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado,
  horario_funcionamento, modo_operacao, status_loja, destaque_home, aceita_pedidos, aprovado_por_admin_id, aprovado_em
)
VALUES
  (1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 2, 1, 'Burger na Area', 'burger-na-area', 'comida',
   'Hamburgueria artesanal com combos, porcoes e bebidas.', 'Loja completa com cardapio, carrinho, pedidos e acompanhamento em tempo real.',
   'joao@burgernaarea.com', '11988887777', '11988887777', 'https://burgernaarea.com.br', 'https://instagram.com/burgernaarea',
   'https://facebook.com/burgernaarea',
   'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80',
   'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
   '01010-000', 'Rua dos Sabores', '45', 'Centro', 'Sao Paulo', 'SP',
   'Seg-Dom 18h as 23h', 'LOJA_COMPLETA', 'ATIVA', 1, 1, 1, NOW()),
  (2, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2, 1, 2, 'Doce na Area', 'doce-na-area', 'loja',
   'Bolos e doces sob encomenda com atendimento direto no WhatsApp.', 'Card simples na home para pedidos e orcamentos via WhatsApp.',
   'ana@docenaarea.com', '11955554444', '11955554444', NULL, 'https://instagram.com/docenaarea', NULL,
   'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=700&q=80',
   'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1200&q=80',
   '07023-010', 'Rua do Acucar', '88', 'Vila Augusta', 'Guarulhos', 'SP',
   'Seg-Sab 09h as 18h', 'WHATSAPP_ONLY', 'PENDENTE', 0, 0, NULL, NULL);

INSERT INTO configuracoes_loja (
  id, loja_id, cor_primaria, cor_secundaria, taxa_entrega_padrao, pedido_minimo, tempo_medio_preparo_minutos,
  tempo_medio_entrega_minutos, aceita_retirada, aceita_entrega, exibir_produtos_esgotados, exibir_whatsapp,
  mensagem_boas_vindas, politica_troca, politica_entrega, seo_title, seo_description
)
VALUES
  (1, 1, '#d62828', '#1d1d1d', 6.00, 20.00, 20, 35, 1, 1, 0, 1,
   'Bem-vindo ao Burger na Area. Monte seu pedido e acompanhe tudo online.',
   'Trocas apenas em casos de erro operacional.',
   'Entregas em ate 45 minutos dentro da area atendida.',
   'Burger na Area | Hamburgueria local', 'Peça hamburguer artesanal, combos e bebidas no Tem na Area.');

INSERT INTO cards_home (
  id, loja_id, titulo_exibicao, subtitulo_exibicao, descricao_curta, imagem_url, botao_label, link_destino, tipo_card, ordem_exibicao, ativo, data_inicio
)
VALUES
  (1, 1, 'Burger na Area', 'Hamburgueria artesanal', 'Combos, porcoes e entrega rapida.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', 'Ver loja', '/loja/burger-na-area', 'LOJA', 1, 1, NOW()),
  (2, 2, 'Doce na Area', 'Encomendas pelo WhatsApp', 'Bolos, docinhos e kits para festas.', 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=700&q=80', 'Chamar no WhatsApp', 'https://wa.me/5511955554444', 'WHATSAPP', 2, 1, NOW());

INSERT INTO banners_loja (id, loja_id, titulo, subtitulo, imagem_url, link_url, ordem_exibicao, status_banner, data_inicio)
VALUES
  (1, 1, 'Combo da Semana', 'Burger + fritas + refri com desconto', 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80', '/loja/burger-na-area', 1, 'ATIVO', NOW()),
  (2, 1, 'Entrega Rapida', 'Pedidos acompanhados em tempo real', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80', '/loja/burger-na-area', 2, 'ATIVO', NOW());

INSERT INTO categorias (id, loja_id, nome, slug, descricao, tipo_categoria, ordem_exibicao, ativo)
VALUES
  (1, 1, 'Hamburgueres', 'hamburgueres', 'Lanches artesanais da casa.', 'AMBOS', 1, 1),
  (2, 1, 'Porcoes', 'porcoes', 'Acompanhamentos e extras.', 'AMBOS', 2, 1),
  (3, 1, 'Bebidas', 'bebidas', 'Refrigerantes e sucos.', 'AMBOS', 3, 1);

INSERT INTO cardapios (id, loja_id, categoria_id, nome, descricao, status_cardapio, ordem_exibicao)
VALUES
  (1, 1, 1, 'Cardapio Principal', 'Lanches mais vendidos da loja.', 'ATIVO', 1),
  (2, 1, 2, 'Acompanhamentos', 'Itens adicionais para completar o pedido.', 'ATIVO', 2),
  (3, 1, 3, 'Bebidas', 'Bebidas geladas.', 'ATIVO', 3);

INSERT INTO produtos (
  id, loja_id, categoria_id, cardapio_id, sku, nome, slug, descricao, descricao_curta, imagem_url,
  preco, preco_promocional, custo, estoque_atual, estoque_minimo, controla_estoque, permite_venda_sem_estoque,
  destaque_home, status_produto
)
VALUES
  (1, 1, 1, 1, 'BURG-001', 'Burger Classic', 'burger-classic', 'Pao brioche, burger 160g, queijo, alface e molho da casa.', 'O classico mais pedido da loja.',
   'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', 28.90, 25.90, 12.00, 100, 10, 1, 0, 1, 'ATIVO'),
  (2, 1, 1, 1, 'BURG-002', 'Burger Bacon', 'burger-bacon', 'Burger 180g, queijo cheddar, bacon crocante e cebola caramelizada.', 'Hamburguer premium com bacon.',
   'https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=700&q=80', 34.90, NULL, 15.00, 80, 8, 1, 0, 1, 'ATIVO'),
  (3, 1, 2, 2, 'SIDE-001', 'Batata Frita Crocante', 'batata-frita-crocante', 'Porcao individual de batata frita crocante.', 'Acompanhamento ideal para qualquer combo.',
   'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=700&q=80', 14.90, NULL, 5.50, 120, 12, 1, 0, 0, 'ATIVO'),
  (4, 1, 3, 3, 'DRINK-001', 'Refrigerante Lata', 'refrigerante-lata', 'Lata 350ml em sabores variados.', 'Bebida gelada para completar o pedido.',
   'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=700&q=80', 6.50, NULL, 2.80, 200, 20, 1, 0, 0, 'ATIVO'),
  (5, 1, 1, 1, 'COMBO-001', 'Combo Area', 'combo-area', 'Burger Classic, batata crocante e refrigerante lata.', 'Combo promocional da casa.',
   'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=700&q=80', 45.00, 39.90, 18.50, 60, 5, 1, 0, 1, 'ATIVO');

INSERT INTO carrinhos (
  id, uuid, cliente_id, loja_id, status_carrinho, canal_origem, subtotal, desconto, taxa_entrega, total, observacoes, convertido_em
)
VALUES
  (1, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1, 1, 'CONVERTIDO', 'SITE', 65.70, 0.00, 6.00, 71.70, 'Sem cebola no burger.', NOW()),
  (2, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 2, 1, 'ABERTO', 'SITE', 39.90, 0.00, 6.00, 45.90, 'Carrinho em aberto para retomar depois.', NULL);

INSERT INTO itens_carrinho (id, carrinho_id, produto_id, quantidade, preco_unitario, subtotal, observacoes)
VALUES
  (1, 1, 1, 1, 25.90, 25.90, 'Sem tomate'),
  (2, 1, 3, 1, 14.90, 14.90, NULL),
  (3, 1, 4, 1, 6.50, 6.50, NULL),
  (4, 1, 2, 1, 34.90, 34.90, 'Ponto da carne ao ponto'),
  (5, 2, 5, 1, 39.90, 39.90, NULL);

INSERT INTO pedidos (
  id, codigo, carrinho_id, loja_id, cliente_id, numero_pedido_loja, status_pedido, status_pagamento, tipo_entrega, canal_venda,
  nome_cliente, telefone_cliente, email_cliente, endereco_entrega_cep, endereco_entrega_logradouro, endereco_entrega_numero,
  endereco_entrega_bairro, endereco_entrega_cidade, endereco_entrega_estado, referencia_entrega, observacoes_cliente,
  subtotal, desconto, taxa_entrega, total, data_confirmacao, data_saida_entrega, data_conclusao, created_at
)
VALUES
  (1, 'PED-20260314-0001', 1, 1, 1, 1, 'CONCLUIDO', 'PAGO', 'ENTREGA', 'SITE',
   'Maria Souza', '11977776666', 'maria@temnaarea.com', '01001-000', 'Rua das Flores', '120',
   'Centro', 'Sao Paulo', 'SP', 'Apto 12', 'Sem cebola no burger.',
   65.70, 0.00, 6.00, 71.70, NOW(), NOW(), NOW(), NOW()),
  (2, 'PED-20260314-0002', NULL, 1, 2, 2, 'EM_PREPARO', 'PENDENTE', 'RETIRADA', 'SITE',
   'Carlos Lima', '11966665555', 'carlos@temnaarea.com', NULL, NULL, NULL,
   NULL, NULL, NULL, NULL, 'Retirar no balcao.',
   39.90, 0.00, 0.00, 39.90, NOW(), NULL, NULL, NOW());

INSERT INTO itens_pedido (id, pedido_id, produto_id, produto_nome, sku_produto, quantidade, preco_unitario, desconto_unitario, subtotal, observacoes)
VALUES
  (1, 1, 1, 'Burger Classic', 'BURG-001', 1, 25.90, 0.00, 25.90, 'Sem tomate'),
  (2, 1, 3, 'Batata Frita Crocante', 'SIDE-001', 1, 14.90, 0.00, 14.90, NULL),
  (3, 1, 4, 'Refrigerante Lata', 'DRINK-001', 1, 6.50, 0.00, 6.50, NULL),
  (4, 1, 2, 'Burger Bacon', 'BURG-002', 1, 18.40, 0.00, 18.40, 'Ponto da carne ao ponto'),
  (5, 2, 5, 'Combo Area', 'COMBO-001', 1, 39.90, 0.00, 39.90, 'Retirar no balcao');

INSERT INTO historico_status_pedido (id, pedido_id, status_anterior, status_novo, alterado_por_usuario_id, observacao, created_at)
VALUES
  (1, 1, NULL, 'NOVO', 3, 'Pedido criado pelo cliente.', NOW()),
  (2, 1, 'NOVO', 'ACEITO', 2, 'Pedido aceito pela loja.', NOW()),
  (3, 1, 'ACEITO', 'EM_PREPARO', 2, 'Pedido em preparo.', NOW()),
  (4, 1, 'EM_PREPARO', 'SAIU_PARA_ENTREGA', 2, 'Saiu para entrega.', NOW()),
  (5, 1, 'SAIU_PARA_ENTREGA', 'CONCLUIDO', 2, 'Pedido finalizado com sucesso.', NOW()),
  (6, 2, NULL, 'NOVO', 4, 'Pedido criado pelo cliente.', NOW()),
  (7, 2, 'NOVO', 'ACEITO', 2, 'Pedido aceito pela loja.', NOW()),
  (8, 2, 'ACEITO', 'EM_PREPARO', 2, 'Pedido em preparo.', NOW());

INSERT INTO vendas (
  id, pedido_id, loja_id, cliente_id, pagamento_id, data_venda, subtotal, desconto, taxa_entrega,
  total_bruto, total_liquido, custo_total, lucro_estimado, status_venda
)
VALUES
  (1, 1, 1, 1, 1, NOW(), 65.70, 0.00, 6.00, 71.70, 71.70, 35.80, 35.90, 'FATURADA');

INSERT INTO relatorios (
  id, loja_id, tipo_relatorio, periodo_inicio, periodo_fim, titulo, formato, status_geracao, gerado_por_usuario_id, parametros, resumo, gerado_em
)
VALUES
  (1, 1, 'VENDAS', '2026-03-01', '2026-03-14', 'Relatorio de Vendas - Burger na Area', 'JSON', 'CONCLUIDO', 2,
   JSON_OBJECT('agrupar_por', 'dia', 'canal', 'todos'),
   JSON_OBJECT('total_pedidos', 2, 'total_vendas', 71.70, 'ticket_medio', 35.85),
   NOW());

INSERT INTO metricas (
  id, loja_id, data_referencia, visitas_loja, visualizacoes_card_home, cliques_whatsapp, cliques_ligacao, cliques_site,
  produtos_visualizados, carrinhos_criados, pedidos_recebidos, pedidos_concluidos, pedidos_cancelados, faturamento_bruto,
  faturamento_liquido, ticket_medio, taxa_conversao
)
VALUES
  (1, 1, '2026-03-14', 420, 980, 35, 4, 19, 310, 28, 2, 1, 0, 71.70, 71.70, 35.85, 0.48),
  (2, 2, '2026-03-14', 95, 260, 18, 0, 0, 0, 0, 0, 0, 0, 0.00, 0.00, 0.00, 0.00);
