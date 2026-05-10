let editandoProdutoId = null;

function iniciarProduto() {
  const form = document.getElementById("formProduto");

  if (!form) return;

  carregarFornecedores();
  carregarProdutos();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const altura = Number(document.getElementById("altura").value);
    const largura = Number(document.getElementById("largura").value);
    const profundidade = Number(document.getElementById("profundidade").value);

    const custo = Number(document.getElementById("custo").value);
    const precoVenda = Number(document.getElementById("preco_venda").value);

    const produto = {
      nome: document.getElementById("nome").value,
      fornecedor_id: document.getElementById("fornecedor").value,
      categoria: document.getElementById("categoria").value,
      cor: document.getElementById("cor").value,

      altura: altura,
      largura: largura,
      profundidade: profundidade,
      volume: altura * largura * profundidade,

      custo: custo,
      preco_venda: precoVenda,
      margem_lucro: precoVenda - custo,

      estoque_minimo: document.getElementById("estoque_minimo").value
    };

    try {
      let res;

      if (editandoProdutoId) {
        res = await fetch(`http://localhost:3000/produtos/${editandoProdutoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(produto)
        });

        const msg = await res.text();

        if (!res.ok) {
          alert(msg);
          return;
        }

        alert("Produto atualizado!");
        editandoProdutoId = null;
      } else {
        res = await fetch("http://localhost:3000/produtos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(produto)
        });

        const msg = await res.text();

        if (!res.ok) {
          alert(msg);
          return;
        }

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
        <strong>${p.nome}</strong> - SKU: ${p.codigo || ""}
        <br>
        Categoria: ${p.categoria || ""} | Cor: ${p.cor || ""}
        <br>
        Fornecedor: ${p.fornecedor_nome || "Sem fornecedor"}
        <br>
        Estoque: ${p.quantidade_estoque || 0} | Mínimo: ${p.estoque_minimo || 0}
        <br>
        Medidas: ${p.altura || 0}m x ${p.largura || 0}m x ${p.profundidade || 0}m
        <br>
        Volume: ${p.volume || 0} m³
        <br>
        Custo: R$ ${p.custo || 0} | Venda: R$ ${p.preco_venda || 0} | Lucro: R$ ${p.margem_lucro || 0}

        <button onclick='editarProduto(${JSON.stringify(p)})'>✏️ Editar</button>
        <button onclick="excluirProduto(${p.id})">🗑️ Excluir</button>
      </li>
    `;
  });
}

function editarProduto(p) {
  document.getElementById("nome").value = p.nome || "";
  document.getElementById("fornecedor").value = p.fornecedor_id || "";
  document.getElementById("categoria").value = p.categoria || "";
  document.getElementById("cor").value = p.cor || "";

  document.getElementById("altura").value = p.altura || "";
  document.getElementById("largura").value = p.largura || "";
  document.getElementById("profundidade").value = p.profundidade || "";

  document.getElementById("custo").value = p.custo || "";
  document.getElementById("preco_venda").value = p.preco_venda || "";
  document.getElementById("estoque_minimo").value = p.estoque_minimo || "";

  editandoProdutoId = p.id;
}

async function excluirProduto(id) {
  if (!confirm("Deseja excluir este produto?")) return;

  const res = await fetch(`http://localhost:3000/produtos/${id}`, {
    method: "DELETE"
  });

  const msg = await res.text();

  if (!res.ok) {
    alert(msg);
    return;
  }

  carregarProdutos();
}