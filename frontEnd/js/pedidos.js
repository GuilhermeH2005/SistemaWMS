var API_PEDIDOS = "http://localhost:3000";
var produtosPedido = [];
var itensPedido = [];
var pedidoEditandoId = null;

function iniciarPedidos() {
  itensPedido = [];
  pedidoEditandoId = null;

  carregarClientesPedido();
  carregarProdutosPedido();
  carregarPedidos();
  renderizarItensPedido();

  const produtoBusca = document.getElementById("produtoBuscaPedido");
  const produtoId = document.getElementById("produto_id_pedido");

  if (produtoBusca) {
    produtoBusca.addEventListener("input", () => {
      const valor = produtoBusca.value;

      const produtoSelecionado = produtosPedido.find(p =>
        valor === `${p.nome} | SKU: ${p.codigo || "-"}`
      );

      produtoId.value = produtoSelecionado ? produtoSelecionado.id : "";
    });
  }
}

async function carregarClientesPedido() {
  try {
    const res = await fetch(`${API_PEDIDOS}/clientes`);
    const clientes = await res.json();

    const select = document.getElementById("cliente_id");
    if (!select) return;

    select.innerHTML = `<option value="">Selecione o cliente</option>`;

    clientes.forEach(c => {
      select.innerHTML += `
        <option value="${c.id}">
          ${c.razao_social} - ${c.cnpj || ""}
        </option>
      `;
    });

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar clientes.");
  }
}

async function carregarProdutosPedido() {
  try {
    const res = await fetch(`${API_PEDIDOS}/produtos`);
    const produtos = await res.json();

    produtosPedido = produtos;

    const datalist = document.getElementById("listaProdutosPedido");
    if (!datalist) return;

    datalist.innerHTML = "";

    produtos.forEach(p => {
      datalist.innerHTML += `
        <option value="${p.nome} | SKU: ${p.codigo || "-"}"></option>
      `;
    });

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar produtos.");
  }
}

function adicionarItemPedido() {
  const produtoId = document.getElementById("produto_id_pedido").value;
  const quantidade = Number(document.getElementById("quantidadePedido").value || 0);

  if (!produtoId) {
    alert("Selecione um produto válido.");
    return;
  }

  if (quantidade <= 0) {
    alert("Informe uma quantidade válida.");
    return;
  }

  const produto = produtosPedido.find(p => Number(p.id) === Number(produtoId));

  if (!produto) {
    alert("Produto não encontrado.");
    return;
  }

  const valorUnitario = Number(produto.preco_venda || 0);
  const subtotal = quantidade * valorUnitario;

  const itemExistente = itensPedido.find(
    item => Number(item.produto_id) === Number(produtoId)
  );

  if (itemExistente) {
    itemExistente.quantidade += quantidade;
    itemExistente.subtotal = itemExistente.quantidade * itemExistente.valor_unitario;
  } else {
    itensPedido.push({
      produto_id: produto.id,
      produto_nome: produto.nome,
      produto_codigo: produto.codigo || "-",
      quantidade,
      quantidade_separada: 0,
      valor_unitario: valorUnitario,
      subtotal,
      estoque_atual: Number(produto.quantidade_estoque || 0)
    });
  }

  document.getElementById("produtoBuscaPedido").value = "";
  document.getElementById("produto_id_pedido").value = "";
  document.getElementById("quantidadePedido").value = "";

  renderizarItensPedido();
}

function renderizarItensPedido() {
  const tbody = document.getElementById("listaItensPedido");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (itensPedido.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">Nenhum item adicionado.</td>
      </tr>
    `;
    atualizarTotalPedido();
    return;
  }

  itensPedido.forEach((item, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${item.produto_nome}</td>
        <td>${item.produto_codigo}</td>
        <td>${item.quantidade}</td>
        <td>${formatarMoedaPedido(item.valor_unitario)}</td>
        <td>${formatarMoedaPedido(item.subtotal)}</td>
        <td>${item.estoque_atual}</td>
        <td>
          <button type="button" onclick="removerItemPedido(${index})">
            Remover
          </button>
        </td>
      </tr>
    `;
  });

  atualizarTotalPedido();
}

function atualizarTotalPedido() {
  const campo = document.getElementById("totalPedido");
  if (!campo) return;

  const total = itensPedido.reduce((soma, item) => {
    return soma + Number(item.subtotal || 0);
  }, 0);

  campo.value = formatarMoedaPedido(total);
}

function removerItemPedido(index) {
  const item = itensPedido[index];

  if (pedidoEditandoId && Number(item.quantidade_separada || 0) > 0) {
    alert("Não é possível remover item já separado no picking.");
    return;
  }

  itensPedido.splice(index, 1);
  renderizarItensPedido();
}

async function salvarPedido(confirmarEstoqueInsuficiente = false) {
  const clienteId = document.getElementById("cliente_id").value;
  const observacao = document.getElementById("observacao").value;

  if (!clienteId) {
    alert("Selecione o cliente.");
    return;
  }

  if (itensPedido.length === 0) {
    alert("Adicione pelo menos um item ao pedido.");
    return;
  }

  const dados = {
    cliente_id: clienteId,
    observacao,
    itens: itensPedido,
    confirmar_estoque_insuficiente: confirmarEstoqueInsuficiente,
    ...getUsuarioAuditoria()
  };

  const url = pedidoEditandoId
    ? `${API_PEDIDOS}/pedidos/${pedidoEditandoId}`
    : `${API_PEDIDOS}/pedidos`;

  const metodo = pedidoEditandoId ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(dados)
    });

    if (res.status === 409) {
      const resposta = await res.json();

      let texto = `${resposta.mensagem}\n\n`;

      resposta.divergencias.forEach(d => {
        texto +=
          `Produto: ${d.produto_nome}\n` +
          `Pedido: ${d.quantidade_pedido}\n` +
          `Disponível: ${d.estoque_disponivel}\n` +
          `Diferença: ${d.diferenca}\n\n`;
      });

      texto += "Deseja salvar mesmo assim?";

      if (confirm(texto)) {
        return salvarPedido(true);
      }

      return;
    }

    const msg = await res.text();

    if (!res.ok) {
      alert(msg);
      return;
    }

    alert(msg);
    limparFormularioPedido();
    carregarPedidos();

  } catch (err) {
    console.error(err);
    alert("Erro ao salvar pedido.");
  }
}

function limparFormularioPedido() {
  document.getElementById("formPedido").reset();

  itensPedido = [];
  pedidoEditandoId = null;

  const btn = document.querySelector(".btn-salvar-pedido");
  if (btn) btn.textContent = "Salvar Pedido";

  renderizarItensPedido();
}

async function carregarPedidos() {
  const busca = document.getElementById("buscarPedido")?.value || "";

  try {
    const res = await fetch(
      `${API_PEDIDOS}/pedidos?busca=${encodeURIComponent(busca)}`
    );

    if (!res.ok) {
      alert(await res.text());
      return;
    }

    const pedidos = await res.json();
    renderizarPedidos(pedidos);

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar pedidos.");
  }
}

function renderizarPedidos(pedidos) {
  const tbody = document.getElementById("listaPedidos");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (pedidos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">Nenhum pedido encontrado.</td>
      </tr>
    `;
    return;
  }

  pedidos.forEach(p => {
    const podeEditar = p.status === "ABERTO" || p.status === "EM_PICKING";

    tbody.innerHTML += `
      <tr>
        <td>${p.id}</td>
        <td>${p.cliente_nome || "-"}</td>
        <td>${formatarDataPedido(p.data_pedido)}</td>
        <td>
          <span class="${classeStatusPedido(p.status)}">
            ${p.status}
          </span>
        </td>
        <td>${p.total_itens || 0}</td>
        <td>${formatarMoedaPedido(p.valor_total || 0)}</td>
        <td>${p.observacao || "-"}</td>
        <td>
          ${
            podeEditar
              ? `<button onclick='editarPedido(${JSON.stringify(p)})'>Editar</button>`
              : ""
          }

          ${
            podeEditar
              ? `<button onclick="cancelarPedido(${p.id})">Cancelar</button>`
              : ""
          }
        </td>
      </tr>

      <tr class="linha-itens-pedido">
        <td colspan="8">
          <div class="box-itens-pedido">
            ${renderizarDetalhesItensPedido(p.itens)}
          </div>
        </td>
      </tr>
    `;
  });
}

function editarPedido(pedido) {
  if (!(pedido.status === "ABERTO" || pedido.status === "EM_PICKING")) {
    alert("Este pedido não pode mais ser editado.");
    return;
  }

  pedidoEditandoId = pedido.id;

  document.getElementById("cliente_id").value = pedido.cliente_id;
  document.getElementById("observacao").value = pedido.observacao || "";

  let itens = [];

  try {
    itens = JSON.parse(pedido.itens || "[]");
  } catch {
    itens = [];
  }

  itensPedido = itens.map(item => ({
    produto_id: item.produto_id,
    produto_nome: item.produto_nome,
    produto_codigo: item.produto_codigo || "-",
    quantidade: Number(item.quantidade || 0),
    quantidade_separada: Number(item.quantidade_separada || 0),
    valor_unitario: Number(item.valor_unitario || 0),
    subtotal: Number(item.subtotal || 0),
    estoque_atual: Number(item.quantidade_estoque || 0)
  }));

  const btn = document.querySelector(".btn-salvar-pedido");
  if (btn) btn.textContent = "Atualizar Pedido";

  renderizarItensPedido();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function renderizarDetalhesItensPedido(itensJson) {
  let itens = [];

  try {
    itens = JSON.parse(itensJson || "[]");
  } catch {
    itens = [];
  }

  if (itens.length === 0) {
    return `<p>Nenhum item encontrado.</p>`;
  }

  let html = `
    <table class="tabela-itens-interna">
      <thead>
        <tr>
          <th>Produto</th>
          <th>SKU</th>
          <th>Qtd</th>
          <th>Separado</th>
          <th>Pendente</th>
          <th>Valor Unit.</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
  `;

  itens.forEach(item => {
    const qtd = Number(item.quantidade || 0);
    const separado = Number(item.quantidade_separada || 0);

    html += `
      <tr>
        <td>${item.produto_nome}</td>
        <td>${item.produto_codigo || "-"}</td>
        <td>${qtd}</td>
        <td>${separado}</td>
        <td>${Math.max(qtd - separado, 0)}</td>
        <td>${formatarMoedaPedido(item.valor_unitario || 0)}</td>
        <td>${formatarMoedaPedido(item.subtotal || 0)}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  return html;
}

async function cancelarPedido(id) {
  if (!confirm("Deseja cancelar este pedido?")) return;

  try {
    const res = await fetch(`${API_PEDIDOS}/pedidos/${id}/cancelar`, {
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
    carregarPedidos();

  } catch (err) {
    console.error(err);
    alert("Erro ao cancelar pedido.");
  }
}

function formatarDataPedido(data) {
  if (!data) return "-";

  const dataObj = new Date(data);
  if (isNaN(dataObj.getTime())) return "-";

  return dataObj.toLocaleString("pt-BR");
}

function formatarMoedaPedido(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function classeStatusPedido(status) {
  if (status === "ABERTO") return "status-aberto";
  if (status === "EM_PICKING") return "status-picking";
  if (status === "SEPARADO") return "status-separado";
  if (status === "EXPEDIDO") return "status-expedido";
  if (status === "EXPEDIDO_PARCIAL") return "status-expedido";
  if (status === "CANCELADO") return "status-cancelado";
  return "status-aberto";
}