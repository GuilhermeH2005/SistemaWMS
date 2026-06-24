var API_PICKING = "http://localhost:3000";
var dadosPicking = [];
var pickingSelecionados = [];

function iniciarPicking() {
  carregarPicking();
}

async function carregarPicking() {
  try {
    const res = await fetch(`${API_PICKING}/picking`);

    if (!res.ok) {
      alert(await res.text());
      return;
    }

    dadosPicking = await res.json();
    pickingSelecionados = [];

    renderizarResumoPicking(dadosPicking);
    renderizarPicking(dadosPicking);

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar picking.");
  }
}

function renderizarResumoPicking(lista) {
  const resumo = document.getElementById("resumoPicking");
  if (!resumo) return;

  const totalProdutos = lista.length;

  const totalUnidades = lista.reduce((soma, item) => {
    return soma + Number(item.total_quantidade || 0);
  }, 0);

  const produtosSemEstoque = lista.filter(item => {
    return Number(item.quantidade_estoque || 0) <
      Number(item.total_quantidade || 0);
  }).length;

  resumo.innerHTML = `
    <div class="card-resumo-picking">
      <span>Produtos Agrupados</span>
      <strong>${totalProdutos}</strong>
    </div>

    <div class="card-resumo-picking">
      <span>Unidades Pendentes</span>
      <strong>${totalUnidades}</strong>
    </div>

    <div class="card-resumo-picking">
      <span>Produtos sem Estoque</span>
      <strong>${produtosSemEstoque}</strong>
    </div>
  `;
}

function renderizarPicking(lista) {
  const tbody = document.getElementById("listaPicking");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!lista || lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">Nenhum pedido aberto para picking.</td>
      </tr>
    `;
    return;
  }

  const btnIniciar = document.getElementById("btnIniciarPicking");

  const temPedidoAberto = lista.some(item => {
    const pedidos = JSON.parse(item.pedidos || "[]");
    return pedidos.some(p => p.pedido_status === "ABERTO");
  });

  if (btnIniciar) {
    btnIniciar.style.display = temPedidoAberto ? "block" : "none";
  }

  lista.forEach((item, index) => {
    const estoque = Number(item.quantidade_estoque || 0);
    const total = Number(item.total_quantidade || 0);

    const status = estoque >= total ? "Estoque OK" : "Estoque insuficiente";
    const classe = estoque >= total ? "status-ok" : "status-insuficiente";

    tbody.innerHTML += `
      <tr>
        <td>
          <input
            type="checkbox"
            class="check-picking"
            onchange="alternarSelecaoPicking(${index})"
          >
        </td>

        <td><strong>${item.produto_nome}</strong></td>

        <td>${item.produto_codigo || "-"}</td>

        <td>${total}</td>

        <td>${estoque}</td>

        <td>${resumirEnderecosPicking(item.enderecos)}</td>

        <td>
          <span class="${classe}">
            ${status}
          </span>
        </td>

        <td>
          <button
            class="btn-detalhes-picking"
            onclick="alternarDetalhesPicking(${index})"
          >
            👁 Ver
          </button>
        </td>
      </tr>

      <tr id="detalhes-picking-${index}" class="linha-detalhes-picking">
        <td colspan="8">
          <div class="box-detalhes-picking">

            ${renderizarPedidosProduto(item.pedidos)}

            ${renderizarEnderecosProduto(item.enderecos)}

            <div id="fifo-produto-${item.produto_id}" class="box-fifo-picking">
              Carregando ordem FIFO/FEFO...
            </div>

            ${
              produtoEmPicking(item)
                ? renderizarFormularioSeparacao(item)
                : `<p class="alerta-fifo">Clique em "Iniciar Picking" para liberar a separação deste produto.</p>`
            }

          </div>
        </td>
      </tr>
    `;
  });
}

function resumirEnderecosPicking(enderecosJson) {
  let enderecos = [];

  try {
    enderecos = JSON.parse(enderecosJson || "[]");
  } catch {
    enderecos = [];
  }

  if (enderecos.length === 0) {
    return `<span class="status-insuficiente">Sem endereço</span>`;
  }

  return enderecos
    .slice(0, 2)
    .map(e => `<strong>${e.endereco}</strong> (${e.quantidade_unidades} un)`)
    .join("<br>");
}

function renderizarEnderecosProduto(enderecosJson) {
  let enderecos = [];

  try {
    enderecos = JSON.parse(enderecosJson || "[]");
  } catch {
    enderecos = [];
  }

  if (enderecos.length === 0) {
    return `
      <div class="box-fifo-picking">
        <h4>Endereços</h4>
        <p class="alerta-fifo">Produto sem endereço cadastrado.</p>
      </div>
    `;
  }

  let html = `
    <div class="box-fifo-picking">
      <h4>Endereços do Produto</h4>

      <table class="tabela-interna-picking">
        <thead>
          <tr>
            <th>Endereço</th>
            <th>Rua</th>
            <th>Coluna</th>
            <th>Nível</th>
            <th>Quantidade no Endereço</th>
          </tr>
        </thead>
        <tbody>
  `;

  enderecos.forEach(e => {
    html += `
      <tr>
        <td><strong>${e.endereco}</strong></td>
        <td>${e.rua || "-"}</td>
        <td>${e.coluna || "-"}</td>
        <td>${e.nivel || "-"}</td>
        <td>${e.quantidade_unidades || 0}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  return html;
}

function renderizarPedidosProduto(pedidosJson) {
  let pedidos = [];

  try {
    pedidos = JSON.parse(pedidosJson || "[]");
  } catch {
    pedidos = [];
  }

  if (pedidos.length === 0) {
    return `<p>Nenhum pedido encontrado.</p>`;
  }

  let html = `
    <table class="tabela-interna-picking">
      <thead>
        <tr>
          <th>Pedido</th>
          <th>Cliente</th>
          <th>Quantidade</th>
          <th>Separada</th>
          <th>Pendente</th>
        </tr>
      </thead>
      <tbody>
  `;

  pedidos.forEach(p => {
    html += `
      <tr>
        <td>#${p.pedido_id}</td>
        <td>${p.cliente_nome}</td>
        <td>${p.quantidade}</td>
        <td>${p.quantidade_separada || 0}</td>
        <td>${p.quantidade_pendente || 0}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  return html;
}

function renderizarFormularioSeparacao(item) {
  return `
    <div class="campo-separacao-picking">

      <div>
        <label>Qtd Separada</label>
        <input
          type="number"
          id="qtd-separada-${item.produto_id}"
          min="0"
          max="${item.total_quantidade}"
          placeholder="Ex: ${item.total_quantidade}"
        >
      </div>

      <div>
        <label>Qtd Avariada</label>
        <input
          type="number"
          id="qtd-avariada-${item.produto_id}"
          min="0"
          placeholder="Ex: 0"
        >
      </div>

      <div>
        <label>Motivo</label>
        <select id="motivo-divergencia-${item.produto_id}">
          <option value="">Sem divergência</option>
          <option value="FALTA_FISICA">Falta física</option>
          <option value="AVARIA">Avaria</option>
          <option value="ESTOQUE_INCORRETO">Estoque incorreto</option>
        </select>
      </div>

      <div>
        <label>Observação</label>
        <input
          type="text"
          id="observacao-divergencia-${item.produto_id}"
          placeholder="Opcional"
        >
      </div>

      <button
        class="btn-confirmar-picking"
        onclick="confirmarSeparacaoProduto(${item.produto_id})"
      >
        Confirmar Separação
      </button>

    </div>
  `;
}

function alternarDetalhesPicking(index) {
  const linha = document.getElementById(`detalhes-picking-${index}`);
  if (!linha) return;

  linha.classList.toggle("ativo");

  const item = dadosPicking[index];

  if (item && linha.classList.contains("ativo")) {
    carregarFIFOProduto(item.produto_id);
  }
}

function alternarSelecaoPicking(index) {
  if (pickingSelecionados.includes(index)) {
    pickingSelecionados = pickingSelecionados.filter(i => i !== index);
  } else {
    pickingSelecionados.push(index);
  }
}

function selecionarTodosPicking() {
  const check = document.getElementById("checkTodosPicking");
  if (!check) return;

  if (check.checked) {
    pickingSelecionados = dadosPicking.map((_, index) => index);

    document.querySelectorAll(".check-picking").forEach(c => {
      c.checked = true;
    });
  } else {
    pickingSelecionados = [];

    document.querySelectorAll(".check-picking").forEach(c => {
      c.checked = false;
    });
  }
}

async function iniciarSeparacaoPicking() {
  if (!dadosPicking || dadosPicking.length === 0) {
    alert("Não existem pedidos abertos para picking.");
    return;
  }

  if (!confirm("Deseja iniciar o picking dos pedidos abertos?")) return;

  try {
    const res = await fetch(`${API_PICKING}/picking/iniciar`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...getUsuarioAuditoria()
      })
    });

    const msg = await res.text();

    if (!res.ok) {
      alert(msg);
      return;
    }

    alert(msg);
    carregarPicking();

  } catch (err) {
    console.error(err);
    alert("Erro ao iniciar picking.");
  }
}

async function confirmarSeparacaoProduto(produtoId) {
  const item = dadosPicking.find(
    p => Number(p.produto_id) === Number(produtoId)
  );

  if (!item) {
    alert("Produto não encontrado no picking.");
    return;
  }

  const totalPendente = Number(item.total_quantidade || 0);
  const estoqueSistema = Number(item.quantidade_estoque || 0);

  const quantidadeSeparada = Number(
    document.getElementById(`qtd-separada-${produtoId}`)?.value || 0
  );

  const quantidadeAvariada = Number(
    document.getElementById(`qtd-avariada-${produtoId}`)?.value || 0
  );

  const motivoDivergencia =
    document.getElementById(`motivo-divergencia-${produtoId}`)?.value || "";

  const observacao =
    document.getElementById(`observacao-divergencia-${produtoId}`)?.value || "";

  const totalBaixar = quantidadeSeparada + quantidadeAvariada;

  if (quantidadeSeparada < 0 || quantidadeAvariada < 0) {
    alert("Quantidades inválidas.");
    return;
  }

  if (totalBaixar <= 0) {
    alert("Informe quantidade separada ou avariada.");
    return;
  }

  if (quantidadeSeparada > totalPendente) {
    alert(`Quantidade separada maior que a pendente. Pendente: ${totalPendente}`);
    return;
  }

  if (totalBaixar > estoqueSistema) {
    alert(
      `Não é possível baixar mais do que o estoque disponível.\n\n` +
      `Estoque disponível: ${estoqueSistema}\n` +
      `Tentativa de baixa: ${totalBaixar}`
    );
    return;
  }

  if ((quantidadeSeparada < totalPendente || quantidadeAvariada > 0) && !motivoDivergencia) {
    alert("Informe o motivo da divergência.");
    return;
  }

  if (!confirm(
    `Confirmar separação?\n\n` +
    `Produto: ${item.produto_nome}\n` +
    `Pendente: ${totalPendente}\n` +
    `Separado: ${quantidadeSeparada}\n` +
    `Avariado: ${quantidadeAvariada}\n` +
    `Motivo: ${motivoDivergencia || "-"}`
  )) return;

  try {
    const res = await fetch(`${API_PICKING}/picking/separar-produto/${produtoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        quantidade_separada: quantidadeSeparada,
        quantidade_avariada: quantidadeAvariada,
        motivo_divergencia: motivoDivergencia,
        observacao,
        ...getUsuarioAuditoria()
      })
    });

    const msg = await res.text();

    if (!res.ok) {
      alert(msg);
      return;
    }

    alert(msg);
    carregarPicking();

  } catch (err) {
    console.error(err);
    alert("Erro ao confirmar separação.");
  }
}

async function carregarFIFOProduto(produtoId) {
  const box = document.getElementById(`fifo-produto-${produtoId}`);
  if (!box) return;

  const itemPicking = dadosPicking.find(
    item => Number(item.produto_id) === Number(produtoId)
  );

  const quantidadeNecessaria = Number(itemPicking?.total_quantidade || 0);

  try {
    const res = await fetch(`${API_PICKING}/fifo/produto/${produtoId}`);

    if (!res.ok) {
      box.innerHTML = "Não foi possível carregar FIFO/FEFO.";
      return;
    }

    const lotes = await res.json();

    if (!lotes || lotes.length === 0) {
      box.innerHTML = "Nenhum lote disponível para este produto.";
      return;
    }

    let restante = quantidadeNecessaria;

    let html = `
      <h4>Ordem de Separação FIFO/FEFO</h4>

      <p class="texto-fifo">
        Quantidade necessária para separar:
        <strong>${quantidadeNecessaria}</strong>
      </p>

      <table class="tabela-interna-picking">
        <thead>
          <tr>
            <th>Ordem</th>
            <th>NF</th>
            <th>Lote</th>
            <th>Validade</th>
            <th>Data Entrada</th>
            <th>Disponível</th>
            <th>Pegar</th>
          </tr>
        </thead>
        <tbody>
    `;

    lotes.forEach((lote, index) => {
      const disponivel = Number(lote.quantidade_disponivel || 0);
      let pegar = 0;

      if (restante > 0) {
        pegar = Math.min(disponivel, restante);
        restante -= pegar;
      }

      html += `
        <tr class="${pegar > 0 ? "linha-pegar-fifo" : ""}">
          <td>${index + 1}</td>
          <td>${lote.numero_nf || "-"}</td>
          <td>${lote.lote || "-"}</td>
          <td>${formatarDataFIFO(lote.validade)}</td>
          <td>${formatarDataFIFO(lote.data_nf)}</td>
          <td>${disponivel}</td>
          <td><strong>${pegar}</strong></td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    if (restante > 0) {
      html += `
        <p class="alerta-fifo">
          Atenção: ainda faltam ${restante} unidade(s) para atender o picking.
        </p>
      `;
    }

    box.innerHTML = html;

  } catch (err) {
    console.error(err);
    box.innerHTML = "Erro ao carregar FIFO/FEFO.";
  }
}

function imprimirPickingSelecionados() {
  const selecionados = pickingSelecionados
    .map(index => dadosPicking[index])
    .filter(Boolean);

  if (selecionados.length === 0) {
    alert("Selecione pelo menos um produto para imprimir.");
    return;
  }

  imprimirOrdemSeparacao(selecionados);
}

function imprimirOrdemSeparacao(lista) {
  const dataAtual = new Date().toLocaleString("pt-BR");

  let produtosHtml = "";

  lista.forEach((item, index) => {
    let enderecos = [];
    let pedidos = [];

    try {
      enderecos = JSON.parse(item.enderecos || "[]");
    } catch {
      enderecos = [];
    }

    try {
      pedidos = JSON.parse(item.pedidos || "[]");
    } catch {
      pedidos = [];
    }

    let linhasEnderecos = "";

    enderecos.forEach(e => {
      linhasEnderecos += `
        <tr>
          <td>${e.endereco || "-"}</td>
          <td>${e.rua || "-"}</td>
          <td>${e.coluna || "-"}</td>
          <td>${e.nivel || "-"}</td>
          <td>${e.quantidade_unidades || 0}</td>
        </tr>
      `;
    });

    let linhasPedidos = "";

    pedidos.forEach(p => {
      linhasPedidos += `
        <tr>
          <td>#${p.pedido_id}</td>
          <td>${p.cliente_nome}</td>
          <td>${p.quantidade_pendente}</td>
        </tr>
      `;
    });

    produtosHtml += `
      <section class="produto">
        <h2>${index + 1}. ${item.produto_nome}</h2>

        <p><strong>SKU:</strong> ${item.produto_codigo || "-"}</p>
        <p><strong>Total a separar:</strong> ${item.total_quantidade}</p>
        <p><strong>Estoque disponível:</strong> ${item.quantidade_estoque}</p>

        <h3>Endereços para Separação</h3>
        <table>
          <thead>
            <tr>
              <th>Endereço</th>
              <th>Rua</th>
              <th>Coluna</th>
              <th>Nível</th>
              <th>Qtd no Endereço</th>
            </tr>
          </thead>
          <tbody>
            ${linhasEnderecos || `<tr><td colspan="5">Sem endereço cadastrado</td></tr>`}
          </tbody>
        </table>

        <h3>Pedidos Atendidos</h3>
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Qtd Pendente</th>
            </tr>
          </thead>
          <tbody>
            ${linhasPedidos}
          </tbody>
        </table>
      </section>
    `;
  });

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Ordem de Separação</title>

      <style>
        body {
          font-family: Arial, Helvetica, sans-serif;
          color: #111827;
          padding: 28px;
        }

        .cabecalho {
          border-bottom: 4px solid #003641;
          padding-bottom: 14px;
          margin-bottom: 24px;
        }

        .cabecalho h1 {
          margin: 0;
          color: #003641;
        }

        .produto {
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 22px;
          page-break-inside: avoid;
        }

        .produto h2 {
          color: #003641;
          margin-top: 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0 18px;
        }

        th {
          background: #003641;
          color: white;
          padding: 9px;
          text-align: left;
        }

        td {
          border-bottom: 1px solid #e5e7eb;
          padding: 9px;
        }

        .assinatura {
          margin-top: 50px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 50px;
        }

        .linha-assinatura {
          border-top: 1px solid #111827;
          text-align: center;
          padding-top: 8px;
          font-size: 13px;
        }

        @media print {
          body {
            padding: 10px;
          }

          .produto {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>

    <body>
      <div class="cabecalho">
        <h1>Ordem de Separação - Picking</h1>
        <p><strong>LG Logística</strong></p>
        <p>Emitido em: ${dataAtual}</p>
        <p>Total de produtos selecionados: ${lista.length}</p>
      </div>

      ${produtosHtml}

      <div class="assinatura">
        <div class="linha-assinatura">Separador</div>
        <div class="linha-assinatura">Conferente</div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  const janela = window.open("", "_blank");
  janela.document.open();
  janela.document.write(html);
  janela.document.close();
}

function formatarDataFIFO(data) {
  if (!data) return "Sem validade";

  const dataTexto = String(data).split("T")[0];
  const partes = dataTexto.split("-");

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return data;
}

function produtoEmPicking(item) {
  try {
    const pedidos = JSON.parse(item.pedidos || "[]");
    return pedidos.some(p => p.pedido_status === "EM_PICKING");
  } catch {
    return false;
  }
}