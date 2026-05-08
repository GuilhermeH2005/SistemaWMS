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

// CADASTRAR
app.post("/fornecedores", (req, res) => {
  const {
    nome, cnpj, telefone, email,
    rua, numero, bairro, cidade, cep, inscricao_estadual
  } = req.body;

  if (!nome) {
    return res.status(400).send("Nome é obrigatório ❌");
  }

  const sql = `
    INSERT INTO fornecedor 
    (nome, cnpj, telefone, email, rua, numero, bairro, cidade, cep, inscricao_estadual)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [nome, cnpj, telefone, email, rua, numero, bairro, cidade, cep, inscricao_estadual],
    (err, result) => {
      if (err) {
        console.error("Erro ao cadastrar:", err);
        return res.status(500).send("Erro ao cadastrar ❌");
      }

      res.send("Fornecedor cadastrado com sucesso ✅");
    }
  );
});

// LISTAR
app.get("/fornecedores", (req, res) => {
  db.query("SELECT * FROM fornecedor", (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar ❌");
    }

    res.json(result);
  });
});

// EDITAR
app.put("/fornecedores/:id", (req, res) => {
  const { id } = req.params;

  const {
    nome, cnpj, telefone, email,
    rua, numero, bairro, cidade, cep, inscricao_estadual
  } = req.body;

  if (!nome) {
    return res.status(400).send("Nome é obrigatório ❌");
  }

  const sql = `
    UPDATE fornecedor 
    SET nome = ?, cnpj = ?, telefone = ?, email = ?, rua = ?, numero = ?, bairro = ?, cidade = ?, cep = ?, inscricao_estadual = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [nome, cnpj, telefone, email, rua, numero, bairro, cidade, cep, inscricao_estadual, id],
    (err) => {
      if (err) {
        console.error("Erro ao atualizar:", err);
        return res.status(500).send("Erro ao atualizar ❌");
      }

      res.send("Fornecedor atualizado com sucesso ✅");
    }
  );
});

// EXCLUIR
app.delete("/fornecedores/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM fornecedor WHERE id = ?", [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao excluir ❌");
    }

    res.send("Fornecedor excluído com sucesso ✅");
  });
});

// CADASTRAR PRODUTO
app.post("/produtos", (req, res) => {
  const { nome, codigo, fornecedor_id, peso, volume, estoque_minimo } = req.body;

  if (!nome) {
    return res.status(400).send("Nome do produto é obrigatório ❌");
  }

  const sql = `
    INSERT INTO produto
    (nome, codigo, fornecedor_id, peso, volume, estoque_minimo)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [nome, codigo, fornecedor_id || null, peso || 0, volume || 0, estoque_minimo || 0],
    (err) => {
      if (err) {
        console.error("Erro ao cadastrar produto:", err);
        return res.status(500).send("Erro ao cadastrar produto ❌");
      }

      res.send("Produto cadastrado com sucesso ✅");
    }
  );
});

// LISTAR PRODUTOS
app.get("/produtos", (req, res) => {
  const sql = `
    SELECT 
      produto.id,
      produto.nome,
      produto.codigo,
      produto.fornecedor_id,
      produto.peso,
      produto.volume,
      produto.quantidade_estoque,
      produto.estoque_minimo,
      fornecedor.nome AS fornecedor_nome
    FROM produto
    LEFT JOIN fornecedor ON produto.fornecedor_id = fornecedor.id
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Erro ao buscar produtos:", err);
      return res.status(500).send("Erro ao buscar produtos ❌");
    }

    res.json(result);
  });
});

// EDITAR PRODUTO
app.put("/produtos/:id", (req, res) => {
  const { id } = req.params;
  const { nome, codigo, fornecedor_id, peso, volume, estoque_minimo } = req.body;

  if (!nome) {
    return res.status(400).send("Nome do produto é obrigatório ❌");
  }

  const sql = `
    UPDATE produto
    SET nome = ?, codigo = ?, fornecedor_id = ?, peso = ?, volume = ?, estoque_minimo = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [nome, codigo, fornecedor_id || null, peso || 0, volume || 0, estoque_minimo || 0, id],
    (err) => {
      if (err) {
        console.error("Erro ao atualizar produto:", err);
        return res.status(500).send("Erro ao atualizar produto ❌");
      }

      res.send("Produto atualizado com sucesso ✅");
    }
  );
});

// EXCLUIR PRODUTO
app.delete("/produtos/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM produto WHERE id = ?", [id], (err) => {
    if (err) {
      console.error("Erro ao excluir produto:", err);
      return res.status(500).send("Erro ao excluir produto ❌");
    }

    res.send("Produto excluído com sucesso ✅");
  });
});

// CADASTRAR ENTRADA DE MERCADORIA
app.post("/entradas", (req, res) => {
  const {
    produto_id,
    quantidade,
    numero_nf,
    serie_nf,
    data_nf,
    lote,
    validade
  } = req.body;

  if (!produto_id || !quantidade) {
    return res.status(400).send("Produto e quantidade são obrigatórios ❌");
  }

  const sqlEntrada = `
    INSERT INTO entrada_mercadoria
    (produto_id, quantidade, numero_nf, serie_nf, data_nf, lote, validade)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sqlEntrada,
    [produto_id, quantidade, numero_nf, serie_nf, data_nf, lote, validade],
    (err) => {
      if (err) {
        console.error("Erro ao registrar entrada:", err);
        return res.status(500).send("Erro ao registrar entrada ❌");
      }

      const sqlAtualizaEstoque = `
        UPDATE produto
        SET quantidade_estoque = quantidade_estoque + ?
        WHERE id = ?
      `;

      db.query(sqlAtualizaEstoque, [quantidade, produto_id], (err) => {
        if (err) {
          console.error("Erro ao atualizar estoque:", err);
          return res.status(500).send("Entrada salva, mas erro ao atualizar estoque ❌");
        }

        res.send("Entrada registrada e estoque atualizado ✅");
      });
    }
  );
});

// LISTAR ENTRADAS DE MERCADORIA
app.get("/entradas", (req, res) => {
  const sql = `
    SELECT 
      entrada_mercadoria.id,
      entrada_mercadoria.quantidade,
      entrada_mercadoria.numero_nf,
      entrada_mercadoria.serie_nf,
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
      console.error("Erro ao buscar entradas:", err);
      return res.status(500).send("Erro ao buscar entradas ❌");
    }

    res.json(result);
  });
});

// CADASTRAR FUNCIONÁRIO
app.post("/funcionarios", (req, res) => {
  const { nome, cpf, telefone, email, cargo, status } = req.body;

  if (!nome) {
    return res.status(400).send("Nome é obrigatório ❌");
  }

  const sql = `
    INSERT INTO funcionario
    (nome, cpf, telefone, email, cargo)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [nome, cpf, telefone, email, cargo, status], (err) => {
    if (err) {
      console.error("Erro ao cadastrar funcionário:", err);
      return res.status(500).send("Erro ao cadastrar funcionário ❌");
    }

    res.send("Funcionário cadastrado com sucesso ✅");
  });
});

// LISTAR FUNCIONÁRIOS
app.get("/funcionarios", (req, res) => {
  db.query("SELECT * FROM funcionario", (err, result) => {
    if (err) {
      console.error("Erro ao buscar funcionários:", err);
      return res.status(500).send("Erro ao buscar funcionários ❌");
    }

    res.json(result);
  });
});

// EDITAR FUNCIONÁRIO
app.put("/funcionarios/:id", (req, res) => {
  const { id } = req.params;
  const { nome, cpf, telefone, email, cargo, status } = req.body;

  const sql = `
    UPDATE funcionario
    SET nome = ?, cpf = ?, telefone = ?, email = ?, cargo = ?
    WHERE id = ?
  `;

  db.query(sql, [nome, cpf, telefone, email, cargo, id], (err) => {
    if (err) {
      console.error("Erro ao atualizar funcionário:", err);
      return res.status(500).send("Erro ao atualizar funcionário ❌");
    }

    res.send("Funcionário atualizado com sucesso ✅");
  });
});

// EXCLUIR FUNCIONÁRIO
app.delete("/funcionarios/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM funcionario WHERE id = ?", [id], (err) => {
    if (err) {
      console.error("Erro ao excluir funcionário:", err);
      return res.status(500).send("Erro ao excluir funcionário ❌");
    }

    res.send("Funcionário excluído com sucesso ✅");
  });
});

app.use((req, res) => {
  res.status(404).send("Rota não encontrada ❌");
});

app.listen(3000, () => {
  console.log("🚀 Servidor rodando em http://localhost:3000");
});