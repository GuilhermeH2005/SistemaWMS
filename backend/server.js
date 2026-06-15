const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const multer = require("multer");
const { XMLParser } = require("fast-xml-parser");

const upload = multer({
  storage: multer.memoryStorage()
});

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

function registrarAuditoria(
  usuarioId,
  usuarioNome,
  acao,
  tabela,
  registroId,
  descricao
) {
  const sql = `
    INSERT INTO auditoria
    (
      usuario_id,
      usuario_nome,
      acao,
      tabela_afetada,
      registro_id,
      descricao
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      usuarioId || null,
      usuarioNome || "Sistema",
      acao || "AÇÃO",
      tabela || "-",
      registroId || null,
      descricao || "Sem descrição"
    ],
    (err) => {
      if (err) {
        console.error("Erro ao registrar auditoria:", err);
      }
    }
  );
}

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
   Cargo
========================= */

app.post("/cargos", (req, res) => {
  const { nome } = req.body;

  if (!nome) {
    return res.status(400).send("Nome obrigatório ❌");
  }

  db.query(
    "INSERT INTO cargo (nome) VALUES (?)",
    [nome],
    (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).send("Cargo já cadastrado ❌");
        }

        return res.status(500).send("Erro ao cadastrar cargo ❌");
      }

      res.send("Cargo cadastrado ✅");
    }
  );
});

app.get("/cargos", (req, res) => {
  db.query("SELECT * FROM cargo ORDER BY nome", (err, result) => {
    if (err) return res.status(500).send("Erro ao buscar cargos ❌");
    res.json(result);
  });
});

app.delete("/cargos/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM cargo WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).send("Erro ao excluir cargo ❌");
    res.send("Cargo excluído ✅");
  });
});


/* =========================
   CATEGORIAS DE PRODUTO
========================= */

app.post("/categorias-produto", (req, res) => {
  const { nome } = req.body;

  if (!nome) {
    return res.status(400).send("Nome da categoria obrigatório ❌");
  }

  db.query(
    "INSERT INTO categoria_produto (nome) VALUES (?)",
    [nome],
    (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).send("Categoria já cadastrada ❌");
        }

        console.error(err);
        return res.status(500).send("Erro ao cadastrar categoria ❌");
      }

      res.send("Categoria cadastrada com sucesso ✅");
    }
  );
});

app.get("/categorias-produto", (req, res) => {
  db.query(
    "SELECT * FROM categoria_produto ORDER BY nome",
    (err, result) => {
      if (err) return res.status(500).send("Erro ao buscar categorias ❌");
      res.json(result);
    }
  );
});

app.delete("/categorias-produto/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM categoria_produto WHERE id = ?", [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao excluir categoria ❌");
    }

    res.send("Categoria excluída ✅");
  });
});

/* =========================
   CORES DE PRODUTO
========================= */

app.post("/cores-produto", (req, res) => {
  const { nome } = req.body;

  if (!nome) {
    return res.status(400).send("Nome da cor obrigatório ❌");
  }

  db.query(
    "INSERT INTO cor_produto (nome) VALUES (?)",
    [nome],
    (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).send("Cor já cadastrada ❌");
        }

        console.error(err);
        return res.status(500).send("Erro ao cadastrar cor ❌");
      }

      res.send("Cor cadastrada com sucesso ✅");
    }
  );
});

app.get("/cores-produto", (req, res) => {
  db.query(
    "SELECT * FROM cor_produto ORDER BY nome",
    (err, result) => {
      if (err) return res.status(500).send("Erro ao buscar cores ❌");
      res.json(result);
    }
  );
});

app.delete("/cores-produto/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM cor_produto WHERE id = ?", [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao excluir cor ❌");
    }

    res.send("Cor excluída ✅");
  });
});

/* =========================
   PRODUTOS
========================= */

app.get("/produtos", (req, res) => {
  const sql = `
    SELECT
      produto.*,
      categoria_produto.nome AS categoria_nome,
      cor_produto.nome AS cor_nome,

      (
        SELECT fornecedor.nome
        FROM entrada_mercadoria e
        INNER JOIN fornecedor
          ON e.fornecedor_id = fornecedor.id
        WHERE e.produto_id = produto.id
        ORDER BY e.data_entrada DESC
        LIMIT 1
      ) AS fornecedor_nome

    FROM produto

    LEFT JOIN categoria_produto
      ON produto.categoria_id = categoria_produto.id

    LEFT JOIN cor_produto
      ON produto.cor_id = cor_produto.id

    ORDER BY produto.nome
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar produtos ❌");
    }

    res.json(result);
  });
});

app.post("/produtos", (req, res) => {
  const {
    nome,
    categoria_id,
    cor_id,
    altura,
    largura,
    profundidade,
    volume,
    preco_venda,
    estoque_minimo,
    giro,
    margem_lucro_percentual,
    usuario_id,
    usuario_nome
  } = req.body;

  if (!nome || !categoria_id || !cor_id) {
    return res.status(400).send("Preencha nome, categoria e cor do produto ❌");
  }

  const codigo = "SKU" + Date.now();

  const sql = `
    INSERT INTO produto
    (
      nome,
      codigo,
      categoria_id,
      cor_id,
      altura,
      largura,
      profundidade,
      volume,
      preco_venda,
      estoque_minimo,
      giro,
      margem_lucro_percentual
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      nome,
      codigo,
      categoria_id,
      cor_id,
      altura || 0,
      largura || 0,
      profundidade || 0,
      volume || 0,
      preco_venda || 0,
      estoque_minimo || 0,
      giro || "MEDIO",
      margem_lucro_percentual || 0
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao cadastrar produto ❌");
      }

     registrarAuditoria(
  usuario_id,
  usuario_nome,
  "CADASTRO",
  "produto",
  result.insertId,
  `Produto ${nome} cadastrado`
);

      res.send("Produto cadastrado com sucesso ✅");
    }
  );
});

app.put("/produto/:id/codigo-xml", (req, res) => {

  const { id } = req.params;
  const { codigo_xml } = req.body;

  if (!codigo_xml) {
    return res.status(400).send("Código XML obrigatório");
  }

  const sql = `
    UPDATE produto
    SET codigo_xml = ?
    WHERE id = ?
  `;

  db.query(sql, [codigo_xml, id], (err) => {

    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao vincular código XML");
    }

    res.send("Código XML vinculado com sucesso");
  });
});

app.put("/produtos/:id", (req, res) => {
  const { id } = req.params;

  const {
    nome,
    categoria_id,
    cor_id,
    altura,
    largura,
    profundidade,
    volume,
    preco_venda,
    estoque_minimo,
    giro,
    margem_lucro_percentual,
    usuario_id,
    usuario_nome
  } = req.body;

  if (!nome || !categoria_id || !cor_id) {
    return res.status(400).send("Preencha nome, categoria e cor do produto ❌");
  }

  const sql = `
    UPDATE produto
    SET
      nome = ?,
      categoria_id = ?,
      cor_id = ?,
      altura = ?,
      largura = ?,
      profundidade = ?,
      volume = ?,
      preco_venda = ?,
      estoque_minimo = ?,
      giro = ?,
      margem_lucro_percentual = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      nome,
      categoria_id,
      cor_id,
      altura || 0,
      largura || 0,
      profundidade || 0,
      volume || 0,
      preco_venda || 0,
      estoque_minimo || 0,
      giro || "MEDIO",
      margem_lucro_percentual || 0,
      id
    ],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao atualizar produto ❌");
      }

     registrarAuditoria(
  usuario_id,
  usuario_nome,
  "EDIÇÃO",
  "produto",
  id,
  `Produto ${nome} editado`
);

      res.send("Produto atualizado com sucesso ✅");
    }
  );
});

app.delete("/produtos/:id", (req, res) => {
  const { id } = req.params;
  const { usuario_id, usuario_nome } = req.body;

  db.query(
    "SELECT nome FROM produto WHERE id = ?",
    [id],
    (err, produtoResult) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao buscar produto ❌");
      }

      if (produtoResult.length === 0) {
        return res.status(404).send("Produto não encontrado ❌");
      }

      const nomeProduto = produtoResult[0].nome;

      db.query("DELETE FROM produto WHERE id = ?", [id], (err) => {
        if (err) {
          if (err.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(400).send("Este produto possui movimentações e não pode ser excluído ❌");
          }

          console.error(err);
          return res.status(500).send("Erro ao excluir produto ❌");
        }

        registrarAuditoria(
          usuario_id,
          usuario_nome,
          "EXCLUSÃO",
          "produto",
          id,
          `Produto ${nomeProduto} excluído`
        );

        res.send("Produto excluído com sucesso ✅");
      });
    }
  );
});

/* =========================
   FUNCIONÁRIOS
========================= */

app.post("/funcionarios", (req, res) => {
  const {
    nome, cpf, rg, telefone, email,
    rua, numero, bairro, cidade, cep, cargo,
    data_admissao, 
  } = req.body;

  if (!nome || !cpf || !telefone || !email) {
    return res.status(400).send("Preencha os campos obrigatórios ❌");
  }


  const sql = `
    INSERT INTO funcionario
    (nome, cpf, rg, telefone, email, rua, numero, bairro, cidade, cep, data_admissao, cargo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [nome, cpf, rg, telefone, email, rua, numero, bairro, cidade, cep, data_admissao, cargo],
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
  const sql = `
    SELECT
      funcionario.*,
      cargo.nome AS cargo_nome
    FROM funcionario
    LEFT JOIN cargo
      ON funcionario.cargo_id = cargo.id
    ORDER BY funcionario.nome
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar funcionários ❌");
    }

    res.json(result);
  });
});

app.put("/funcionarios/:id", (req, res) => {
  const { id } = req.params;

  const {
    nome, cpf, rg, telefone, email,
    rua, numero, bairro, cidade, cep, cargo,
    data_admissao
  } = req.body;

  const sql = `
    UPDATE funcionario
    SET nome=?, cpf=?, rg=?, telefone=?, email=?, rua=?, numero=?, bairro=?, cidade=?, cep=?, data_admissao=?, cargo=?
    WHERE id=?
  `;

  db.query(
    sql,
    [nome, cpf, rg, telefone, email, rua, numero, bairro, cidade, cep, data_admissao, cargo, id],
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
    fornecedor_id,
    numero_nf,
    serie_nf,
    data_nf,
    usuario_id,
    usuario_nome,
    itens
  } = req.body;

  if (!fornecedor_id || !numero_nf || !data_nf || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).send("Preencha os dados da NF ❌");
  }

  for (const item of itens) {
    if (!item.produto_id || !item.quantidade || item.quantidade <= 0) {
      return res.status(400).send("Existe item inválido na NF ❌");
    }
  }

  const sqlVerifica = `
    SELECT id 
    FROM entrada_mercadoria
    WHERE fornecedor_id = ?
      AND numero_nf = ?
      AND IFNULL(serie_nf, '') = IFNULL(?, '')
    LIMIT 1
  `;

  db.query(sqlVerifica, [fornecedor_id, numero_nf, serie_nf || null], (err, existe) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao verificar NF ❌");
    }

    if (existe.length > 0) {
      return res.status(400).send("Essa NF já foi registrada para este fornecedor ❌");
    }

    db.beginTransaction((err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao iniciar transação ❌");
      }

      const sqlEntrada = `
        INSERT INTO entrada_mercadoria
        (
          fornecedor_id,
          produto_id,
          quantidade,
          quantidade_disponivel,
          numero_nf,
          serie_nf,
          data_nf,
          lote,
          validade,
          peso_unitario,
          custo_unitario_sem_imposto,
          icms_percentual,
          ipi_percentual,
          pis_percentual,
          cofins_percentual,
          frete,
          seguro,
          outras_despesas,
          subtotal,
          valor_impostos,
          custo_total_com_imposto,
          custo_unitario_com_imposto,
          status_conferencia,
          usuario_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDENTE', ?)
      `;

      const valores = itens.map(item => [
        fornecedor_id,
        item.produto_id,
        item.quantidade,
        item.quantidade,
        numero_nf,
        serie_nf || null,
        data_nf,
        item.lote || null,
        item.validade || null,
        item.peso_unitario || 0,
        item.custo_unitario_sem_imposto || 0,
        item.icms_percentual || 0,
        item.ipi_percentual || 0,
        item.pis_percentual || 0,
        item.cofins_percentual || 0,
        item.frete || 0,
        item.seguro || 0,
        item.outras_despesas || 0,
        item.subtotal || 0,
        item.valor_impostos || 0,
        item.custo_total_com_imposto || 0,
        item.custo_unitario_com_imposto || 0,
        usuario_id || null
      ]);

      let concluidos = 0;

      valores.forEach(v => {
        db.query(sqlEntrada, v, (err) => {
          if (err) {
            console.error(err);

            return db.rollback(() => {
              res.status(500).send("Erro ao registrar item da NF ❌");
            });
          }

          concluidos++;

          if (concluidos === valores.length) {
            registrarAuditoria(
              usuario_id,
              usuario_nome,
              "ENTRADA NF",
              "entrada_mercadoria",
              null,
              `NF ${numero_nf} registrada com ${itens.length} item(ns), aguardando conferência`
            );

            db.commit((err) => {
              if (err) {
                console.error(err);

                return db.rollback(() => {
                  res.status(500).send("Erro ao finalizar entrada da NF ❌");
                });
              }

              res.send("Entrada de NF registrada com sucesso. Aguardando conferência ✅");
            });
          }
        });
      });
    });
  });
});

app.post("/importar-xml-nfe", upload.single("xml"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("Nenhum XML enviado ❌");
  }

  try {
    const xmlString = req.file.buffer.toString("utf8");

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: ""
    });

    const xml = parser.parse(xmlString);

    const nfe =
      xml.nfeProc?.NFe?.infNFe ||
      xml.NFe?.infNFe ||
      xml.infNFe;

    if (!nfe) {
      return res.status(400).send("XML de NF-e inválido ❌");
    }

    const ide = nfe.ide || {};
    const emit = nfe.emit || {};
    const det = Array.isArray(nfe.det) ? nfe.det : [nfe.det];

    const numero_nf = ide.nNF || "";
    const serie_nf = ide.serie || "";
    const dataOriginal = ide.dhEmi || ide.dEmi || "";

    const data_nf = formatarDataXMLParaBR(dataOriginal);

    const cnpjFornecedor = emit.CNPJ || "";
    const nomeFornecedor = emit.xNome || "";

    const itens = det.map(item => {
      const prod = item.prod || {};
      const imposto = item.imposto || {};

      const icmsObj = imposto.ICMS
        ? Object.values(imposto.ICMS)[0]
        : {};

      const ipiObj = imposto.IPI?.IPITrib || {};
      const pisObj = imposto.PIS
        ? Object.values(imposto.PIS)[0]
        : {};
      const cofinsObj = imposto.COFINS
        ? Object.values(imposto.COFINS)[0]
        : {};

      const quantidade = Number(prod.qCom || 0);
      const custoUnitario = Number(prod.vUnCom || 0);
      const subtotal = Number(prod.vProd || quantidade * custoUnitario);

      const icms_percentual = Number(icmsObj?.pICMS || 0);
      const ipi_percentual = Number(ipiObj?.pIPI || 0);
      const pis_percentual = Number(pisObj?.pPIS || 0);
      const cofins_percentual = Number(cofinsObj?.pCOFINS || 0);

      const valor_impostos =
        Number(icmsObj?.vICMS || 0) +
        Number(ipiObj?.vIPI || 0) +
        Number(pisObj?.vPIS || 0) +
        Number(cofinsObj?.vCOFINS || 0);

     const custo_total_com_imposto = Number(prod.vProd || subtotal);

const custo_unitario_com_imposto =
  quantidade > 0 ? custo_total_com_imposto / quantidade : 0;

      return {
        codigo_produto_xml: prod.cProd || "",
        ean: prod.cEAN || "",
        produto_nome_xml: prod.xProd || "",
        quantidade,
        peso_unitario: 0,
        custo_unitario_sem_imposto: custoUnitario,
        icms_percentual,
        ipi_percentual,
        pis_percentual,
        cofins_percentual,
        frete: 0,
        seguro: 0,
        outras_despesas: 0,
        subtotal,
        valor_impostos,
        custo_total_com_imposto,
        custo_unitario_com_imposto,
        lote: null,
        validade: null
      };
    });

    const sqlFornecedor = `
      SELECT id, nome, cnpj
      FROM fornecedor
      WHERE cnpj = ?
      LIMIT 1
    `;

    db.query(sqlFornecedor, [cnpjFornecedor], (err, fornecedores) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao buscar fornecedor do XML ❌");
      }

      const fornecedorEncontrado = fornecedores[0] || null;

      res.json({
        numero_nf,
        serie_nf,
        data_nf,
        fornecedor: {
          id: fornecedorEncontrado ? fornecedorEncontrado.id : null,
          nome: nomeFornecedor,
          cnpj: cnpjFornecedor
        },
        itens
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao importar XML da NF-e ❌");
  }
});

function formatarDataXMLParaBR(dataXML) {
  if (!dataXML) return "";

  const data = dataXML.substring(0, 10);

  const partes = data.split("-");

  if (partes.length !== 3) return "";

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

app.get("/entradas", (req, res) => {
  const sql = `
    SELECT
      e.*,
      DATE_FORMAT(e.data_nf, '%d/%m/%Y') AS data_nf_formatada,
      p.nome AS produto_nome,
      p.codigo AS produto_codigo,
      f.nome AS fornecedor_nome,
      u.login AS usuario_nome
    FROM entrada_mercadoria e

    INNER JOIN produto p
      ON e.produto_id = p.id

    LEFT JOIN fornecedor f
      ON e.fornecedor_id = f.id

    LEFT JOIN usuario u
      ON e.usuario_id = u.id

    ORDER BY e.data_entrada DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar entradas de NF ❌");
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
  funcionario.cargo AS cargo,
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
      funcionario.cargo AS cargo,
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

app.put("/usuarios/:id/trocar-senha", (req, res) => {
  const { id } = req.params;
  const { novaSenha } = req.body;

  if (!novaSenha) {
    return res.status(400).send("Informe a nova senha.");
  }

  const sql = `
    UPDATE usuario
    SET senha = ?
    WHERE id = ?
  `;

  db.query(sql, [novaSenha, id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao alterar senha.");
    }

    res.send("Senha alterada com sucesso ✅");
  });
});


app.get("/usuarios/:id/dados-senha", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT id, login, senha
    FROM usuario
    WHERE id = ?
  `;

  db.query(sql, [id], (err, resultado) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar dados do usuário.");
    }

    if (resultado.length === 0) {
      return res.status(404).send("Usuário não encontrado.");
    }

    res.json(resultado[0]);
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
    usuario_nome,
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

registrarAuditoria(
  usuario_id,
  usuario_nome,
  "AJUSTE_ESTOQUE",
  "ajuste_estoque",
  ajusteId,
  descricao
);

res.status(201).json({
  mensagem: "Ajuste de estoque realizado com sucesso.",
  ajuste_id: ajusteId,
  estoque_anterior: estoqueAnterior,
  quantidade_ajustada: quantidadeAjustada,
  estoque_novo: novoEstoque
});
        }
      );
    });
  });
});

/* =========================
   AUDITORIA
========================= */

app.get("/auditoria", (req, res) => {
  const {
    busca,
    tabela,
    acao,
    usuario,
    data_inicio,
    data_fim,
    limite
  } = req.query;

  let sql = `
    SELECT
      a.*,

      CASE
        WHEN a.tabela_afetada = 'produto'
          THEN p.nome

        WHEN a.tabela_afetada = 'cliente'
          THEN c.razao_social

        WHEN a.tabela_afetada = 'fornecedor'
          THEN f.nome

        WHEN a.tabela_afetada = 'usuario'
          THEN u.login

        WHEN a.tabela_afetada = 'entrada_mercadoria'
          THEN CONCAT('NF ', em.numero_nf)

        WHEN a.tabela_afetada = 'divergencia_conferencia'
          THEN CONCAT('Divergência NF ', dc.numero_nf)

        ELSE NULL
      END AS registro_nome

    FROM auditoria a

    LEFT JOIN produto p
      ON a.tabela_afetada = 'produto'
      AND a.registro_id = p.id

    LEFT JOIN cliente c
      ON a.tabela_afetada = 'cliente'
      AND a.registro_id = c.id

    LEFT JOIN fornecedor f
      ON a.tabela_afetada = 'fornecedor'
      AND a.registro_id = f.id

    LEFT JOIN usuario u
      ON a.tabela_afetada = 'usuario'
      AND a.registro_id = u.id

    LEFT JOIN entrada_mercadoria em
      ON a.tabela_afetada = 'entrada_mercadoria'
      AND a.registro_id = em.id

    LEFT JOIN divergencia_conferencia dc
      ON a.tabela_afetada = 'divergencia_conferencia'
      AND a.registro_id = dc.id

    WHERE 1 = 1
  `;

  const valores = [];

  if (busca) {
    sql += `
      AND (
        a.descricao LIKE ?
        OR a.tabela_afetada LIKE ?
        OR a.acao LIKE ?
        OR a.usuario_nome LIKE ?
      )
    `;

    valores.push(
      `%${busca}%`,
      `%${busca}%`,
      `%${busca}%`,
      `%${busca}%`
    );
  }

  if (tabela && tabela !== "TODAS") {
    sql += ` AND a.tabela_afetada = ? `;
    valores.push(tabela);
  }

  if (acao && acao !== "TODAS") {
    sql += ` AND a.acao = ? `;
    valores.push(acao);
  }

  if (usuario) {
    sql += ` AND a.usuario_nome LIKE ? `;
    valores.push(`%${usuario}%`);
  }

  if (data_inicio) {
    sql += ` AND DATE(a.data_hora) >= ? `;
    valores.push(data_inicio);
  }

  if (data_fim) {
    sql += ` AND DATE(a.data_hora) <= ? `;
    valores.push(data_fim);
  }

  sql += ` ORDER BY a.data_hora DESC `;

  if (limite) {
    sql += ` LIMIT ? `;
    valores.push(Number(limite));
  }

  db.query(sql, valores, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar auditoria ❌");
    }

    res.json(result);
  });
});

/* =========================
   CONFERÊNCIA
========================= */

app.put("/conferencia/:id", (req, res) => {
  const { id } = req.params;

  const {
    quantidade_conferida,
    motivo,
    justificativa,
    usuario_id,
    usuario_nome
  } = req.body;

  if (quantidade_conferida === undefined || quantidade_conferida === null) {
    return res.status(400).send("Informe a quantidade conferida ❌");
  }

  const sqlBusca = `
    SELECT *
    FROM entrada_mercadoria
    WHERE id = ?
  `;

  db.query(sqlBusca, [id], (err, resultado) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar entrada ❌");
    }

    if (resultado.length === 0) {
      return res.status(404).send("Entrada não encontrada ❌");
    }

    const entrada = resultado[0];

    const qtdNF = Number(entrada.quantidade || 0);
    const qtdConferida = Number(quantidade_conferida || 0);
    const diferenca = qtdConferida - qtdNF;

    const temDivergencia = diferenca !== 0;

    if (temDivergencia && (!motivo || !justificativa)) {
      return res.status(400).send(
        "Motivo e justificativa são obrigatórios para divergência ❌"
      );
    }

    const statusConferencia =
      temDivergencia ? "DIVERGENTE" : "CONFERIDO";

    const statusDivergencia =
      temDivergencia ? "ABERTA" : null;

    const custoSemImposto =
      Number(entrada.custo_unitario_sem_imposto || 0);

    const custoComImposto =
      Number(entrada.custo_unitario_com_imposto || 0);

    db.beginTransaction((err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao iniciar conferência ❌");
      }

      const sqlAtualizaEntrada = `
        UPDATE entrada_mercadoria
        SET
          quantidade_conferida = ?,
          quantidade_disponivel = ?,
          status_conferencia = ?,
          motivo_divergencia = ?,
          justificativa_divergencia = ?,
          status_divergencia = ?
        WHERE id = ?
      `;

      db.query(
        sqlAtualizaEntrada,
        [
          qtdConferida,
          qtdConferida,
          statusConferencia,
          motivo || null,
          justificativa || null,
          statusDivergencia,
          id
        ],
        (err) => {
          if (err) {
            console.error(err);

            return db.rollback(() => {
              res.status(500).send("Erro ao atualizar conferência ❌");
            });
          }

          const sqlProdutoAtual = `
           SELECT
  quantidade_estoque,
  custo_medio,
  margem_lucro_percentual
FROM produto
WHERE id = ?
          `;

          db.query(sqlProdutoAtual, [entrada.produto_id], (err, produtoResult) => {
            if (err) {
              console.error(err);

              return db.rollback(() => {
                res.status(500).send("Erro ao buscar produto ❌");
              });
            }

            if (produtoResult.length === 0) {
              return db.rollback(() => {
                res.status(404).send("Produto não encontrado ❌");
              });
            }

            const produtoAtual = produtoResult[0];

            const estoqueAtual =
              Number(produtoAtual.quantidade_estoque || 0);

            const custoMedioAtual =
              Number(produtoAtual.custo_medio || 0);

          const margemAtual =
  Number(produtoAtual.margem_lucro_percentual || 0);

            const novoEstoque =
              estoqueAtual + qtdConferida;

            let novoCustoMedio = custoComImposto;

            if (novoEstoque > 0) {
              novoCustoMedio =
                (
                  (estoqueAtual * custoMedioAtual) +
                  (qtdConferida * custoComImposto)
                ) / novoEstoque;
            }

          const novoPrecoVenda =
  custoComImposto + (custoComImposto * margemAtual / 100);

            const sqlAtualizaProduto = `
              UPDATE produto
              SET
                quantidade_estoque = ?,
                ultimo_custo_sem_imposto = ?,
                ultimo_custo_com_imposto = ?,
             custo_medio = ?,
              preco_venda = ?
              WHERE id = ?
            `;

            db.query(
              sqlAtualizaProduto,
              [
                novoEstoque,
                custoSemImposto,
                custoComImposto,
               novoCustoMedio,
                novoPrecoVenda,
                entrada.produto_id
              ],
              (err) => {
                if (err) {
                  console.error(err);

                  return db.rollback(() => {
                    res.status(500).send("Erro ao atualizar estoque e custos ❌");
                  });
                }

                if (!temDivergencia) {
                  registrarAuditoria(
                    usuario_id,
                    usuario_nome,
                    "CONFERÊNCIA",
                    "entrada_mercadoria",
                    id,
                    `Item da NF ${entrada.numero_nf} conferido sem divergência. Quantidade: ${qtdConferida}. Custo sem imposto: R$ ${custoSemImposto.toFixed(2)}. Custo com imposto: R$ ${custoComImposto.toFixed(2)}. Custo médio atualizado: R$ ${novoCustoMedio.toFixed(2)}. Margem atualizada: ${margemLucro.toFixed(2)}%.`
                  );

                  return db.commit((err) => {
                    if (err) {
                      return db.rollback(() => {
                        res.status(500).send("Erro ao finalizar conferência ❌");
                      });
                    }

                    res.send("Item conferido com sucesso ✅");
                  });
                }

                const sqlDivergencia = `
                  INSERT INTO divergencia_conferencia
                  (
                    entrada_id,
                    produto_id,
                    numero_nf,
                    quantidade_nf,
                    quantidade_conferida,
                    diferenca,
                    motivo,
                    justificativa,
                    status,
                    usuario_id
                  )
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ABERTA', ?)
                `;

                db.query(
                  sqlDivergencia,
                  [
                    id,
                    entrada.produto_id,
                    entrada.numero_nf,
                    qtdNF,
                    qtdConferida,
                    diferenca,
                    motivo,
                    justificativa,
                    usuario_id || null
                  ],
                  (err) => {
                    if (err) {
                      console.error(err);

                      return db.rollback(() => {
                        res.status(500).send("Erro ao registrar divergência ❌");
                      });
                    }

                    registrarAuditoria(
                      usuario_id,
                      usuario_nome,
                      "DIVERGÊNCIA CONFERÊNCIA",
                      "entrada_mercadoria",
                      id,
                      `NF ${entrada.numero_nf}: quantidade NF ${qtdNF}, conferida ${qtdConferida}, diferença ${diferenca}. Motivo: ${motivo}. Justificativa: ${justificativa}. Estoque atualizado com quantidade conferida. Custo médio atualizado: R$ ${novoCustoMedio.toFixed(2)}.`
                    );

                    db.commit((err) => {
                      if (err) {
                        return db.rollback(() => {
                          res.status(500).send("Erro ao finalizar divergência ❌");
                        });
                      }

                      res.send("Divergência registrada com sucesso ✅");
                    });
                  }
                );
              }
            );
          });
        }
      );
    });
  });
});

app.get("/conferencia", (req, res) => {
  const sql = `
    SELECT
      e.*,
      DATE_FORMAT(e.data_nf, '%d/%m/%Y') AS data_nf_formatada,
      p.nome AS produto_nome,
      p.codigo AS produto_codigo,
      f.nome AS fornecedor_nome
    FROM entrada_mercadoria e

    INNER JOIN produto p
      ON e.produto_id = p.id

    LEFT JOIN fornecedor f
      ON e.fornecedor_id = f.id

    WHERE
      e.status_conferencia = 'PENDENTE'
      OR e.status_conferencia = 'DIVERGENTE'
      OR e.status_divergencia IS NOT NULL

    ORDER BY e.data_entrada DESC
  `;

  db.query(sql, (err, resultado) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar conferência ❌");
    }

    res.json(resultado);
  });
});

app.get("/divergencias-conferencia", (req, res) => {
  const sql = `
    SELECT
      d.*,
      p.nome AS produto_nome,
      p.codigo AS produto_codigo,
      e.lote,
      e.validade,
      f.nome AS fornecedor_nome
    FROM divergencia_conferencia d
    INNER JOIN produto p ON d.produto_id = p.id
    INNER JOIN entrada_mercadoria e ON d.entrada_id = e.id
    LEFT JOIN fornecedor f ON e.fornecedor_id = f.id
    ORDER BY d.data_registro DESC
  `;

  db.query(sql, (err, resultado) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar divergências ❌");
    }

    res.json(resultado);
  });
});

app.put("/divergencias-conferencia/:id/resolver", (req, res) => {
  const { id } = req.params;

  const {
    tipo_resolucao,
    observacao_resolucao,
    usuario_id,
    usuario_nome
  } = req.body;

  if (!tipo_resolucao || !observacao_resolucao) {
    return res.status(400).send("Informe o tipo e a observação da resolução ❌");
  }

  const statusPermitidos = [
    "AGUARDANDO_COMPLEMENTO",
    "DEVOLUCAO",
    "ABATIMENTO",
    "RESOLVIDA"
  ];

  if (!statusPermitidos.includes(tipo_resolucao)) {
    return res.status(400).send("Tipo de resolução inválido ❌");
  }

  const sqlBusca = `
    SELECT *
    FROM divergencia_conferencia
    WHERE id = ?
  `;

  db.query(sqlBusca, [id], (err, resultado) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar divergência ❌");
    }

    if (resultado.length === 0) {
      return res.status(404).send("Divergência não encontrada ❌");
    }

    const divergencia = resultado[0];

    const novoStatus =
      tipo_resolucao === "AGUARDANDO_COMPLEMENTO"
        ? "AGUARDANDO_COMPLEMENTO"
        : "RESOLVIDA";

    db.beginTransaction((err) => {
      if (err) {
        return res.status(500).send("Erro ao iniciar resolução ❌");
      }

      const sqlAtualizaDivergencia = `
        UPDATE divergencia_conferencia
        SET
          status = ?,
          data_resolucao = CASE
            WHEN ? = 'RESOLVIDA' THEN NOW()
            ELSE data_resolucao
          END,
          observacao_resolucao = ?
        WHERE id = ?
      `;

      db.query(
        sqlAtualizaDivergencia,
        [
          novoStatus,
          novoStatus,
          observacao_resolucao,
          id
        ],
        (err) => {
          if (err) {
            console.error(err);
            return db.rollback(() => {
              res.status(500).send("Erro ao atualizar divergência ❌");
            });
          }

          const statusEntrada =
            novoStatus === "RESOLVIDA" ? "CONFERIDO" : "DIVERGENTE";

          const statusDivergenciaEntrada =
            novoStatus === "RESOLVIDA" ? "RESOLVIDA" : "AGUARDANDO_COMPLEMENTO";

          const sqlAtualizaEntrada = `
            UPDATE entrada_mercadoria
            SET
              status_conferencia = ?,
              status_divergencia = ?
            WHERE id = ?
          `;

          db.query(
            sqlAtualizaEntrada,
            [
              statusEntrada,
              statusDivergenciaEntrada,
              divergencia.entrada_id
            ],
            (err) => {
              if (err) {
                console.error(err);
                return db.rollback(() => {
                  res.status(500).send("Erro ao atualizar entrada ❌");
                });
              }

              registrarAuditoria(
                usuario_id,
                usuario_nome,
                "RESOLUÇÃO DIVERGÊNCIA",
                "divergencia_conferencia",
                id,
                `Divergência da NF ${divergencia.numero_nf} atualizada para ${novoStatus}. Resolução: ${tipo_resolucao}. Observação: ${observacao_resolucao}`
              );

              db.commit((err) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).send("Erro ao finalizar resolução ❌");
                  });
                }

                res.send("Divergência atualizada com sucesso ✅");
              });
            }
          );
        }
      );
    });
  });
});

/* =========================
  ROTA DIVERGENCIAS
========================= */

app.get("/divergencias", (req, res) => {
  const busca = req.query.busca || "";
  const status = req.query.status || "TODOS";

  let sql = `
    SELECT
      e.*,
      p.nome AS produto_nome,
      p.codigo AS produto_codigo,
      f.nome AS fornecedor_nome
    FROM entrada_mercadoria e
    INNER JOIN produto p
      ON e.produto_id = p.id
    LEFT JOIN fornecedor f
      ON e.fornecedor_id = f.id
    WHERE
      e.status_conferencia = 'DIVERGENTE'
      OR e.status_divergencia IS NOT NULL
  `;

  const valores = [];

  if (busca) {
    sql += `
      AND (
        e.numero_nf LIKE ?
        OR p.nome LIKE ?
        OR p.codigo LIKE ?
        OR f.nome LIKE ?
      )
    `;

    valores.push(
      `%${busca}%`,
      `%${busca}%`,
      `%${busca}%`,
      `%${busca}%`
    );
  }

  if (status !== "TODOS") {
    sql += `
      AND e.status_divergencia = ?
    `;

    valores.push(status);
  }

  sql += `
    ORDER BY e.id DESC
  `;

  db.query(sql, valores, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar divergências ❌");
    }

    res.json(result);
  });
});

app.put("/divergencias/:id", (req, res) => {
  const { id } = req.params;

  const {
    tipo,
    observacao,
    usuario_id,
    usuario_nome
  } = req.body;

  if (!tipo || !observacao) {
    return res.status(400).send("Tipo e observação são obrigatórios ❌");
  }

  const tiposPermitidos = [
  "AGUARDANDO_COMPLEMENTO",
  "DEVOLUCAO",
  "ABATIMENTO"
];

  if (!tiposPermitidos.includes(tipo)) {
    return res.status(400).send("Tipo de resolução inválido ❌");
  }

  const sqlBusca = `
    SELECT
      e.*,
      p.nome AS produto_nome
    FROM entrada_mercadoria e
    INNER JOIN produto p
      ON e.produto_id = p.id
    WHERE e.id = ?
  `;

  db.query(sqlBusca, [id], (err, resultado) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar divergência ❌");
    }

    if (resultado.length === 0) {
      return res.status(404).send("Divergência não encontrada ❌");
    }

    const item = resultado[0];


let novoStatusConferencia = "DIVERGENTE";
let novoStatusDivergencia = tipo;

if (tipo === "ABATIMENTO") {
  novoStatusConferencia = "CONFERIDO";
  novoStatusDivergencia = "RESOLVIDA";
}

if (tipo === "DEVOLUCAO") {
  novoStatusConferencia = "DIVERGENTE";
  novoStatusDivergencia = "DEVOLUCAO";
}

if (tipo === "AGUARDANDO_COMPLEMENTO") {
  novoStatusConferencia = "DIVERGENTE";
  novoStatusDivergencia = "AGUARDANDO_COMPLEMENTO";
}

    const sqlUpdate = `
      UPDATE entrada_mercadoria
      SET
        status_conferencia = ?,
        status_divergencia = ?
      WHERE id = ?
    `;

    db.query(
      sqlUpdate,
      [
        novoStatusConferencia,
        novoStatusDivergencia,
        id
      ],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Erro ao atualizar divergência ❌");
        }

        registrarAuditoria(
          usuario_id,
          usuario_nome,
          "RESOLUÇÃO DIVERGÊNCIA",
          "entrada_mercadoria",
          id,
          `NF ${item.numero_nf}, produto ${item.produto_nome}. Tipo: ${tipo}. Observação: ${observacao}`
        );

        res.send("Divergência atualizada com sucesso ✅");
      }
    );
  });
});

app.put("/divergencias/:id/complemento", (req, res) => {
  const { id } = req.params;

  const {
    quantidade_recebida,
    observacao,
    usuario_id,
    usuario_nome
  } = req.body;

  const qtdRecebida = Number(quantidade_recebida || 0);

  if (qtdRecebida <= 0) {
    return res.status(400).send("Quantidade recebida inválida ❌");
  }

  const sqlBusca = `
    SELECT
      e.*,
      p.nome AS produto_nome
    FROM entrada_mercadoria e
    INNER JOIN produto p ON e.produto_id = p.id
    WHERE e.id = ?
  `;

  db.query(sqlBusca, [id], (err, resultado) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar divergência ❌");
    }

    if (resultado.length === 0) {
      return res.status(404).send("Divergência não encontrada ❌");
    }

    const item = resultado[0];

    const qtdNF = Number(item.quantidade || 0);
    const qtdConferidaAtual = Number(item.quantidade_conferida || 0);
    const faltante = qtdNF - qtdConferidaAtual;

    if (qtdRecebida > faltante) {
      return res.status(400).send(`Quantidade maior que o faltante. Falta apenas ${faltante} ❌`);
    }

    const novaQuantidadeConferida = qtdConferidaAtual + qtdRecebida;

    const novoStatusConferencia =
      novaQuantidadeConferida >= qtdNF ? "CONFERIDO" : "DIVERGENTE";

    const novoStatusDivergencia =
      novaQuantidadeConferida >= qtdNF ? "RESOLVIDA" : "AGUARDANDO_COMPLEMENTO";

    db.beginTransaction((err) => {
      if (err) {
        return res.status(500).send("Erro ao iniciar transação ❌");
      }

      db.query(
        `
          UPDATE entrada_mercadoria
          SET
            quantidade_conferida = ?,
            quantidade_disponivel = quantidade_disponivel + ?,
            status_conferencia = ?,
            status_divergencia = ?
          WHERE id = ?
        `,
        [
          novaQuantidadeConferida,
          qtdRecebida,
          novoStatusConferencia,
          novoStatusDivergencia,
          id
        ],
        (err) => {
          if (err) {
            console.error(err);
            return db.rollback(() => {
              res.status(500).send("Erro ao atualizar entrada ❌");
            });
          }

          db.query(
            `
              UPDATE produto
              SET quantidade_estoque = quantidade_estoque + ?
              WHERE id = ?
            `,
            [
              qtdRecebida,
              item.produto_id
            ],
            (err) => {
              if (err) {
                console.error(err);
                return db.rollback(() => {
                  res.status(500).send("Erro ao atualizar estoque ❌");
                });
              }

              registrarAuditoria(
                usuario_id,
                usuario_nome,
                "RECEBIMENTO COMPLEMENTO",
                "entrada_mercadoria",
                id,
                `NF ${item.numero_nf}, produto ${item.produto_nome}. Complemento recebido: ${qtdRecebida}. Conferido: ${novaQuantidadeConferida}/${qtdNF}. Observação: ${observacao || "-"}`
              );

              db.commit((err) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).send("Erro ao finalizar complemento ❌");
                  });
                }

                res.send("Complemento recebido com sucesso ✅");
              });
            }
          );
        }
      );
    });
  });
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
    auditoria.usuario_nome AS usuario_login
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

app.get("/produtos-pendentes-enderecamento", (req, res) => {
  const sql = `
    SELECT
      p.id,
      p.nome,
      p.codigo,
      p.volume,
      p.quantidade_estoque,
      IFNULL(SUM(e.quantidade_unidades), 0) AS quantidade_enderecada,
      (
        p.quantidade_estoque - IFNULL(SUM(e.quantidade_unidades), 0)
      ) AS quantidade_pendente
    FROM produto p

    LEFT JOIN endereco_estoque e
      ON e.produto_id = p.id

    GROUP BY
      p.id,
      p.nome,
      p.codigo,
      p.volume,
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

app.get("/teste-enderecamento", (req, res) => {
  res.send("Endereçamento carregado ✅");
});

app.get("/enderecos/sugerir/:produtoId", (req, res) => {
  const { produtoId } = req.params;

  const quantidadeSolicitada = Number(req.query.quantidade || 1);

  const sqlProduto = `
    SELECT
      id,
      nome,
      volume,
      giro,
      peso
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

    const volumeUnitario = Number(produto.volume || 0);
    const pesoProduto = Number(produto.peso || 0);
    const volumeTotal = volumeUnitario * quantidadeSolicitada;

    if (!volumeUnitario || volumeUnitario <= 0) {
      return res.status(400).send("Produto sem cubagem cadastrada ❌");
    }

    let ruaInicio = 1;
    let ruaFim = 9;

    if (produto.giro === "ALTO") {
      ruaInicio = 20;
      ruaFim = 24;
    } else if (produto.giro === "MEDIO") {
      ruaInicio = 10;
      ruaFim = 19;
    }

    let nivelMaximo = 7;

    if (pesoProduto >= 30) {
      nivelMaximo = 2;
    } else if (pesoProduto >= 15) {
      nivelMaximo = 4;
    }

    const sqlSugestao = `
      SELECT
        p.id,
        p.rua,
        p.coluna,
        p.nivel,
        p.endereco,
        p.capacidade_m3,
        p.status,
        p.volume_ocupado,
        (p.capacidade_m3 - p.volume_ocupado) AS volume_disponivel,
        FLOOR((p.capacidade_m3 - p.volume_ocupado) / ?) AS capacidade_unidades
      FROM posicao_estoque p
      WHERE
        p.status = 'LIVRE'
        AND p.rua BETWEEN ? AND ?
        AND p.nivel <= ?
        AND (p.capacidade_m3 - p.volume_ocupado) >= ?
      ORDER BY
        p.nivel ASC,
        capacidade_unidades DESC,
        volume_disponivel ASC,
        p.rua ASC,
        p.coluna ASC
      LIMIT 1
    `;

    db.query(
      sqlSugestao,
      [
        volumeUnitario,
        ruaInicio,
        ruaFim,
        nivelMaximo,
        volumeUnitario
      ],
      (err, posicaoResult) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Erro ao sugerir posição ❌");
        }

        if (posicaoResult.length === 0) {
          return res
            .status(404)
            .send("Nenhuma posição disponível para pelo menos 1 unidade ❌");
        }

        const sugestao = posicaoResult[0];

        const capacidadeUnidades = Number(sugestao.capacidade_unidades || 0);

        const quantidadeSugerida = Math.min(
          quantidadeSolicitada,
          capacidadeUnidades
        );

        res.json({
          produto: produto.nome,
          giro: produto.giro,
          peso: pesoProduto,
          volume_unitario: volumeUnitario,
          volume_total_solicitado: volumeTotal,
          quantidade_solicitada: quantidadeSolicitada,
          quantidade_sugerida: quantidadeSugerida,
          quantidade_restante:
            quantidadeSolicitada - quantidadeSugerida,
          sugestao
        });
      }
    );
  });
});

app.post("/enderecos", (req, res) => {
  const {
    produto_id,
    posicao_id,
    rua,
    coluna,
    nivel,
    endereco,
    quantidade_unidades,
    observacao,
    usuario_id,
    usuario_nome
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

  if (quantidadeSolicitada > capacidadeUnidades) {
  return res.status(400).json({
    erro: `Quantidade excede a capacidade da posição. Essa posição comporta no máximo ${capacidadeUnidades} unidade(s).`
  });
}

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

          registrarAuditoria(
  usuario_id,
  usuario_nome,
  "ATUALIZAÇÃO ENDEREÇAMENTO",
  "endereco_estoque",
  enderecoAtual.id,
  `Quantidade do produto ${produto.nome} somada no endereço ${posicao.endereco}`
);

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

        registrarAuditoria(
  usuario_id,
  usuario_nome,
  "ENDEREÇAMENTO",
  "endereco_estoque",
  null,
  `Produto ${produto.nome} endereçado para ${posicao.endereco}`
);

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

      IFNULL(p.capacidade_m3, e.capacidade_m3) AS capacidade_m3,

      FLOOR(
        IFNULL(p.capacidade_m3, e.capacidade_m3) / produto.volume
      ) AS capacidade_unidades,

      e.ocupacao_m3,
      e.status,
      e.observacao,

      produto.nome AS produto_nome,
      produto.codigo AS produto_codigo

    FROM endereco_estoque e

    INNER JOIN produto
      ON e.produto_id = produto.id

    LEFT JOIN posicao_estoque p
      ON e.posicao_id = p.id

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

  const {
    usuario_id,
    usuario_nome
  } = req.body;

  const sqlBusca = `
    SELECT
      e.id,
      e.endereco,
      e.posicao_id,
      produto.nome AS produto_nome

    FROM endereco_estoque e

    INNER JOIN produto
      ON e.produto_id = produto.id

    WHERE e.id = ?
  `;

  db.query(sqlBusca, [id], (err, result) => {

    if (err) {
      console.error(err);

      return res
        .status(500)
        .send("Erro ao buscar endereçamento ❌");
    }

    if (result.length === 0) {

      return res
        .status(404)
        .send("Endereçamento não encontrado ❌");
    }

    const endereco = result[0];

    db.query(
      "DELETE FROM endereco_estoque WHERE id = ?",
      [id],
      (err) => {

        if (err) {
          console.error(err);

          return res
            .status(500)
            .send("Erro ao excluir endereçamento ❌");
        }

        if (endereco.posicao_id) {

          db.query(
            `
              UPDATE posicao_estoque
              SET status = 'LIVRE'
              WHERE id = ?
            `,
            [endereco.posicao_id]
          );

        }

        registrarAuditoria(
          usuario_id,
          usuario_nome,
          "EXCLUSÃO ENDEREÇAMENTO",
          "endereco_estoque",
          endereco.id,
          `Produto ${endereco.produto_nome} removido da posição ${endereco.endereco}`
        );

        res.send(
          "Endereçamento excluído e posição liberada ✅"
        );

      }
    );

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
   POSIÇÕES DO ARMAZÉM
========================= */

app.get("/posicoes/endereco/:endereco", (req, res) => {
  const { endereco } = req.params;

  const sql = `
    SELECT
      id,
      rua,
      coluna,
      nivel,
      endereco,
      capacidade_m3,
      status
    FROM posicao_estoque
    WHERE endereco = ?
  `;

  db.query(sql, [endereco], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar posição ❌");
    }

    if (result.length === 0) {
      return res.status(404).send("Posição não encontrada ❌");
    }

    res.json(result[0]);
  });
});

app.post("/posicoes", (req, res) => {
  const {
    rua,
    coluna,
    nivel,
    altura,
    largura,
    profundidade
  } = req.body;

  if (!rua || !coluna || !nivel || !altura || !largura || !profundidade) {
    return res.status(400).send("Preencha todos os campos da posição ❌");
  }

  const endereco =
    `R${String(rua).padStart(2, "0")}-C${String(coluna).padStart(3, "0")}-N${String(nivel).padStart(2, "0")}`;

  const capacidadeM3 =
    Number(altura) * Number(largura) * Number(profundidade);

  const sql = `
    INSERT INTO posicao_estoque
    (
      rua,
      coluna,
      nivel,
      endereco,
      altura,
      largura,
      profundidade,
      capacidade_m3,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'LIVRE')
  `;

  db.query(
    sql,
    [
      rua,
      coluna,
      nivel,
      endereco,
      altura,
      largura,
      profundidade,
      capacidadeM3
    ],
    (err) => {
      if (err) {
        console.error(err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).send("Esta posição já existe ❌");
        }

        return res.status(500).send("Erro ao cadastrar posição ❌");
      }

      res.send(`Posição ${endereco} cadastrada com sucesso ✅`);
    }
  );
});

app.post("/posicoes/gerar", (req, res) => {
  const valores = [];

  for (let rua = 1; rua <= 24; rua++) {
    for (let coluna = 1; coluna <= 20; coluna++) {
      for (let nivel = 1; nivel <= 7; nivel++) {
        const endereco =
          `R${String(rua).padStart(2, "0")}-C${String(coluna).padStart(3, "0")}-N${String(nivel).padStart(2, "0")}`;

        const altura = 1.5;
        const largura = 1.2;
        const profundidade = 1.0;
        const capacidadeM3 = altura * largura * profundidade;

        valores.push([
          rua,
          coluna,
          nivel,
          endereco,
          altura,
          largura,
          profundidade,
          capacidadeM3,
          "LIVRE"
        ]);
      }
    }
  }

  const sql = `
    INSERT IGNORE INTO posicao_estoque
    (
      rua,
      coluna,
      nivel,
      endereco,
      altura,
      largura,
      profundidade,
      capacidade_m3,
      status
    )
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
      p.altura,
      p.largura,
      p.profundidade,
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

app.put("/posicoes/:id/dimensoes", (req, res) => {
  const { id } = req.params;

  const {
    altura,
    largura,
    profundidade
  } = req.body;

  if (!altura || !largura || !profundidade) {
    return res.status(400).send("Informe altura, largura e profundidade ❌");
  }

  const capacidadeM3 =
    Number(altura) * Number(largura) * Number(profundidade);

  const sql = `
    UPDATE posicao_estoque
    SET
      altura = ?,
      largura = ?,
      profundidade = ?,
      capacidade_m3 = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      altura,
      largura,
      profundidade,
      capacidadeM3,
      id
    ],
    (err) => {
     if (err) {
  console.error(err);
  return res.status(500).send("Erro ao atualizar dimensões ❌");
}

db.query(
  `
    UPDATE endereco_estoque
    SET capacidade_m3 = ?
    WHERE posicao_id = ?
  `,
  [capacidadeM3, id]
);

res.send("Dimensões da posição atualizadas ✅");
    }
  );
});

app.get("/clientes", (req, res) => {
  const busca = req.query.busca || "";

  let sql = `
    SELECT *
    FROM cliente
  `;

  const valores = [];

  if (busca) {
    sql += `
      WHERE
        id LIKE ?
        OR razao_social LIKE ?
        OR nome_fantasia LIKE ?
        OR cnpj LIKE ?
    `;

    valores.push(
      `%${busca}%`,
      `%${busca}%`,
      `%${busca}%`,
      `%${busca}%`
    );
  }

  sql += `
    ORDER BY id DESC
  `;

  db.query(sql, valores, (err, resultado) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar clientes ❌");
    }

    res.json(resultado);
  });
});

app.post("/clientes", (req, res) => {
  const {
    razao_social,
    nome_fantasia,
    cnpj,
    inscricao_estadual,
    telefone,
    email,
    cep,
    rua,
    numero,
    bairro,
    cidade,
    estado,
    usuario_id,
    usuario_nome
  } = req.body;

  if (!razao_social || !cnpj) {
    return res.status(400).send("Razão social e CNPJ são obrigatórios ❌");
  }

  const sql = `
    INSERT INTO cliente
    (
      razao_social,
      nome_fantasia,
      cnpj,
      inscricao_estadual,
      telefone,
      email,
      cep,
      rua,
      numero,
      bairro,
      cidade,
      estado,
      ativo
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'S')
  `;

  db.query(
    sql,
    [
      razao_social,
      nome_fantasia || null,
      cnpj,
      inscricao_estadual || null,
      telefone || null,
      email || null,
      cep || null,
      rua || null,
      numero || null,
      bairro || null,
      cidade || null,
      estado || null
    ],
    (err, resultado) => {
      if (err) {
        console.error(err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).send("Já existe cliente com esse CNPJ ❌");
        }

        return res.status(500).send("Erro ao cadastrar cliente ❌");
      }

      registrarAuditoria(
        usuario_id,
        usuario_nome,
        "CADASTRO",
        "cliente",
        resultado.insertId,
        `Cliente ${razao_social} cadastrado`
      );

      res.send("Cliente cadastrado com sucesso ✅");
    }
  );
});

app.put("/clientes/:id", (req, res) => {
  const { id } = req.params;

  const {
    razao_social,
    nome_fantasia,
    cnpj,
    inscricao_estadual,
    telefone,
    email,
    cep,
    rua,
    numero,
    bairro,
    cidade,
    estado,
    ativo,
    usuario_id,
    usuario_nome
  } = req.body;

  if (!razao_social || !cnpj) {
    return res.status(400).send("Razão social e CNPJ são obrigatórios ❌");
  }

  const sql = `
    UPDATE cliente
    SET
      razao_social = ?,
      nome_fantasia = ?,
      cnpj = ?,
      inscricao_estadual = ?,
      telefone = ?,
      email = ?,
      cep = ?,
      rua = ?,
      numero = ?,
      bairro = ?,
      cidade = ?,
      estado = ?,
      ativo = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      razao_social,
      nome_fantasia || null,
      cnpj,
      inscricao_estadual || null,
      telefone || null,
      email || null,
      cep || null,
      rua || null,
      numero || null,
      bairro || null,
      cidade || null,
      estado || null,
      ativo || "S",
      id
    ],
    (err) => {
      if (err) {
        console.error(err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).send("Já existe cliente com esse CNPJ ❌");
        }

        return res.status(500).send("Erro ao atualizar cliente ❌");
      }

      registrarAuditoria(
        usuario_id,
        usuario_nome,
        "EDIÇÃO",
        "cliente",
        id,
        `Cliente ${razao_social} atualizado`
      );

      res.send("Cliente atualizado com sucesso ✅");
    }
  );
});

app.delete("/clientes/:id", (req, res) => {
  const { id } = req.params;
  const { usuario_id, usuario_nome } = req.body;

  const sql = `
    UPDATE cliente
    SET ativo = 'N'
    WHERE id = ?
  `;

  db.query(sql, [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao desativar cliente ❌");
    }

    registrarAuditoria(
      usuario_id,
      usuario_nome,
      "EXCLUSÃO",
      "cliente",
      id,
      `Cliente ID ${id} desativado`
    );

    res.send("Cliente desativado com sucesso ✅");
  });
});

app.use((req, res) => {
  res.status(404).send("Rota não encontrada ❌");
});

app.listen(3000, () => {
  console.log("🚀 Servidor rodando em http://localhost:3000");
});