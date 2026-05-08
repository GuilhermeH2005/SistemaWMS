let editandoProdutoId = null;

function iniciarProduto() {
  const form = document.getElementById("formProduto");

  if (!form) return;

  carregarFornecedores();
  carregarProdutos();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const produto = {
  nome: document.getElementById("nome").value,
  codigo: document.getElementById("codigo").value,
  fornecedor_id: document.getElementById("fornecedor").value,
  peso: document.getElementById("peso").value,
  volume: document.getElementById("volume").value,
  estoque_minimo: document.getElementById("estoque_minimo").value
};

    try {
      if (editandoProdutoId) {
        await fetch(`http://localhost:3000/produtos/${editandoProdutoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(produto)
        });

        alert("Produto atualizado!");
        editandoProdutoId = null;
      } else {
        await fetch("http://localhost:3000/produtos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(produto)
        });

        alert("Produto cadastrado!");
      }

      form.reset();
      carregarProdutos();

    } catch (err) {
      console.error("Erro:", err);
      alert("Erro ao salvar produto");
    }
  });
}

async function carregarFornecedores() {
  const res = await fetch("http://localhost:3000/fornecedores");
  const fornecedores = await res.json();

  const select = document.getElementById("fornecedor");
  select.innerHTML = `<option value="">Selecione o fornecedor</option>`;

  fornecedores.forEach(f => {
    select.innerHTML += `<option value="${f.id}">${f.nome}</option>`;
  });
}

async function carregarProdutos() {
  const res = await fetch("http://localhost:3000/produtos");
  const produtos = await res.json();

  const lista = document.getElementById("listaProdutos");
  lista.innerHTML = "";

  produtos.forEach(p => {
    lista.innerHTML += `
      <li>
        <strong>${p.nome}</strong> - Código: ${p.codigo || ""}
        <br>
        Fornecedor: ${p.fornecedor_nome || "Sem fornecedor"}
        <br>
        Peso: ${p.peso || 0} | Volume: ${p.volume || 0}

        <button onclick='editarProduto(${JSON.stringify(p)})'>✏️ Editar</button>
        <button onclick="excluirProduto(${p.id})">🗑️ Excluir</button>
      </li>
      <hr>
    `;
  });
}

function editarProduto(p) {
  document.getElementById("nome").value = p.nome || "";
  document.getElementById("codigo").value = p.codigo || "";
  document.getElementById("fornecedor").value = p.fornecedor_id || "";
  document.getElementById("peso").value = p.peso || "";
  document.getElementById("volume").value = p.volume || "";
  document.getElementById("estoque_minimo").value = p.estoque_minimo || "";

  editandoProdutoId = p.id;
}

async function excluirProduto(id) {
  if (!confirm("Deseja excluir este produto?")) return;

  await fetch(`http://localhost:3000/produtos/${id}`, {
    method: "DELETE"
  });

  carregarProdutos();
}