function iniciarEntrada() {
  const form = document.getElementById("formEntrada");

  if (!form) return;

  aplicarMascarasEntrada();
  carregarProdutosEntrada();
  carregarEntradas();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

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

      carregarProdutosEntrada();
      carregarEntradas();

    } catch (err) {
      console.error(err);
      alert("Erro ao registrar entrada.");
    }
  });
}

async function carregarProdutosEntrada() {
  const res = await fetch("http://localhost:3000/produtos");
  const produtos = await res.json();

  const select = document.getElementById("produto_id");

  select.innerHTML = `<option value="">Selecione o produto</option>`;

  produtos.forEach(p => {
    select.innerHTML += `
      <option value="${p.id}">
        ${p.nome} | SKU: ${p.codigo} | Estoque: ${p.quantidade_estoque || 0}
      </option>
    `;
  });
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
      <li class="entrada-item">

        <strong>${e.produto_nome}</strong>

        <br>

        SKU: ${e.produto_codigo || "-"}

        <br>

        NF: ${e.numero_nf || "-"} |
        Data NF: ${formatarData(e.data_nf)}

        <br>

        Quantidade Recebida:
        <strong>${e.quantidade}</strong>

        <br>

        Lote: ${e.lote || "-"} |
        Validade: ${formatarData(e.validade)}

        <br>

        Status:
        <span class="${classeStatus(e.status_conferencia)}">
          ${e.status_conferencia || "PENDENTE"}
        </span>

        <br>

        Responsável:
        ${e.usuario_nome || "Não informado"}

        <br>

        Entrada:
        ${formatarDataHora(e.data_entrada)}

      </li>
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