var API_PEDIDOS = "http://localhost:3000";
var produtosPedido = [];
var itensPedido = [];

function iniciarPedidos() {
  itensPedido = [];

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

  const produto = produtosPedido.find(
    p => Number(p.id) === Number(produtoId)
  );

  if (!produto) {
    alert("Produto não encontrado.");
    return;
  }

  const itemExistente = itensPedido.find(
    item => Number(item.produto_id) === Number(produtoId)
  );

  if (itemExistente) {
    itemExistente.quantidade += quantidade;
  } else {
    itensPedido.push({
      produto_id: produto.id,
      produto_nome: produto.nome,
      produto_codigo: produto.codigo || "-",
      quantidade,
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
        <td colspan="5">Nenhum item adicionado.</td>
      </tr>
    `;
    return;
  }

  itensPedido.forEach((item, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${item.produto_nome}</td>
        <td>${item.produto_codigo}</td>
        <td>${item.quantidade}</td>
        <td>${item.estoque_atual}</td>
        <td>
          <button onclick="removerItemPedido(${index})">
            Remover
          </button>
        </td>
      </tr>
    `;
  });
}

function removerItemPedido(index) {
  itensPedido.splice(index, 1);
  renderizarItensPedido();
}

async function salvarPedido() {
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

  try {
    const res = await fetch(`${API_PEDIDOS}/pedidos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        cliente_id: clienteId,
        observacao,
        itens: itensPedido,
        ...getUsuarioAuditoria()
      })
    });

    const msg = await res.text();

    if (!res.ok) {
      alert(msg);
      return;
    }

    alert(msg);

    document.getElementById("formPedido").reset();
    itensPedido = [];
    renderizarItensPedido();
    carregarPedidos();

  } catch (err) {
    console.error(err);
    alert("Erro ao salvar pedido.");
  }
}

async function carregarPedidos() {
  const busca = document.getElementById("buscarPedido")?.value || "";

  try {
   const res = await fetch(
  `${API_PEDIDOS}/pedidos?busca=${encodeURIComponent(busca)}`
);

if (!res.ok) {
  const erro = await res.text();
  alert(erro);
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
        <td colspan="7">Nenhum pedido encontrado.</td>
      </tr>
    `;
    return;
  }

  pedidos.forEach(p => {
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
        <td>${p.observacao || "-"}</td>
        <td>
          <button onclick="cancelarPedido(${p.id})">
            Cancelar
          </button>
        </td>
      </tr>

      <tr class="linha-itens-pedido">
        <td colspan="7">
          <div class="box-itens-pedido">
            ${renderizarDetalhesItensPedido(p.itens)}
          </div>
        </td>
      </tr>
    `;
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
        </tr>
      </thead>
      <tbody>
  `;

  itens.forEach(item => {
    html += `
      <tr>
        <td>${item.produto_nome}</td>
        <td>${item.produto_codigo || "-"}</td>
        <td>${item.quantidade}</td>
        <td>${item.quantidade_separada || 0}</td>
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
  return new Date(data).toLocaleString("pt-BR");
}

function classeStatusPedido(status) {
  if (status === "ABERTO") return "status-aberto";
  if (status === "EM_PICKING") return "status-picking";
  if (status === "SEPARADO") return "status-separado";
  if (status === "EXPEDIDO") return "status-expedido";
  if (status === "CANCELADO") return "status-cancelado";
  return "status-aberto";
}