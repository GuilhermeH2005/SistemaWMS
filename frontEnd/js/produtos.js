var API_URL_PRODUTO = "http://localhost:3000";
var editandoProdutoId = null;
var produtosCache = [];

function iniciarProduto() {
  const form = document.getElementById("formProduto");

  if (!form) return;

  const campoPrecoVenda = document.getElementById("preco_venda");
const campoMargem = document.getElementById("margem_lucro_percentual");

campoMargem.addEventListener("input", () => {
  const custo = obterCustoAtualProdutoSelecionado();
  const margem = Number(campoMargem.value || 0);

  if (custo > 0) {
    campoPrecoVenda.value = (custo + (custo * margem / 100)).toFixed(2);
  }
});

campoPrecoVenda.addEventListener("input", () => {
  const custo = obterCustoAtualProdutoSelecionado();
  const venda = Number(campoPrecoVenda.value || 0);

  if (custo > 0 && venda > 0) {
    campoMargem.value = (((venda - custo) / custo) * 100).toFixed(2);
  }
});

  carregarFornecedoresProduto();
  carregarListaProdutos();
  carregarCategoriasProduto();
  carregarCoresProduto();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const altura = Number(document.getElementById("altura").value);
    const largura = Number(document.getElementById("largura").value);
    const profundidade = Number(document.getElementById("profundidade").value);
    const precoVenda = Number(document.getElementById("preco_venda").value);

    const produto = {
  nome: document.getElementById("nome").value,
  categoria_id: document.getElementById("categoria_id").value,
  cor_id: document.getElementById("cor_id").value,

  altura,
  largura,
  profundidade,
  volume: Number(((altura * largura * profundidade) / 1000000).toFixed(6)),

  preco_venda: precoVenda,
  estoque_minimo: document.getElementById("estoque_minimo").value,
  giro: document.getElementById("giro").value,
  margem_lucro_percentual: document.getElementById("margem_lucro_percentual").value || 0
};

    try {
      let res;

      if (editandoProdutoId) {
        res = await fetch(`${API_URL_PRODUTO}/produtos/${editandoProdutoId}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    ...produto,
    ...getUsuarioAuditoria()
  })
});
      } else {
      res = await fetch(`${API_URL_PRODUTO}/produtos`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    ...produto,
    ...getUsuarioAuditoria()
  })
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

async function carregarCategoriasProduto() {
  const res = await fetch("http://localhost:3000/categorias-produto");
  const categorias = await res.json();

  const select = document.getElementById("categoria_id");

  select.innerHTML = `<option value="">Selecione a categoria</option>`;

  categorias.forEach(c => {
    select.innerHTML += `
      <option value="${c.id}">
        ${c.nome}
      </option>
    `;
  });
}

async function carregarCoresProduto() {
  const res = await fetch("http://localhost:3000/cores-produto");
  const cores = await res.json();

  const select = document.getElementById("cor_id");

  select.innerHTML = `<option value="">Selecione a cor</option>`;

  cores.forEach(c => {
    select.innerHTML += `
      <option value="${c.id}">
        ${c.nome}
      </option>
    `;
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
    produtosCache = produtos;

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
     <td>R$ ${Number(p.ultimo_custo_com_imposto || 0).toFixed(2)}</td>
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
            <strong>${p.categoria_nome || "-"}</strong>
          </div>

          <div>
            <span>Cor</span>
            <strong>${p.cor_nome || "-"}</strong>
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
          
 <div class="grupo-custos-produto">
  <div>
    <span>Último custo s/ imposto</span>
    <strong>R$ ${Number(p.ultimo_custo_sem_imposto || 0).toFixed(2)}</strong>
  </div>

  <div>
    <span>Último custo c/ imposto</span>
    <strong>R$ ${Number(p.ultimo_custo_com_imposto || 0).toFixed(2)}</strong>
  </div>

  <div>
    <span>Custo médio</span>
    <strong>R$ ${Number(p.custo_medio || 0).toFixed(2)}</strong>
  </div>

  <div>
    <span>Margem</span>
    <strong>${Number(p.margem_lucro_percentual || 0).toFixed(2)}%</strong>
  </div>

  <div>
    <span>Venda</span>
    <strong>R$ ${Number(p.preco_venda || 0).toFixed(2)}</strong>
  </div>
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

  const categoria = document.getElementById("categoria_id");
  const cor = document.getElementById("cor_id");

  if (categoria) {
    categoria.value = p.categoria_id || "";
  }

  if (cor) {
    cor.value = p.cor_id || "";
  }

  document.getElementById("altura").value = p.altura || "";
  document.getElementById("largura").value = p.largura || "";
  document.getElementById("profundidade").value = p.profundidade || "";

  document.getElementById("preco_venda").value = p.preco_venda || "";
  document.getElementById("estoque_minimo").value = p.estoque_minimo || "";
  document.getElementById("giro").value = p.giro || "MEDIO";
  document.getElementById("margem_lucro_percentual").value =
  p.margem_lucro_percentual || "";

  editandoProdutoId = p.id;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

async function excluirProduto(id) {
  if (!confirm("Deseja excluir este produto?")) return;

  try {
    const res = await fetch(`${API_URL_PRODUTO}/produtos/${id}`, {
      method: "DELETE",

      headers: {
    "Content-Type": "application/json"
  },

  body: JSON.stringify({
    ...getUsuarioAuditoria()
  })
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

function obterCustoAtualProdutoSelecionado() {
  if (!editandoProdutoId) return 0;

  const produto = produtosCache.find(p => Number(p.id) === Number(editandoProdutoId));

  return Number(produto?.ultimo_custo_com_imposto || 0);
}