function iniciarEntrada() {
  const form = document.getElementById("formEntrada");

  if (!form) return;

  carregarProdutosEntrada();
  carregarEntradas();
  aplicarMascaraData();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const entrada = {
      produto_id: document.getElementById("produto_id").value,
      quantidade: document.getElementById("quantidade").value,
      numero_nf: document.getElementById("numero_nf").value,

      // converte dd/mm/aaaa para aaaa-mm-dd antes de enviar ao banco
      data_nf: converterDataParaBanco(document.getElementById("data_nf").value),

      lote: document.getElementById("lote").value,

      // converte dd/mm/aaaa para aaaa-mm-dd antes de enviar ao banco
      validade: converterDataParaBanco(document.getElementById("validade").value)
    };

    try {
      await fetch("http://localhost:3000/entradas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entrada)
      });

      alert("Entrada registrada!");
      form.reset();

      carregarProdutosEntrada();
      carregarEntradas();

    } catch (err) {
      console.error("Erro:", err);
      alert("Erro ao registrar entrada");
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
        ${p.nome} - Estoque: ${p.quantidade_estoque || 0}
      </option>
    `;
  });
}

async function carregarEntradas() {
  const res = await fetch("http://localhost:3000/entradas");
  const entradas = await res.json();

  const lista = document.getElementById("listaEntradas");
  lista.innerHTML = "";

  entradas.forEach(e => {
    lista.innerHTML += `
      <li>
        <strong>${e.produto_nome}</strong> - Quantidade: ${e.quantidade}
        <br>
        NF: ${e.numero_nf || ""}
        <br>
        Lote: ${e.lote || ""} | Validade: ${formatarData(e.validade)}
        <br>
        Entrada: ${formatarDataHora(e.data_entrada)}
      </li>
    `;
  });
}

function aplicarMascaraData() {
  const campos = [
    document.getElementById("data_nf"),
    document.getElementById("validade")
  ];

  campos.forEach(campo => {
    campo.addEventListener("input", () => {
      let valor = campo.value.replace(/\D/g, "");

      valor = valor.replace(/^(\d{2})(\d)/, "$1/$2");
      valor = valor.replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");

      campo.value = valor.substring(0, 10);
    });
  });
}

function converterDataParaBanco(dataBR) {
  if (!dataBR) return null;

  const partes = dataBR.split("/");

  if (partes.length !== 3) return null;

  const dia = partes[0];
  const mes = partes[1];
  const ano = partes[2];

  return `${ano}-${mes}-${dia}`;
}

function formatarData(data) {
  if (!data) return "";

  const d = new Date(data);
  return d.toLocaleDateString("pt-BR");
}

function formatarDataHora(data) {
  if (!data) return "";

  const d = new Date(data);
  return d.toLocaleString("pt-BR");
}