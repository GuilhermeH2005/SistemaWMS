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

app.use((req, res) => {
  res.status(404).send("Rota não encontrada ❌");
});

app.listen(3000, () => {
  console.log("🚀 Servidor rodando em http://localhost:3000");
});