function iniciarEntrada() {
  const form = document.getElementById("formEntrada");

  if (!form) return;

  carregarProdutosEntrada();
  carregarEntradas();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const entrada = {
      produto_id: document.getElementById("produto_id").value,
      quantidade: document.getElementById("quantidade").value,
      numero_nf: document.getElementById("numero_nf").value,
      data_nf: document.getElementById("data_nf").value,
      lote: document.getElementById("lote").value,
      validade: document.getElementById("validade").value
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
        NF: ${e.numero_nf || ""} | Série: ${e.serie_nf || ""}
        <br>
        Lote: ${e.lote || ""} | Validade: ${formatarData(e.validade)}
        <br>
        Entrada: ${formatarDataHora(e.data_entrada)}
      </li>
      <hr>
    `;
  });
}

function formatarData(data) {
  if (!data) return "";
  return new Date(data).toLocaleDateString("pt-BR");
}

function formatarDataHora(data) {
  if (!data) return "";
  return new Date(data).toLocaleString("pt-BR");
}