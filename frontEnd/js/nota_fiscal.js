var API_NF = "http://localhost:3000";
var produtosNF = [];
var itensNotaFiscal = [];

function iniciarNotaFiscal() {
  itensNotaFiscal = [];

  carregarPedidosSeparadosNF();
  carregarClientesNF();
  carregarFornecedoresNF();
  carregarProdutosNF();
  carregarNotasFiscais();
  renderizarItensNotaFiscal();

  const produtoBusca = document.getElementById("produtoBuscaNF");
  const produtoId = document.getElementById("produto_id_nf");

  if (produtoBusca) {
    produtoBusca.addEventListener("input", () => {
      const valor = produtoBusca.value;

      const produtoSelecionado = produtosNF.find(p =>
        valor === `${p.nome} | SKU: ${p.codigo || "-"}`
      );

      produtoId.value = produtoSelecionado ? produtoSelecionado.id : "";

      if (produtoSelecionado) {
        document.getElementById("valor_unitario_nf").value =
          Number(produtoSelecionado.preco_venda || 0).toFixed(2);
      }
    });
  }
}

function alterarTipoNotaFiscal() {
  const tipo = document.getElementById("tipo_nf").value;

  document.querySelector(".campo-venda").classList.add("hidden");
  document.querySelector(".campo-fornecedor").classList.add("hidden");
  document.querySelector(".campo-cliente").classList.add("hidden");
  document.getElementById("areaItensNota").classList.add("hidden");

  if (tipo === "VENDA") {
    document.querySelector(".campo-venda").classList.remove("hidden");
  }

  if (tipo === "DEVOLUCAO_FORNECEDOR") {
    document.querySelector(".campo-fornecedor").classList.remove("hidden");
    document.getElementById("areaItensNota").classList.remove("hidden");
  }

  if (tipo === "DEVOLUCAO_CLIENTE") {
    document.querySelector(".campo-cliente").classList.remove("hidden");
    document.getElementById("areaItensNota").classList.remove("hidden");
  }
}

async function carregarPedidosSeparadosNF() {
  const res = await fetch(`${API_NF}/nf/pedidos-separados`);
  const pedidos = await res.json();

  const select = document.getElementById("pedido_id");

  if (!select) return;

  select.innerHTML = `<option value="">Selecione o pedido</option>`;

  pedidos.forEach(p => {
    select.innerHTML += `
      <option value="${p.id}">
        Pedido #${p.id} - ${p.cliente_nome}
      </option>
    `;
  });
}

async function carregarClientesNF() {
  const res = await fetch(`${API_NF}/clientes`);
  const clientes = await res.json();

  const select = document.getElementById("cliente_id_nf");

  if (!select) return;

  select.innerHTML = `<option value="">Selecione o cliente</option>`;

  clientes.forEach(c => {
    select.innerHTML += `
      <option value="${c.id}">
        ${c.razao_social} - ${c.cnpj || ""}
      </option>
    `;
  });
}

async function carregarFornecedoresNF() {
  const res = await fetch(`${API_NF}/fornecedores`);
  const fornecedores = await res.json();

  const select = document.getElementById("fornecedor_id_nf");

  if (!select) return;

  select.innerHTML = `<option value="">Selecione o fornecedor</option>`;

  fornecedores.forEach(f => {
    select.innerHTML += `
      <option value="${f.id}">
        ${f.nome}
      </option>
    `;
  });
}

async function carregarProdutosNF() {
  const res = await fetch(`${API_NF}/produtos`);
  const produtos = await res.json();

  produtosNF = produtos;

  const datalist = document.getElementById("listaProdutosNF");

  if (!datalist) return;

  datalist.innerHTML = "";

  produtos.forEach(p => {
    datalist.innerHTML += `
      <option value="${p.nome} | SKU: ${p.codigo || "-"}"></option>
    `;
  });
}

function adicionarItemNotaFiscal() {
  const produtoId = document.getElementById("produto_id_nf").value;
  const quantidade = Number(document.getElementById("quantidade_nf").value || 0);
  const valorUnitario = Number(document.getElementById("valor_unitario_nf").value || 0);

  if (!produtoId) {
    alert("Selecione um produto válido.");
    return;
  }

  if (quantidade <= 0) {
    alert("Informe uma quantidade válida.");
    return;
  }

  const produto = produtosNF.find(p => Number(p.id) === Number(produtoId));

  itensNotaFiscal.push({
    produto_id: produto.id,
    produto_nome: produto.nome,
    produto_codigo: produto.codigo || "-",
    quantidade,
    valor_unitario: valorUnitario
  });

  document.getElementById("produtoBuscaNF").value = "";
  document.getElementById("produto_id_nf").value = "";
  document.getElementById("quantidade_nf").value = "";
  document.getElementById("valor_unitario_nf").value = "";

  renderizarItensNotaFiscal();
}

function renderizarItensNotaFiscal() {
  const tbody = document.getElementById("listaItensNFsaida");

  if (!tbody) return;

  tbody.innerHTML = "";

  if (itensNotaFiscal.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">Nenhum item adicionado.</td>
      </tr>
    `;
    return;
  }

  itensNotaFiscal.forEach((item, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${item.produto_nome}</td>
        <td>${item.produto_codigo}</td>
        <td>${item.quantidade}</td>
        <td>R$ ${Number(item.valor_unitario || 0).toFixed(2)}</td>
        <td>
          <button onclick="removerItemNotaFiscal(${index})">
            Remover
          </button>
        </td>
      </tr>
    `;
  });
}

function removerItemNotaFiscal(index) {
  itensNotaFiscal.splice(index, 1);
  renderizarItensNotaFiscal();
}

async function salvarNotaFiscal() {
  const tipo = document.getElementById("tipo_nf").value;

  const dados = {
    tipo,
    numero_nf: document.getElementById("numero_nf_saida").value,
    serie_nf: document.getElementById("serie_nf_saida").value,
    data_nf: document.getElementById("data_nf_saida").value,
    pedido_id: document.getElementById("pedido_id").value || null,
    fornecedor_id: document.getElementById("fornecedor_id_nf").value || null,
    cliente_id: document.getElementById("cliente_id_nf").value || null,
    observacao: document.getElementById("observacao_nf").value,
    itens: itensNotaFiscal,
    ...getUsuarioAuditoria()
  };

  if (!dados.tipo || !dados.numero_nf || !dados.data_nf) {
    alert("Informe tipo, número e data da NF.");
    return;
  }

  if (tipo === "VENDA" && !dados.pedido_id) {
    alert("Selecione o pedido da venda.");
    return;
  }

  if (tipo !== "VENDA" && itensNotaFiscal.length === 0) {
    alert("Adicione pelo menos um item.");
    return;
  }

  const confirmar = confirm("Deseja emitir esta nota?");

  if (!confirmar) return;

  try {
    const res = await fetch(`${API_NF}/notas-fiscais`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(dados)
    });

    const msg = await res.text();

    if (!res.ok) {
      alert(msg);
      return;
    }

    alert(msg);

    document.getElementById("formNotaFiscal").reset();
    itensNotaFiscal = [];
    renderizarItensNotaFiscal();
    alterarTipoNotaFiscal();
    carregarNotasFiscais();
    carregarPedidosSeparadosNF();

  } catch (err) {
    console.error(err);
    alert("Erro ao emitir nota fiscal.");
  }
}

async function carregarNotasFiscais() {
  const res = await fetch(`${API_NF}/notas-fiscais`);
  const notas = await res.json();

  const tbody = document.getElementById("listaNotasFiscais");

  if (!tbody) return;

  tbody.innerHTML = "";

  if (notas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">Nenhuma nota emitida.</td>
      </tr>
    `;
    return;
  }

  notas.forEach(n => {
    tbody.innerHTML += `
      <tr>
        <td>${n.id}</td>
        <td>${n.tipo}</td>
        <td>${n.numero_nf}</td>
        <td>${n.serie_nf || "-"}</td>
        <td>${n.data_nf || "-"}</td>
        <td><span class="status-emitida">${n.status}</span></td>
        <td>${n.observacao || "-"}</td>
      </tr>
    `;
  });
}