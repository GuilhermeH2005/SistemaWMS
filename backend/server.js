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

    if (qtdConferida < 0) {
      return res.status(400).send("Quantidade conferida inválida ❌");
    }

    if (temDivergencia && (!motivo || !justificativa)) {
      return res.status(400).send(
        "Motivo e justificativa são obrigatórios para divergência ❌"
      );
    }

    const statusConferencia = temDivergencia ? "DIVERGENTE" : "CONFERIDO";
    const statusDivergencia = temDivergencia ? "ABERTA" : null;

    const custoSemImposto = Number(entrada.custo_unitario_sem_imposto || 0);
    const custoComImposto = Number(entrada.custo_unitario_com_imposto || 0);

    db.beginTransaction((err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao iniciar conferência ❌");
      }

      const sqlAtualizaEntrada = `
        UPDATE entrada_mercadoria
        SET
          quantidade_conferida = ?,
          quantidade_disponivel = 0,
          quantidade_enderecada = 0,
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

            const estoqueAtual = Number(produtoAtual.quantidade_estoque || 0);
            const custoMedioAtual = Number(produtoAtual.custo_medio || 0);
            const margemAtual = Number(produtoAtual.margem_lucro_percentual || 0);

            const novoEstoque = estoqueAtual + qtdConferida;

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
                ultimo_custo_sem_imposto = ?,
                ultimo_custo_com_imposto = ?,
                custo_medio = ?,
                preco_venda = ?
              WHERE id = ?
            `;

            db.query(
              sqlAtualizaProduto,
              [
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
                    res.status(500).send("Erro ao atualizar custos ❌");
                  });
                }

                if (!temDivergencia) {
                  registrarAuditoria(
                    usuario_id,
                    usuario_nome,
                    "CONFERÊNCIA",
                    "entrada_mercadoria",
                    id,
                    `Item da NF ${entrada.numero_nf} conferido sem divergência. Quantidade: ${qtdConferida}. Custo sem imposto: R$ ${custoSemImposto.toFixed(2)}. Custo com imposto: R$ ${custoComImposto.toFixed(2)}. Custo médio atualizado: R$ ${novoCustoMedio.toFixed(2)}. Margem atual: ${margemAtual.toFixed(2)}%.`
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
                      `NF ${entrada.numero_nf}: quantidade NF ${qtdNF}, conferida ${qtdConferida}, diferença ${diferenca}. Motivo: ${motivo}. Justificativa: ${justificativa}. Estoque ainda não liberado para picking; será liberado no endereçamento. Custo médio atualizado: R$ ${novoCustoMedio.toFixed(2)}.`
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
      f.nome AS fornecedor_nome,
      e.tipo_entrada
    FROM entrada_mercadoria e

    INNER JOIN produto p
      ON e.produto_id = p.id

    LEFT JOIN fornecedor f
      ON e.fornecedor_id = f.id

    WHERE
      e.status_conferencia = 'PENDENTE'
      OR (
        e.status_conferencia = 'DIVERGENTE'
        AND e.status_divergencia IN ('ABERTA', 'AGUARDANDO_COMPLEMENTO', 'DEVOLUCAO')
      )

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
  const status = req.query.status || "ABERTAS";

  let sql = `
   SELECT
  d.id,
  d.entrada_id,
  d.produto_id,
  d.numero_nf,

  d.quantidade_nf AS quantidade,
  d.quantidade_conferida,
  d.diferenca,

  d.motivo AS motivo_divergencia,
  d.justificativa AS justificativa_divergencia,
  d.status AS status_divergencia,

  d.data_registro,
  d.data_resolucao,
  d.observacao_resolucao,

  p.nome AS produto_nome,
  p.codigo AS produto_codigo,

  f.id AS fornecedor_id,
  f.nome AS fornecedor_nome

    FROM divergencia_conferencia d

    INNER JOIN produto p
      ON d.produto_id = p.id

    INNER JOIN entrada_mercadoria e
      ON d.entrada_id = e.id

    LEFT JOIN fornecedor f
      ON e.fornecedor_id = f.id

    WHERE 1 = 1
  `;

  const valores = [];

  if (status === "ABERTAS") {
    sql += `
      AND d.status IN ('ABERTA', 'AGUARDANDO_COMPLEMENTO', 'DEVOLUCAO')
    `;
  } else if (status === "RESOLVIDAS") {
    sql += `
      AND d.status = 'RESOLVIDA'
    `;
  } else if (status !== "TODOS") {
    sql += `
      AND d.status = ?
    `;
    valores.push(status);
  }

  if (busca) {
    sql += `
      AND (
        d.numero_nf LIKE ?
        OR p.nome LIKE ?
        OR p.codigo LIKE ?
        OR f.nome LIKE ?
        OR d.motivo LIKE ?
      )
    `;

    valores.push(
      `%${busca}%`,
      `%${busca}%`,
      `%${busca}%`,
      `%${busca}%`,
      `%${busca}%`
    );
  }

  sql += `
    ORDER BY d.data_registro DESC, d.id DESC
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
      d.*,
      e.id AS entrada_id,
      e.numero_nf,
      p.nome AS produto_nome
    FROM divergencia_conferencia d

    INNER JOIN entrada_mercadoria e
      ON d.entrada_id = e.id

    INNER JOIN produto p
      ON d.produto_id = p.id

    WHERE d.id = ?
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

    let novoStatusDivergencia = tipo;
    let novoStatusEntrada = tipo;

    if (tipo === "ABATIMENTO") {
      novoStatusDivergencia = "RESOLVIDA";
      novoStatusEntrada = "RESOLVIDA";
    }

    if (tipo === "DEVOLUCAO") {
      novoStatusDivergencia = "DEVOLUCAO";
      novoStatusEntrada = "DEVOLUCAO";
    }

    if (tipo === "AGUARDANDO_COMPLEMENTO") {
      novoStatusDivergencia = "AGUARDANDO_COMPLEMENTO";
      novoStatusEntrada = "AGUARDANDO_COMPLEMENTO";
    }

    db.beginTransaction((err) => {
      if (err) {
        return res.status(500).send("Erro ao iniciar divergência ❌");
      }

      db.query(
        `
          UPDATE divergencia_conferencia
          SET
            status = ?,
            observacao_resolucao = ?,
            data_resolucao = CASE
              WHEN ? = 'RESOLVIDA' THEN NOW()
              ELSE data_resolucao
            END
          WHERE id = ?
        `,
        [
          novoStatusDivergencia,
          observacao,
          novoStatusDivergencia,
          id
        ],
        (err) => {
          if (err) {
            console.error(err);
            return db.rollback(() => {
              res.status(500).send("Erro ao atualizar divergência ❌");
            });
          }

          db.query(
            `
              UPDATE entrada_mercadoria
              SET
                status_conferencia = ?,
                status_divergencia = ?
              WHERE id = ?
            `,
            [
              novoStatusEntrada === "RESOLVIDA" ? "CONFERIDO" : "DIVERGENTE",
              novoStatusEntrada,
              item.entrada_id
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
                `NF ${item.numero_nf}, produto ${item.produto_nome}. Tipo: ${tipo}. Status: ${novoStatusDivergencia}. Observação: ${observacao}`
              );

              db.commit((err) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).send("Erro ao finalizar divergência ❌");
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
      (SELECT COUNT(*) FROM cliente) AS total_clientes,

      (SELECT COUNT(*) FROM entrada_mercadoria) AS total_entradas,

      (SELECT IFNULL(SUM(quantidade_estoque), 0) FROM produto) AS estoque_total,

     (SELECT IFNULL(SUM(IFNULL(quantidade_estoque, 0) * COALESCE(custo_medio, preco_venda, 0)), 0)
 FROM produto) AS valor_estoque,

      (SELECT COUNT(*)
       FROM produto
       WHERE IFNULL(quantidade_estoque, 0) <= IFNULL(estoque_minimo, 0)) AS produtos_alerta,

      (SELECT COUNT(*)
       FROM entrada_mercadoria
       WHERE status_conferencia = 'PENDENTE') AS conferencias_pendentes,

      (SELECT COUNT(*)
       FROM entrada_mercadoria
       WHERE status_conferencia = 'CONFERIDO'
         AND (IFNULL(quantidade_conferida, 0) - IFNULL(quantidade_enderecada, 0)) > 0) AS pendentes_enderecamento,

      (SELECT COUNT(*)
       FROM divergencia_conferencia
       WHERE status IN ('ABERTA', 'AGUARDANDO_COMPLEMENTO', 'DEVOLUCAO', 'AGUARDANDO_NF_DEVOLUCAO')) AS divergencias_abertas,

      (SELECT COUNT(*) FROM pedido_cliente WHERE status = 'ABERTO') AS pedidos_abertos,
      (SELECT COUNT(*) FROM pedido_cliente WHERE status = 'EM_PICKING') AS pedidos_picking,
      (SELECT COUNT(*) FROM pedido_cliente WHERE status = 'SEPARADO') AS pedidos_separados,
      (SELECT COUNT(*) FROM pedido_cliente WHERE status IN ('EXPEDIDO', 'EXPEDIDO_PARCIAL')) AS pedidos_expedidos,

      (SELECT COUNT(*) FROM nota_fiscal_saida WHERE status = 'TRANSMITIDA') AS notas_emitidas,
      (SELECT COUNT(*) FROM nota_fiscal_saida WHERE status = 'RASCUNHO') AS notas_rascunho,

      (SELECT IFNULL(SUM(valor_total), 0)
       FROM nota_fiscal_saida
       WHERE tipo = 'VENDA'
         AND status = 'TRANSMITIDA'
         AND MONTH(data_nf) = MONTH(CURDATE())
         AND YEAR(data_nf) = YEAR(CURDATE())) AS faturamento_mes,

      (SELECT COUNT(*) FROM auditoria) AS total_auditorias
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Erro ao buscar dashboard:", err);
      return res.status(500).json({
        erro: "Erro ao buscar dados do dashboard"
      });
    }

    res.json(result[0]);
  });
});

app.get("/dashboard/auditorias-recentes", (req, res) => {
  const sql = `
    SELECT
      acao,
      descricao,
      data_hora,
      usuario_nome AS usuario_login
    FROM auditoria
    ORDER BY data_hora DESC
    LIMIT 6
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Erro ao buscar auditorias recentes:", err);
      return res.status(500).json({
        erro: "Erro ao buscar auditorias recentes"
      });
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

      IFNULL(
        SUM(
          em.quantidade_conferida -
          IFNULL(em.quantidade_enderecada, 0)
        ),
        0
      ) AS quantidade_pendente

    FROM produto p

    INNER JOIN entrada_mercadoria em
      ON em.produto_id = p.id

    WHERE
      em.status_conferencia = 'CONFERIDO'
      AND (
        em.quantidade_conferida -
        IFNULL(em.quantidade_enderecada, 0)
      ) > 0

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
      return res
        .status(500)
        .send("Erro ao buscar produtos pendentes ❌");
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

    IFNULL(SUM(em.quantidade_conferida - IFNULL(em.quantidade_enderecada, 0)), 0) AS quantidade_pendente

  FROM produto p

  INNER JOIN entrada_mercadoria em
    ON em.produto_id = p.id

  WHERE
    p.id = ?
    AND em.status_conferencia = 'CONFERIDO'
    AND (em.quantidade_conferida - IFNULL(em.quantidade_enderecada, 0)) > 0

  GROUP BY
    p.id,
    p.nome,
    p.volume,
    p.quantidade_estoque
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

    function liberarEstoqueEnderecado(produtoId, quantidade, callback) {
  const sqlEntradas = `
    SELECT
      id,
      quantidade_conferida,
      IFNULL(quantidade_enderecada, 0) AS quantidade_enderecada
    FROM entrada_mercadoria
    WHERE
      produto_id = ?
      AND status_conferencia = 'CONFERIDO'
      AND (quantidade_conferida - IFNULL(quantidade_enderecada, 0)) > 0
    ORDER BY
      data_nf ASC,
      id ASC
  `;

  db.query(sqlEntradas, [produtoId], (err, entradas) => {
    if (err) return callback(err);

    let restante = Number(quantidade);
    const updates = [];

    for (const entrada of entradas) {
      if (restante <= 0) break;

      const pendenteEntrada =
        Number(entrada.quantidade_conferida || 0) -
        Number(entrada.quantidade_enderecada || 0);

      const qtdLiberar = Math.min(pendenteEntrada, restante);

      restante -= qtdLiberar;

      updates.push(
        new Promise((resolve, reject) => {
          db.query(
            `
              UPDATE entrada_mercadoria
              SET
                quantidade_enderecada = IFNULL(quantidade_enderecada, 0) + ?,
                quantidade_disponivel = IFNULL(quantidade_disponivel, 0) + ?
              WHERE id = ?
            `,
            [
              qtdLiberar,
              qtdLiberar,
              entrada.id
            ],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        })
      );
    }

    if (restante > 0) {
      return callback(new Error("Quantidade maior que o pendente de endereçamento"));
    }

    Promise.all(updates)
      .then(() => {
        db.query(
          `
            UPDATE produto
            SET quantidade_estoque = quantidade_estoque + ?
            WHERE id = ?
          `,
          [
            quantidade,
            produtoId
          ],
          (err) => {
            if (err) return callback(err);

            callback(null);
          }
        );
      })
      .catch(callback);
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

       liberarEstoqueEnderecado(
  produto_id,
  quantidadeArmazenada,
  (err) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        erro: "Endereço atualizado, mas erro ao liberar estoque ❌"
      });
    }

    registrarAuditoria(
      usuario_id,
      usuario_nome,
      "ATUALIZAÇÃO ENDEREÇAMENTO",
      "endereco_estoque",
      enderecoAtual.id,
      `Quantidade do produto ${produto.nome} somada no endereço ${posicao.endereco}. Estoque liberado: ${quantidadeArmazenada}`
    );

    return res.status(200).json({
      mensagem: "Quantidade somada ao endereço existente e estoque liberado ✅",
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
  (err, insertResult) => {
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

            liberarEstoqueEnderecado(
              produto_id,
              quantidadeArmazenada,
              (err) => {
                if (err) {
                  console.error(err);
                  return res.status(500).json({
                    erro: "Endereçamento salvo, mas erro ao liberar estoque ❌"
                  });
                }

                registrarAuditoria(
                  usuario_id,
                  usuario_nome,
                  "ENDEREÇAMENTO",
                  "endereco_estoque",
                  insertResult.insertId,
                  `Produto ${produto.nome} endereçado para ${posicao.endereco}. Estoque liberado: ${quantidadeArmazenada}`
                );

                return res.status(201).json({
                  mensagem: "Endereçamento realizado e estoque liberado com sucesso ✅",
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

          salvarComPosicao(posicaoResult[0]);
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
            salvarComPosicao(posicaoManualResult[0]);
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

/* =========================
   PEDIDOS
========================= */

function verificarEstoquePedido(itens, callback) {
  if (!itens || itens.length === 0) return callback(null, []);

  const ids = itens.map(i => i.produto_id);

  const sql = `
    SELECT
      p.id,
      p.nome,
      IFNULL((
        SELECT SUM(e.quantidade_disponivel)
        FROM entrada_mercadoria e
        WHERE
          e.produto_id = p.id
          AND e.status_conferencia = 'CONFERIDO'
          AND e.quantidade_disponivel > 0
      ), 0) AS estoque_disponivel
    FROM produto p
    WHERE p.id IN (?)
  `;

  db.query(sql, [ids], (err, produtos) => {
    if (err) return callback(err);

    const divergencias = [];

    itens.forEach(item => {
      const produto = produtos.find(
        p => Number(p.id) === Number(item.produto_id)
      );

      const estoque = Number(produto?.estoque_disponivel || 0);
      const qtd = Number(item.quantidade || 0);

      if (qtd > estoque) {
        divergencias.push({
          produto_id: item.produto_id,
          produto_nome: produto?.nome || "Produto",
          quantidade_pedido: qtd,
          estoque_disponivel: estoque,
          diferenca: qtd - estoque
        });
      }
    });

    callback(null, divergencias);
  });
}

app.post("/pedidos", (req, res) => {
  const {
    cliente_id,
    observacao,
    itens,
    usuario_id,
    usuario_nome,
    confirmar_estoque_insuficiente
  } = req.body;

  if (!cliente_id) {
    return res.status(400).send("Cliente é obrigatório ❌");
  }

  if (!itens || itens.length === 0) {
    return res.status(400).send("Adicione pelo menos um item ❌");
  }

  verificarEstoquePedido(itens, (err, divergencias) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao verificar estoque ❌");
    }

    if (divergencias.length > 0 && confirmar_estoque_insuficiente !== true) {
      return res.status(409).json({
        mensagem: "Existem produtos com estoque insuficiente. Deseja salvar mesmo assim?",
        divergencias
      });
    }

    db.beginTransaction((err) => {
      if (err) {
        return res.status(500).send("Erro ao iniciar pedido ❌");
      }

      const sqlPedido = `
        INSERT INTO pedido_cliente
        (
          cliente_id,
          observacao,
          usuario_criacao_id
        )
        VALUES (?, ?, ?)
      `;

      db.query(
        sqlPedido,
        [
          cliente_id,
          observacao || null,
          usuario_id || null
        ],
        (err, result) => {
          if (err) {
            console.error(err);

            return db.rollback(() => {
              res.status(500).send("Erro ao salvar pedido ❌");
            });
          }

          const pedidoId = result.insertId;

          const valoresItens = itens.map(item => {
            const quantidade = Number(item.quantidade || 0);
            const valorUnitario = Number(item.valor_unitario || 0);
            const subtotal = quantidade * valorUnitario;

            return [
              pedidoId,
              item.produto_id,
              quantidade,
              0,
              valorUnitario,
              subtotal
            ];
          });

          const sqlItens = `
            INSERT INTO pedido_cliente_item
            (
              pedido_id,
              produto_id,
              quantidade,
              quantidade_separada,
              valor_unitario,
              subtotal
            )
            VALUES ?
          `;

          db.query(sqlItens, [valoresItens], (err) => {
            if (err) {
              console.error(err);

              return db.rollback(() => {
                res.status(500).send("Erro ao salvar itens do pedido ❌");
              });
            }

            registrarAuditoria(
              usuario_id,
              usuario_nome,
              divergencias.length > 0
                ? "CADASTRO PEDIDO COM ESTOQUE INSUFICIENTE"
                : "CADASTRO PEDIDO",
              "pedido_cliente",
              pedidoId,
              `Pedido ${pedidoId} cadastrado com ${itens.length} item(ns). Divergências: ${JSON.stringify(divergencias)}`
            );

            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).send("Erro ao finalizar pedido ❌");
                });
              }

              if (divergencias.length > 0) {
                return res.send("Pedido cadastrado com aviso de estoque insuficiente ✅");
              }

              res.send("Pedido cadastrado com sucesso ✅");
            });
          });
        }
      );
    });
  });
});
app.get("/pedidos", (req, res) => {
  const busca = req.query.busca || "";

  let sql = `
    SELECT
      pc.id,
      pc.cliente_id,
      pc.data_pedido,
      pc.status,
      pc.observacao,
      c.razao_social AS cliente_nome
    FROM pedido_cliente pc
    INNER JOIN cliente c
      ON pc.cliente_id = c.id
    WHERE 1 = 1
  `;

  const valores = [];

  if (busca) {
    sql += `
      AND (
        pc.id LIKE ?
        OR c.razao_social LIKE ?
        OR pc.status LIKE ?
      )
    `;

    valores.push(
      `%${busca}%`,
      `%${busca}%`,
      `%${busca}%`
    );
  }

  sql += ` ORDER BY pc.id DESC `;

  db.query(sql, valores, (err, pedidos) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar pedidos ❌");
    }

    if (pedidos.length === 0) {
      return res.json([]);
    }

    const ids = pedidos.map(p => p.id);

    const sqlItens = `
      SELECT
        pci.pedido_id,
        pci.produto_id,
        pci.quantidade,
        pci.valor_unitario,
        pci.subtotal,
        IFNULL(pci.quantidade_separada, 0) AS quantidade_separada,
        p.nome AS produto_nome,
        p.codigo AS produto_codigo,
        IFNULL((
          SELECT SUM(e.quantidade_disponivel)
          FROM entrada_mercadoria e
          WHERE
            e.produto_id = p.id
            AND e.status_conferencia = 'CONFERIDO'
            AND e.quantidade_disponivel > 0
        ), 0) AS quantidade_estoque
      FROM pedido_cliente_item pci
      INNER JOIN produto p
        ON pci.produto_id = p.id
      WHERE pci.pedido_id IN (?)
    `;

    db.query(sqlItens, [ids], (err, itens) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao buscar itens dos pedidos ❌");
      }

      const pedidosComItens = pedidos.map(pedido => {
        const itensPedido = itens.filter(
          item => Number(item.pedido_id) === Number(pedido.id)
        );

        const valorTotal = itensPedido.reduce((soma, item) => {
  return soma + Number(item.subtotal || 0);
}, 0);

       return {
  ...pedido,
  total_itens: itensPedido.length,
  valor_total: valorTotal,
  itens: JSON.stringify(itensPedido)
};
      });

      res.json(pedidosComItens);
    });
  });
});

app.put("/pedidos/:id", (req, res) => {
  const { id } = req.params;

  const {
    cliente_id,
    observacao,
    itens,
    usuario_id,
    usuario_nome,
    confirmar_estoque_insuficiente
  } = req.body;

  if (!cliente_id) {
    return res.status(400).send("Cliente é obrigatório ❌");
  }

  if (!itens || itens.length === 0) {
    return res.status(400).send("Adicione pelo menos um item ❌");
  }

  db.query(
    `
      SELECT status
      FROM pedido_cliente
      WHERE id = ?
    `,
    [id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao buscar pedido ❌");
      }

      if (result.length === 0) {
        return res.status(404).send("Pedido não encontrado ❌");
      }

      const status = result[0].status;

      if (!["ABERTO", "EM_PICKING"].includes(status)) {
        return res.status(400).send("Este pedido não pode mais ser editado ❌");
      }

      verificarEstoquePedido(itens, (err, divergencias) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Erro ao verificar estoque ❌");
        }

        if (divergencias.length > 0 && confirmar_estoque_insuficiente !== true) {
          return res.status(409).json({
            mensagem: "Existem produtos com estoque insuficiente. Deseja salvar mesmo assim?",
            divergencias
          });
        }

        atualizarPedido();
      });
    }
  );

  function atualizarPedido() {
    db.beginTransaction((err) => {
      if (err) {
        return res.status(500).send("Erro ao iniciar atualização do pedido ❌");
      }

      db.query(
        `
          SELECT
            produto_id,
            quantidade_separada
          FROM pedido_cliente_item
          WHERE pedido_id = ?
        `,
        [id],
        (err, itensAtuais) => {
          if (err) {
            console.error(err);
            return db.rollback(() => {
              res.status(500).send("Erro ao buscar itens atuais ❌");
            });
          }

          for (const itemAtual of itensAtuais) {
            const novoItem = itens.find(
              item => Number(item.produto_id) === Number(itemAtual.produto_id)
            );

            const separado = Number(itemAtual.quantidade_separada || 0);

            if (separado > 0 && !novoItem) {
              return db.rollback(() => {
                res.status(400).send("Não é possível remover produto que já foi separado no picking ❌");
              });
            }

            if (novoItem && Number(novoItem.quantidade || 0) < separado) {
              return db.rollback(() => {
                res.status(400).send(
                  `Não é possível reduzir quantidade abaixo do que já foi separado. Produto ID ${itemAtual.produto_id}, separado: ${separado} ❌`
                );
              });
            }
          }

          db.query(
            `
              UPDATE pedido_cliente
              SET
                cliente_id = ?,
                observacao = ?
              WHERE id = ?
            `,
            [
              cliente_id,
              observacao || null,
              id
            ],
            (err) => {
              if (err) {
                console.error(err);
                return db.rollback(() => {
                  res.status(500).send("Erro ao atualizar pedido ❌");
                });
              }

              db.query(
                `
                  DELETE FROM pedido_cliente_item
                  WHERE pedido_id = ?
                `,
                [id],
                (err) => {
                  if (err) {
                    console.error(err);
                    return db.rollback(() => {
                      res.status(500).send("Erro ao remover itens antigos ❌");
                    });
                  }

                  const valoresItens = itens.map(item => {
                    const itemAntigo = itensAtuais.find(
                      antigo => Number(antigo.produto_id) === Number(item.produto_id)
                    );

                    return [
                      id,
                      item.produto_id,
                      item.quantidade,
                      Number(itemAntigo?.quantidade_separada || 0)
                    ];
                  });

                  db.query(
                    `
                      INSERT INTO pedido_cliente_item
                      (
                        pedido_id,
                        produto_id,
                        quantidade,
                        quantidade_separada
                      )
                      VALUES ?
                    `,
                    [valoresItens],
                    (err) => {
                      if (err) {
                        console.error(err);
                        return db.rollback(() => {
                          res.status(500).send("Erro ao salvar novos itens ❌");
                        });
                      }

                      registrarAuditoria(
                        usuario_id,
                        usuario_nome,
                        "EDIÇÃO PEDIDO",
                        "pedido_cliente",
                        id,
                        `Pedido ${id} editado. Itens atualizados.`
                      );

                      db.commit((err) => {
                        if (err) {
                          return db.rollback(() => {
                            res.status(500).send("Erro ao finalizar edição ❌");
                          });
                        }

                        res.send("Pedido atualizado com sucesso ✅");
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  }
});

app.put("/pedidos/:id/cancelar", (req, res) => {
  const { id } = req.params;
  const { usuario_id, usuario_nome, motivo } = req.body;

  db.query(
    `SELECT * FROM pedido_cliente WHERE id = ?`,
    [id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao buscar pedido ❌");
      }

      if (result.length === 0) {
        return res.status(404).send("Pedido não encontrado ❌");
      }

      const pedido = result[0];

      if (["EXPEDIDO", "EXPEDIDO_PARCIAL"].includes(pedido.status)) {
        return res.status(400).send(
          "Pedido já expedido. Para desfazer, faça uma NF de devolução de cliente ❌"
        );
      }

      if (["EM_PICKING", "SEPARADO"].includes(pedido.status)) {
        return res.status(400).send(
          "Este pedido possui picking. Cancele o picking antes de cancelar o pedido ❌"
        );
      }

      if (pedido.status !== "ABERTO") {
        return res.status(400).send("Somente pedidos ABERTOS podem ser cancelados diretamente ❌");
      }

      db.query(
        `
          UPDATE pedido_cliente
          SET
            status = 'CANCELADO',
            data_cancelamento = NOW(),
            motivo_cancelamento = ?
          WHERE id = ?
        `,
        [motivo || null, id],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Erro ao cancelar pedido ❌");
          }

          registrarAuditoria(
            usuario_id,
            usuario_nome,
            "CANCELAMENTO PEDIDO",
            "pedido_cliente",
            id,
            `Pedido ${id} cancelado. Motivo: ${motivo || "-"}`
          );

          res.send("Pedido cancelado com sucesso ✅");
        }
      );
    }
  );
});

/* =========================
   PICKING
========================= */

function consumirEstoqueFIFO(produtoId, quantidadeNecessaria, callback) {
  const sqlLotes = `
    SELECT
      id,
      produto_id,
      numero_nf,
      lote,
      validade,
      data_nf,
      quantidade_disponivel
    FROM entrada_mercadoria
    WHERE
      produto_id = ?
      AND status_conferencia = 'CONFERIDO'
      AND quantidade_disponivel > 0
    ORDER BY
      CASE WHEN validade IS NULL THEN 1 ELSE 0 END,
      validade ASC,
      data_nf ASC,
      id ASC
  `;

  db.query(sqlLotes, [produtoId], (err, lotes) => {
    if (err) return callback(err);

    let restante = Number(quantidadeNecessaria);
    const consumo = [];

    for (const lote of lotes) {
      if (restante <= 0) break;

      const disponivel = Number(lote.quantidade_disponivel || 0);
      const consumir = Math.min(disponivel, restante);

      consumo.push({
        entrada_id: lote.id,
        lote: lote.lote,
        validade: lote.validade,
        numero_nf: lote.numero_nf,
        quantidade: consumir
      });

      restante -= consumir;
    }

    if (restante > 0) {
      return callback(new Error("Estoque por lote insuficiente para FIFO/FEFO"));
    }

    const updates = consumo.map(item => {
      return new Promise((resolve, reject) => {
        db.query(
          `
            UPDATE entrada_mercadoria
            SET quantidade_disponivel = quantidade_disponivel - ?
            WHERE id = ?
          `,
          [item.quantidade, item.entrada_id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    });

    Promise.all(updates)
      .then(() => callback(null, consumo))
      .catch(callback);
  });
}

app.put("/picking/pedido/:pedidoId/cancelar", (req, res) => {
  const { pedidoId } = req.params;
  const { usuario_id, usuario_nome, motivo } = req.body;

  db.beginTransaction((err) => {
    if (err) return res.status(500).send("Erro ao iniciar cancelamento ❌");

    db.query(
      `SELECT * FROM pedido_cliente WHERE id = ? FOR UPDATE`,
      [pedidoId],
      (err, pedidos) => {
        if (err) {
          return db.rollback(() => res.status(500).send("Erro ao buscar pedido ❌"));
        }

        if (pedidos.length === 0) {
          return db.rollback(() => res.status(404).send("Pedido não encontrado ❌"));
        }

        const pedido = pedidos[0];

        if (["EXPEDIDO", "EXPEDIDO_PARCIAL"].includes(pedido.status)) {
          return db.rollback(() => {
            res.status(400).send("Pedido já expedido. Faça uma NF de devolução de cliente ❌");
          });
        }

        if (pedido.status === "ABERTO") {
          return db.rollback(() => {
            res.status(400).send("Este pedido ainda não possui picking para cancelar.");
          });
        }

        db.query(
          `
            SELECT *
            FROM picking_movimento
            WHERE pedido_id = ?
              AND status = 'ATIVO'
          `,
          [pedidoId],
          (err, movimentos) => {
            if (err) {
              return db.rollback(() => res.status(500).send("Erro ao buscar movimentos do picking ❌"));
            }

            const updates = movimentos.map(mov => {
              return new Promise((resolve, reject) => {
                db.query(
                  `
                    UPDATE entrada_mercadoria
                    SET quantidade_disponivel = IFNULL(quantidade_disponivel, 0) + ?
                    WHERE id = ?
                  `,
                  [mov.quantidade, mov.entrada_id],
                  (err) => {
                    if (err) return reject(err);

                    if (mov.endereco_id) {
                      db.query(
                        `
                          UPDATE endereco_estoque
                          SET quantidade_unidades = IFNULL(quantidade_unidades, 0) + ?
                          WHERE id = ?
                        `,
                        [mov.quantidade, mov.endereco_id],
                        (err) => {
                          if (err) return reject(err);

                          db.query(
  `
    UPDATE posicao_estoque pe
    INNER JOIN endereco_estoque ee
      ON pe.id = ee.posicao_id
    SET pe.status = 'OCUPADA'
    WHERE ee.id = ?
  `,
  [mov.endereco_id],
  (err) => {
    if (err) return reject(err);

    db.query(
      `
        UPDATE produto
        SET quantidade_estoque = IFNULL(quantidade_estoque, 0) + ?
        WHERE id = ?
      `,
      [mov.quantidade, mov.produto_id],
      (err) => err ? reject(err) : resolve()
    );
  }
);
                        }
                      );
                    } else {
                      db.query(
                        `
                          UPDATE produto
                          SET quantidade_estoque = IFNULL(quantidade_estoque, 0) + ?
                          WHERE id = ?
                        `,
                        [mov.quantidade, mov.produto_id],
                        (err) => err ? reject(err) : resolve()
                      );
                    }
                  }
                );
              });
            });

            Promise.all(updates)
              .then(() => {
                db.query(
                  `
                    UPDATE pedido_cliente_item
                    SET quantidade_separada = 0
                    WHERE pedido_id = ?
                  `,
                  [pedidoId],
                  (err) => {
                    if (err) {
                      return db.rollback(() => res.status(500).send("Erro ao zerar separação ❌"));
                    }

                    db.query(
                      `
                        UPDATE picking_movimento
                        SET status = 'CANCELADO'
                        WHERE pedido_id = ?
                          AND status = 'ATIVO'
                      `,
                      [pedidoId],
                      (err) => {
                        if (err) {
                          return db.rollback(() => res.status(500).send("Erro ao cancelar histórico do picking ❌"));
                        }

                        db.query(
                          `
                            UPDATE pedido_cliente
                            SET status = 'ABERTO'
                            WHERE id = ?
                          `,
                          [pedidoId],
                          (err) => {
                            if (err) {
                              return db.rollback(() => res.status(500).send("Erro ao voltar pedido para aberto ❌"));
                            }

                            registrarAuditoria(
                              usuario_id,
                              usuario_nome,
                              "CANCELAMENTO PICKING",
                              "pedido_cliente",
                              pedidoId,
                              `Picking do pedido ${pedidoId} cancelado. Estoque devolvido aos endereços. Motivo: ${motivo || "-"}`
                            );

                            db.commit((err) => {
                              if (err) {
                                return db.rollback(() => res.status(500).send("Erro ao finalizar cancelamento ❌"));
                              }

                              res.send("Picking cancelado e pedido voltou para ABERTO ✅");
                            });
                          }
                        );
                      }
                    );
                  }
                );
              })
              .catch(err => {
                console.error(err);
                db.rollback(() => res.status(500).send("Erro ao devolver estoque do picking ❌"));
              });
          }
        );
      }
    );
  });
});

function consumirEnderecoProduto(produtoId, quantidadeNecessaria, callback) {
  const sqlEnderecos = `
    SELECT
      id,
      endereco,
      rua,
      coluna,
      nivel,
      posicao_id,
      quantidade_unidades
    FROM endereco_estoque
    WHERE
      produto_id = ?
      AND quantidade_unidades > 0
    ORDER BY
      rua ASC,
      coluna ASC,
      nivel ASC,
      id ASC
  `;

  db.query(sqlEnderecos, [produtoId], (err, enderecos) => {
    if (err) return callback(err);

    let restante = Number(quantidadeNecessaria);
    const consumoEnderecos = [];

    for (const end of enderecos) {
      if (restante <= 0) break;

      const disponivel = Number(end.quantidade_unidades || 0);
      const consumir = Math.min(disponivel, restante);

      consumoEnderecos.push({
        endereco_id: end.id,
        endereco: end.endereco,
        rua: end.rua,
        coluna: end.coluna,
        nivel: end.nivel,
        posicao_id: end.posicao_id,
        quantidade: consumir
      });

      restante -= consumir;
    }

    if (restante > 0) {
      return callback(new Error("Estoque endereçado insuficiente"));
    }

    const updates = consumoEnderecos.map(item => {
      return new Promise((resolve, reject) => {
        db.query(
          `
            UPDATE endereco_estoque
            SET quantidade_unidades = quantidade_unidades - ?
            WHERE id = ?
          `,
          [item.quantidade, item.endereco_id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    });

    Promise.all(updates)
      .then(() => {
       db.query(
  `
    UPDATE posicao_estoque pe
    INNER JOIN endereco_estoque ee
      ON pe.id = ee.posicao_id
    SET pe.status = 'LIVRE'
    WHERE ee.quantidade_unidades <= 0
  `,
  (err) => {
    if (err) return callback(err);

    callback(null, consumoEnderecos);
  }
);
      })
      .catch(callback);
  });
}

app.get("/picking", (req, res) => {
  const sql = `
    SELECT
      pc.id AS pedido_id,
      pc.status AS pedido_status,
      c.razao_social AS cliente_nome,

      p.id AS produto_id,
      p.nome AS produto_nome,
      p.codigo AS produto_codigo,

      IFNULL((
        SELECT SUM(e.quantidade_disponivel)
        FROM entrada_mercadoria e
        WHERE
          e.produto_id = p.id
          AND e.status_conferencia = 'CONFERIDO'
          AND e.quantidade_disponivel > 0
      ), 0) AS quantidade_estoque,

      pci.quantidade,
      IFNULL(pci.quantidade_separada, 0) AS quantidade_separada

    FROM pedido_cliente pc

    INNER JOIN pedido_cliente_item pci
      ON pc.id = pci.pedido_id

    INNER JOIN produto p
      ON pci.produto_id = p.id

    INNER JOIN cliente c
      ON pc.cliente_id = c.id

    WHERE
      pc.status IN ('ABERTO', 'EM_PICKING')
      AND (pci.quantidade - IFNULL(pci.quantidade_separada, 0)) > 0

    ORDER BY p.nome, pc.id
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar picking ❌");
    }

    if (rows.length === 0) {
      return res.json([]);
    }

    const produtosIds = [...new Set(rows.map(r => r.produto_id))];

    const sqlEnderecos = `
      SELECT
        id,
        produto_id,
        endereco,
        rua,
        coluna,
        nivel,
        quantidade_unidades
      FROM endereco_estoque
      WHERE
        produto_id IN (?)
        AND quantidade_unidades > 0
      ORDER BY rua, coluna, nivel
    `;

    db.query(sqlEnderecos, [produtosIds], (err, enderecos) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao buscar endereços do picking ❌");
      }

      const agrupado = {};

      rows.forEach(r => {
        const pendente =
          Number(r.quantidade || 0) -
          Number(r.quantidade_separada || 0);

        if (!agrupado[r.produto_id]) {
          const endProduto = enderecos.filter(
            e => Number(e.produto_id) === Number(r.produto_id)
          );

          agrupado[r.produto_id] = {
            produto_id: r.produto_id,
            produto_nome: r.produto_nome,
            produto_codigo: r.produto_codigo,
            quantidade_estoque: r.quantidade_estoque,
            total_quantidade: 0,
            pedidos: [],
            enderecos: JSON.stringify(endProduto)
          };
        }

        agrupado[r.produto_id].total_quantidade += pendente;

        agrupado[r.produto_id].pedidos.push({
          pedido_id: r.pedido_id,
          pedido_status: r.pedido_status,
          cliente_nome: r.cliente_nome,
          quantidade: r.quantidade,
          quantidade_separada: r.quantidade_separada,
          quantidade_pendente: pendente
        });
      });

      const resultado = Object.values(agrupado).map(item => ({
        ...item,
        pedidos: JSON.stringify(item.pedidos)
      }));

      res.json(resultado);
    });
  });
});

app.put("/picking/iniciar", (req, res) => {
  const { usuario_id, usuario_nome } = req.body;

  db.query(
    `
      UPDATE pedido_cliente
      SET status = 'EM_PICKING'
      WHERE status = 'ABERTO'
    `,
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao iniciar picking ❌");
      }

      if (result.affectedRows === 0) {
        return res.status(400).send("Nenhum pedido aberto para picking ❌");
      }

      registrarAuditoria(
        usuario_id,
        usuario_nome,
        "INÍCIO PICKING",
        "pedido_cliente",
        null,
        `${result.affectedRows} pedido(s) enviado(s) para picking.`
      );

      res.send("Picking iniciado com sucesso ✅");
    }
  );
});

app.put("/picking/separar-produto/:produtoId", (req, res) => {
  const { produtoId } = req.params;

  const {
    quantidade_separada,
    quantidade_avariada,
    motivo_divergencia,
    observacao,
    usuario_id,
    usuario_nome
  } = req.body;

  const qtdSeparada = Number(quantidade_separada || 0);
  const qtdAvariada = Number(quantidade_avariada || 0);
  const totalBaixar = qtdSeparada + qtdAvariada;

  if (qtdSeparada < 0 || qtdAvariada < 0) {
    return res.status(400).send("Quantidades inválidas ❌");
  }

  if (totalBaixar <= 0) {
    return res.status(400).send("Informe a quantidade separada ou avariada ❌");
  }

  const sqlBusca = `
    SELECT
      pc.id AS pedido_id,
      pc.status,
      pci.id AS item_id,
      pci.produto_id,
      pci.quantidade,
      IFNULL(pci.quantidade_separada, 0) AS quantidade_separada,
      p.nome AS produto_nome
    FROM pedido_cliente pc

    INNER JOIN pedido_cliente_item pci
      ON pc.id = pci.pedido_id

    INNER JOIN produto p
      ON pci.produto_id = p.id

    WHERE
      pc.status = 'EM_PICKING'
      AND pci.produto_id = ?
      AND (pci.quantidade - IFNULL(pci.quantidade_separada, 0)) > 0

    ORDER BY pc.id ASC, pci.id ASC
  `;

  db.query(sqlBusca, [produtoId], (err, itens) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar itens do picking ❌");
    }

    if (itens.length === 0) {
      return res.status(404).send("Nenhum item em picking para este produto ❌");
    }

    const produtoNome = itens[0].produto_nome;

    const totalPendente = itens.reduce((soma, item) => {
      return soma +
        (
          Number(item.quantidade || 0) -
          Number(item.quantidade_separada || 0)
        );
    }, 0);

    if (qtdSeparada > totalPendente) {
      return res.status(400).send(
        `Quantidade separada maior que a pendente. Pendente: ${totalPendente} ❌`
      );
    }

    db.beginTransaction((err) => {
      if (err) {
        return res.status(500).send("Erro ao iniciar separação ❌");
      }

      consumirEstoqueFIFO(produtoId, totalBaixar, (err, consumoFIFO) => {
        if (err) {
          console.error(err);

          return db.rollback(() => {
            res.status(400).send("Erro no FIFO/FEFO: " + err.message + " ❌");
          });
        }

        consumirEnderecoProduto(produtoId, totalBaixar, (err, consumoEnderecos) => {
          if (err) {
            console.error(err);

            return db.rollback(() => {
              res.status(400).send("Erro no endereço: " + err.message + " ❌");
            });
          }

          let restanteSeparar = qtdSeparada;

let filaFIFO = [...consumoFIFO];
let filaEnderecos = [...consumoEnderecos];

function pegarOrigemPicking(qtd) {
  const origens = [];
  let restante = Number(qtd || 0);

  while (restante > 0 && filaFIFO.length > 0 && filaEnderecos.length > 0) {
    const fifo = filaFIFO[0];
    const endereco = filaEnderecos[0];

    const qtdOrigem = Math.min(
      restante,
      Number(fifo.quantidade || 0),
      Number(endereco.quantidade || 0)
    );

    origens.push({
      entrada_id: fifo.entrada_id,
      endereco_id: endereco.endereco_id,
      quantidade: qtdOrigem
    });

    fifo.quantidade = Number(fifo.quantidade || 0) - qtdOrigem;
    endereco.quantidade = Number(endereco.quantidade || 0) - qtdOrigem;
    restante -= qtdOrigem;

    if (fifo.quantidade <= 0) filaFIFO.shift();
    if (endereco.quantidade <= 0) filaEnderecos.shift();
  }

  return origens;
}

const updatesItens = itens.map(item => {
  return new Promise((resolve, reject) => {
    if (restanteSeparar <= 0) return resolve();

    const pendente =
      Number(item.quantidade || 0) -
      Number(item.quantidade_separada || 0);

    const separarNesteItem = Math.min(pendente, restanteSeparar);
    restanteSeparar -= separarNesteItem;

    const origens = pegarOrigemPicking(separarNesteItem);

    db.query(
      `
        UPDATE pedido_cliente_item
        SET quantidade_separada = quantidade_separada + ?
        WHERE id = ?
      `,
      [separarNesteItem, item.item_id],
      (err) => {
        if (err) return reject(err);

        if (origens.length === 0) return resolve();

        const valoresMovimento = origens.map(origem => [
          item.pedido_id,
          item.item_id,
          item.produto_id,
          origem.entrada_id,
          origem.endereco_id,
          origem.quantidade,
          "ATIVO"
        ]);

        db.query(
          `
            INSERT INTO picking_movimento
            (
              pedido_id,
              pedido_item_id,
              produto_id,
              entrada_id,
              endereco_id,
              quantidade,
              status
            )
            VALUES ?
          `,
          [valoresMovimento],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      }
    );
  });
});

          Promise.all(updatesItens)
            .then(() => {
              db.query(
                `
                  UPDATE produto
                  SET quantidade_estoque = GREATEST(quantidade_estoque - ?, 0)
                  WHERE id = ?
                `,
                [totalBaixar, produtoId],
                (err) => {
                  if (err) {
                    console.error(err);

                    return db.rollback(() => {
                      res.status(500).send("Erro ao atualizar estoque geral ❌");
                    });
                  }

                  verificarPedidosAposPicking(
                    itens,
                    produtoNome,
                    totalPendente,
                    qtdSeparada,
                    qtdAvariada,
                    motivo_divergencia,
                    observacao,
                    consumoFIFO,
                    consumoEnderecos,
                    usuario_id,
                    usuario_nome,
                    res
                  );
                }
              );
            })
            .catch(err => {
              console.error(err);

              db.rollback(() => {
                res.status(500).send("Erro ao atualizar itens do picking ❌");
              });
            });
        });
      });
    });
  });
});

function verificarPedidosAposPicking(
  itens,
  produtoNome,
  totalPendente,
  qtdSeparada,
  qtdAvariada,
  motivoDivergencia,
  observacao,
  consumoFIFO,
  consumoEnderecos,
  usuario_id,
  usuario_nome,
  res
) {
  const pedidosIds = [...new Set(itens.map(i => i.pedido_id))];

  const verificacoes = pedidosIds.map(pedidoId => {
    return new Promise((resolve, reject) => {
      db.query(
        `
          SELECT COUNT(*) AS pendentes
          FROM pedido_cliente_item
          WHERE
            pedido_id = ?
            AND quantidade_separada < quantidade
        `,
        [pedidoId],
        (err, result) => {
          if (err) reject(err);
          else {
            resolve({
              pedidoId,
              pendentes: Number(result[0].pendentes || 0)
            });
          }
        }
      );
    });
  });

  Promise.all(verificacoes)
    .then(resultados => {
      const pedidosSeparados = resultados
        .filter(r => r.pendentes === 0)
        .map(r => r.pedidoId);

      const finalizar = () => {
        const houveDivergencia =
          qtdSeparada < totalPendente ||
          qtdAvariada > 0 ||
          motivoDivergencia;

        registrarAuditoria(
          usuario_id,
          usuario_nome,
          houveDivergencia
            ? "DIVERGÊNCIA PICKING"
            : "SEPARAÇÃO PICKING FIFO/FEFO",
          "pedido_cliente_item",
          null,
          `
            Produto: ${produtoNome}.
            Pendente antes da separação: ${totalPendente}.
            Quantidade separada: ${qtdSeparada}.
            Quantidade avariada: ${qtdAvariada}.
            Motivo divergência: ${motivoDivergencia || "-"}.
            Observação: ${observacao || "-"}.
            Consumo FIFO/FEFO: ${JSON.stringify(consumoFIFO)}.
            Consumo Endereços: ${JSON.stringify(consumoEnderecos)}.
          `
        );

        db.commit((err) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).send("Erro ao finalizar separação ❌");
            });
          }

          if (houveDivergencia) {
            return res.send("Separação parcial registrada com divergência ✅");
          }

          res.send("Separação confirmada com FIFO/FEFO e endereço ✅");
        });
      };

      if (pedidosSeparados.length === 0) {
        return finalizar();
      }

      db.query(
        `
          UPDATE pedido_cliente
          SET status = 'SEPARADO'
          WHERE id IN (?)
        `,
        [pedidosSeparados],
        (err) => {
          if (err) {
            console.error(err);

            return db.rollback(() => {
              res.status(500).send("Erro ao atualizar pedidos separados ❌");
            });
          }

          finalizar();
        }
      );
    })
    .catch(err => {
      console.error(err);

      db.rollback(() => {
        res.status(500).send("Erro ao verificar pedidos separados ❌");
      });
    });
}

app.get("/fifo/produto/:produtoId", (req, res) => {
  const { produtoId } = req.params;

  const sql = `
    SELECT
      e.id,
      e.numero_nf,
      e.lote,
      e.validade,
      e.data_nf,
      e.quantidade_disponivel,
      p.nome AS produto_nome,
      p.codigo AS produto_codigo
    FROM entrada_mercadoria e

    INNER JOIN produto p
      ON e.produto_id = p.id

    WHERE
      e.produto_id = ?
      AND e.status_conferencia = 'CONFERIDO'
      AND e.quantidade_disponivel > 0

    ORDER BY
      CASE WHEN e.validade IS NULL THEN 1 ELSE 0 END,
      e.validade ASC,
      e.data_nf ASC,
      e.id ASC
  `;

  db.query(sql, [produtoId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar FIFO ❌");
    }

    res.json(result);
  });
});

/* =========================
   ROMANEIO
========================= */

app.get("/romaneio", (req, res) => {
  const tipo = req.query.tipo || "ATIVO";
  const busca = req.query.busca || "";

  let statusFiltro = "";

  if (tipo === "EXPEDIDO") {
    statusFiltro = `
      pc.status IN ('EXPEDIDO', 'EXPEDIDO_PARCIAL')
    `;
  } else {
    statusFiltro = `
      pc.status IN ('SEPARADO', 'EM_PICKING')
      AND EXISTS (
        SELECT 1
        FROM pedido_cliente_item pci2
        WHERE pci2.pedido_id = pc.id
          AND IFNULL(pci2.quantidade_separada, 0) > 0
      )
    `;
  }

  let sql = `
    SELECT
      pc.id,
      pc.cliente_id,
      pc.data_pedido,
      pc.status,
      pc.observacao,

      c.razao_social AS cliente_nome,
      c.nome_fantasia,
      c.cnpj,
      c.telefone,
      c.email,
      c.cep,
      c.rua,
      c.numero,
      c.bairro,
      c.cidade,
      c.estado,

      nf.numero_nf,
      nf.serie_nf,
      nf.data_nf,
      nf.data_transmissao,

      pci.produto_id,
      pci.quantidade,
      pci.quantidade_separada,

      p.nome AS produto_nome,
      p.codigo AS produto_codigo

    FROM pedido_cliente pc

    INNER JOIN cliente c
      ON pc.cliente_id = c.id

    INNER JOIN pedido_cliente_item pci
      ON pc.id = pci.pedido_id

    INNER JOIN produto p
      ON pci.produto_id = p.id

    LEFT JOIN nota_fiscal_saida nf
      ON nf.pedido_id = pc.id
      AND nf.status = 'TRANSMITIDA'

    WHERE ${statusFiltro}
  `;

  const valores = [];

  if (busca) {
    sql += `
      AND (
        pc.id LIKE ?
        OR c.razao_social LIKE ?
        OR c.cnpj LIKE ?
        OR c.cidade LIKE ?
        OR pc.status LIKE ?
        OR nf.numero_nf LIKE ?
      )
    `;

    valores.push(
      `%${busca}%`,
      `%${busca}%`,
      `%${busca}%`,
      `%${busca}%`,
      `%${busca}%`,
      `%${busca}%`
    );
  }

  sql += `
    ORDER BY
      c.cidade,
      c.bairro,
      c.razao_social,
      pc.id
  `;

  db.query(sql, valores, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar romaneio ❌");
    }

    const agrupado = {};

    rows.forEach(r => {
      const quantidadeSeparada = Number(r.quantidade_separada || 0);

      if (quantidadeSeparada <= 0) return;

      if (!agrupado[r.id]) {
        agrupado[r.id] = {
          id: r.id,
          cliente_id: r.cliente_id,
          data_pedido: r.data_pedido,
          status: r.status,
          observacao: r.observacao,

          cliente_nome: r.cliente_nome,
          nome_fantasia: r.nome_fantasia,
          cnpj: r.cnpj,
          telefone: r.telefone,
          email: r.email,
          cep: r.cep,
          rua: r.rua,
          numero: r.numero,
          bairro: r.bairro,
          cidade: r.cidade,
          estado: r.estado,

          numero_nf: r.numero_nf,
          serie_nf: r.serie_nf,
          data_nf: r.data_nf,
          data_transmissao: r.data_transmissao,

          total_itens: 0,
          itens: []
        };
      }

      agrupado[r.id].total_itens += 1;

      agrupado[r.id].itens.push({
        produto_id: r.produto_id,
        produto_nome: r.produto_nome,
        produto_codigo: r.produto_codigo,
        quantidade: r.quantidade,
        quantidade_separada: r.quantidade_separada
      });
    });

    const resultado = Object.values(agrupado).map(pedido => ({
      ...pedido,
      itens: JSON.stringify(pedido.itens)
    }));

    res.json(resultado);
  });
});


/* =========================
   NOTA FISCAL
========================= */

app.get("/nf/pedidos-separados", (req, res) => {
  const sql = `
    SELECT
      pc.id,
      pc.status,
      c.razao_social AS cliente_nome,
      c.cnpj
    FROM pedido_cliente pc
    INNER JOIN cliente c
      ON pc.cliente_id = c.id
    WHERE
      pc.status IN ('SEPARADO', 'EM_PICKING')
      AND EXISTS (
        SELECT 1
        FROM pedido_cliente_item pci
        WHERE pci.pedido_id = pc.id
          AND IFNULL(pci.quantidade_separada, 0) > 0
      )
    ORDER BY pc.id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar pedidos para NF ❌");
    }

    res.json(result);
  });
});

app.get("/notas-fiscais/:id", (req, res) => {
  const { id } = req.params;

  const sqlNota = `
    SELECT
      nf.*,

      pc.id AS pedido_id_ref,
      pc.status AS pedido_status,

      c.razao_social AS cliente_nome,
      c.cnpj AS cliente_cnpj,
      c.telefone AS cliente_telefone,
      c.email AS cliente_email,
      c.cep AS cliente_cep,
      c.rua AS cliente_rua,
      c.numero AS cliente_numero,
      c.bairro AS cliente_bairro,
      c.cidade AS cliente_cidade,
      c.estado AS cliente_estado,

      f.nome AS fornecedor_nome,
      f.cnpj AS fornecedor_cnpj

    FROM nota_fiscal_saida nf

    LEFT JOIN pedido_cliente pc
      ON nf.pedido_id = pc.id

    LEFT JOIN cliente c
      ON nf.cliente_id = c.id
      OR pc.cliente_id = c.id

    LEFT JOIN fornecedor f
      ON nf.fornecedor_id = f.id

    WHERE nf.id = ?
  `;

  db.query(sqlNota, [id], (err, notas) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar NF ❌");
    }

    if (notas.length === 0) {
      return res.status(404).send("NF não encontrada ❌");
    }

    const nota = notas[0];

    const sqlItens = `
      SELECT
        nfi.*,
        p.nome AS produto_nome,
        p.codigo AS produto_codigo
      FROM nota_fiscal_saida_item nfi
      INNER JOIN produto p
        ON nfi.produto_id = p.id
      WHERE nfi.nota_id = ?
    `;

    db.query(sqlItens, [id], (err, itens) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao buscar itens da NF ❌");
      }

      res.json({
        ...nota,
        itens
      });
    });
  });
});

app.get("/nf/pedido/:pedidoId/itens", (req, res) => {
  const { pedidoId } = req.params;

  const sql = `
    SELECT
      pci.produto_id,
      p.nome AS produto_nome,
      p.codigo AS produto_codigo,
      pci.quantidade AS quantidade_pedido,
      IFNULL(pci.quantidade_separada, 0) AS quantidade_faturada,
      IFNULL(p.preco_venda, 0) AS valor_unitario
    FROM pedido_cliente_item pci
    INNER JOIN produto p
      ON pci.produto_id = p.id
    WHERE
      pci.pedido_id = ?
      AND IFNULL(pci.quantidade_separada, 0) > 0
  `;

  db.query(sql, [pedidoId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar itens do pedido ❌");
    }

    res.json(result);
  });
});

app.get("/notas-fiscais", (req, res) => {
  const sql = `
    SELECT
      id,
      tipo,
      numero_nf,
      serie_nf,
      data_nf,
      data_transmissao,
      status,
      valor_total,
      observacao
    FROM nota_fiscal_saida
    ORDER BY id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar notas fiscais ❌");
    }

    res.json(result);
  });
});

app.post("/notas-fiscais", (req, res) => {
  const {
    tipo,
    numero_nf,
    serie_nf,
    pedido_id,
    cliente_id,
    fornecedor_id,
    nf_origem_id,
    entrada_origem_id,
    observacao,
    itens,
    valor_frete,
    origem_devolucao,
    divergencia_origem_id,
    valor_desconto,
    outras_despesas,
    usuario_id,
    usuario_nome
  } = req.body;

  if (!tipo || !numero_nf) {
    return res.status(400).send("Tipo e número da NF são obrigatórios ❌");
  }

  const frete = tipo === "VENDA" ? Number(valor_frete || 0) : 0;
  const desconto = tipo === "VENDA" ? Number(valor_desconto || 0) : 0;
  const outras = tipo === "VENDA" ? Number(outras_despesas || 0) : 0;

  const valorProdutos = Array.isArray(itens)
    ? itens.reduce((soma, item) => {
        return soma + Number(item.quantidade || 0) * Number(item.valor_unitario || 0);
      }, 0)
    : 0;

  const valorTotal = valorProdutos + frete + outras - desconto;

  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).send("Erro ao iniciar NF ❌");
    }

    const sqlNota = `
      INSERT INTO nota_fiscal_saida
      (
        tipo,
        numero_nf,
        serie_nf,
        data_nf,
        data_transmissao,
        pedido_id,
        cliente_id,
        fornecedor_id,
        nf_origem_id,
        entrada_origem_id,
        observacao,
        status,
        origem_devolucao,
        divergencia_origem_id,
        valor_produtos,
        valor_frete,
        valor_desconto,
        outras_despesas,
        valor_total,
        usuario_id
      )
      VALUES (?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, 'RASCUNHO', ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sqlNota,
      [
  tipo,
  numero_nf,
  serie_nf || "1",
  pedido_id || null,
  cliente_id || null,
  fornecedor_id || null,
  nf_origem_id || null,
  entrada_origem_id || null,
  observacao || null,

  origem_devolucao || null,
  divergencia_origem_id || null,

  valorProdutos,
  frete,
  desconto,
  outras,
  valorTotal,
  usuario_id || null
],
      (err, result) => {
        if (err) {
          console.error(err);
          return db.rollback(() => {
            res.status(500).send("Erro ao salvar espelho da NF ❌");
          });
        }

        const notaId = result.insertId;

        if (tipo === "VENDA") {
          return salvarItensEspelhoVendaNF(
            notaId,
            pedido_id,
            usuario_id,
            usuario_nome,
            res
          );
        }

        return salvarItensEspelhoManualNF(
          notaId,
          tipo,
          itens,
          usuario_id,
          usuario_nome,
          res
        );
      }
    );
  });
});

function salvarItensEspelhoVendaNF(notaId, pedidoId, usuario_id, usuario_nome, res) {
  if (!pedidoId) {
    return db.rollback(() => {
      res.status(400).send("Pedido é obrigatório para NF de venda ❌");
    });
  }

  const sql = `
  SELECT
    pci.produto_id,
    pci.quantidade AS quantidade_pedido,
    IFNULL(pci.quantidade_separada, 0) AS quantidade_faturada,
    COALESCE(pci.valor_unitario, p.preco_venda, 0) AS valor_unitario
  FROM pedido_cliente_item pci
  INNER JOIN produto p
    ON pci.produto_id = p.id
  WHERE
    pci.pedido_id = ?
    AND IFNULL(pci.quantidade_separada, 0) > 0
`;

  db.query(sql, [pedidoId], (err, itens) => {
    if (err) {
      console.error(err);
      return db.rollback(() => {
        res.status(500).send("Erro ao buscar itens do pedido ❌");
      });
    }

    if (itens.length === 0) {
      return db.rollback(() => {
        res.status(400).send("Pedido sem quantidade física para faturar ❌");
      });
    }

    const valorProdutosVenda = itens.reduce((soma, item) => {
      return soma +
        Number(item.quantidade_faturada || 0) *
        Number(item.valor_unitario || 0);
    }, 0);

    db.query(
      `
        UPDATE nota_fiscal_saida
        SET
          valor_produtos = ?,
          valor_total = ? + IFNULL(valor_frete, 0) + IFNULL(outras_despesas, 0) - IFNULL(valor_desconto, 0)
        WHERE id = ?
      `,
      [
        valorProdutosVenda,
        valorProdutosVenda,
        notaId
      ],
      (err) => {
        if (err) {
          console.error(err);
          return db.rollback(() => {
            res.status(500).send("Erro ao atualizar total da NF ❌");
          });
        }

        const valores = itens.map(item => [
          notaId,
          item.produto_id,
          item.quantidade_pedido,
          item.quantidade_faturada,
          item.quantidade_faturada,
          item.valor_unitario || 0
        ]);

        db.query(
          `
            INSERT INTO nota_fiscal_saida_item
            (
              nota_id,
              produto_id,
              quantidade_pedido,
              quantidade_faturada,
              quantidade,
              valor_unitario
            )
            VALUES ?
          `,
          [valores],
          (err) => {
            if (err) {
              console.error(err);
              return db.rollback(() => {
                res.status(500).send("Erro ao salvar itens do espelho ❌");
              });
            }

            registrarAuditoria(
              usuario_id,
              usuario_nome,
              "ESPELHO NF VENDA",
              "nota_fiscal_saida",
              notaId,
              `Espelho da NF ${notaId} salvo para o pedido ${pedidoId}. Ainda não transmitida.`
            );

            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).send("Erro ao finalizar espelho ❌");
                });
              }

              res.send("Espelho da NF salvo com sucesso ✅");
            });
          }
        );
      }
    );
  });
}

function salvarItensEspelhoManualNF(notaId, tipo, itens, usuario_id, usuario_nome, res) {
  if (!itens || itens.length === 0) {
    return db.rollback(() => {
      res.status(400).send("Adicione pelo menos um item ❌");
    });
  }

  const valores = itens.map(item => [
    notaId,
    item.produto_id,
    item.quantidade,
    item.quantidade,
    item.quantidade,
    item.valor_unitario || 0,
    item.nf_item_origem_id || null,
    item.entrada_item_origem_id || null
  ]);

  db.query(
    `
      INSERT INTO nota_fiscal_saida_item
      (
        nota_id,
        produto_id,
        quantidade_pedido,
        quantidade_faturada,
        quantidade,
        valor_unitario,
        nf_item_origem_id,
        entrada_item_origem_id
      )
      VALUES ?
    `,
    [valores],
    (err) => {
      if (err) {
        console.error(err);
        return db.rollback(() => {
          res.status(500).send("Erro ao salvar itens da nota ❌");
        });
      }

      const valorProdutos = itens.reduce((soma, item) => {
        return soma + Number(item.quantidade || 0) * Number(item.valor_unitario || 0);
      }, 0);

      db.query(
        `
          UPDATE nota_fiscal_saida
          SET
            valor_produtos = ?,
            valor_frete = 0,
            valor_desconto = 0,
            outras_despesas = 0,
            valor_total = ?
          WHERE id = ?
        `,
        [valorProdutos, valorProdutos, notaId],
        (err) => {
          if (err) {
            console.error(err);
            return db.rollback(() => {
              res.status(500).send("Erro ao atualizar total da nota ❌");
            });
          }

          registrarAuditoria(
            usuario_id,
            usuario_nome,
            "ESPELHO NF DEVOLUÇÃO",
            "nota_fiscal_saida",
            notaId,
            `Espelho de devolução salvo. Tipo: ${tipo}.`
          );

          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).send("Erro ao finalizar espelho ❌");
              });
            }

            res.send("Espelho da devolução salvo com sucesso ✅");
          });
        }
      );
    }
  );
}

app.put("/notas-fiscais/:id/transmitir", (req, res) => {
  const { id } = req.params;
  const { usuario_id, usuario_nome } = req.body;

  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).send("Erro ao iniciar transmissão ❌");
    }

    db.query(
      `
        SELECT *
        FROM nota_fiscal_saida
        WHERE id = ?
        FOR UPDATE
      `,
      [id],
      (err, notas) => {
        if (err) {
          console.error(err);
          return db.rollback(() => {
            res.status(500).send("Erro ao buscar NF ❌");
          });
        }

        if (notas.length === 0) {
          return db.rollback(() => {
            res.status(404).send("NF não encontrada ❌");
          });
        }

        const nota = notas[0];

        if (nota.status === "TRANSMITIDA") {
          return db.rollback(() => {
            res.status(400).send("NF já foi transmitida ❌");
          });
        }

        if (nota.tipo === "VENDA") {
          return transmitirNFVenda(nota, usuario_id, usuario_nome, res);
        }

        return transmitirNFManual(nota, usuario_id, usuario_nome, res);
      }
    );
  });
});

function transmitirNFVenda(nota, usuario_id, usuario_nome, res) {
  const pedidoId = nota.pedido_id;

  if (!pedidoId) {
    return db.rollback(() => {
      res.status(400).send("NF de venda sem pedido vinculado ❌");
    });
  }

  db.query(
    `
      SELECT
        SUM(quantidade) AS total_pedido,
        SUM(IFNULL(quantidade_separada, 0)) AS total_faturado
      FROM pedido_cliente_item
      WHERE pedido_id = ?
    `,
    [pedidoId],
    (err, result) => {
      if (err) {
        console.error(err);
        return db.rollback(() => {
          res.status(500).send("Erro ao verificar pedido ❌");
        });
      }

      const totalPedido = Number(result[0].total_pedido || 0);
      const totalFaturado = Number(result[0].total_faturado || 0);

      const statusPedido =
        totalFaturado >= totalPedido
          ? "EXPEDIDO"
          : "EXPEDIDO_PARCIAL";

      db.query(
        `
          UPDATE nota_fiscal_saida
          SET
            status = 'TRANSMITIDA',
            data_nf = CURDATE(),
            data_transmissao = NOW()
          WHERE id = ?
        `,
        [nota.id],
        (err) => {
          if (err) {
            console.error(err);
            return db.rollback(() => {
              res.status(500).send("Erro ao transmitir NF ❌");
            });
          }

          db.query(
            `
              UPDATE pedido_cliente
              SET status = ?
              WHERE id = ?
            `,
            [statusPedido, pedidoId],
            (err) => {
              if (err) {
                console.error(err);
                return db.rollback(() => {
                  res.status(500).send("Erro ao atualizar pedido ❌");
                });
              }

              registrarAuditoria(
                usuario_id,
                usuario_nome,
                statusPedido === "EXPEDIDO_PARCIAL"
                  ? "TRANSMISSÃO NF PARCIAL"
                  : "TRANSMISSÃO NF",
                "nota_fiscal_saida",
                nota.id,
                `
                  NF ${nota.id} transmitida.
                  Pedido: ${pedidoId}.
                  Quantidade pedida: ${totalPedido}.
                  Quantidade física/faturada: ${totalFaturado}.
                  Status pedido: ${statusPedido}.
                `
              );

              db.commit((err) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).send("Erro ao finalizar transmissão ❌");
                  });
                }

                res.send("NF transmitida com sucesso ✅");
              });
            }
          );
        }
      );
    }
  );
}

function transmitirNFManual(nota, usuario_id, usuario_nome, res) {
  if (nota.tipo === "DEVOLUCAO_CLIENTE") {
    return transmitirDevolucaoCliente(
      nota,
      usuario_id,
      usuario_nome,
      res
    );
  }

  if (nota.tipo === "DEVOLUCAO_FORNECEDOR") {
    return transmitirDevolucaoFornecedor(
      nota,
      usuario_id,
      usuario_nome,
      res
    );
  }

  return db.rollback(() => {
    res.status(400).send("Tipo de NF manual inválido ❌");
  });
}

function transmitirDevolucaoCliente(nota, usuario_id, usuario_nome, res) {
  db.query(
    `
      SELECT
        nfi.*,
        p.nome AS produto_nome
      FROM nota_fiscal_saida_item nfi
      INNER JOIN produto p
        ON nfi.produto_id = p.id
      WHERE nfi.nota_id = ?
    `,
    [nota.id],
    (err, itens) => {
      if (err) {
        console.error(err);
        return db.rollback(() => {
          res.status(500).send("Erro ao buscar itens da devolução ❌");
        });
      }

      const inserts = itens.map(item => {
        return new Promise((resolve, reject) => {
          db.query(
            `
              INSERT INTO entrada_mercadoria
              (
                produto_id,
                numero_nf,
                serie_nf,
                data_nf,
                quantidade,
                quantidade_conferida,
                quantidade_disponivel,
                quantidade_enderecada,
                custo_unitario_sem_imposto,
                custo_unitario_com_imposto,
                status_conferencia,
                tipo_entrada,
                nf_devolucao_id
              )
              VALUES (?, ?, ?, CURDATE(), ?, 0, 0, 0, ?, ?, 'PENDENTE', 'DEVOLUCAO_CLIENTE', ?)
            `,
            [
              item.produto_id,
              nota.numero_nf,
              nota.serie_nf || "1",
              item.quantidade,
              item.valor_unitario || 0,
              item.valor_unitario || 0,
              nota.id
            ],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      });

      Promise.all(inserts)
        .then(() => {
          db.query(
            `
              UPDATE nota_fiscal_saida
              SET
                status = 'TRANSMITIDA',
                data_nf = CURDATE(),
                data_transmissao = NOW()
              WHERE id = ?
            `,
            [nota.id],
            (err) => {
              if (err) {
                console.error(err);
                return db.rollback(() => {
                  res.status(500).send("Erro ao transmitir devolução ❌");
                });
              }

              registrarAuditoria(
                usuario_id,
                usuario_nome,
                "TRANSMISSÃO DEVOLUÇÃO CLIENTE",
                "nota_fiscal_saida",
                nota.id,
                `Devolução de cliente transmitida. Itens enviados para conferência, sem liberar estoque ainda.`
              );

              db.commit((err) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).send("Erro ao finalizar transmissão ❌");
                  });
                }

                res.send("Devolução de cliente transmitida e enviada para conferência ✅");
              });
            }
          );
        })
        .catch(err => {
          console.error(err);
          db.rollback(() => {
            res.status(500).send("Erro ao gerar entrada de devolução ❌");
          });
        });
    }
  );
}

function transmitirDevolucaoFornecedor(nota, usuario_id, usuario_nome, res) {

  if (nota.origem_devolucao === "DIVERGENCIA") {
  return transmitirDevolucaoFornecedorDivergencia(
    nota,
    usuario_id,
    usuario_nome,
    res
  );
}

  db.query(
    `
      SELECT
        produto_id,
        quantidade,
        entrada_item_origem_id
      FROM nota_fiscal_saida_item
      WHERE nota_id = ?
    `,
    [nota.id],
    (err, itens) => {
      if (err) {
        console.error(err);
        return db.rollback(() => {
          res.status(500).send("Erro ao buscar itens da devolução ❌");
        });
      }

      const entradasIds = itens
        .map(i => i.entrada_item_origem_id)
        .filter(Boolean);

      const updates = itens.map(item => {
        return new Promise((resolve, reject) => {
          db.query(
            `
              UPDATE entrada_mercadoria
              SET quantidade_disponivel = GREATEST(quantidade_disponivel - ?, 0)
              WHERE id = ?
                AND quantidade_disponivel >= ?
            `,
            [
              item.quantidade,
              item.entrada_item_origem_id,
              item.quantidade
            ],
            (err, result) => {
              if (err) return reject(err);

              if (result.affectedRows === 0) {
                return reject(
                  new Error("Quantidade insuficiente na entrada original para devolução")
                );
              }

              db.query(
                `
                  UPDATE produto
                  SET quantidade_estoque = GREATEST(quantidade_estoque - ?, 0)
                  WHERE id = ?
                `,
                [item.quantidade, item.produto_id],
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            }
          );
        });
      });

      Promise.all(updates)
        .then(() => {
          db.query(
            `
              UPDATE entrada_mercadoria
              SET
                status_conferencia = 'CONFERIDO',
                status_divergencia = 'RESOLVIDA'
              WHERE id IN (?)
                AND status_divergencia = 'DEVOLUCAO'
            `,
            [entradasIds],
            (err) => {
              if (err) {
                console.error(err);
                return db.rollback(() => {
                  res.status(500).send("Erro ao resolver divergência da devolução ❌");
                });
              }

              db.query(
                `
                  UPDATE nota_fiscal_saida
                  SET
                    status = 'TRANSMITIDA',
                    data_nf = CURDATE(),
                    data_transmissao = NOW()
                  WHERE id = ?
                `,
                [nota.id],
                (err) => {
                  if (err) {
                    console.error(err);
                    return db.rollback(() => {
                      res.status(500).send("Erro ao transmitir NF ❌");
                    });
                  }

                  registrarAuditoria(
                    usuario_id,
                    usuario_nome,
                    "TRANSMISSÃO DEVOLUÇÃO FORNECEDOR",
                    "nota_fiscal_saida",
                    nota.id,
                    `Devolução ao fornecedor transmitida. Estoque baixado e divergência marcada como resolvida.`
                  );

                  db.commit((err) => {
                    if (err) {
                      return db.rollback(() => {
                        res.status(500).send("Erro ao finalizar transmissão ❌");
                      });
                    }

                    res.send("Devolução ao fornecedor transmitida e divergência resolvida ✅");
                  });
                }
              );
            }
          );
        })
        .catch(err => {
          console.error(err);

          db.rollback(() => {
            res.status(400).send(err.message || "Erro ao baixar estoque da devolução ❌");
          });
        });
    }
  );
}

function transmitirDevolucaoFornecedorDivergencia(nota, usuario_id, usuario_nome, res) {
  db.query(
    `
      UPDATE nota_fiscal_saida
      SET
        status = 'TRANSMITIDA',
        data_nf = CURDATE(),
        data_transmissao = NOW()
      WHERE id = ?
    `,
    [nota.id],
    (err) => {
      if (err) {
        console.error(err);
        return db.rollback(() => {
          res.status(500).send("Erro ao transmitir NF de devolução ❌");
        });
      }

      db.query(
        `
          UPDATE divergencia_conferencia
          SET
            status = 'RESOLVIDA',
            data_resolucao = NOW(),
            observacao_resolucao = 'Resolvida por NF de devolução ao fornecedor'
          WHERE id = ?
        `,
        [nota.divergencia_origem_id],
        (err) => {
          if (err) {
            console.error(err);
            return db.rollback(() => {
              res.status(500).send("Erro ao resolver divergência ❌");
            });
          }

          db.query(
            `
              UPDATE entrada_mercadoria e
              INNER JOIN divergencia_conferencia d
                ON d.entrada_id = e.id
              SET
                e.status_conferencia = 'CONFERIDO',
                e.status_divergencia = 'RESOLVIDA'
              WHERE d.id = ?
            `,
            [nota.divergencia_origem_id],
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
                "TRANSMISSÃO DEVOLUÇÃO FORNECEDOR DIVERGÊNCIA",
                "nota_fiscal_saida",
                nota.id,
                "NF transmitida apenas documentalmente. Não baixou estoque, pois a falta já foi considerada na conferência."
              );

              db.commit((err) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).send("Erro ao finalizar transmissão ❌");
                  });
                }

                res.send("NF transmitida e divergência resolvida ✅");
              });
            }
          );
        }
      );
    }
  );
}

app.get("/nf/origem/vendas", (req, res) => {
  const sql = `
    SELECT
  nf.id,
  nf.numero_nf,
  nf.serie_nf,
  nf.valor_total,
  nf.data_nf,
  c.id AS cliente_id,
  c.razao_social AS cliente_nome
    FROM nota_fiscal_saida nf
    INNER JOIN cliente c
      ON nf.cliente_id = c.id
      OR nf.pedido_id IN (
        SELECT pc.id
        FROM pedido_cliente pc
        WHERE pc.cliente_id = c.id
      )
    WHERE
      nf.tipo = 'VENDA'
      AND nf.status = 'TRANSMITIDA'
    ORDER BY nf.id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar NFs de venda ❌");
    }

    res.json(result);
  });
});

app.get("/nf/origem/vendas/:id/itens", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT
      nfi.id AS item_id,
      nfi.produto_id,
      p.nome AS produto_nome,
      p.codigo AS produto_codigo,
      nfi.quantidade AS quantidade_vendida,
      nfi.valor_unitario,

      IFNULL((
        SELECT SUM(dev_item.quantidade)
        FROM nota_fiscal_saida dev
        INNER JOIN nota_fiscal_saida_item dev_item
          ON dev.id = dev_item.nota_id
        WHERE
          dev.tipo = 'DEVOLUCAO_CLIENTE'
          AND dev.status <> 'CANCELADA'
          AND dev.nf_origem_id = ?
          AND dev_item.nf_item_origem_id = nfi.id
      ), 0) AS quantidade_ja_devolvida,

      (
        nfi.quantidade - IFNULL((
          SELECT SUM(dev_item.quantidade)
          FROM nota_fiscal_saida dev
          INNER JOIN nota_fiscal_saida_item dev_item
            ON dev.id = dev_item.nota_id
          WHERE
            dev.tipo = 'DEVOLUCAO_CLIENTE'
            AND dev.status <> 'CANCELADA'
            AND dev.nf_origem_id = ?
            AND dev_item.nf_item_origem_id = nfi.id
        ), 0)
      ) AS quantidade_disponivel_devolucao

    FROM nota_fiscal_saida_item nfi
    INNER JOIN produto p
      ON nfi.produto_id = p.id
    WHERE nfi.nota_id = ?
    HAVING quantidade_disponivel_devolucao > 0
  `;

  db.query(sql, [id, id, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar itens da NF de venda ❌");
    }

    res.json(result);
  });
});

app.get("/nf/origem/entradas", (req, res) => {
  const sql = `
    SELECT DISTINCT
      em.numero_nf,
      f.id AS fornecedor_id,
      f.nome AS fornecedor_nome
    FROM entrada_mercadoria em
    LEFT JOIN fornecedor f
      ON em.fornecedor_id = f.id
    WHERE
      em.status_conferencia = 'CONFERIDO'
    ORDER BY em.numero_nf DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar NFs de entrada ❌");
    }

    res.json(result);
  });
});

app.get("/nf/origem/entradas/:numeroNF/itens", (req, res) => {
  const { numeroNF } = req.params;

  const sql = `
    SELECT
      em.id AS entrada_id,
      em.produto_id,
      p.nome AS produto_nome,
      p.codigo AS produto_codigo,
      em.quantidade_conferida AS quantidade_recebida,
      em.quantidade_disponivel,
      em.custo_unitario_com_imposto AS valor_unitario,

      IFNULL((
        SELECT SUM(nfi.quantidade)
        FROM nota_fiscal_saida nf
        INNER JOIN nota_fiscal_saida_item nfi
          ON nf.id = nfi.nota_id
        WHERE
          nf.tipo = 'DEVOLUCAO_FORNECEDOR'
          AND nf.status <> 'CANCELADA'
          AND nf.entrada_origem_id = em.numero_nf
          AND nfi.entrada_item_origem_id = em.id
      ), 0) AS quantidade_ja_devolvida,

      (
        em.quantidade_disponivel - IFNULL((
          SELECT SUM(nfi.quantidade)
          FROM nota_fiscal_saida nf
          INNER JOIN nota_fiscal_saida_item nfi
            ON nf.id = nfi.nota_id
          WHERE
            nf.tipo = 'DEVOLUCAO_FORNECEDOR'
            AND nf.status <> 'CANCELADA'
            AND nf.entrada_origem_id = em.numero_nf
            AND nfi.entrada_item_origem_id = em.id
        ), 0)
      ) AS quantidade_disponivel_devolucao

    FROM entrada_mercadoria em
    INNER JOIN produto p
      ON em.produto_id = p.id
    WHERE
      em.numero_nf = ?
      AND em.status_conferencia = 'CONFERIDO'
    HAVING quantidade_disponivel_devolucao > 0
  `;

  db.query(sql, [numeroNF], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar itens da NF de entrada ❌");
    }

    res.json(result);
  });
});

/* =========================
   RELATÓRIOS
========================= */

app.get("/relatorios/dashboard", (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM produto) AS total_produtos,
      (SELECT COUNT(*) FROM cliente) AS total_clientes,
      (SELECT COUNT(*) FROM fornecedor) AS total_fornecedores,

      (SELECT COUNT(*) FROM pedido_cliente WHERE status = 'ABERTO') AS pedidos_abertos,
      (SELECT COUNT(*) FROM pedido_cliente WHERE status = 'EM_PICKING') AS pedidos_picking,
      (SELECT COUNT(*) FROM pedido_cliente WHERE status = 'SEPARADO') AS pedidos_separados,
      (SELECT COUNT(*) FROM pedido_cliente WHERE status IN ('EXPEDIDO', 'EXPEDIDO_PARCIAL')) AS pedidos_expedidos,

      IFNULL((
        SELECT SUM(valor_total)
        FROM nota_fiscal_saida
        WHERE tipo = 'VENDA'
          AND status = 'TRANSMITIDA'
      ), 0) AS valor_faturado
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao carregar dashboard ❌");
    }

    res.json(result[0]);
  });
});

app.get("/relatorios/estoque", (req, res) => {
  const busca = req.query.busca || "";

  let sql = `
    SELECT
      p.id,
      p.nome,
      p.codigo,
      IFNULL(p.quantidade_estoque, 0) AS quantidade_estoque,
      IFNULL(p.estoque_minimo, 0) AS estoque_minimo,
      IFNULL(p.preco_venda, 0) AS preco_venda,

      IFNULL((
        SELECT GROUP_CONCAT(
          CONCAT(ee.endereco, ' (', ee.quantidade_unidades, ' un)')
          SEPARATOR ', '
        )
        FROM endereco_estoque ee
        WHERE ee.produto_id = p.id
      ), '') AS enderecos,

      (
        IFNULL(p.quantidade_estoque, 0) *
        IFNULL(p.preco_venda, 0)
      ) AS valor_estoque

    FROM produto p
    WHERE 1 = 1
  `;

  const valores = [];

  if (busca) {
    sql += `
      AND (
        p.nome LIKE ?
        OR p.codigo LIKE ?
        OR EXISTS (
          SELECT 1
          FROM endereco_estoque ee
          WHERE ee.produto_id = p.id
            AND ee.endereco LIKE ?
        )
      )
    `;

    valores.push(
      `%${busca}%`,
      `%${busca}%`,
      `%${busca}%`
    );
  }

  sql += ` ORDER BY p.nome ASC `;

  db.query(sql, valores, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao carregar relatório de estoque ❌");
    }

    res.json(result);
  });
});

app.get("/relatorios/faturamento", (req, res) => {
  const inicio = req.query.inicio || null;
  const fim = req.query.fim || null;
  const busca = req.query.busca || "";

  let where = `
    WHERE
      nf.tipo = 'VENDA'
      AND nf.status = 'TRANSMITIDA'
  `;

  const valores = [];

  if (inicio) {
    where += ` AND nf.data_nf >= ? `;
    valores.push(inicio);
  }

  if (fim) {
    where += ` AND nf.data_nf <= ? `;
    valores.push(fim);
  }

  if (busca) {
    where += `
      AND (
        nf.numero_nf LIKE ?
        OR nf.status LIKE ?
        OR c.razao_social LIKE ?
        OR c.cnpj LIKE ?
      )
    `;

    valores.push(
      `%${busca}%`,
      `%${busca}%`,
      `%${busca}%`,
      `%${busca}%`
    );
  }

  const sqlNotas = `
    SELECT
      nf.id,
      nf.numero_nf,
      nf.serie_nf,
      nf.data_nf,
      nf.status,
      IFNULL(nf.valor_produtos, 0) AS valor_produtos,
      IFNULL(nf.valor_frete, 0) AS valor_frete,
      IFNULL(nf.valor_desconto, 0) AS valor_desconto,
      IFNULL(nf.outras_despesas, 0) AS outras_despesas,
      IFNULL(nf.valor_total, 0) AS valor_total,
      c.razao_social AS cliente_nome,
      c.cnpj AS cliente_cnpj
    FROM nota_fiscal_saida nf

    LEFT JOIN pedido_cliente pc
      ON nf.pedido_id = pc.id

    LEFT JOIN cliente c
      ON nf.cliente_id = c.id
      OR pc.cliente_id = c.id

    ${where}

    ORDER BY nf.data_nf DESC, nf.id DESC
  `;

  db.query(sqlNotas, valores, (err, notas) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao carregar faturamento ❌");
    }

    const resumo = {
      total_notas: notas.length,
      valor_produtos: 0,
      valor_frete: 0,
      valor_desconto: 0,
      outras_despesas: 0,
      valor_total: 0
    };

    notas.forEach(n => {
      resumo.valor_produtos += Number(n.valor_produtos || 0);
      resumo.valor_frete += Number(n.valor_frete || 0);
      resumo.valor_desconto += Number(n.valor_desconto || 0);
      resumo.outras_despesas += Number(n.outras_despesas || 0);
      resumo.valor_total += Number(n.valor_total || 0);
    });

    res.json({
      resumo,
      notas
    });
  });
});

app.get("/relatorios/entradas-saidas", (req, res) => {
  const { inicio, fim } = req.query;

  const valoresEntrada = [];
  const valoresSaida = [];

  let filtroEntrada = "WHERE 1=1";
  let filtroSaida = "WHERE nf.tipo = 'VENDA' AND nf.status = 'TRANSMITIDA'";

  if (inicio) {
    filtroEntrada += " AND em.data_nf >= ?";
    filtroSaida += " AND nf.data_nf >= ?";
    valoresEntrada.push(inicio);
    valoresSaida.push(inicio);
  }

  if (fim) {
    filtroEntrada += " AND em.data_nf <= ?";
    filtroSaida += " AND nf.data_nf <= ?";
    valoresEntrada.push(fim);
    valoresSaida.push(fim);
  }

  const sqlEntradas = `
    SELECT
      'ENTRADA' AS tipo,
      em.numero_nf AS documento,
      em.data_nf AS data_movimento,
      COALESCE(f.nome, 'Sem fornecedor') AS parceiro,
      SUM(
        IFNULL(em.quantidade_conferida, em.quantidade) *
        IFNULL(em.custo_unitario_com_imposto, 0)
      ) AS valor
    FROM entrada_mercadoria em
    LEFT JOIN fornecedor f
      ON em.fornecedor_id = f.id
    ${filtroEntrada}
    GROUP BY
      em.numero_nf,
      em.data_nf,
      f.nome
  `;

  const sqlSaidas = `
    SELECT
      'SAÍDA' AS tipo,
      nf.numero_nf AS documento,
      nf.data_nf AS data_movimento,
      COALESCE(c.razao_social, 'Sem cliente') AS parceiro,
      IFNULL(nf.valor_total, 0) AS valor
    FROM nota_fiscal_saida nf
    LEFT JOIN pedido_cliente pc
      ON nf.pedido_id = pc.id
    LEFT JOIN cliente c
      ON nf.cliente_id = c.id
      OR pc.cliente_id = c.id
    ${filtroSaida}
  `;

  db.query(sqlEntradas, valoresEntrada, (err, entradas) => {
    if (err) {
      console.error("Erro entradas-saidas entradas:", err);
      return res.status(500).json({
        erro: "Erro ao buscar entradas",
        detalhe: err.sqlMessage || err.message
      });
    }

    db.query(sqlSaidas, valoresSaida, (err, saidas) => {
      if (err) {
        console.error("Erro entradas-saidas saídas:", err);
        return res.status(500).json({
          erro: "Erro ao buscar saídas",
          detalhe: err.sqlMessage || err.message
        });
      }

      const movimentos = [...entradas, ...saidas].sort((a, b) => {
        return new Date(b.data_movimento || 0) - new Date(a.data_movimento || 0);
      });

      const totalEntradas = entradas.reduce((s, e) => s + Number(e.valor || 0), 0);
      const totalSaidas = saidas.reduce((s, e) => s + Number(e.valor || 0), 0);

      res.json({
        resumo: {
          total_entradas: totalEntradas,
          total_saidas: totalSaidas,
          saldo: totalSaidas - totalEntradas
        },
        movimentos
      });
    });
  });
});

app.get("/relatorios/divergencias", (req, res) => {
  const busca = req.query.busca || "";

  let sql = `
    SELECT
      d.numero_nf,
      p.nome AS produto_nome,
      d.quantidade_nf,
      d.quantidade_conferida,
      d.diferenca,
      d.motivo,
      d.status
    FROM divergencia_conferencia d
    INNER JOIN produto p ON d.produto_id = p.id
    WHERE 1=1
  `;

  const valores = [];

  if (busca) {
    sql += `
      AND (
        d.numero_nf LIKE ?
        OR p.nome LIKE ?
        OR d.motivo LIKE ?
        OR d.status LIKE ?
      )
    `;
    valores.push(`%${busca}%`, `%${busca}%`, `%${busca}%`, `%${busca}%`);
  }

  sql += " ORDER BY d.id DESC";

  db.query(sql, valores, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar divergências ❌");
    }

    res.json(result);
  });
});

app.get("/relatorios/enderecamento", (req, res) => {
  const busca = req.query.busca || "";

  let sql = `
    SELECT
      ee.endereco,
      ee.quantidade_unidades,
      ee.capacidade_unidades,
      ee.ocupacao_m3,
      p.nome AS produto_nome,
      p.codigo AS produto_codigo
    FROM endereco_estoque ee
    INNER JOIN produto p ON ee.produto_id = p.id
    WHERE 1=1
  `;

  const valores = [];

  if (busca) {
    sql += `
      AND (
        ee.endereco LIKE ?
        OR p.nome LIKE ?
        OR p.codigo LIKE ?
      )
    `;
    valores.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
  }

  sql += " ORDER BY ee.rua, ee.coluna, ee.nivel";

  db.query(sql, valores, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao buscar endereçamento ❌");
    }

    res.json(result);
  });
});

app.get("/relatorios/movimentacoes", (req, res) => {
  const busca = req.query.busca || "";

  let sql = `
    SELECT
      usuario_nome,
      acao,
      tabela_afetada AS tabela,
      descricao,
      data_hora AS data_registro
    FROM auditoria
    WHERE 1=1
  `;

  const valores = [];

  if (busca) {
    sql += `
      AND (
        usuario_nome LIKE ?
        OR acao LIKE ?
        OR tabela_afetada LIKE ?
        OR descricao LIKE ?
      )
    `;

    valores.push(
      `%${busca}%`,
      `%${busca}%`,
      `%${busca}%`,
      `%${busca}%`
    );
  }

  sql += `
    ORDER BY data_hora DESC
    LIMIT 300
  `;

  db.query(sql, valores, (err, result) => {
    if (err) {
      console.error("Erro movimentações:", err);
      return res.status(500).json({
        erro: "Erro ao buscar movimentações",
        detalhe: err.sqlMessage || err.message
      });
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