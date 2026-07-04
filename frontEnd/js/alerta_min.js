function iniciarAlertas() {
  carregarAlertas();
}

async function carregarAlertas() {

  const res = await fetch("http://localhost:3000/produtos?listarTodos=true&limite=500");
  const produtos = await res.json();

  const lista = document.getElementById("listaAlertas");

  lista.innerHTML = "";

  const alertas = produtos.filter(p =>
    Number(p.quantidade_estoque || 0)
    <=
    Number(p.estoque_minimo || 0)
  );

  if (alertas.length === 0) {

    lista.innerHTML = `
      <li class="sem-alerta">
        Nenhum produto com estoque baixo ✅
      </li>
    `;

    return;
  }

  alertas.forEach(p => {

    lista.innerHTML += `
      <li class="alerta-item">

        <strong>${p.nome}</strong>

        <br>

        Código: ${p.codigo || ""}

        <br>

        Estoque Atual:
        <strong>${p.quantidade_estoque}</strong>

        <br>

        Estoque Mínimo:
        <strong>${p.estoque_minimo}</strong>

        <br>

        Fornecedor:
        ${p.fornecedor_nome || "Sem fornecedor"}

      </li>
    `;
  });
}