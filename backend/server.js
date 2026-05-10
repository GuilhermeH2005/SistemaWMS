const express = require("express");
const cors = require("cors");
const db = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});

app.get("/teste-banco", (req, res) => {
  db.query("SELECT 1", (err) => {
    if (err) return res.send("Erro no banco ❌");
    res.send("Banco conectado com sucesso ✅");
  });
});

/* =========================
   FORNECEDORES
========================= */

app.post("/fornecedores", (req, res) => {
  const {
    nome, cnpj, telefone, email,
    rua, numero, bairro, cidade, cep, inscricao_estadual
  } = req.body;

  if (!nome || !cnpj || !telefone || !email) {
    return res.status(400).send("Preencha os campos obrigatórios ❌");
  }

  const sql = `
    INSERT INTO fornecedor 
    (nome, cnpj, telefone, email, rua, numero, bairro, cidade, cep, inscricao_estadual)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [nome, cnpj, telefone, email, rua, numero, bairro, cidade, cep, inscricao_estadual], (err) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).send("CNPJ já cadastrado ❌");
      }

      console.error(err);
      return res.status(500).send("Erro ao cadastrar fornecedor ❌");
    }

    res.send("Fornecedor cadastrado com sucesso ✅");
  });
});

app.get("/fornecedores", (req, res) => {
  db.query("SELECT * FROM fornecedor", (err, result) => {
    if (err) return res.status(500).send("Erro ao buscar fornecedores ❌");
    res.json(result);
  });
});

app.put("/fornecedores/:id", (req, res) => {
  const { id } = req.params;

  const {
    nome, cnpj, telefone, email,
    rua, numero, bairro, cidade, cep, inscricao_estadual
  } = req.body;

  const sql = `
    UPDATE fornecedor 
    SET nome=?, cnpj=?, telefone=?, email=?, rua=?, numero=?, bairro=?, cidade=?, cep=?, inscricao_estadual=?
    WHERE id=?
  `;

  db.query(sql, [nome, cnpj, telefone, email, rua, numero, bairro, cidade, cep, inscricao_estadual, id], (err) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).send("CNPJ já cadastrado ❌");
      }

      console.error(err);
      return res.status(500).send("Erro ao atualizar fornecedor ❌");
    }

    res.send("Fornecedor atualizado com sucesso ✅");
  });
});

app.delete("/fornecedores/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM fornecedor WHERE id=?", [id], (err) => {
    if (err) return res.status(500).send("Erro ao excluir fornecedor ❌");
    res.send("Fornecedor excluído com sucesso ✅");
  });
});

/* =========================
   PRODUTOS
========================= */

app.post("/produtos", (req, res) => {
  const {
    nome, fornecedor_id, categoria, cor,
    altura, largura, profundidade, volume,
    custo, preco_venda, margem_lucro, estoque_minimo
  } = req.body;

  if (!nome || !fornecedor_id || !categoria || !cor) {
    return res.status(400).send("Preencha os campos obrigatórios do produto ❌");
  }

  const codigo = "SKU" + Date.now();

  const sql = `
    INSERT INTO produto
    (nome, codigo, fornecedor_id, categoria, cor, altura, largura, profundidade, volume, custo, preco_venda, margem_lucro, estoque_minimo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [nome, codigo, fornecedor_id, categoria, cor, altura, largura, profundidade, volume, custo, preco_venda, margem_lucro, estoque_minimo],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao cadastrar produto ❌");
      }

      res.send("Produto cadastrado com sucesso ✅");
    }
  );
});

app.get("/produtos", (req, res) => {
  const sql = `
    SELECT 
      produto.id,
      produto.nome,
      produto.codigo,
      produto.fornecedor_id,
      produto.categoria,
      produto.cor,
      produto.altura,
      produto.largura,
      produto.profundidade,
      produto.volume,
      produto.custo,
      produto.preco_venda,
      produto.margem_lucro,
      produto.quantidade_estoque,
      produto.estoque_minimo,
      fornecedor.nome AS fornecedor_nome
    FROM produto
    LEFT JOIN fornecedor ON produto.fornecedor_id = fornecedor.id
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar produtos ❌");
    }

    res.json(result);
  });
});

app.put("/produtos/:id", (req, res) => {
  const { id } = req.params;

  const {
    nome, fornecedor_id, categoria, cor,
    altura, largura, profundidade, volume,
    custo, preco_venda, margem_lucro, estoque_minimo
  } = req.body;

  const sql = `
    UPDATE produto
    SET nome=?, fornecedor_id=?, categoria=?, cor=?, altura=?, largura=?, profundidade=?, volume=?, custo=?, preco_venda=?, margem_lucro=?, estoque_minimo=?
    WHERE id=?
  `;

  db.query(
    sql,
    [nome, fornecedor_id, categoria, cor, altura, largura, profundidade, volume, custo, preco_venda, margem_lucro, estoque_minimo, id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao atualizar produto ❌");
      }

      res.send("Produto atualizado com sucesso ✅");
    }
  );
});

app.delete("/produtos/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM produto WHERE id=?", [id], (err) => {
    if (err) {
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(400).send("Este produto possui movimentações e não pode ser excluído ❌");
      }

      console.error(err);
      return res.status(500).send("Erro ao excluir produto ❌");
    }

    res.send("Produto excluído com sucesso ✅");
  });
});

/* =========================
   FUNCIONÁRIOS
========================= */

app.post("/funcionarios", (req, res) => {
  const {
    nome, cpf, rg, telefone, email,
    rua, numero, bairro, cidade, cep,
    data_admissao, 
  } = req.body;

  if (!nome || !cpf || !telefone || !email) {
    return res.status(400).send("Preencha os campos obrigatórios ❌");
  }

  const sql = `
    INSERT INTO funcionario
    (nome, cpf, rg, telefone, email, rua, numero, bairro, cidade, cep, data_admissao)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [nome, cpf, rg, telefone, email, rua, numero, bairro, cidade, cep, data_admissao],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao cadastrar funcionário ❌");
      }

      res.send("Funcionário cadastrado com sucesso ✅");
    }
  );
});

app.get("/funcionarios", (req, res) => {
  db.query("SELECT * FROM funcionario", (err, result) => {
    if (err) return res.status(500).send("Erro ao buscar funcionários ❌");
    res.json(result);
  });
});

app.put("/funcionarios/:id", (req, res) => {
  const { id } = req.params;

  const {
    nome, cpf, rg, telefone, email,
    rua, numero, bairro, cidade, cep,
    data_admissao
  } = req.body;

  const sql = `
    UPDATE funcionario
    SET nome=?, cpf=?, rg=?, telefone=?, email=?, rua=?, numero=?, bairro=?, cidade=?, cep=?, data_admissao=?,
    WHERE id=?
  `;

  db.query(
    sql,
    [nome, cpf, rg, telefone, email, rua, numero, bairro, cidade, cep, data_admissao, id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao atualizar funcionário ❌");
      }

      res.send("Funcionário atualizado com sucesso ✅");
    }
  );
});

app.delete("/funcionarios/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM funcionario WHERE id=?", [id], (err) => {
    if (err) return res.status(500).send("Erro ao excluir funcionário ❌");
    res.send("Funcionário excluído com sucesso ✅");
  });
});

/* =========================
   ENTRADAS
========================= */

app.post("/entradas", (req, res) => {
  const {
    produto_id,
    quantidade,
    numero_nf,
    data_nf,
    lote,
    validade
  } = req.body;

  if (!produto_id || !quantidade || !numero_nf || !data_nf || !lote || !validade) {
    return res.status(400).send("Preencha todos os campos da entrada ❌");
  }

  const sqlEntrada = `
    INSERT INTO entrada_mercadoria
    (produto_id, quantidade, numero_nf, data_nf, lote, validade)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sqlEntrada,
    [produto_id, quantidade, numero_nf, data_nf, lote, validade],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao registrar entrada ❌");
      }

      const sqlAtualizaEstoque = `
        UPDATE produto
        SET quantidade_estoque = quantidade_estoque + ?
        WHERE id = ?
      `;

      db.query(sqlAtualizaEstoque, [quantidade, produto_id], (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Entrada salva, mas erro ao atualizar estoque ❌");
        }

        res.send("Entrada registrada e estoque atualizado ✅");
      });
    }
  );
});

app.get("/entradas", (req, res) => {
  const sql = `
    SELECT 
      entrada_mercadoria.id,
      entrada_mercadoria.quantidade,
      entrada_mercadoria.numero_nf,
      entrada_mercadoria.data_nf,
      entrada_mercadoria.lote,
      entrada_mercadoria.validade,
      entrada_mercadoria.data_entrada,
      produto.nome AS produto_nome,
      produto.codigo AS produto_codigo
    FROM entrada_mercadoria
    INNER JOIN produto ON entrada_mercadoria.produto_id = produto.id
    ORDER BY entrada_mercadoria.data_entrada DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar entradas ❌");
    }

    res.json(result);
  });
});

app.use((req, res) => {
  res.status(404).send("Rota não encontrada ❌");
});

app.listen(3000, () => {
  console.log("🚀 Servidor rodando em http://localhost:3000");
});