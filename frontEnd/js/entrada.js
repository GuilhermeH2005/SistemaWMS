let produtosEntrada = [];

function iniciarEntrada() {
  const form = document.getElementById("formEntrada");

  if (!form) return;

  const produtoBusca = document.getElementById("produtoBusca");
  const produtoId = document.getElementById("produto_id");

  if (produtoBusca) {
    produtoBusca.addEventListener("input", () => {
      const valor = produtoBusca.value;

      const produtoSelecionado = produtosEntrada.find(p =>
        valor === `${p.nome} | SKU: ${p.codigo || "-"} | Estoque: ${p.quantidade_estoque || 0}`
      );

      produtoId.value = produtoSelecionado ? produtoSelecionado.id : "";
    });
  }

  aplicarMascarasEntrada();
  carregarProdutosEntrada();
  carregarEntradas();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!document.getElementById("produto_id").value) {
      alert("Selecione um produto válido da lista.");
      return;
    }

    const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));

    const entrada = {
      produto_id: document.getElementById("produto_id").value,
      quantidade: document.getElementById("quantidade").value,
      numero_nf: document.getElementById("numero_nf").value,
      data_nf: converterDataParaBanco(document.getElementById("data_nf").value),
      lote: document.getElementById("lote").value,
      validade: converterDataParaBanco(document.getElementById("validade").value),
      usuario_id: usuarioLogado ? usuarioLogado.id : null
    };

    try {
      const res = await fetch("http://localhost:3000/entradas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(entrada)
      });

      const msg = await res.text();

      if (!res.ok) {
        alert(msg);
        return;
      }

      alert("Entrada registrada com sucesso!");

      form.reset();
      document.getElementById("produto_id").value = "";

      carregarProdutosEntrada();
      carregarEntradas();

    } catch (err) {
      console.error(err);
      alert("Erro ao registrar entrada.");
    }
  });
}

function renderizarProdutosEntrada(produtos) {
  const datalist = document.getElementById("listaProdutosEntrada");

  datalist.innerHTML = "";

  produtos.forEach(p => {
    datalist.innerHTML += `
      <option 
        value="${p.nome} | SKU: ${p.codigo || "-"} | Estoque: ${p.quantidade_estoque || 0}"
        data-id="${p.id}">
      </option>
    `;
  });
}

async function carregarProdutosEntrada() {
  const res = await fetch("http://localhost:3000/produtos");
  const produtos = await res.json();

  produtosEntrada = produtos;

  renderizarProdutosEntrada(produtosEntrada);
}

async function carregarEntradas() {
  const res = await fetch("http://localhost:3000/entradas");
  const entradas = await res.json();

  const lista = document.getElementById("listaEntradas");

  lista.innerHTML = "";

  if (entradas.length === 0) {
    lista.innerHTML = `<li>Nenhuma entrada registrada.</li>`;
    return;
  }

  entradas.forEach(e => {
    lista.innerHTML += `
<div class="entrada-item">

  <div class="entrada-topo">
    <strong>${e.produto_nome}</strong>

    <span class="${classeStatus(e.status_conferencia)}">
      ${e.status_conferencia || "PENDENTE"}
    </span>
  </div>

  <div class="entrada-grid">

    <div>
      <span>SKU</span>
      <strong>${e.produto_codigo || "-"}</strong>
    </div>

    <div>
      <span>NF</span>
      <strong>${e.numero_nf || "-"}</strong>
    </div>

    <div>
      <span>Data NF</span>
      <strong>${formatarData(e.data_nf)}</strong>
    </div>

    <div>
      <span>Quantidade</span>
      <strong>${e.quantidade}</strong>
    </div>

    <div>
      <span>Lote</span>
      <strong>${e.lote || "-"}</strong>
    </div>

    <div>
      <span>Validade</span>
      <strong>${formatarData(e.validade)}</strong>
    </div>

    <div>
      <span>Responsável</span>
      <strong>${e.usuario_nome || "-"}</strong>
    </div>

    <div>
      <span>Entrada</span>
      <strong>${formatarDataHora(e.data_entrada)}</strong>
    </div>

  </div>

</div>
    `;
  });
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
  if (!data) return "";
  return new Date(data).toLocaleDateString("pt-BR");
}

function formatarDataHora(data) {
  if (!data) return "";
  return new Date(data).toLocaleString("pt-BR");
}