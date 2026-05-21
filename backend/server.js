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

async function registrarAuditoria(usuarioId, acao, tabelaAfetada, registroId, descricao) {
  try {
    await db.query(
      `INSERT INTO auditoria 
      (usuario_id, acao, tabela_afetada, registro_id, descricao)
      VALUES (?, ?, ?, ?, ?)`,
      [usuarioId || null, acao, tabelaAfetada, registroId || null, descricao]
    );
  } catch (erro) {
    console.error("Erro ao registrar auditoria:", erro);
  }
}

/* =========================
   FORNECEDORES
========================= */

/* =========================
   FORNECEDORES
========================= */

app.post("/fornecedores", (req, res) => {
  const {
    nome,
    cnpj,
    telefone,
    email,
    rua,
    numero,
    bairro,
    cidade,
    cep,
    inscricao_estadual
  } = req.body;

  if (!nome || !cnpj || !telefone || !email) {
    return res.status(400).send("Preencha os campos obrigatórios ❌");
  }

  const sql = `
    INSERT INTO fornecedor
    (
      nome,
      cnpj,
      telefone,
      email,
      rua,
      numero,
      bairro,
      cidade,
      cep,
      inscricao_estadual
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      nome,
      cnpj,
      telefone,
      email,
      rua,
      numero,
      bairro,
      cidade,
      cep,
      inscricao_estadual || null
    ],
    (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(400)
            .send("CNPJ ou Inscrição Estadual já cadastrado ❌");
        }

        console.error(err);
        return res.status(500).send("Erro ao cadastrar fornecedor ❌");
      }

      res.send("Fornecedor cadastrado com sucesso ✅");
    }
  );
});

app.get("/fornecedores", (req, res) => {
  db.query(
    "SELECT * FROM fornecedor ORDER BY nome",
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao buscar fornecedores ❌");
      }

      res.json(result);
    }
  );
});

app.put("/fornecedores/:id", (req, res) => {
  const { id } = req.params;

  const {
    nome,
    cnpj,
    telefone,
    email,
    rua,
    numero,
    bairro,
    cidade,
    cep,
    inscricao_estadual
  } = req.body;

  if (!nome || !cnpj || !telefone || !email) {
    return res.status(400).send("Preencha os campos obrigatórios ❌");
  }

  const sql = `
    UPDATE fornecedor
    SET
      nome = ?,
      cnpj = ?,
      telefone = ?,
      email = ?,
      rua = ?,
      numero = ?,
      bairro = ?,
      cidade = ?,
      cep = ?,
      inscricao_estadual = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      nome,
      cnpj,
      telefone,
      email,
      rua,
      numero,
      bairro,
      cidade,
      cep,
      inscricao_estadual || null,
      id
    ],
    (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(400)
            .send("CNPJ ou Inscrição Estadual já cadastrado ❌");
        }

        console.error(err);
        return res.status(500).send("Erro ao atualizar fornecedor ❌");
      }

      res.send("Fornecedor atualizado com sucesso ✅");
    }
  );
});

app.delete("/fornecedores/:id", (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM fornecedor WHERE id = ?",
    [id],
    (err) => {
      if (err) {
        console.error(err);

        if (err.code === "ER_ROW_IS_REFERENCED_2") {
          return res
            .status(400)
            .send("Este fornecedor está vinculado a produtos e não pode ser excluído ❌");
        }

        return res.status(500).send("Erro ao excluir fornecedor ❌");
      }

      res.send("Fornecedor excluído com sucesso ✅");
    }
  );
});

/* =========================
   PRODUTOS
========================= */

app.get("/produtos", (req, res) => {

  const sql = `
    SELECT
      produto.*,
      fornecedor.nome AS fornecedor_nome
    FROM produto

    LEFT JOIN fornecedor
      ON produto.fornecedor_id = fornecedor.id

    ORDER BY produto.nome
  `;

  db.query(sql, (err, result) => {

    if (err) {

      console.error(err);

      return res.status(500).send(
        "Erro ao buscar produtos ❌"
      );

    }

    res.json(result);

  });

});

app.post("/produtos", (req, res) => {
  const {
    nome, fornecedor_id, categoria, cor,
    altura, largura, profundidade, volume,
    custo, preco_venda, margem_lucro, estoque_minimo,
    giro
  } = req.body;

  if (!nome || !fornecedor_id || !categoria || !cor) {
    return res.status(400).send("Preencha os campos obrigatórios do produto ❌");
  }

  const codigo = "SKU" + Date.now();

  const sql = `
    INSERT INTO produto
    (nome, codigo, fornecedor_id, categoria, cor, altura, largura, profundidade, volume, custo, preco_venda, margem_lucro, estoque_minimo, giro)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      nome, codigo, fornecedor_id, categoria, cor,
      altura, largura, profundidade, volume,
      custo, preco_venda, margem_lucro, estoque_minimo,
      giro || "MEDIO"
    ],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao cadastrar produto ❌");
      }

      res.send("Produto cadastrado com sucesso ✅");
    }
  );
});

app.put("/produtos/:id", (req, res) => {
  const { id } = req.params;

  const {
    nome, fornecedor_id, categoria, cor,
    altura, largura, profundidade, volume,
    custo, preco_venda, margem_lucro, estoque_minimo, giro
  } = req.body;

  const sql = `
    UPDATE produto
    SET nome=?, fornecedor_id=?, categoria=?, cor=?, altura=?, largura=?, profundidade=?, volume=?, custo=?, preco_venda=?, margem_lucro=?, estoque_minimo=?, giro=?
    WHERE id=?
  `;

  db.query(
    sql,
    [nome, fornecedor_id, categoria, cor, altura, largura, profundidade, volume, custo, preco_venda, margem_lucro, estoque_minimo,  giro || "MEDIO", id],
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
        if (err) {
    if (err.code === "ER_DUP_ENTRY") {
    return res.status(400).send("CPF já cadastrado ❌");
    }

  console.error(err);
  return res.status(500).send("Erro ao cadastrar funcionário ❌");
}
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
    SET nome=?, cpf=?, rg=?, telefone=?, email=?, rua=?, numero=?, bairro=?, cidade=?, cep=?, data_admissao=?
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

  db.query(
    "SELECT * FROM usuario WHERE funcionario_id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao verificar funcionário ❌");
      }

      if (result.length > 0) {
        return res.status(400).send(
          "Este funcionário possui usuário vinculado e não pode ser excluído ❌"
        );
      }

      db.query(
        "DELETE FROM funcionario WHERE id = ?",
        [id],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Erro ao excluir funcionário ❌");
          }

          res.send("Funcionário excluído com sucesso ✅");
        }
      );
    }
  );
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
    validade,
    usuario_id
  } = req.body;

  if (!produto_id || !quantidade || !numero_nf || !data_nf || !lote || !validade) {
    return res.status(400).send("Preencha todos os campos da entrada ❌");
  }

  const sqlEntrada = `
    INSERT INTO entrada_mercadoria
    (
      produto_id,
      quantidade,
      numero_nf,
      data_nf,
      lote,
      validade,
      status_conferencia,
      usuario_id
    )
    VALUES (?, ?, ?, ?, ?, ?, 'PENDENTE', ?)
  `;

  db.query(
    sqlEntrada,
    [produto_id, quantidade, numero_nf, data_nf, lote, validade, usuario_id],
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

      if (err) {
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(400).send("Número da nota fiscal já cadastrado ❌");
  }

  console.error(err);
  return res.status(500).send("Erro ao registrar entrada ❌");
}

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
      entrada_mercadoria.status_conferencia,
      entrada_mercadoria.data_entrada,

      produto.nome AS produto_nome,
      produto.codigo AS produto_codigo,

      usuario.login AS usuario_nome

    FROM entrada_mercadoria

    INNER JOIN produto 
      ON entrada_mercadoria.produto_id = produto.id

    LEFT JOIN usuario 
      ON entrada_mercadoria.usuario_id = usuario.id

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

/* =========================
   LOGIN
========================= */

app.post("/login", (req, res) => {

  const { login, senha } = req.body;

  if (!login || !senha) {

    return res.status(400).json({
      mensagem: "Login e senha obrigatórios ❌"
    });

  }

  const sql = `
    SELECT * FROM usuario
    WHERE login = ?
  `;

  db.query(sql, [login], (err, result) => {

    if (err) {

      console.error(err);

      return res.status(500).json({
        mensagem: "Erro no login ❌"
      });

    }

    if (result.length === 0) {

      return res.status(401).json({
        mensagem: "Usuário não encontrado ❌"
      });

    }

    const usuario = result[0];

    if (usuario.senha !== senha) {

      return res.status(401).json({
        mensagem: "Senha inválida ❌"
      });

    }

    if (usuario.situacao === "INATIVO") {

      return res.status(403).json({
        mensagem: "Usuário inativo ❌"
      });

    }

    const ultimoAcesso =
      new Date().toLocaleDateString("pt-BR") +
      " " +
      new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      });

    db.query(
      `UPDATE usuario SET ultimo_acesso = ? WHERE id = ?`,
      [ultimoAcesso, usuario.id]
    );

   db.query(
  "SELECT permissao FROM usuario_permissao WHERE usuario_id = ?",
  [usuario.id],
  (err, permissoesResult) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        mensagem: "Erro ao buscar permissões ❌"
      });
    }

    const permissoes = permissoesResult.map(p => p.permissao);

    res.json({
      id: usuario.id,
      funcionario_id: usuario.funcionario_id,
      nomeCompleto: usuario.nome_completo,
      login: usuario.login,
      email: usuario.email,
      situacao: usuario.situacao,
      ultimoAcesso,
      permissoes: permissoes
    });
  }
);

  });

});

app.post("/setores", (req, res) => {

  const { nome } = req.body;

  if (!nome) {
    return res.status(400)
      .send("Nome obrigatório ❌");
  }

  const sql =
    "INSERT INTO setor (nome) VALUES (?)";

  db.query(sql, [nome], (err) => {

    if (err) {

      if (err.code === "ER_DUP_ENTRY") {

        return res.status(400)
          .send("Setor já cadastrado ❌");

      }

      console.error(err);

      return res.status(500)
        .send("Erro ao cadastrar setor ❌");
    }

    res.send("Setor cadastrado ✅");

  });

});

app.get("/setores", (req, res) => {

  db.query(
    "SELECT * FROM setor ORDER BY nome",
    (err, result) => {

      if (err) {

        console.error(err);

        return res.status(500)
          .send("Erro ao buscar setores ❌");
      }

      res.json(result);

    }
  );

});

app.delete("/setores/:id", (req, res) => {

  const { id } = req.params;

  db.query(
    "DELETE FROM setor WHERE id = ?",
    [id],
    (err) => {

      if (err) {

        console.error(err);

        return res.status(500)
          .send("Erro ao excluir setor ❌");
      }

      res.send("Setor excluído ✅");

    }
  );

});

/* =========================
   USUÁRIOS
========================= */

app.get("/usuarios", (req, res) => {

  const sql = `
    SELECT
      usuario.id,
      usuario.login,
      usuario.email,
      usuario.situacao,
      usuario.ultimo_acesso,

      funcionario.nome AS nome_completo,

      setor.nome AS setor_nome

    FROM usuario

    INNER JOIN funcionario
      ON usuario.funcionario_id = funcionario.id

    LEFT JOIN setor
      ON usuario.setor_id = setor.id

    ORDER BY funcionario.nome
  `;

  db.query(sql, (err, result) => {

    if (err) {

      console.error(err);

      return res.status(500).send(
        "Erro ao buscar usuários ❌"
      );

    }

    res.json(result);

  });

});

app.post("/usuarios", (req, res) => {
  const {
    funcionario_id,
    setor_id,
    login,
    senha,
    email,
    permissoes
  } = req.body;

  if (!funcionario_id || !login || !senha) {
    return res.status(400).send("Funcionário, login e senha são obrigatórios ❌");
  }

  const sqlUsuario = `
    INSERT INTO usuario
    (funcionario_id, setor_id, login, senha, email, situacao)
    VALUES (?, ?, ?, ?, ?, 'ATIVO')
  `;

  db.query(
    sqlUsuario,
    [funcionario_id, setor_id || null, login, senha, email],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).send("Login já cadastrado ❌");
        }

        console.error(err);
        return res.status(500).send("Erro ao cadastrar usuário ❌");
      }

      const usuarioId = result.insertId;

      if (!permissoes || permissoes.length === 0) {
        return res.send("Usuário cadastrado com sucesso ✅");
      }

      const valoresPermissoes = permissoes.map(permissao => [
        usuarioId,
        permissao
      ]);

      db.query(
        "INSERT INTO usuario_permissao (usuario_id, permissao) VALUES ?",
        [valoresPermissoes],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Usuário criado, mas erro ao salvar permissões ❌");
          }

          res.send("Usuário cadastrado com sucesso ✅");
        }
      );
    }
  );
});

app.delete("/usuarios/:id", (req, res) => {
  const { id } = req.params;

  if (Number(id) === 1) {
  return res.status(400).send("O usuário administrador não pode ser excluído ❌");
}

  db.query(
    "DELETE FROM usuario_permissao WHERE usuario_id = ?",
    [id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao excluir permissões ❌");
      }

      db.query(
        "DELETE FROM usuario WHERE id = ?",
        [id],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Erro ao excluir usuário ❌");
          }

          res.send("Usuário excluído com sucesso ✅");
        }
      );
    }
  );
});

app.put("/usuarios/:id", (req, res) => {
  const { id } = req.params;

  const {
    funcionario_id,
    setor_id,
    email,
    situacao,
    permissoes
  } = req.body;

  if (!funcionario_id) {
    return res.status(400).send("Funcionário é obrigatório ❌");
  }

  const sqlUsuario = `
    UPDATE usuario
    SET funcionario_id = ?, setor_id = ?, email = ?, situacao = ?
    WHERE id = ?
  `;

  db.query(
    sqlUsuario,
    [
      funcionario_id,
      setor_id || null,
      email,
      situacao || "ATIVO",
      id
    ],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao atualizar usuário ❌");
      }

      db.query(
        "DELETE FROM usuario_permissao WHERE usuario_id = ?",
        [id],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Erro ao limpar permissões ❌");
          }

          if (!permissoes || permissoes.length === 0) {
            return res.send("Usuário atualizado com sucesso ✅");
          }

          const valoresPermissoes = permissoes.map(permissao => [
            id,
            permissao
          ]);

          db.query(
            "INSERT INTO usuario_permissao (usuario_id, permissao) VALUES ?",
            [valoresPermissoes],
            (err) => {
              if (err) {
                console.error(err);
                return res.status(500).send("Erro ao salvar permissões ❌");
              }

              res.send("Usuário atualizado com sucesso ✅");
            }
          );
        }
      );
    }
  );
});

app.get("/usuarios/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT
      usuario.id,
      usuario.funcionario_id,
      usuario.setor_id,
      usuario.login,
      usuario.senha,
      usuario.email,
      usuario.situacao,
      usuario.ultimo_acesso,
      funcionario.nome AS nome_completo,
      setor.nome AS setor_nome
    FROM usuario
    INNER JOIN funcionario ON usuario.funcionario_id = funcionario.id
    LEFT JOIN setor ON usuario.setor_id = setor.id
    WHERE usuario.id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar usuário ❌");
    }

    if (result.length === 0) {
      return res.status(404).send("Usuário não encontrado ❌");
    }

    const usuario = result[0];

    db.query(
      "SELECT permissao FROM usuario_permissao WHERE usuario_id = ?",
      [id],
      (err, permissoesResult) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Erro ao buscar permissões ❌");
        }

        usuario.permissoes = permissoesResult.map(p => p.permissao);

        res.json(usuario);
      }
    );
  });
});

/* =========================
   AJUSTE MANUAL DE ESTOQUE
========================= */

// Buscar um produto específico
app.get("/produtos/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      id, 
      nome, 
      quantidade_estoque 
    FROM produto 
    WHERE id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Erro ao buscar produto:", err);
      return res.status(500).json({ erro: "Erro ao buscar produto." });
    }

    if (result.length === 0) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    res.json(result[0]);
  });
});

// Listar ajustes de estoque
app.get("/ajustes-estoque", (req, res) => {
  const sql = `
    SELECT 
      ae.id,
      ae.tipo,
      ae.quantidade_anterior,
      ae.quantidade_ajustada,
      ae.quantidade_nova,
      ae.motivo,
      ae.observacao,
      ae.data_ajuste,
      p.nome AS produto_nome,
      u.login AS usuario_login
    FROM ajuste_estoque ae
    INNER JOIN produto p ON ae.produto_id = p.id
    LEFT JOIN usuario u ON ae.usuario_id = u.id
    ORDER BY ae.data_ajuste DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Erro ao listar ajustes:", err);
      return res.status(500).json({ erro: "Erro ao listar ajustes de estoque." });
    }

    res.json(result);
  });
});

// Criar ajuste manual de estoque
app.post("/ajustes-estoque", (req, res) => {
  const {
    produto_id,
    usuario_id,
    tipo,
    quantidade,
    motivo,
    observacao
  } = req.body;

  if (!produto_id || !tipo || !quantidade || !motivo) {
    return res.status(400).json({
      erro: "Produto, tipo, quantidade e motivo são obrigatórios."
    });
  }

  if (tipo !== "ENTRADA" && tipo !== "SAIDA") {
    return res.status(400).json({
      erro: "Tipo de ajuste inválido."
    });
  }

  if (Number(quantidade) <= 0) {
    return res.status(400).json({
      erro: "A quantidade deve ser maior que zero."
    });
  }

  const sqlBuscaProduto = `
    SELECT id, nome, quantidade_estoque
    FROM produto
    WHERE id = ?
  `;

  db.query(sqlBuscaProduto, [produto_id], (err, produtoResult) => {
    if (err) {
      console.error("Erro ao buscar produto:", err);
      return res.status(500).json({ erro: "Erro ao buscar produto." });
    }

    if (produtoResult.length === 0) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    const produto = produtoResult[0];
    const estoqueAnterior = Number(produto.quantidade_estoque);
    const quantidadeAjustada = Number(quantidade);

    let novoEstoque;

    if (tipo === "ENTRADA") {
      novoEstoque = estoqueAnterior + quantidadeAjustada;
    } else {
      if (quantidadeAjustada > estoqueAnterior) {
        return res.status(400).json({
          erro: "Não é possível realizar saída maior que o estoque atual."
        });
      }

      novoEstoque = estoqueAnterior - quantidadeAjustada;
    }

    const sqlAtualizaProduto = `
      UPDATE produto
      SET quantidade_estoque = ?
      WHERE id = ?
    `;

    db.query(sqlAtualizaProduto, [novoEstoque, produto_id], (err) => {
      if (err) {
        console.error("Erro ao atualizar estoque:", err);
        return res.status(500).json({ erro: "Erro ao atualizar estoque." });
      }

      const sqlAjuste = `
        INSERT INTO ajuste_estoque
        (
          produto_id,
          usuario_id,
          tipo,
          quantidade_anterior,
          quantidade_ajustada,
          quantidade_nova,
          motivo,
          observacao
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sqlAjuste,
        [
          produto_id,
          usuario_id || null,
          tipo,
          estoqueAnterior,
          quantidadeAjustada,
          novoEstoque,
          motivo,
          observacao || null
        ],
        (err, ajusteResult) => {
          if (err) {
            console.error("Erro ao salvar ajuste:", err);
            return res.status(500).json({ erro: "Erro ao salvar ajuste." });
          }

          const ajusteId = ajusteResult.insertId;

          const descricao = `
            Ajuste manual no produto "${produto.nome}".
            Tipo: ${tipo}.
            Estoque anterior: ${estoqueAnterior}.
            Quantidade ajustada: ${quantidadeAjustada}.
            Novo estoque: ${novoEstoque}.
            Motivo: ${motivo}.
          `;

          const sqlAuditoria = `
            INSERT INTO auditoria
            (usuario_id, acao, tabela_afetada, registro_id, descricao)
            VALUES (?, ?, ?, ?, ?)
          `;

          db.query(
            sqlAuditoria,
            [
              usuario_id || null,
              "AJUSTE_ESTOQUE",
              "ajuste_estoque",
              ajusteId,
              descricao
            ],
            (err) => {
              if (err) {
                console.error("Erro ao registrar auditoria:", err);
                return res.status(500).json({
                  erro: "Ajuste salvo, mas erro ao registrar auditoria."
                });
              }

              res.status(201).json({
                mensagem: "Ajuste de estoque realizado com sucesso.",
                ajuste_id: ajusteId,
                estoque_anterior: estoqueAnterior,
                quantidade_ajustada: quantidadeAjustada,
                estoque_novo: novoEstoque
              });
            }
          );
        }
      );
    });
  });
});

/* =========================
   AUDITORIA
========================= */

app.get("/auditoria", (req, res) => {

  const sql = `
    SELECT
      auditoria.id,
      auditoria.acao,
      auditoria.tabela_afetada,
      auditoria.registro_id,
      auditoria.descricao,
      auditoria.data_hora,

      usuario.login AS usuario_login

    FROM auditoria

    LEFT JOIN usuario
      ON auditoria.usuario_id = usuario.id

    ORDER BY auditoria.data_hora DESC
  `;

  db.query(sql, (err, result) => {

    if (err) {

      console.error(err);

      return res.status(500).json({
        erro: "Erro ao buscar auditoria"
      });

    }

    res.json(result);

  });

});

/* =========================
   CONFERÊNCIA
========================= */

app.get("/conferencia", (req, res) => {
  const sql = `
    SELECT 
      entrada_mercadoria.id,
      entrada_mercadoria.quantidade,
      entrada_mercadoria.numero_nf,
      entrada_mercadoria.lote,
      entrada_mercadoria.validade,
      entrada_mercadoria.status_conferencia,

      produto.nome AS produto_nome,
      produto.codigo AS produto_codigo

    FROM entrada_mercadoria

    INNER JOIN produto 
      ON entrada_mercadoria.produto_id = produto.id

    WHERE entrada_mercadoria.status_conferencia IN ('PENDENTE', 'DIVERGENTE')

    ORDER BY entrada_mercadoria.data_entrada DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar conferências ❌");
    }

    res.json(result);
  });
});

app.put("/conferencia/:id", (req, res) => {
  const { id } = req.params;

  const {
    status_conferencia,
    usuario_edicao_id
  } = req.body;

  if (!status_conferencia) {
    return res.status(400).send("Status obrigatório ❌");
  }

  if (!["CONFERIDO", "DIVERGENTE", "PENDENTE"].includes(status_conferencia)) {
    return res.status(400).send("Status inválido ❌");
  }

  const sql = `
    UPDATE entrada_mercadoria
    SET 
      status_conferencia = ?,
      usuario_edicao_id = ?,
      data_atualizacao = NOW()
    WHERE id = ?
  `;

  db.query(
    sql,
    [status_conferencia, usuario_edicao_id || null, id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao atualizar conferência ❌");
      }

      res.send("Conferência atualizada com sucesso ✅");
    }
  );
});

/* =========================
   DASHBOARD
========================= */

app.get("/dashboard", (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM produto) AS total_produtos,
      (SELECT COUNT(*) FROM fornecedor) AS total_fornecedores,
      (SELECT COUNT(*) FROM entrada_mercadoria) AS total_entradas,
      (SELECT IFNULL(SUM(quantidade_estoque), 0) FROM produto) AS estoque_total,
      (SELECT COUNT(*) FROM produto WHERE quantidade_estoque <= estoque_minimo) AS produtos_alerta,
      (SELECT COUNT(*) FROM ajuste_estoque) AS total_ajustes,
      (SELECT COUNT(*) FROM entrada_mercadoria WHERE status_conferencia = 'PENDENTE') AS conferencias_pendentes,
      (SELECT COUNT(*) FROM auditoria) AS total_auditorias
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard:", err);
      return res.status(500).json({ erro: "Erro ao buscar dados do dashboard" });
    }

    res.json(result[0]);
  });
});

app.get("/dashboard/auditorias-recentes", (req, res) => {
  const sql = `
    SELECT 
      auditoria.acao,
      auditoria.descricao,
      auditoria.data_hora,
      usuario.login AS usuario_login
    FROM auditoria
    LEFT JOIN usuario ON auditoria.usuario_id = usuario.id
    ORDER BY auditoria.data_hora DESC
    LIMIT 5
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Erro ao buscar auditorias recentes:", err);
      return res.status(500).json({ erro: "Erro ao buscar auditorias recentes" });
    }

    res.json(result);
  });
});

/* =========================
   ENDEREÇAMENTO
========================= */

app.post("/enderecos", (req, res) => {
  const {
    produto_id,
    posicao_id,
    rua,
    coluna,
    nivel,
    endereco,
    quantidade_unidades,
    observacao
  } = req.body;

  if (!produto_id || !quantidade_unidades) {
    return res.status(400).json({
      erro: "Produto e quantidade são obrigatórios ❌"
    });
  }

  if (!posicao_id && (!rua || !coluna || !nivel || !endereco)) {
    return res.status(400).json({
      erro: "Informe uma posição sugerida ou preencha rua, coluna e nível manualmente ❌"
    });
  }

  const sqlProduto = `
    SELECT
      p.id,
      p.nome,
      p.volume,
      p.quantidade_estoque,
      p.quantidade_estoque - IFNULL(SUM(e.quantidade_unidades), 0) AS quantidade_pendente
    FROM produto p
    LEFT JOIN endereco_estoque e ON e.produto_id = p.id
    WHERE p.id = ?
    GROUP BY p.id, p.nome, p.volume, p.quantidade_estoque
  `;

  db.query(sqlProduto, [produto_id], (err, produtoResult) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: "Erro ao buscar produto ❌" });
    }

    if (produtoResult.length === 0) {
      return res.status(404).json({ erro: "Produto não encontrado ❌" });
    }

    const produto = produtoResult[0];
    const volumeProduto = Number(produto.volume || 0);
    const quantidadePendente = Number(produto.quantidade_pendente || 0);

    if (quantidadePendente <= 0) {
      return res.status(400).json({
        erro: "Este produto já está totalmente endereçado."
      });
    }

    if (!volumeProduto || volumeProduto <= 0) {
      return res.status(400).json({
        erro: "Produto sem cubagem cadastrada."
      });
    }

function salvarComPosicao(posicao) {
  const capacidadeM3 = Number(posicao.capacidade_m3 || 1.8);
  const capacidadeUnidades = Math.floor(capacidadeM3 / volumeProduto);
  const quantidadeSolicitada = Number(quantidade_unidades);

  let quantidadeArmazenada = quantidadeSolicitada;

  if (quantidadeArmazenada > capacidadeUnidades) {
    quantidadeArmazenada = capacidadeUnidades;
  }

  if (quantidadeArmazenada > quantidadePendente) {
    quantidadeArmazenada = quantidadePendente;
  }

  const pendenteDepois = quantidadePendente - quantidadeArmazenada;
  const ocupacaoM3 = quantidadeArmazenada * volumeProduto;

  const sqlVerificaEndereco = `
    SELECT *
    FROM endereco_estoque
    WHERE endereco = ?
  `;

  db.query(sqlVerificaEndereco, [posicao.endereco], (err, enderecoResult) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        erro: "Erro ao verificar endereço ❌"
      });
    }

    if (enderecoResult.length > 0) {
      const enderecoAtual = enderecoResult[0];

      if (Number(enderecoAtual.produto_id) !== Number(produto_id)) {
        return res.status(400).json({
          erro: "Esta posição já está ocupada por outro produto ❌"
        });
      }

      const novaQuantidade =
        Number(enderecoAtual.quantidade_unidades) + quantidadeArmazenada;

      if (novaQuantidade > capacidadeUnidades) {
        return res.status(400).json({
          erro: `Capacidade excedida. Esta posição comporta ${capacidadeUnidades} un. Atualmente possui ${enderecoAtual.quantidade_unidades} un.`
        });
      }

      const novaOcupacao = novaQuantidade * volumeProduto;
      const novoPendenteDepois = quantidadePendente - quantidadeArmazenada;

      const sqlUpdate = `
        UPDATE endereco_estoque
        SET
          quantidade_unidades = ?,
          ocupacao_m3 = ?
        WHERE id = ?
      `;

      return db.query(
        sqlUpdate,
        [
          novaQuantidade,
          novaOcupacao,
          enderecoAtual.id
        ],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({
              erro: "Erro ao atualizar quantidade no endereço ❌"
            });
          }

          return res.status(200).json({
            mensagem: "Quantidade somada ao endereço existente ✅",
            produto: produto.nome,
            endereco: posicao.endereco,
            capacidade_m3: capacidadeM3,
            volume_produto: volumeProduto,
            capacidade_unidades: capacidadeUnidades,
            quantidade_solicitada: quantidadeSolicitada,
            quantidade_armazenada: quantidadeArmazenada,
            quantidade_total_endereco: novaQuantidade,
            quantidade_pendente_depois: novoPendenteDepois
          });
        }
      );
    }

    const sqlInsert = `
      INSERT INTO endereco_estoque
      (
        produto_id,
        posicao_id,
        rua,
        coluna,
        nivel,
        endereco,
        quantidade_unidades,
        quantidade_paletes,
        capacidade_m3,
        capacidade_unidades,
        ocupacao_m3,
        status,
        observacao
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OCUPADO', ?)
    `;

    db.query(
      sqlInsert,
      [
        produto_id,
        posicao.id || null,
        posicao.rua,
        posicao.coluna,
        posicao.nivel,
        posicao.endereco,
        quantidadeArmazenada,
        1,
        capacidadeM3,
        capacidadeUnidades,
        ocupacaoM3,
        observacao || null
      ],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            erro: "Erro ao salvar endereçamento ❌"
          });
        }

        if (posicao.id) {
          db.query(
            "UPDATE posicao_estoque SET status = 'OCUPADA' WHERE id = ?",
            [posicao.id]
          );
        }

        res.status(201).json({
          mensagem: "Endereçamento realizado com sucesso ✅",
          produto: produto.nome,
          endereco: posicao.endereco,
          capacidade_m3: capacidadeM3,
          volume_produto: volumeProduto,
          capacidade_unidades: capacidadeUnidades,
          quantidade_pendente_antes: quantidadePendente,
          quantidade_solicitada: quantidadeSolicitada,
          quantidade_armazenada: quantidadeArmazenada,
          quantidade_pendente_depois: pendenteDepois
        });
      }
    );
  });
}

    if (posicao_id) {

  db.query(
    "SELECT * FROM posicao_estoque WHERE id = ?",
    [posicao_id],
    (err, posicaoResult) => {

      if (err) {
        console.error(err);

        return res.status(500).json({
          erro: "Erro ao buscar posição ❌"
        });
      }

      if (posicaoResult.length === 0) {
        return res.status(404).json({
          erro: "Posição não encontrada ❌"
        });
      }

      const posicao = posicaoResult[0];

      salvarComPosicao(posicao);

    }
  );

} else {

  const sqlBuscaPosicaoManual = `
    SELECT *
    FROM posicao_estoque
    WHERE endereco = ?
  `;

  db.query(
    sqlBuscaPosicaoManual,
    [endereco],
    (err, posicaoManualResult) => {

      if (err) {
        console.error(err);

        return res.status(500).json({
          erro: "Erro ao buscar posição manual ❌"
        });
      }

      if (posicaoManualResult.length > 0) {

        const posicao = posicaoManualResult[0];
        
        salvarComPosicao(posicao);

      } else {

        salvarComPosicao({
          id: null,
          rua,
          coluna,
          nivel,
          endereco,
          capacidade_m3: 1.8
        });

      }

    }
  );

}
  });
});

app.get("/enderecos", (req, res) => {
  const sql = `
    SELECT
      e.id,
      e.produto_id,
      e.posicao_id,
      e.rua,
      e.coluna,
      e.nivel,
      e.endereco,
      e.quantidade_unidades,
      e.capacidade_m3,
      e.capacidade_unidades,
      e.ocupacao_m3,
      e.status,
      e.observacao,

      produto.nome AS produto_nome,
      produto.codigo AS produto_codigo

    FROM endereco_estoque e

    INNER JOIN produto
      ON e.produto_id = produto.id

    ORDER BY e.rua, e.coluna, e.nivel
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar endereços ❌");
    }

    res.json(result);
  });
});

app.delete("/enderecos/:id", (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT posicao_id FROM endereco_estoque WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao buscar endereçamento ❌");
      }

      if (result.length === 0) {
        return res.status(404).send("Endereçamento não encontrado ❌");
      }

      const posicaoId = result[0].posicao_id;

      db.query(
        "DELETE FROM endereco_estoque WHERE id = ?",
        [id],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Erro ao excluir endereçamento ❌");
          }

          db.query(
            "UPDATE posicao_estoque SET status = 'LIVRE' WHERE id = ?",
            [posicaoId],
            (err) => {
              if (err) {
                console.error(err);
                return res.status(500).send("Endereçamento excluído, mas erro ao liberar posição.");
              }

              res.send("Endereçamento excluído e posição liberada ✅");
            }
          );
        }
      );
    }
  );
});

app.get("/enderecos/sugerir/:produtoId", (req, res) => {
  const { produtoId } = req.params;

  const sqlProduto = `
    SELECT id, nome, volume, giro
    FROM produto
    WHERE id = ?
  `;

  db.query(sqlProduto, [produtoId], (err, produtoResult) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar produto ❌");
    }

    if (produtoResult.length === 0) {
      return res.status(404).send("Produto não encontrado ❌");
    }

    const produto = produtoResult[0];

    let ruas = [];
    let niveis = [];

    if (produto.giro === "ALTO") {
      ruas = gerarIntervalo(20, 24);
    } else if (produto.giro === "MEDIO") {
      ruas = gerarIntervalo(10, 19);
    } else {
      ruas = gerarIntervalo(1, 9);
    }

    const volume = Number(produto.volume || 0);

    if (volume >= 0.006) {
      niveis = [1, 2, 3];
    } else {
      niveis = [4, 5, 6, 7];
    }

    const colunas = gerarIntervalo(1, 84);

    const candidatos = [];

    ruas.forEach(rua => {
      colunas.forEach(coluna => {
        niveis.forEach(nivel => {
          const endereco =
            `R${String(rua).padStart(2, "0")}-C${String(coluna).padStart(3, "0")}-N${String(nivel).padStart(2, "0")}`;

          candidatos.push({
            rua,
            coluna,
            nivel,
            endereco
          });
        });
      });
    });

    const enderecosCandidatos =
      candidatos.map(c => c.endereco);

    const sqlOcupados = `
      SELECT endereco
      FROM endereco_estoque
      WHERE endereco IN (?)
      AND status IN ('OCUPADO', 'BLOQUEADO')
    `;

    db.query(sqlOcupados, [enderecosCandidatos], (err, ocupadosResult) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao verificar endereços ❌");
      }

      const ocupados = ocupadosResult.map(e => e.endereco);

      const enderecoLivre = candidatos.find(c =>
        !ocupados.includes(c.endereco)
      );

      if (!enderecoLivre) {
        return res.status(404).send("Nenhum endereço disponível para este produto ❌");
      }

      res.json({
        produto: produto.nome,
        giro: produto.giro,
        volume: produto.volume,
        sugestao: enderecoLivre
      });
    });
  });
});

function gerarIntervalo(inicio, fim) {
  const lista = [];

  for (let i = inicio; i <= fim; i++) {
    lista.push(i);
  }

  return lista;
}

/* =========================
   POSIÇÕES DE ESTOQUE
========================= */

app.post("/posicoes/gerar", (req, res) => {
  const valores = [];

  for (let rua = 1; rua <= 24; rua++) {
    for (let coluna = 1; coluna <= 20; coluna++) {
      for (let nivel = 1; nivel <= 7; nivel++) {
        const endereco =
          `R${String(rua).padStart(2, "0")}-C${String(coluna).padStart(3, "0")}-N${String(nivel).padStart(2, "0")}`;

        valores.push([
          rua,
          coluna,
          nivel,
          endereco,
          1.8,
          "LIVRE"
        ]);
      }
    }
  }

const filtros = [];

if (status) {
  filtros.push("p.status = ?");
  valores.push(status);
}

if (rua) {
  filtros.push("p.rua = ?");
  valores.push(rua);
}

if (filtros.length > 0) {
  sql += " WHERE " + filtros.join(" AND ");
}

sql += " LIMIT 200";

  const sql = `
    INSERT IGNORE INTO posicao_estoque
    (rua, coluna, nivel, endereco, capacidade_m3, status)
    VALUES ?
  `;

  db.query(sql, [valores], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao gerar posições ❌");
    }

    res.send("Posições geradas com sucesso ✅");
  });
});

app.get("/posicoes/resumo", (req, res) => {
  const sql = `
    SELECT
      COUNT(*) AS total,
      SUM(status = 'LIVRE') AS livres,
      SUM(status = 'OCUPADA') AS ocupadas,
      SUM(status = 'BLOQUEADA') AS bloqueadas
    FROM posicao_estoque
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar resumo das posições ❌");
    }

    res.json(result[0]);
  });
});

app.get("/posicoes", (req, res) => {
  const { status, rua, endereco, produto } = req.query;

  let sql = `
    SELECT
      p.id,
      p.rua,
      p.coluna,
      p.nivel,
      p.endereco,
      p.capacidade_m3,
      p.status,
      e.quantidade_unidades,
      e.ocupacao_m3,
      produto.nome AS produto_nome,
      produto.codigo AS produto_codigo
    FROM posicao_estoque p
    LEFT JOIN endereco_estoque e
      ON e.posicao_id = p.id
    LEFT JOIN produto
      ON e.produto_id = produto.id
  `;

  const filtros = [];
  const valoresFiltro = [];

  if (status) {
    filtros.push("p.status = ?");
    valoresFiltro.push(status);
  }

  if (rua) {
    filtros.push("p.rua = ?");
    valoresFiltro.push(rua);
  }

  if (endereco) {
    filtros.push("p.endereco LIKE ?");
    valoresFiltro.push(`%${endereco}%`);
  }

  if (produto) {
    filtros.push("produto.nome LIKE ?");
    valoresFiltro.push(`%${produto}%`);
  }

  if (filtros.length > 0) {
    sql += " WHERE " + filtros.join(" AND ");
  }

  sql += `
    ORDER BY p.rua, p.coluna, p.nivel
    LIMIT 200
  `;

  db.query(sql, valoresFiltro, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar posições ❌");
    }

    res.json(result);
  });
});

app.get("/produtos-pendentes-enderecamento", (req, res) => {
  const sql = `
    SELECT
      p.id,
      p.nome,
      p.codigo,
      p.volume,
      p.giro,
      p.quantidade_estoque,

      IFNULL(SUM(e.quantidade_unidades), 0) AS quantidade_enderecada,

      p.quantidade_estoque - IFNULL(SUM(e.quantidade_unidades), 0) AS quantidade_pendente

    FROM produto p

    LEFT JOIN endereco_estoque e
      ON e.produto_id = p.id

    GROUP BY
      p.id,
      p.nome,
      p.codigo,
      p.volume,
      p.giro,
      p.quantidade_estoque

    HAVING quantidade_pendente > 0

    ORDER BY p.nome
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar produtos pendentes ❌");
    }

    res.json(result);
  });
});

app.get("/posicoes/sugerir/:produtoId", (req, res) => {
  const { produtoId } = req.params;

  const sqlProduto = `
    SELECT id, nome, volume, giro
    FROM produto
    WHERE id = ?
  `;

  db.query(sqlProduto, [produtoId], (err, produtoResult) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar produto ❌");
    }

    if (produtoResult.length === 0) {
      return res.status(404).send("Produto não encontrado ❌");
    }

    const produto = produtoResult[0];

    let ruaInicio = 1;
    let ruaFim = 9;

    if (produto.giro === "ALTO") {
      ruaInicio = 20;
      ruaFim = 24;
    } else if (produto.giro === "MEDIO") {
      ruaInicio = 10;
      ruaFim = 19;
    }

    const volume = Number(produto.volume || 0);

    let nivelInicio = 4;
    let nivelFim = 7;

    if (volume >= 0.006) {
      nivelInicio = 1;
      nivelFim = 3;
    }

    const sqlPosicao = `
      SELECT *
      FROM posicao_estoque
      WHERE status = 'LIVRE'
      AND rua BETWEEN ? AND ?
      AND nivel BETWEEN ? AND ?
      ORDER BY rua, coluna, nivel
      LIMIT 1
    `;

    db.query(
      sqlPosicao,
      [ruaInicio, ruaFim, nivelInicio, nivelFim],
      (err, posicaoResult) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Erro ao sugerir posição ❌");
        }

        if (posicaoResult.length === 0) {
          return res.status(404).send("Nenhuma posição livre encontrada ❌");
        }

        res.json({
          produto: produto.nome,
          giro: produto.giro,
          volume: produto.volume,
          posicao: posicaoResult[0]
        });
      }
    );
  });
});

app.get("/posicoes/resumo", (req, res) => {
  const sql = `
    SELECT
      COUNT(*) AS total,
      SUM(status = 'LIVRE') AS livres,
      SUM(status = 'OCUPADA') AS ocupadas,
      SUM(status = 'BLOQUEADA') AS bloqueadas
    FROM posicao_estoque
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar resumo das posições ❌");
    }

    res.json(result[0]);
  });
});

app.use((req, res) => {
  res.status(404).send("Rota não encontrada ❌");
});

app.listen(3000, () => {
  console.log("🚀 Servidor rodando em http://localhost:3000");
});