var produtosEstoque = [];

function iniciarEstoque() {
  carregarEstoque();
}

async function carregarEstoque() {
  try {
    const res = await fetch("http://localhost:3000/produtos?listarTodos=true&limite=500");
    produtosEstoque = await res.json();

    renderizarEstoque(produtosEstoque);

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar estoque.");
  }
}

function renderizarEstoque(produtos) {
  const lista = document.getElementById("listaEstoque");

  if (!lista) return;

  lista.innerHTML = "";

  if (produtos.length === 0) {
    lista.innerHTML = `
      <tr>
        <td colspan="12" class="sem-registro">
          Nenhum produto encontrado.
        </td>
      </tr>
    `;
    return;
  }

  produtos.forEach(produto => {
    const estoque = Number(produto.quantidade_estoque || 0);
    const minimo = Number(produto.estoque_minimo || 0);

    const custo = Number(produto.ultimo_custo_com_imposto || 0);
    const venda = Number(produto.preco_venda || 0);

    const volume = Number(produto.volume || 0);

    const valorTotal = estoque * custo;
    const volumeTotal = estoque * volume;

    let status = "NORMAL";
    let classeStatus = "status-normal";

    if (estoque <= 0) {
      status = "SEM ESTOQUE";
      classeStatus = "status-sem";
    } else if (estoque <= minimo) {
      status = "BAIXO";
      classeStatus = "status-baixo";
    }

    lista.innerHTML += `
      <tr>
        <td>${produto.codigo || "-"}</td>
        <td>${produto.nome || "-"}</td>
        <td>${produto.categoria_nome || "-"}</td>
        <td>${produto.fornecedor_nome || "-"}</td>
        <td>${produto.cor_nome || "-"}</td>
        <td>${estoque}</td>
        <td>${minimo}</td>

        <td>
          <span class="${classeStatus}">
            ${status}
          </span>
        </td>

        <td>${formatarMoeda(custo)}</td>
        <td>${formatarMoeda(venda)}</td>
        <td>${formatarMoeda(valorTotal)}</td>
        <td>${volumeTotal.toFixed(3)} m³</td>
      </tr>
    `;
  });
}

function filtrarEstoque() {
  const texto = document
    .getElementById("buscarEstoque")
    .value
    .toLowerCase();

  const filtrados = produtosEstoque.filter(produto => {
    return (
      String(produto.nome || "").toLowerCase().includes(texto) ||
      String(produto.codigo || "").toLowerCase().includes(texto) ||
      String(produto.categoria_nome || "").toLowerCase().includes(texto) ||
      String(produto.cor_nome || "").toLowerCase().includes(texto)
    );
  });

  renderizarEstoque(filtrados);
}

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}