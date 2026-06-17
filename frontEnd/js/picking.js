var API_PICKING = "http://localhost:3000";
var dadosPicking = [];

function iniciarPicking() {
  carregarPicking();
}

async function carregarPicking() {
  try {
    const res = await fetch(`${API_PICKING}/picking`);

    if (!res.ok) {
      const erro = await res.text();
      alert(erro);
      return;
    }

    dadosPicking = await res.json();

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
      <span>Unidades para Separar</span>
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
        <td colspan="6">Nenhum pedido aberto para picking.</td>
      </tr>
    `;
    return;
  }

  lista.forEach((item, index) => {
    const estoque = Number(item.quantidade_estoque || 0);
    const total = Number(item.total_quantidade || 0);

    const status = estoque >= total
      ? "Estoque OK"
      : "Estoque insuficiente";

    const classe = estoque >= total
      ? "status-ok"
      : "status-insuficiente";

    tbody.innerHTML += `
      <tr>
        <td>
          <strong>${item.produto_nome}</strong>
        </td>

        <td>${item.produto_codigo || "-"}</td>

        <td>${total}</td>

        <td>${estoque}</td>

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

          <button
            class="btn-confirmar-picking"
            onclick="confirmarSeparacaoProduto(${item.produto_id})"
          >
            Separar
          </button>

          <button
            class="btn-detalhes-picking"
            onclick="verFIFOProduto(${item.produto_id})"
          >
            FIFO
          </button>
        </td>
      </tr>

      <tr
        id="detalhes-picking-${index}"
        class="linha-detalhes-picking"
      >
        <td colspan="6">
          <div class="box-detalhes-picking">
            ${renderizarPedidosProduto(item.pedidos)}
          </div>
        </td>
      </tr>
    `;
  });
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
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  return html;
}

function alternarDetalhesPicking(index) {
  const linha = document.getElementById(`detalhes-picking-${index}`);

  if (!linha) return;

  linha.classList.toggle("ativo");
}

async function iniciarSeparacaoPicking() {
  if (!dadosPicking || dadosPicking.length === 0) {
    alert("Não existem pedidos abertos para picking.");
    return;
  }

  const temEstoqueInsuficiente = dadosPicking.some(item => {
    return Number(item.quantidade_estoque || 0) <
      Number(item.total_quantidade || 0);
  });

  if (temEstoqueInsuficiente) {
    const continuar = confirm(
      "Existem produtos com estoque insuficiente. Deseja iniciar o picking mesmo assim?"
    );

    if (!continuar) return;
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

  const total = Number(item.total_quantidade || 0);
  const estoque = Number(item.quantidade_estoque || 0);

  if (estoque < total) {
    alert(
      `Estoque insuficiente para separar.\n\n` +
      `Produto: ${item.produto_nome}\n` +
      `Necessário: ${total}\n` +
      `Estoque: ${estoque}`
    );
    return;
  }

  const confirmar = confirm(
    `Confirmar separação FIFO/FEFO?\n\n` +
    `Produto: ${item.produto_nome}\n` +
    `Quantidade: ${total}`
  );

  if (!confirmar) return;

  try {
    const res = await fetch(
      `${API_PICKING}/picking/separar-produto/${produtoId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...getUsuarioAuditoria()
        })
      }
    );

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

async function verFIFOProduto(produtoId) {
  try {
    const res = await fetch(`${API_PICKING}/fifo/produto/${produtoId}`);

    if (!res.ok) {
      const erro = await res.text();
      alert(erro);
      return;
    }

    const lotes = await res.json();

    if (!lotes || lotes.length === 0) {
      alert("Nenhum lote disponível para este produto.");
      return;
    }

    let texto = "Ordem de separação FIFO/FEFO:\n\n";

    lotes.forEach((lote, index) => {
      texto += `${index + 1}. `;
      texto += `NF: ${lote.numero_nf || "-"} | `;
      texto += `Lote: ${lote.lote || "-"} | `;
      texto += `Validade: ${formatarDataFIFO(lote.validade)} | `;
      texto += `Disponível: ${lote.quantidade_disponivel}\n`;
    });

    alert(texto);

  } catch (err) {
    console.error(err);
    alert("Erro ao consultar FIFO.");
  }
}

function formatarDataFIFO(data) {
  if (!data) return "Sem validade";
  return new Date(data).toLocaleDateString("pt-BR");
}