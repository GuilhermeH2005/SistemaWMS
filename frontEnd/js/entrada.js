var produtosEntrada = [];
var itensNF = [];
var itemXmlPendente = null;

function iniciarEntrada() {
  const form = document.getElementById("formEntrada");

  if (!form) return;

  carregarFornecedoresEntrada();
  carregarProdutosEntrada();
  carregarEntradas();
  aplicarMascarasEntrada();

  const produtoBusca = document.getElementById("produtoBusca");
  const produtoId = document.getElementById("produto_id");
  document
  .getElementById("btnAdicionarItemNF")
  .addEventListener("click", adicionarItemNF);

  const btnSalvarVinculo =
  document.getElementById("btnSalvarVinculoProduto");

if (btnSalvarVinculo) {
  btnSalvarVinculo.onclick =
    salvarVinculoProdutoXML;
}

   const btnImportarXML = document.getElementById("btnImportarXML");  

if (btnImportarXML) {
  btnImportarXML.addEventListener("click", importarXMLNFe);
}

  produtoBusca.addEventListener("input", () => {

    const valor = produtoBusca.value;

    const produtoSelecionado = produtosEntrada.find(p =>
      valor === `${p.nome} | SKU: ${p.codigo || "-"} | Estoque: ${p.quantidade_estoque || 0}`
    );

    produtoId.value = produtoSelecionado ? produtoSelecionado.id : "";
  });

 [
  "quantidade",
  "custo_unitario_sem_imposto",
  "icms_percentual",
  "ipi_percentual",
  "pis_percentual",
  "cofins_percentual",
  "frete",
  "seguro",
  "outras_despesas"
].forEach(id => {
  const campo = document.getElementById(id);

  if (campo) {
    campo.addEventListener("input", calcularTotaisNF);
  }
});

  document.getElementById("btnGerarImpostos")
    .addEventListener("click", gerarImpostosSimulados);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fornecedorSelect = document.getElementById("fornecedor_id");

    if (itensNF.length === 0) {
  alert("Adicione pelo menos um produto na NF.");
  return;
}

    const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));

   const entrada = {
  fornecedor_id: fornecedorSelect.value,
  numero_nf: document.getElementById("numero_nf").value,
  serie_nf: document.getElementById("serie_nf").value,
  data_nf: converterDataParaBanco(document.getElementById("data_nf").value),
  usuario_id: usuarioLogado ? usuarioLogado.id : null,
  usuario_nome: usuarioLogado?.nome || usuarioLogado?.login || null,
  itens: itensNF
};

    try {
      const res = await fetch("http://localhost:3000/entradas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
         body: JSON.stringify({
    ...entrada,
    ...getUsuarioAuditoria()
  })

      });

      const msg = await res.text();

      if (!res.ok) {
        alert(msg);
        return;
      }

    alert(msg);

form.reset();
document.getElementById("produto_id").value = "";

itensNF = [];
renderizarItensNF();
liberarCabecalhoNF();

carregarProdutosEntrada();
carregarEntradas();

    } catch (err) {
      console.error(err);
      alert("Erro ao registrar entrada de NF.");
    }
  });
}

async function carregarFornecedoresEntrada() {
  try {

    const res =
      await fetch("http://localhost:3000/fornecedores");

    const fornecedores =
      await res.json();

    const select =
      document.getElementById("fornecedor_id");

    if (!select) return;

    select.innerHTML = `
      <option value="">
        Selecione o fornecedor
      </option>
    `;

    fornecedores.forEach(f => {

      select.innerHTML += `
        <option value="${f.id}">
          ${f.nome}
        </option>
      `;

    });

  } catch (err) {

    console.error("Erro ao carregar fornecedores:", err);

  }
}

function adicionarItemNF() {
  const produtoId = document.getElementById("produto_id").value;

  if (!produtoId) {
    alert("Selecione um produto válido.");
    return;
  }

  const lote = document.getElementById("lote").value.trim();

  if (!lote) {
    alert("Informe o lote do produto antes de adicionar o item.");
    return;
  }

  const produto = produtosEntrada.find(
    p => String(p.id) === String(produtoId)
  );

  const quantidade = valorCampo("quantidade");
  const custoUnitario = valorCampo("custo_unitario_sem_imposto");

  if (quantidade <= 0 || custoUnitario <= 0) {
    alert("Informe quantidade e custo unitário.");
    return;
  }

  calcularTotaisNF();

  const item = {
    produto_id: produtoId,
    produto_nome: produto.nome,
    quantidade,

    peso_unitario: valorCampo("peso_unitario"),

    custo_unitario_sem_imposto: custoUnitario,

    icms_percentual: valorCampo("icms_percentual"),
    ipi_percentual: valorCampo("ipi_percentual"),
    pis_percentual: valorCampo("pis_percentual"),
    cofins_percentual: valorCampo("cofins_percentual"),

    frete: valorCampo("frete"),
    seguro: valorCampo("seguro"),
    outras_despesas: valorCampo("outras_despesas"),

    subtotal: valorCampo("subtotal"),
    valor_impostos: valorCampo("valor_impostos"),
    custo_total_com_imposto: valorCampo("custo_total_com_imposto"),
    custo_unitario_com_imposto: valorCampo("custo_unitario_com_imposto"),

    lote,
    validade: converterDataParaBanco(
      document.getElementById("validade").value
    )
  };

  itensNF.push(item);
  bloquearCabecalhoNF();

  renderizarItensNF();
  limparCamposItemNF();
}

function bloquearCabecalhoNF() {
  document.getElementById("fornecedor_id").disabled = true;
  document.getElementById("numero_nf").readOnly = true;
  document.getElementById("serie_nf").readOnly = true;
  document.getElementById("data_nf").readOnly = true;
}

function liberarCabecalhoNF() {
  document.getElementById("fornecedor_id").disabled = false;
  document.getElementById("numero_nf").readOnly = false;
  document.getElementById("serie_nf").readOnly = false;
  document.getElementById("data_nf").readOnly = false;
}

function renderizarItensNF() {
  const tbody = document.getElementById("listaItensNF");

  tbody.innerHTML = "";

  if (itensNF.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">Nenhum item adicionado.</td>
      </tr>
    `;
    return;
  }

itensNF.forEach((item, index) => {
  tbody.innerHTML += `
    <tr>
      <td>${item.produto_nome}</td>

      <td>
        ${Number(item.quantidade).toLocaleString("pt-BR")}
      </td>

      <td>
        R$ ${Number(
          item.custo_unitario_sem_imposto
        ).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}
      </td>

      <td>
        R$ ${Number(
          item.custo_unitario_com_imposto
        ).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}
      </td>

      <td>${item.lote || "-"}</td>

      <td>
        <button
          type="button"
          onclick="removerItemNF(${index})"
        >
          Remover
        </button>
      </td>
    </tr>
  `;
});
}

function removerItemNF(index) {
  itensNF.splice(index, 1);
  renderizarItensNF();

  if (itensNF.length === 0) {
    liberarCabecalhoNF();
  }
}

function limparCamposItemNF() {
  document.getElementById("produtoBusca").value = "";
  document.getElementById("produto_id").value = "";
  document.getElementById("quantidade").value = "";
  document.getElementById("custo_unitario_sem_imposto").value = "";
  document.getElementById("icms_percentual").value = "";
  document.getElementById("ipi_percentual").value = "";
  document.getElementById("pis_percentual").value = "";
  document.getElementById("cofins_percentual").value = "";
  document.getElementById("subtotal").value = "";
  document.getElementById("valor_impostos").value = "";
  document.getElementById("custo_total_com_imposto").value = "";
  document.getElementById("custo_unitario_com_imposto").value = "";
  document.getElementById("lote").value = "";
  document.getElementById("validade").value = "";
  document.getElementById("peso_unitario").value = "";
  document.getElementById("frete").value = "0";
  document.getElementById("seguro").value = "0";
  document.getElementById("outras_despesas").value = "0"; 
}

async function carregarEntradas() {
  const res = await fetch("http://localhost:3000/entradas");
  const entradas = await res.json();

  const lista = document.getElementById("listaEntradas");
  lista.innerHTML = "";

  if (entradas.length === 0) {
    lista.innerHTML = `<p>Nenhuma entrada de NF registrada.</p>`;
    return;
  }

  const notasAgrupadas = {};

  entradas.forEach(e => {
    const chave = `${e.numero_nf}-${e.serie_nf || ""}-${e.fornecedor_id}`;

    if (!notasAgrupadas[chave]) {
      notasAgrupadas[chave] = {
        numero_nf: e.numero_nf,
        serie_nf: e.serie_nf,
        fornecedor_nome: e.fornecedor_nome,
       data_nf: e.data_nf_formatada || e.data_nf,
        status_conferencia: e.status_conferencia,
        itens: []
      };
    }

    notasAgrupadas[chave].itens.push(e);
  });

  Object.values(notasAgrupadas).forEach(nf => {
    let totalNF = 0;

    const itensHtml = nf.itens.map(item => {
      totalNF += Number(item.custo_total_com_imposto || 0);

      return `
        <tr>
          <td>${item.produto_nome}</td>
          <td>${item.quantidade}</td>
          <td>${item.lote || "-"}</td>
          <td>R$ ${Number(item.custo_unitario_sem_imposto || 0).toFixed(2)}</td>
          <td>R$ ${Number(item.custo_unitario_com_imposto || 0).toFixed(2)}</td>
          <td>${Number(item.icms_percentual || 0).toFixed(2)}%</td>
          <td>${Number(item.ipi_percentual || 0).toFixed(2)}%</td>
          <td>${Number(item.pis_percentual || 0).toFixed(2)}%</td>
          <td>${Number(item.cofins_percentual || 0).toFixed(2)}%</td>
        </tr>
      `;
    }).join("");

    lista.innerHTML += `
      <div class="entrada-item">

        <div class="entrada-topo">
          <strong>
            NF ${nf.numero_nf}
            ${nf.serie_nf ? " - Série " + nf.serie_nf : ""}
          </strong>

          <span class="${classeStatus(nf.status_conferencia)}">
            ${nf.status_conferencia || "PENDENTE"}
          </span>
        </div>

        <div class="entrada-grid">
          <div>
            <span>Fornecedor</span>
            <strong>${nf.fornecedor_nome || "-"}</strong>
          </div>

          <div>
            <span>Data NF</span>
            <strong>${formatarData(nf.data_nf)}</strong>
          </div>

          <div>
            <span>Qtd. Itens</span>
            <strong>${nf.itens.length}</strong>
          </div>

          <div>
            <span>Total NF</span>
            <strong>R$ ${totalNF.toFixed(2)}</strong>
          </div>
        </div>

        <div class="tabela-container" style="margin-top: 16px;">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd</th>
                <th>Lote</th>
                <th>Custo s/ Imp.</th>
                <th>Custo c/ Imp.</th>
                <th>ICMS</th>
                <th>IPI</th>
                <th>PIS</th>
                <th>COFINS</th>
              </tr>
            </thead>

            <tbody>
              ${itensHtml}
            </tbody>
          </table>
        </div>

      </div>
    `;
  });
}

async function carregarProdutosEntrada() {
  const res = await fetch("http://localhost:3000/produtos");
  const produtos = await res.json();

  produtosEntrada = produtos;

  const datalist = document.getElementById("listaProdutosEntrada");

  datalist.innerHTML = "";

  produtos.forEach(p => {
    datalist.innerHTML += `
      <option
        value="${p.nome} | SKU: ${p.codigo || "-"} | Estoque: ${p.quantidade_estoque || 0}"
      ></option>
    `;
  });
}

function gerarImpostosSimulados() {
  const icmsOpcoes = [7, 12, 18];
  const ipiOpcoes = [0, 5, 10];

  document.getElementById("icms_percentual").value =
    icmsOpcoes[Math.floor(Math.random() * icmsOpcoes.length)];

  document.getElementById("ipi_percentual").value =
    ipiOpcoes[Math.floor(Math.random() * ipiOpcoes.length)];

  document.getElementById("pis_percentual").value = 1.65;

  document.getElementById("cofins_percentual").value = 7.6;

  calcularTotaisNF();
}

function valorCampo(id) {
  return Number(document.getElementById(id)?.value || 0);
}

function calcularTotaisNF() {
  const quantidade = valorCampo("quantidade");
  const custoUnitario = valorCampo("custo_unitario_sem_imposto");

  const icms = valorCampo("icms_percentual");
  const ipi = valorCampo("ipi_percentual");
  const pis = valorCampo("pis_percentual");
  const cofins = valorCampo("cofins_percentual");

  const frete = valorCampo("frete");
  const seguro = valorCampo("seguro");
  const outrasDespesas = valorCampo("outras_despesas");

  const subtotal = quantidade * custoUnitario;

  const percentualTotal = icms + ipi + pis + cofins;

  const valorImpostos = subtotal * (percentualTotal / 100);

  const custoTotalComImposto =
    subtotal + valorImpostos + frete + seguro + outrasDespesas;

  const custoUnitarioComImposto =
    quantidade > 0
      ? custoTotalComImposto / quantidade
      : 0;

  document.getElementById("subtotal").value =
    subtotal.toFixed(2);

  document.getElementById("valor_impostos").value =
    valorImpostos.toFixed(2);

  document.getElementById("custo_total_com_imposto").value =
    custoTotalComImposto.toFixed(2);

  document.getElementById("custo_unitario_com_imposto").value =
    custoUnitarioComImposto.toFixed(2);
}


function classeStatus(status) {
  if (status === "CONFERIDO") return "status-conferido";
  if (status === "DIVERGENTE") return "status-divergente";
  return "status-pendente";
}

function aplicarMascarasEntrada() {
  const dataNF = document.getElementById("data_nf");
  const validade = document.getElementById("validade");

  [dataNF, validade].forEach(input => {
    input.addEventListener("input", () => {
      let valor = input.value.replace(/\D/g, "");

      valor = valor.replace(/^(\d{2})(\d)/, "$1/$2");
      valor = valor.replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");

      input.value = valor.substring(0, 10);
    });
  });
}

function converterDataParaBanco(dataBR) {
  if (!dataBR) return null;

  const partes = dataBR.split("/");

  if (partes.length !== 3) return null;

  return `${partes[2]}-${partes[1]}-${partes[0]}`;
}

function formatarData(data) {
  return data || "-";
}

async function importarXMLNFe() {
  console.log("Botão importar XML clicado");

  const inputXML = document.getElementById("xmlNfe");

  if (!inputXML) {
    alert("Campo xmlNfe não encontrado no HTML.");
    return;
  }

  if (!inputXML.files.length) {
    alert("Selecione um arquivo XML da NF-e.");
    return;
  }

  const formData = new FormData();
  formData.append("xml", inputXML.files[0]);

  try {
    const res = await fetch("http://localhost:3000/importar-xml-nfe", {
      method: "POST",
      body: formData
    });

    const texto = await res.text();

    if (!res.ok) {
      console.error("Erro backend:", texto);
      alert(texto);
      return;
    }

    const dados = JSON.parse(texto);

    console.log("XML importado:", dados);

    document.getElementById("numero_nf").value = dados.numero_nf || "";
    document.getElementById("serie_nf").value = dados.serie_nf || "";
    document.getElementById("data_nf").value = dados.data_nf || "";

    if (dados.fornecedor && dados.fornecedor.id) {
      document.getElementById("fornecedor_id").value = dados.fornecedor.id;
    } else {
      alert("Fornecedor não encontrado. Selecione manualmente.");
    }

    itensNF = [];

    let produtosNaoEncontrados = [];

    dados.itens.forEach(itemXML => {
      const produto = produtosEntrada.find(p =>

  String(p.codigo_xml || "").trim() ===
  String(itemXML.codigo_produto_xml || "").trim()

);

     if (!produto) {

  abrirModalVinculo(itemXML);

  return;
}

      itensNF.push({
  produto_id: Number(produto.id),

  produto_nome:
    produto.nome || itemXML.produto_nome_xml || "-",

  quantidade: Number(itemXML.quantidade || 0),

  peso_unitario: Number(
    itemXML.peso_unitario ||
    produto.peso ||
    0
  ),

  custo_unitario_sem_imposto: Number(
    itemXML.custo_unitario_sem_imposto || 0
  ),

  icms_percentual: Number(
    itemXML.icms_percentual || 0
  ),

  ipi_percentual: Number(
    itemXML.ipi_percentual || 0
  ),

  pis_percentual: Number(
    itemXML.pis_percentual || 0
  ),

  cofins_percentual: Number(
    itemXML.cofins_percentual || 0
  ),

  frete: Number(itemXML.frete || 0),

  seguro: Number(itemXML.seguro || 0),

  outras_despesas: Number(
    itemXML.outras_despesas || 0
  ),

  subtotal: Number(itemXML.subtotal || 0),

  valor_impostos: Number(
    itemXML.valor_impostos || 0
  ),

  custo_total_com_imposto: Number(
    itemXML.custo_total_com_imposto || 0
  ),

  custo_unitario_com_imposto: Number(
    itemXML.custo_unitario_com_imposto || 0
  ),

  lote: itemXML.lote || null,

  validade: itemXML.validade || null
});
    });

    renderizarItensNF();

    if (itensNF.length > 0) {
      bloquearCabecalhoNF();
    }

    if (produtosNaoEncontrados.length > 0) {
      alert(
        "Produtos não encontrados pelo código/SKU:\n\n" +
        produtosNaoEncontrados.join("\n")
      );
    } else {
      alert("XML importado com sucesso ✅");
    }

  } catch (err) {
    console.error("Erro ao importar XML:", err);
    alert("Erro ao importar XML. Veja o console.");
  }
}

function abrirModalVinculo(itemXML) {

  itemXmlPendente = itemXML;

  const modal =
    document.getElementById("modalVincularProduto");

  const nome =
    document.getElementById("produtoXmlNome");

  const select =
    document.getElementById("selectProdutoVinculo");

  nome.innerHTML = `
    Produto XML:
    <strong>${itemXML.produto_nome_xml}</strong>
    <br>
    Código XML:
    <strong>${itemXML.codigo_produto_xml}</strong>
  `;

  select.innerHTML =
    `<option value="">Selecione um produto</option>`;

  produtosEntrada.forEach(produto => {

    select.innerHTML += `
      <option value="${produto.id}">
        ${produto.nome}
        | SKU: ${produto.codigo}
      </option>
    `;
  });

  modal.classList.remove("hidden");
}

async function salvarVinculoProdutoXML() {

  const produtoId =
    document.getElementById("selectProdutoVinculo").value;

  if (!produtoId) {
    alert("Selecione um produto.");
    return;
  }

  try {

    const res = await fetch(
      `http://localhost:3000/produto/${produtoId}/codigo-xml`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          codigo_xml: itemXmlPendente.codigo_produto_xml
        })
      }
    );

    const msg = await res.text();

    if (!res.ok) {
      alert(msg);
      return;
    }

    alert("Produto vinculado com sucesso ✅");

    document
      .getElementById("modalVincularProduto")
      .classList.add("hidden");

    await carregarProdutosEntrada();

    importarXMLNFe();

  } catch (err) {

    console.error(err);

    alert("Erro ao vincular produto XML.");
  }
}