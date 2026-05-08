function iniciarEstoque() {
  carregarEstoque();
}

async function carregarEstoque() {
  const res = await fetch("http://localhost:3000/produtos");
  const produtos = await res.json();

  const lista = document.getElementById("listaEstoque");
  const totalProdutos = document.getElementById("totalProdutos");
  const totalUnidades = document.getElementById("totalUnidades");

  lista.innerHTML = "";

  let somaUnidades = 0;

  produtos.forEach(p => {
    const quantidade = Number(p.quantidade_estoque || 0);
    const minimo = Number(p.estoque_minimo || 0);

    somaUnidades += quantidade;

    const estoqueBaixo = quantidade <= minimo;

    lista.innerHTML += `
      <li class="${estoqueBaixo ? "estoque-baixo" : ""}">
        <strong>${p.nome}</strong> - Código: ${p.codigo || ""}
        <br>
        Fornecedor: ${p.fornecedor_nome || "Sem fornecedor"}
        <br>
        Estoque atual: <strong>${quantidade}</strong>
        <br>
        Estoque mínimo: <strong>${minimo}</strong>
        <br>
        Peso: ${p.peso || 0} kg | Volume: ${p.volume || 0} m³
      </li>
    `;
  });

  totalProdutos.textContent = produtos.length;
  totalUnidades.textContent = somaUnidades;
}