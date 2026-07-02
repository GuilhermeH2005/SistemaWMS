var API_NF = "http://localhost:3000";

var pedidosNF = [];
var itensNotaFiscal = [];
var itensOrigemDevolucao = [];

function iniciarNotaFiscal() {
  itensNotaFiscal = [];

  ["valor_frete_nf", "valor_desconto_nf", "outras_despesas_nf"].forEach(id => {
  const campo = document.getElementById(id);
  if (campo) {
    campo.addEventListener("input", calcularTotaisNF);
  }
});

  prepararCamposNotaFiscal();
  carregarPedidosSeparadosNF();
  carregarClientesNF();
  carregarFornecedoresNF();
  carregarProdutosNF();
  carregarNotasFiscais();
  renderizarItensNotaFiscal();
}

function prepararCamposNotaFiscal() {
  gerarNumeroNotaFiscal();
  preencherDataAtualNF();

  const numero = document.getElementById("numero_nf_saida");
  if (numero) {
    numero.readOnly = true;
    numero.style.background = "#eef2f7";
    numero.style.cursor = "not-allowed";
  }

  const tipo = document.getElementById("tipo_nf");
  if (tipo) {
    tipo.addEventListener("change", alterarTipoNotaFiscal);
  }

  const pedido = document.getElementById("pedido_id");
  if (pedido) {
    pedido.addEventListener("change", carregarItensPedidoNF);
  }
}

function gerarNumeroNotaFiscal() {
  const campo = document.getElementById("numero_nf_saida");
  if (!campo) return;

  const ano = new Date().getFullYear();
  const numero = Math.floor(100000 + Math.random() * 900000);

  campo.value = `NF-${ano}-${numero}`;
}

function preencherDataAtualNF() {
  const campo = document.getElementById("data_nf_saida");
  if (!campo) return;

  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, "0");
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const ano = hoje.getFullYear();

  campo.value = `${dia}/${mes}/${ano}`;
}

function converterDataNFBanco(dataTexto) {
  if (!dataTexto) return "";

  const partes = dataTexto.split("/");
  if (partes.length !== 3) return "";

  const dia = partes[0].padStart(2, "0");
  const mes = partes[1].padStart(2, "0");
  const ano = partes[2];

  if (ano.length !== 4) return "";

  return `${ano}-${mes}-${dia}`;
}

function formatarDataNF(data) {
  if (!data) return "-";

  const dataTexto = String(data).split("T")[0];
  if (dataTexto === "0000-00-00") return "-";

  const partes = dataTexto.split("-");
  if (partes.length !== 3) return "-";

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function alterarTipoNotaFiscal() {
  const tipo = document.getElementById("tipo_nf").value;

  document.querySelector(".campo-venda")?.classList.add("hidden");
  document.querySelector(".campo-fornecedor")?.classList.add("hidden");
  document.querySelector(".campo-cliente")?.classList.add("hidden");
  document.querySelector(".campo-nf-venda-origem")?.classList.add("hidden");
  document.querySelector(".campo-nf-entrada-origem")?.classList.add("hidden");
  document.querySelector(".campo-origem-devolucao-fornecedor")?.classList.add("hidden");
  document.querySelector(".campo-divergencia-origem")?.classList.add("hidden");

  document.getElementById("areaItensNota")?.classList.add("hidden");
  document.getElementById("formItemManualNF")?.classList.add("hidden");

  const cliente = document.getElementById("cliente_id_nf");
  if (cliente) {
    cliente.disabled = false;
    cliente.value = "";
  }

  const fornecedor = document.getElementById("fornecedor_id_nf");
  if (fornecedor) {
    fornecedor.disabled = false;
    fornecedor.value = "";
  }

  const origem = document.getElementById("origem_devolucao");
  if (origem) origem.value = "ESTOQUE";

  const divergencia = document.getElementById("divergencia_origem_id");
  if (divergencia) {
    divergencia.innerHTML = `<option value="">Selecione a divergência</option>`;
    divergencia.value = "";
  }

  const nfVenda = document.getElementById("nf_venda_origem_id");
  if (nfVenda) nfVenda.value = "";

  const nfEntrada = document.getElementById("nf_entrada_origem_id");
  if (nfEntrada) nfEntrada.value = "";

  const thQtd = document.getElementById("thQtdNF");
  if (thQtd) {
    thQtd.textContent =
      tipo === "VENDA" ? "Qtd Física/Faturada" : "Qtd Devolvida";
  }

  const areaValoresExtras = document.getElementById("areaValoresExtrasNF");
  if (areaValoresExtras) {
    areaValoresExtras.classList.add("hidden");
    areaValoresExtras.style.display = "";
  }

  itensNotaFiscal = [];
  itensOrigemDevolucao = [];
  renderizarItensNotaFiscal();

  if (tipo === "VENDA") {
    document.querySelector(".campo-venda")?.classList.remove("hidden");
    document.getElementById("areaItensNota")?.classList.remove("hidden");

    if (areaValoresExtras) {
      areaValoresExtras.classList.remove("hidden");
    }
  }

  if (tipo === "DEVOLUCAO_CLIENTE") {
    document.querySelector(".campo-cliente")?.classList.remove("hidden");
    document.querySelector(".campo-nf-venda-origem")?.classList.remove("hidden");
    document.getElementById("areaItensNota")?.classList.remove("hidden");

    if (cliente) cliente.disabled = true;

    carregarNFsVendaOrigem();
    zerarValoresExtrasNF();
  }

  if (tipo === "DEVOLUCAO_FORNECEDOR") {
    document.querySelector(".campo-fornecedor")?.classList.remove("hidden");
    document.querySelector(".campo-origem-devolucao-fornecedor")?.classList.remove("hidden");
    document.querySelector(".campo-nf-entrada-origem")?.classList.remove("hidden");

    document.getElementById("areaItensNota")?.classList.remove("hidden");
    document.getElementById("formItemManualNF")?.classList.add("hidden");

    carregarNFsEntradaOrigem();
    zerarValoresExtrasNF();
  }
}

function alterarOrigemDevolucaoFornecedor() {
  const origem = document.getElementById("origem_devolucao")?.value || "ESTOQUE";

  itensNotaFiscal = [];
  itensOrigemDevolucao = [];
  renderizarItensNotaFiscal();

  document.querySelector(".campo-nf-entrada-origem")?.classList.add("hidden");
  document.querySelector(".campo-divergencia-origem")?.classList.add("hidden");

  if (origem === "ESTOQUE") {
    document.querySelector(".campo-nf-entrada-origem")?.classList.remove("hidden");
    carregarNFsEntradaOrigem();
  }

  if (origem === "DIVERGENCIA") {
    document.querySelector(".campo-divergencia-origem")?.classList.remove("hidden");
    carregarDivergenciasParaNF();
  }
}

async function carregarNFsVendaOrigem() {
  const res = await fetch(`${API_NF}/nf/origem/vendas`);

  if (!res.ok) {
    alert(await res.text());
    return;
  }

  const notas = await res.json();
  const select = document.getElementById("nf_venda_origem_id");

  if (!select) return;

  select.innerHTML = `<option value="">Selecione a NF de venda</option>`;

  notas.forEach(n => {
  select.innerHTML += `
    <option value="${n.id}" data-cliente-id="${n.cliente_id}">
      ${n.numero_nf} - ${n.cliente_nome} - ${formatarMoedaNF(n.valor_total || 0)}
    </option>
  `;
});
}

async function carregarItensNFVendaOrigem() {
  const nfId = document.getElementById("nf_venda_origem_id").value;

  itensNotaFiscal = [];
  itensOrigemDevolucao = [];

  if (!nfId) {
    renderizarItensNotaFiscal();
    return;
  }

  const nfSelecionada = document.querySelector(
    `#nf_venda_origem_id option[value="${nfId}"]`
  );

  const clienteId = nfSelecionada?.dataset.clienteId;
  if (clienteId) {
    document.getElementById("cliente_id_nf").value = clienteId;
  }

  const res = await fetch(`${API_NF}/nf/origem/vendas/${nfId}/itens`);

  if (!res.ok) {
    alert(await res.text());
    return;
  }

  itensOrigemDevolucao = await res.json();

  itensNotaFiscal = itensOrigemDevolucao.map(item => ({
    nf_item_origem_id: item.item_id,
    produto_id: item.produto_id,
    produto_nome: item.produto_nome,
    produto_codigo: item.produto_codigo,
    quantidade_pedido: Number(item.quantidade_disponivel_devolucao || 0),
    quantidade: 0,
    quantidade_faturada: 0,
    valor_unitario: Number(item.valor_unitario || 0),
    quantidade_maxima: Number(item.quantidade_disponivel_devolucao || 0)
  }));

  renderizarItensNotaFiscalEditavelDevolucao();
}
async function carregarNFsEntradaOrigem() {
  const res = await fetch(`${API_NF}/nf/origem/entradas`);

  if (!res.ok) return;

  const entradas = await res.json();

  const select = document.getElementById("nf_entrada_origem_id");

  select.innerHTML =
    `<option value="">Selecione a NF de entrada</option>`;

  entradas.forEach(e => {
    select.innerHTML += `
      <option
        value="${e.numero_nf}"
        data-fornecedor-id="${e.fornecedor_id}"
      >
        NF ${e.numero_nf} - ${e.fornecedor_nome}
      </option>
    `;
  });
}

async function carregarItensNFEntradaOrigem() {
  const numeroNF = document.getElementById("nf_entrada_origem_id").value;

  itensNotaFiscal = [];
  itensOrigemDevolucao = [];

  if (!numeroNF) {
    document.getElementById("fornecedor_id_nf").value = "";
    renderizarItensNotaFiscal();
    return;
  }

  const opcao = document.querySelector(
    `#nf_entrada_origem_id option[value="${numeroNF}"]`
  );

  const fornecedorId = opcao?.dataset.fornecedorId;

  if (fornecedorId) {
    document.getElementById("fornecedor_id_nf").value = fornecedorId;
  }

  const res = await fetch(`${API_NF}/nf/origem/entradas/${numeroNF}/itens`);

  if (!res.ok) {
    alert(await res.text());
    return;
  }

  itensOrigemDevolucao = await res.json();

  itensNotaFiscal = itensOrigemDevolucao.map(item => ({
    entrada_item_origem_id: item.entrada_id,
    produto_id: item.produto_id,
    produto_nome: item.produto_nome,
    produto_codigo: item.produto_codigo,
    quantidade_pedido: Number(item.quantidade_disponivel_devolucao || 0),
    quantidade: 0,
    quantidade_faturada: 0,
    valor_unitario: Number(item.valor_unitario || 0),
    quantidade_maxima: Number(item.quantidade_disponivel_devolucao || 0)
  }));

  renderizarItensNotaFiscalEditavelDevolucao();
}

function renderizarItensNotaFiscalEditavelDevolucao() {
  const tbody = document.getElementById("listaItensNFsaida");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (itensNotaFiscal.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">Nenhum item carregado.</td>
      </tr>
    `;
    calcularTotaisNF();
    return;
  }

  itensNotaFiscal.forEach((item, index) => {
  tbody.innerHTML += `
    <tr>
      <td>${item.produto_nome}</td>
      <td>${item.produto_codigo || "-"}</td>
      <td>${item.quantidade_maxima}</td>
      <td>
        <input
          type="number"
          min="0"
          max="${item.quantidade_maxima}"
          value="${item.quantidade || 0}"
          onchange="alterarQuantidadeDevolucaoNF(${index}, this.value)"
          style="width:90px"
        >
      </td>
      <td>${formatarMoedaNF(item.valor_unitario)}</td>
      <td>${formatarMoedaNF(
        Number(item.quantidade || 0) *
        Number(item.valor_unitario || 0)
      )}</td>
    </tr>
  `;
});

  calcularTotaisNF();
}

function alterarQuantidadeDevolucaoNF(index, valor) {
  const item = itensNotaFiscal[index];
  if (!item) return;

  const qtd = Number(valor || 0);
  const max = Number(item.quantidade_maxima || 0);

  if (qtd < 0) {
    alert("Quantidade inválida.");
    item.quantidade = 0;
  } else if (qtd > max) {
    alert(`Quantidade máxima para devolução: ${max}`);
    item.quantidade = max;
  } else {
    item.quantidade = qtd;
  }

  item.quantidade_faturada = item.quantidade;

  renderizarItensNotaFiscalEditavelDevolucao();
}



function zerarValoresExtrasNF() {
  const frete = document.getElementById("valor_frete_nf");
  const desconto = document.getElementById("valor_desconto_nf");
  const outras = document.getElementById("outras_despesas_nf");
  const total = document.getElementById("valor_total_nf");

  if (frete) frete.value = 0;
  if (desconto) desconto.value = 0;
  if (outras) outras.value = 0;
  if (total) total.value = "R$ 0,00";

  calcularTotaisNF();
}

async function transmitirNotaFiscalSelecionada() {
  const id = prompt("Digite o ID da NF que deseja transmitir:");

  if (!id) return;

  if (!confirm(`Deseja transmitir a NF #${id}? Após transmitir, a data da NF será gravada com a data de hoje.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_NF}/notas-fiscais/${id}/transmitir`, {
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
    carregarNotasFiscais();
    carregarPedidosSeparadosNF();

  } catch (err) {
    console.error(err);
    alert("Erro ao transmitir NF.");
  }
}

async function carregarPedidosSeparadosNF() {
  const res = await fetch(`${API_NF}/nf/pedidos-separados`);

  if (!res.ok) return;

  pedidosNF = await res.json();

  const select = document.getElementById("pedido_id");
  if (!select) return;

  select.innerHTML = `<option value="">Selecione o pedido</option>`;

  pedidosNF.forEach(p => {
    select.innerHTML += `
      <option value="${p.id}">
        Pedido #${p.id} - ${p.cliente_nome} - ${p.status}
      </option>
    `;
  });
}

async function carregarItensPedidoNF() {
  const pedidoId = document.getElementById("pedido_id").value;

  itensNotaFiscal = [];

  if (!pedidoId) {
    renderizarItensNotaFiscal();
    return;
  }

  const res = await fetch(`${API_NF}/nf/pedido/${pedidoId}/itens`);

  if (!res.ok) {
    alert(await res.text());
    return;
  }

  const itens = await res.json();

  itensNotaFiscal = itens
    .filter(item => Number(item.quantidade_faturada || 0) > 0)
    .map(item => ({
      produto_id: item.produto_id,
      produto_nome: item.produto_nome,
      produto_codigo: item.produto_codigo,
      quantidade_pedido: Number(item.quantidade_pedido || 0),
      quantidade: Number(item.quantidade_faturada || 0),
      quantidade_faturada: Number(item.quantidade_faturada || 0),
      valor_unitario: Number(item.valor_unitario || 0)
    }));

  document.getElementById("areaItensNota")?.classList.remove("hidden");
  renderizarItensNotaFiscal();
}

async function carregarClientesNF() {
  const res = await fetch(`${API_NF}/clientes`);
  if (!res.ok) return;

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
  if (!res.ok) return;

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
  if (!res.ok) return;

  produtosNF = await res.json();

  const datalist = document.getElementById("listaProdutosNF");
  if (!datalist) return;

  datalist.innerHTML = "";

  produtosNF.forEach(p => {
    datalist.innerHTML += `
      <option value="${p.nome} | SKU: ${p.codigo || "-"}"></option>
    `;
  });

  const produtoBusca = document.getElementById("produtoBuscaNF");
  const produtoId = document.getElementById("produto_id_nf");

  if (produtoBusca) {
    produtoBusca.addEventListener("input", () => {
      const valor = produtoBusca.value;

      const produto = produtosNF.find(p =>
        valor === `${p.nome} | SKU: ${p.codigo || "-"}`
      );

      produtoId.value = produto ? produto.id : "";

      if (produto) {
        document.getElementById("valor_unitario_nf").value =
          Number(produto.preco_venda || produto.custo || 0).toFixed(2);
      }
    });
  }
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

  if (!produto) {
    alert("Produto não encontrado.");
    return;
  }

  itensNotaFiscal.push({
    produto_id: produto.id,
    produto_nome: produto.nome,
    produto_codigo: produto.codigo || "-",
    quantidade_pedido: quantidade,
    quantidade,
    quantidade_faturada: quantidade,
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
        <td colspan="6">Nenhum item carregado.</td>
      </tr>
    `;
    atualizarTotalNF();
    return;
  }

  itensNotaFiscal.forEach((item, index) => {
    const subtotal = Number(item.quantidade || 0) * Number(item.valor_unitario || 0);

    tbody.innerHTML += `
      <tr>
        <td>${item.produto_nome}</td>
        <td>${item.produto_codigo || "-"}</td>
        <td>${item.quantidade_pedido || item.quantidade}</td>
        <td>${item.quantidade}</td>
        <td>${formatarMoedaNF(item.valor_unitario)}</td>
        <td>${formatarMoedaNF(subtotal)}</td>
      </tr>
    `;
  });

  calcularTotaisNF();
}

function atualizarTotalNF() {
  const campo = document.getElementById("total_nf");
  if (!campo) return;

  const total = itensNotaFiscal.reduce((soma, item) => {
    return soma + Number(item.quantidade || 0) * Number(item.valor_unitario || 0);
  }, 0);

  campo.value = formatarMoedaNF(total);
}

function removerItemNotaFiscal(index) {
  itensNotaFiscal.splice(index, 1);
  renderizarItensNotaFiscal();
}

async function salvarNotaFiscal() {
  const tipo = document.getElementById("tipo_nf").value;

  const usarValoresExtras = tipo === "VENDA";

  const valorFrete = usarValoresExtras
    ? Number(document.getElementById("valor_frete_nf")?.value || 0)
    : 0;

  const valorDesconto = usarValoresExtras
    ? Number(document.getElementById("valor_desconto_nf")?.value || 0)
    : 0;

  const outrasDespesas = usarValoresExtras
    ? Number(document.getElementById("outras_despesas_nf")?.value || 0)
    : 0;

  const dados = {
    tipo,
    numero_nf: document.getElementById("numero_nf_saida").value,
    serie_nf: document.getElementById("serie_nf_saida").value || "1",
    data_nf: null,

    origem_devolucao: document.getElementById("origem_devolucao")?.value || null,
    divergencia_origem_id: document.getElementById("divergencia_origem_id")?.value || null,

    nf_origem_id: document.getElementById("nf_venda_origem_id")?.value || null,
    entrada_origem_id: document.getElementById("nf_entrada_origem_id")?.value || null,

    pedido_id: document.getElementById("pedido_id").value || null,
    fornecedor_id: document.getElementById("fornecedor_id_nf")?.value || null,
    cliente_id: document.getElementById("cliente_id_nf")?.value || null,
    observacao: document.getElementById("observacao_nf")?.value || "",

    valor_frete: valorFrete,
    valor_desconto: valorDesconto,
    outras_despesas: outrasDespesas,

    itens: itensNotaFiscal,
    ...getUsuarioAuditoria()
  };

  if (!dados.tipo || !dados.numero_nf) {
    alert("Informe tipo e número da NF.");
    return;
  }

  if (tipo === "VENDA" && !dados.pedido_id) {
    alert("Selecione o pedido da venda.");
    return;
  }

  if (tipo === "VENDA" && itensNotaFiscal.length === 0) {
    alert("Este pedido não possui quantidade física separada para faturar.");
    return;
  }

  if (tipo === "DEVOLUCAO_FORNECEDOR" && !dados.fornecedor_id) {
    alert("Selecione o fornecedor.");
    return;
  }

  if (tipo === "DEVOLUCAO_CLIENTE" && !dados.cliente_id) {
    alert("Selecione o cliente.");
    return;
  }

  if (
    (tipo === "DEVOLUCAO_FORNECEDOR" || tipo === "DEVOLUCAO_CLIENTE") &&
    itensNotaFiscal.length === 0
  ) {
    alert("Adicione pelo menos um item para a devolução.");
    return;
  }

  if (tipo === "DEVOLUCAO_CLIENTE") {
  if (!dados.nf_origem_id) {
    alert("Selecione a NF de venda original.");
    return;
  }

  dados.itens = itensNotaFiscal.filter(i => Number(i.quantidade || 0) > 0);

  if (dados.itens.length === 0) {
    alert("Informe ao menos uma quantidade devolvida.");
    return;
  }
}

if (tipo === "DEVOLUCAO_FORNECEDOR") {

  if (!dados.origem_devolucao) {
    alert("Selecione a origem da devolução.");
    return;
  }

  if (
    dados.origem_devolucao === "ESTOQUE" &&
    !document.getElementById("nf_entrada_origem_id").value
  ) {
    alert("Selecione a NF de entrada original.");
    return;
  }

  if (
    dados.origem_devolucao === "DIVERGENCIA" &&
    !dados.divergencia_origem_id
  ) {
    alert("Selecione a divergência de origem.");
    return;
  }
}

  if (!confirm("Deseja salvar o espelho desta nota fiscal?")) return;

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
  prepararCamposNotaFiscal();
  alterarTipoNotaFiscal();
  renderizarItensNotaFiscal();
  carregarPedidosSeparadosNF();
  carregarNotasFiscais();
}

function calcularTotaisNF() {
  const valorProdutos = itensNotaFiscal.reduce((soma, item) => {
    return soma + Number(item.quantidade || 0) * Number(item.valor_unitario || 0);
  }, 0);

  const frete = Number(document.getElementById("valor_frete_nf")?.value || 0);
  const desconto = Number(document.getElementById("valor_desconto_nf")?.value || 0);
  const outras = Number(document.getElementById("outras_despesas_nf")?.value || 0);

  const total = valorProdutos + frete + outras - desconto;

  const campoTotal = document.getElementById("valor_total_nf");
  if (campoTotal) campoTotal.value = formatarMoedaNF(total);

  const campoTotalItens = document.getElementById("total_nf");
  if (campoTotalItens) campoTotalItens.value = formatarMoedaNF(valorProdutos);

  return {
    valorProdutos,
    frete,
    desconto,
    outras,
    total
  };
}

async function carregarNotasFiscais() {
  const res = await fetch(`${API_NF}/notas-fiscais`);
  if (!res.ok) return;

  const notas = await res.json();

  const tbody = document.getElementById("listaNotasFiscais");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (notas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">Nenhuma nota emitida.</td>
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
        <td>${formatarMoedaNF(n.valor_total || 0)}</td>
        <td>${n.data_nf ? formatarDataNF(n.data_nf) : "Não transmitida"}</td>
        <td><span class="status-emitida">${n.status}</span></td>
        <td>${n.observacao || "-"}</td>
        <td>
          <button type="button" onclick="abrirDetalhesNotaFiscal(${n.id})">
            👁 Detalhes
          </button>

          <button type="button" onclick="imprimirNotaFiscal(${n.id})">
            🖨 Imprimir
          </button>

          ${
            n.status === "RASCUNHO"
              ? `<button type="button" onclick="transmitirNotaFiscal(${n.id})">🚀 Transmitir</button>`
              : ""
          }
        </td>
      </tr>
    `;
  });
}

function formatarMoedaNF(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

async function transmitirNotaFiscal(id) {
  if (!confirm(`Deseja transmitir a NF #${id}?`)) return;

  try {
    const res = await fetch(`${API_NF}/notas-fiscais/${id}/transmitir`, {
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
    carregarNotasFiscais();
    carregarPedidosSeparadosNF();

  } catch (err) {
    console.error(err);
    alert("Erro ao transmitir NF.");
  }
}

async function imprimirNotaFiscal(id) {
  try {
    const res = await fetch(`${API_NF}/notas-fiscais/${id}`);

    if (!res.ok) {
      alert(await res.text());
      return;
    }

    const nota = await res.json();

    gerarImpressaoNotaFiscal(nota);

  } catch (err) {
    console.error(err);
    alert("Erro ao imprimir NF.");
  }
}

function gerarImpressaoNotaFiscal(nota) {
  const itens = nota.itens || [];

 const totalProdutos = Number(nota.valor_produtos || 0);

const valorFrete = Number(nota.valor_frete || 0);
const valorDesconto = Number(nota.valor_desconto || 0);
const outrasDespesas = Number(nota.outras_despesas || 0);

const totalNF = Number(
  nota.valor_total ||
  (totalProdutos + valorFrete + outrasDespesas - valorDesconto)
);

  const dataEmissao = nota.data_nf
    ? formatarDataNF(nota.data_nf)
    : "Não transmitida";

  const dataImpressao = new Date().toLocaleString("pt-BR");

  const destinatarioNome =
    nota.cliente_nome ||
    nota.fornecedor_nome ||
    "-";

  const destinatarioCnpj =
    nota.cliente_cnpj ||
    nota.fornecedor_cnpj ||
    "-";

  let linhasItens = "";

  itens.forEach((item, index) => {
    const qtd = Number(item.quantidade || item.quantidade_faturada || 0);
    const valorUnit = Number(item.valor_unitario || 0);
    const subtotal = qtd * valorUnit;

    linhasItens += `
      <tr>
        <td>${item.produto_codigo || item.produto_id || index + 1}</td>
        <td>${item.produto_nome || "-"}</td>
        <td>00000000</td>
        <td>000</td>
        <td>5102</td>
        <td>UN</td>
        <td>${qtd.toFixed(2)}</td>
        <td>${valorUnit.toFixed(2)}</td>
        <td>0,00</td>
        <td>${subtotal.toFixed(2)}</td>
        <td>0,00</td>
        <td>0,00</td>
      </tr>
    `;
  });

  const marcaAgua =
  nota.status === "RASCUNHO"
    ? "ESPELHO SEM TRANSMISSÃO"
    : "";

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>NF ${nota.numero_nf}</title>

      <style>
        body {
          font-family: Arial, Helvetica, sans-serif;
          color: #111;
          padding: 18px;
          font-size: 12px;
        }

        .danfe {
          max-width: 1050px;
          margin: auto;
          position: relative;
        }

        .marca-agua {
          position: fixed;
          top: 45%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-18deg);
          font-size: 64px;
          color: rgba(0, 0, 0, 0.08);
          font-weight: bold;
          z-index: -1;
          white-space: nowrap;
        }

        .linha {
          display: grid;
          grid-template-columns: 1fr 180px;
          border: 1px solid #111;
          margin-bottom: 8px;
        }

        .recibo {
          padding: 8px;
          border-right: 1px solid #111;
        }

        .numero-nf {
          padding: 12px;
          text-align: center;
          font-size: 18px;
          font-weight: bold;
        }

        .grid-topo {
          display: grid;
          grid-template-columns: 2fr 1.1fr 2fr;
          border: 1px solid #111;
        }

        .box {
          border-right: 1px solid #111;
          padding: 8px;
          min-height: 105px;
        }

        .box:last-child {
          border-right: none;
        }

        .titulo-box {
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .empresa {
          font-size: 20px;
          font-weight: bold;
          margin: 12px 0;
          text-align: center;
        }

        .danfe-centro {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
        }

        .barcode {
          height: 64px;
          background: repeating-linear-gradient(
            90deg,
            #000 0px,
            #000 2px,
            #fff 2px,
            #fff 4px,
            #000 4px,
            #000 5px,
            #fff 5px,
            #fff 8px
          );
          margin-bottom: 8px;
        }

        .chave {
          font-size: 12px;
          text-align: center;
          font-weight: bold;
          letter-spacing: 1px;
        }

        .secao {
          border: 1px solid #111;
          margin-top: 8px;
        }

        .secao h3 {
          margin: 0;
          padding: 4px 8px;
          font-size: 13px;
          text-transform: uppercase;
          border-bottom: 1px solid #111;
          background: #f3f4f6;
        }

        .campos {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }

        .campo {
          border-right: 1px solid #111;
          border-bottom: 1px solid #111;
          padding: 5px;
          min-height: 38px;
        }

        .campo:nth-child(4n) {
          border-right: none;
        }

        .campo strong {
          display: block;
          font-size: 10px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          border: 1px solid #111;
          padding: 5px;
          font-size: 11px;
        }

        th {
          background: #f3f4f6;
          text-transform: uppercase;
        }

        .dados-adicionais {
          display: grid;
          grid-template-columns: 2fr 1fr;
          min-height: 110px;
        }

        .dados-adicionais div {
          padding: 8px;
          border-right: 1px solid #111;
        }

        .dados-adicionais div:last-child {
          border-right: none;
        }

        .rodape {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          font-size: 11px;
        }

        @media print {
          body {
            padding: 5px;
          }

          button {
            display: none;
          }
        }
      </style>
    </head>

    <body>
    ${marcaAgua ? `<div class="marca-agua">${marcaAgua}</div>` : ""}

      <div class="danfe">

        <div class="linha">
          <div class="recibo">
            RECEBEMOS DE LG LOGÍSTICA OS PRODUTOS / SERVIÇOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO.
            <br><br>
            EMISSÃO: ${dataEmissao} &nbsp;&nbsp;
            DEST / REM: ${destinatarioNome} &nbsp;&nbsp;
            VALOR TOTAL: ${formatarMoedaNF(totalNF)}
            <br><br>
            DATA DO RECEBIMENTO: ________________________
            &nbsp;&nbsp;&nbsp;
            IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR: ________________________
          </div>

          <div class="numero-nf">
            NF-e<br>
            Nº ${nota.numero_nf || "-"}<br>
            Série ${nota.serie_nf || "1"}
          </div>
        </div>

        <div class="grid-topo">

          <div class="box">
            <div class="titulo-box">Identificação do Emitente</div>
            <div class="empresa">LG LOGÍSTICA LTDA</div>
            <p>Rua Exemplo, 123 - Centro</p>
            <p>Monte Carmelo - MG - CEP: 38500-000</p>
            <p>CNPJ: 00.000.000/0001-00</p>
            <p>Fone: (34) 0000-0000</p>
          </div>

          <div class="box danfe-centro">
            DANFE<br>
            Documento Auxiliar da Nota Fiscal Eletrônica
            <br><br>
            0 - ENTRADA<br>
            1 - SAÍDA
            <br><br>
            <strong>1</strong>
            <br><br>
            Nº ${nota.numero_nf || "-"}<br>
            SÉRIE ${nota.serie_nf || "1"}<br>
            FOLHA 1/1
          </div>

          <div class="box">
            <div class="barcode"></div>
            <div class="titulo-box">Chave de Acesso</div>
            <div class="chave">
              4124 0000 0000 0000 0000 5500 1000 ${String(nota.id).padStart(8, "0")} 0000 0000
            </div>
            <br>
            <p style="text-align:center">
              Consulta de autenticidade no portal nacional da NF-e
            </p>
            <p style="text-align:center">
              Documento acadêmico sem valor fiscal
            </p>
          </div>

        </div>

        <div class="secao">
          <h3>Natureza da Operação</h3>
          <div class="campo">
            ${traduzirTipoNF(nota.tipo)}
          </div>
        </div>

        <div class="secao">
          <h3>Destinatário / Remetente</h3>

          <div class="campos">
            <div class="campo">
              <strong>Nome / Razão Social</strong>
              ${destinatarioNome}
            </div>

            <div class="campo">
              <strong>CNPJ / CPF</strong>
              ${destinatarioCnpj}
            </div>

            <div class="campo">
              <strong>Data Emissão</strong>
              ${dataEmissao}
            </div>

            <div class="campo">
              <strong>Pedido</strong>
              ${nota.pedido_id || "-"}
            </div>

            <div class="campo">
              <strong>Endereço</strong>
              ${nota.cliente_rua || "-"}, ${nota.cliente_numero || "-"}
            </div>

            <div class="campo">
              <strong>Bairro</strong>
              ${nota.cliente_bairro || "-"}
            </div>

            <div class="campo">
              <strong>CEP</strong>
              ${nota.cliente_cep || "-"}
            </div>

            <div class="campo">
              <strong>Município / UF</strong>
              ${nota.cliente_cidade || "-"} / ${nota.cliente_estado || "-"}
            </div>
          </div>
        </div>

       <div class="secao">
  <h3>Cálculo do Imposto</h3>

  <div class="campos">

    <div class="campo">
      <strong>Base ICMS</strong>
      0,00
    </div>

    <div class="campo">
      <strong>Valor ICMS</strong>
      0,00
    </div>

    <div class="campo">
      <strong>Total Produtos</strong>
      ${formatarMoedaNF(totalProdutos)}
    </div>

    <div class="campo">
      <strong>Valor Frete</strong>
      ${formatarMoedaNF(valorFrete)}
    </div>

    <div class="campo">
      <strong>Desconto</strong>
      ${formatarMoedaNF(valorDesconto)}
    </div>

    <div class="campo">
      <strong>Outras Despesas</strong>
      ${formatarMoedaNF(outrasDespesas)}
    </div>

    <div class="campo">
      <strong>Total NF</strong>
      ${formatarMoedaNF(totalNF)}
    </div>

    <div class="campo">
      <strong>Impostos</strong>
      Embutidos no preço
    </div>

  </div>
</div>

        <div class="secao">
          <h3>Dados dos Produtos / Serviços</h3>

          <table>
            <thead>
              <tr>
                <th>Cód.</th>
                <th>Descrição</th>
                <th>NCM/SH</th>
                <th>CST</th>
                <th>CFOP</th>
                <th>UN</th>
                <th>Qtd</th>
                <th>V. Unit.</th>
                <th>Desc.</th>
                <th>V. Total</th>
                <th>ICMS</th>
                <th>IPI</th>
              </tr>
            </thead>

            <tbody>
              ${linhasItens || `
                <tr>
                  <td colspan="12">Nenhum item encontrado.</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>

        <div class="secao">
          <h3>Dados Adicionais</h3>

          <div class="dados-adicionais">
            <div>
              <strong>Informações Complementares</strong>
              <br><br>
              ${nota.observacao || "Documento gerado pelo sistema acadêmico LG Logística."}
              <br><br>
              Status: ${nota.status}
              <br>
              Tipo: ${nota.tipo}
              <br>
              Documento acadêmico sem valor fiscal.
            </div>

            <div>
              <strong>Reservado ao Fisco</strong>
            </div>
          </div>
        </div>

        <div class="rodape">
          <span>DATA E HORA DA IMPRESSÃO: ${dataImpressao}</span>
          <span>LG Logística - Sistema WMS Acadêmico</span>
        </div>

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

function traduzirTipoNF(tipo) {
  if (tipo === "VENDA") return "VENDA DE MERCADORIA";
  if (tipo === "DEVOLUCAO_FORNECEDOR") return "DEVOLUÇÃO AO FORNECEDOR";
  if (tipo === "DEVOLUCAO_CLIENTE") return "DEVOLUÇÃO DE CLIENTE";
  return tipo || "-";
}

async function abrirDetalhesNotaFiscal(id) {
  try {
    const res = await fetch(`${API_NF}/notas-fiscais/${id}`);

    if (!res.ok) {
      alert(await res.text());
      return;
    }

    const nf = await res.json();

    let itensHtml = "";

    if (nf.itens && nf.itens.length > 0) {
      nf.itens.forEach(item => {
        const qtd = Number(item.quantidade || 0);
        const valor = Number(item.valor_unitario || 0);
        const subtotal = qtd * valor;

        itensHtml += `
          <tr>
            <td>${item.produto_nome || "-"}</td>
            <td>${item.produto_codigo || "-"}</td>
            <td>${qtd}</td>
            <td>${formatarMoedaNF(valor)}</td>
            <td>${formatarMoedaNF(subtotal)}</td>
          </tr>
        `;
      });
    } else {
      itensHtml = `
        <tr>
          <td colspan="5">Nenhum item encontrado.</td>
        </tr>
      `;
    }

    const html = `
      <div class="modal-nf-fundo" id="modalDetalheNF">
        <div class="modal-nf">

          <div class="modal-nf-topo">
            <div>
              <h2>Detalhes da Nota Fiscal</h2>
              <p>NF ${nf.numero_nf || "-"} - Série ${nf.serie_nf || "1"}</p>
            </div>

            <button onclick="fecharDetalhesNotaFiscal()">✖</button>
          </div>

          <div class="grid-detalhes-nf">
            <div>
              <strong>Tipo</strong>
              <span>${nf.tipo || "-"}</span>
            </div>

            <div>
              <strong>Status</strong>
              <span>${nf.status || "-"}</span>
            </div>

            <div>
              <strong>Data NF</strong>
              <span>${nf.data_nf ? formatarDataNF(nf.data_nf) : "Não transmitida"}</span>
            </div>

            <div>
              <strong>Pedido</strong>
              <span>${nf.pedido_id || nf.pedido_id_ref || "-"}</span>
            </div>

            <div>
              <strong>Cliente</strong>
              <span>${nf.cliente_nome || "-"}</span>
            </div>

            <div>
              <strong>CNPJ Cliente</strong>
              <span>${nf.cliente_cnpj || "-"}</span>
            </div>

            <div>
              <strong>Fornecedor</strong>
              <span>${nf.fornecedor_nome || "-"}</span>
            </div>

            <div>
              <strong>CNPJ Fornecedor</strong>
              <span>${nf.fornecedor_cnpj || "-"}</span>
            </div>

            <div>
              <strong>Valor Produtos</strong>
              <span>${formatarMoedaNF(nf.valor_produtos || 0)}</span>
            </div>

            <div>
              <strong>Frete</strong>
              <span>${formatarMoedaNF(nf.valor_frete || 0)}</span>
            </div>

            <div>
              <strong>Desconto</strong>
              <span>${formatarMoedaNF(nf.valor_desconto || 0)}</span>
            </div>

            <div>
              <strong>Outras Despesas</strong>
              <span>${formatarMoedaNF(nf.outras_despesas || 0)}</span>
            </div>

            <div class="destaque-total-nf">
              <strong>Total NF</strong>
              <span>${formatarMoedaNF(nf.valor_total || 0)}</span>
            </div>
          </div>

          <h3>Itens da Nota</h3>

          <div class="tabela-container">
            <table class="tabela-nf">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>SKU</th>
                  <th>Qtd</th>
                  <th>Valor Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>

              <tbody>
                ${itensHtml}
              </tbody>
            </table>
          </div>

          <div class="observacao-detalhe-nf">
            <strong>Observação</strong>
            <p>${nf.observacao || "-"}</p>
          </div>

          <div class="acoes-modal-nf">
            <button onclick="imprimirNotaFiscal(${nf.id})">
              🖨 Imprimir
            </button>

            ${
              nf.status === "RASCUNHO"
                ? `<button onclick="transmitirNotaFiscal(${nf.id})">🚀 Transmitir</button>`
                : ""
            }
          </div>

        </div>
      </div>
    `;

    const modalExistente = document.getElementById("modalDetalheNF");

    if (modalExistente) {
      modalExistente.remove();
    }

    document.body.insertAdjacentHTML("beforeend", html);

  } catch (err) {
    console.error(err);
    alert("Erro ao abrir detalhes da NF.");
  }
}

function fecharDetalhesNotaFiscal() {
  const modal = document.getElementById("modalDetalheNF");
  if (modal) modal.remove();
}

async function carregarDivergenciasParaNF() {
  try {
    const select = document.getElementById("divergencia_origem_id");
    if (!select) return;

    select.innerHTML = `<option value="">Carregando divergências...</option>`;

    const res = await fetch(`${API_NF}/divergencias?status=DEVOLUCAO`);

    if (!res.ok) {
      alert(await res.text());
      select.innerHTML = `<option value="">Erro ao carregar divergências</option>`;
      return;
    }

    const divergencias = await res.json();

    select.innerHTML = `<option value="">Selecione a divergência</option>`;

    if (!divergencias || divergencias.length === 0) {
      select.innerHTML = `<option value="">Nenhuma divergência para devolução</option>`;
      return;
    }

    divergencias.forEach(d => {
      select.innerHTML += `
        <option
          value="${d.id}"
          data-fornecedor-id="${d.fornecedor_id || ""}"
          data-produto-id="${d.produto_id}"
          data-produto-nome="${d.produto_nome || ""}"
          data-produto-codigo="${d.produto_codigo || ""}"
          data-quantidade="${Math.abs(Number(d.diferenca || 0))}"
          data-valor-unitario="${Number(d.valor_unitario || d.custo_unitario_com_imposto || 0)}"
        >
          NF ${d.numero_nf} - ${d.produto_nome} - Diferença ${d.diferenca}
        </option>
      `;
    });

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar divergências para NF.");
  }
}

function carregarItensDivergenciaNF() {
  const select = document.getElementById("divergencia_origem_id");
  const option = select?.options[select.selectedIndex];

  if (!option || !option.value) {
    itensNotaFiscal = [];
    renderizarItensNotaFiscal();
    return;
  }

  const fornecedorId = option.dataset.fornecedorId;

if (fornecedorId) {
  const campoFornecedor = document.getElementById("fornecedor_id_nf");
  if (campoFornecedor) {
    campoFornecedor.value = fornecedorId;
    campoFornecedor.disabled = true;
  }
}

  const quantidade = Number(option.dataset.quantidade || 0);

  itensNotaFiscal = [
    {
      produto_id: option.dataset.produtoId,
      produto_nome: option.dataset.produtoNome,
      produto_codigo: option.dataset.produtoCodigo,
      quantidade_pedido: quantidade,
      quantidade: quantidade,
      quantidade_faturada: quantidade,
      quantidade_maxima: quantidade,
      valor_unitario: Number(option.dataset.valorUnitario || 0)
    }
  ];

  renderizarItensNotaFiscalEditavelDevolucao();
}