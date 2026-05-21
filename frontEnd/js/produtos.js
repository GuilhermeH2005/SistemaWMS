const API_URL_PRODUTO = "http://localhost:3000";
let editandoProdutoId = null;

function iniciarProduto() {
  const form = document.getElementById("formProduto");

  if (!form) return;

  carregarFornecedoresProduto();
  carregarListaProdutos();

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

      altura,
      largura,
      profundidade,
     volume: Number(((altura * largura * profundidade) / 1000000).toFixed(6)),

      custo,
      preco_venda: precoVenda,
      margem_lucro: precoVenda - custo,

      estoque_minimo: document.getElementById("estoque_minimo").value,
      giro: document.getElementById("giro").value,
    };

    try {
      let res;

      if (editandoProdutoId) {
        res = await fetch(`${API_URL_PRODUTO}/produtos/${editandoProdutoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(produto)
        });
      } else {
        res = await fetch(`${API_URL_PRODUTO}/produtos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(produto)
        });
      }

      const msg = await res.text();

      if (!res.ok) {
        alert(msg);
        return;
      }

      alert(editandoProdutoId ? "Produto atualizado!" : "Produto cadastrado!");

      editandoProdutoId = null;
      form.reset();
      carregarListaProdutos();

    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      alert("Erro ao salvar produto");
    }
  });
}

async function carregarFornecedoresProduto() {
  try {
    const res = await fetch(`${API_URL_PRODUTO}/fornecedores`);

    if (!res.ok) {
      alert("Erro ao carregar fornecedores");
      return;
    }

    const fornecedores = await res.json();

    const select = document.getElementById("fornecedor");

    if (!select) return;

    select.innerHTML = `<option value="">Selecione o fornecedor</option>`;

    fornecedores.forEach(f => {
      select.innerHTML += `<option value="${f.id}">${f.nome}</option>`;
    });

  } catch (err) {
    console.error("Erro ao carregar fornecedores:", err);
    alert("Erro ao carregar fornecedores");
  }
}

async function carregarListaProdutos() {
  try {
    const res = await fetch(`${API_URL_PRODUTO}/produtos`);

    if (!res.ok) {
      const erro = await res.text();
      console.error("Erro vindo do backend:", erro);
      alert("Erro ao carregar produtos: " + erro);
      return;
    }

    const produtos = await res.json();

    console.log("Produtos vindos do banco:", produtos);

    const lista = document.getElementById("listaProdutos");

    if (!lista) {
      console.error("Elemento listaProdutos não encontrado");
      return;
    }

    lista.innerHTML = "";

    if (produtos.length === 0) {
      lista.innerHTML = `<li>Nenhum produto cadastrado.</li>`;
      return;
    }

    produtos.forEach(p => {
  lista.innerHTML += `
    <tr class="linha-produto" onclick="abrirDetalhesProduto(${p.id})">
      <td>${p.id}</td>
      <td><strong>${p.nome}</strong></td>
      <td>${p.codigo || "-"}</td>
      <td>${p.quantidade_estoque || 0}</td>
      <td>${p.estoque_minimo || 0}</td>
      <td>R$ ${Number(p.custo || 0).toFixed(2)}</td>
      <td>R$ ${Number(p.preco_venda || 0).toFixed(2)}</td>
      <td onclick="event.stopPropagation()">
        <button onclick='editarProduto(${JSON.stringify(p)})'>
          ✏️
        </button>

        <button onclick="excluirProduto(${p.id})">
          🗑️
        </button>
      </td>
    </tr>

    <tr id="detalhes-produto-${p.id}" class="detalhes-produto">
      <td colspan="8">
        <div class="detalhes-produto-box">
          <div>
            <span>Fornecedor</span>
            <strong>${p.fornecedor_nome || "Sem fornecedor"}</strong>
          </div>

          <div>
            <span>Categoria</span>
            <strong>${p.categoria || "-"}</strong>
          </div>

          <div>
            <span>Cor</span>
            <strong>${p.cor || "-"}</strong>
          </div>

          <div>
            <span>Giro</span>
            <strong>${p.giro || "MEDIO"}</strong>
          </div>

          <div>
            <span>Altura</span>
            <strong>${p.altura || 0} cm</strong>
          </div>

          <div>
            <span>Largura</span>
            <strong>${p.largura || 0} cm</strong>
          </div>

          <div>
            <span>Profundidade</span>
            <strong>${p.profundidade || 0} cm</strong>
          </div>

          <div>
            <span>Volume</span>
            <strong>${Number(p.volume || 0).toFixed(4)} m³</strong>
          </div>

          <div>
  <span>Custo</span>
  <strong>R$ ${Number(p.custo || 0).toFixed(2)}</strong>
</div>

<div>
  <span>Venda</span>
  <strong>R$ ${Number(p.preco_venda || 0).toFixed(2)}</strong>
</div>

          <div>
            <span>Lucro</span>
            <strong>R$ ${Number(p.margem_lucro || 0).toFixed(2)}</strong>
          </div>
        </div>
      </td>
    </tr>
  `;
});

  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
    alert("Erro ao carregar produtos");
  }
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
  document.getElementById("giro").value = p.giro || "MEDIO";

  editandoProdutoId = p.id;
}

async function excluirProduto(id) {
  if (!confirm("Deseja excluir este produto?")) return;

  try {
    const res = await fetch(`${API_URL_PRODUTO}/produtos/${id}`, {
      method: "DELETE"
    });

    const msg = await res.text();

    if (!res.ok) {
      alert(msg);
      return;
    }

    alert("Produto excluído!");
    carregarListaProdutos();

  } catch (err) {
    console.error("Erro ao excluir produto:", err);
    alert("Erro ao excluir produto");
  }
}

function abrirDetalhesProduto(id) {
  const linha = document.getElementById(`detalhes-produto-${id}`);

  if (!linha) return;

  linha.classList.toggle("ativo");
}