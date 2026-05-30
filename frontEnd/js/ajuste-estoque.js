var API_URL_AJUSTE ="http://localhost:3000";

function iniciarAjusteEstoque() {
  carregarProdutosAjuste();
  carregarAjustes();

  const produtoSelect = document.getElementById("produto_id");
  const form = document.getElementById("formAjuste");

  if (produtoSelect) {
    produtoSelect.addEventListener("change", buscarEstoqueProduto);
  }

  if (form) {
    form.addEventListener("submit", salvarAjuste);
  }
}

async function carregarProdutosAjuste() {
  try {
    const resposta = await fetch(`${API_URL_AJUSTE}/produtos`);

    if (!resposta.ok) {
      const erroTexto = await resposta.text();
      console.error("Erro vindo do backend:", erroTexto);
      alert("Erro ao carregar produtos: " + erroTexto);
      return;
    }

    const produtos = await resposta.json();

    const select = document.getElementById("produto_id");

    if (!select) {
      console.error("Select produto_id não encontrado na página.");
      return;
    }

    select.innerHTML = `<option value="">Selecione um produto</option>`;

    produtos.forEach(produto => {
      const option = document.createElement("option");
      option.value = produto.id;
      option.textContent = `${produto.nome} - Estoque: ${produto.quantidade_estoque ?? 0}`;
      select.appendChild(option);
    });

  } catch (erro) {
    console.error("Erro ao carregar produtos:", erro);
    alert("Erro ao carregar produtos. Verifique se o servidor está rodando.");
  }
}

async function buscarEstoqueProduto() {
  const produtoId = document.getElementById("produto_id").value;
  const estoqueAtual = document.getElementById("estoque_atual");

  if (!produtoId) {
    estoqueAtual.value = "";
    return;
  }

  try {
    const resposta = await fetch(`${API_URL_AJUSTE}/produtos/${produtoId}`);

    if (!resposta.ok) {
      throw new Error("Produto não encontrado");
    }

    const produto = await resposta.json();

    estoqueAtual.value = produto.quantidade_estoque ?? 0;

  } catch (erro) {
    console.error("Erro ao buscar estoque:", erro);
    alert("Erro ao buscar estoque do produto.");
  }
}

async function salvarAjuste(event) {
  event.preventDefault();

  const produto_id = document.getElementById("produto_id").value;
  const tipo = document.getElementById("tipo").value;
  const quantidade = Number(document.getElementById("quantidade").value);
  const motivo = document.getElementById("motivo").value;
  const observacao = document.getElementById("observacao").value.trim();

  if (!produto_id || !tipo || !quantidade || !motivo) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  if (quantidade <= 0) {
    alert("A quantidade deve ser maior que zero.");
    return;
  }

  const confirmar = confirm("Deseja realmente salvar este ajuste de estoque?");

  if (!confirmar) {
    return;
  }

  try {
    const resposta = await fetch(`${API_URL_AJUSTE}/ajustes-estoque`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        produto_id,
        tipo,
        quantidade,
        motivo,
        observacao,

        // Depois podemos trocar isso pelo usuário logado vindo do backend/token.
        usuario_id: 1
      })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      alert(dados.erro || "Erro ao salvar ajuste.");
      return;
    }

    alert("Ajuste realizado com sucesso!");

    document.getElementById("formAjuste").reset();
    document.getElementById("estoque_atual").value = "";

    carregarAjustes();

  } catch (erro) {
    console.error("Erro ao salvar ajuste:", erro);
    alert("Erro ao conectar com o servidor.");
  }
}

async function carregarAjustes() {
  try {
    const resposta = await fetch(`${API_URL_AJUSTE}/ajustes-estoque`);
    const ajustes = await resposta.json();

    const tbody = document.getElementById("tabelaAjustes");

    if (!ajustes.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">Nenhum ajuste registrado.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = "";

    ajustes.forEach(ajuste => {
      const tr = document.createElement("tr");

      const classeTipo = ajuste.tipo === "ENTRADA" ? "tipo-entrada" : "tipo-saida";

      tr.innerHTML = `
        <td>${formatarData(ajuste.data_ajuste)}</td>
        <td>${ajuste.produto_nome}</td>
        <td class="${classeTipo}">${ajuste.tipo}</td>
        <td>${ajuste.quantidade_anterior}</td>
        <td>${ajuste.quantidade_ajustada}</td>
        <td>${ajuste.quantidade_nova}</td>
        <td>${ajuste.motivo}</td>
        <td>${ajuste.usuario_login || "Sistema"}</td>
      `;

      tbody.appendChild(tr);
    });

  } catch (erro) {
    console.error("Erro ao carregar ajustes:", erro);

    document.getElementById("tabelaAjustes").innerHTML = `
      <tr>
        <td colspan="8">Erro ao carregar ajustes.</td>
      </tr>
    `;
  }
}

function formatarData(data) {
  if (!data) return "-";

  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}