const API_URL_ENDERECO = "http://localhost:3000";

let produtosPendentes = [];

function iniciarEnderecamento() {
  carregarProdutosEndereco();
  carregarOpcoesEndereco();
  carregarEnderecos();

  const produtoSelect = document.getElementById("produto_id");
  const btnSugerir = document.getElementById("btnSugerirEndereco");
  const form = document.getElementById("formEndereco");

  const rua = document.getElementById("rua");
  const coluna = document.getElementById("coluna");
  const nivel = document.getElementById("nivel");

  if (produtoSelect) {
    produtoSelect.addEventListener("change", mostrarInfoProduto);
  }

  if (rua) rua.addEventListener("change", gerarEnderecoManual);
  if (coluna) coluna.addEventListener("change", gerarEnderecoManual);
  if (nivel) nivel.addEventListener("change", gerarEnderecoManual);

  if (btnSugerir) {
    btnSugerir.addEventListener("click", sugerirEndereco);
  }

  if (form) {
    form.addEventListener("submit", salvarEndereco);
  }
}

function carregarOpcoesEndereco() {
  const rua = document.getElementById("rua");
  const coluna = document.getElementById("coluna");
  const nivel = document.getElementById("nivel");

  if (!rua || !coluna || !nivel) return;

  rua.innerHTML = `<option value="">Selecione a rua</option>`;
  coluna.innerHTML = `<option value="">Selecione a coluna</option>`;
  nivel.innerHTML = `<option value="">Selecione o nível</option>`;

  for (let i = 1; i <= 24; i++) {
    rua.innerHTML += `
      <option value="${i}">
        Rua ${String(i).padStart(2, "0")}
      </option>
    `;
  }

  for (let i = 1; i <= 20; i++) {
    coluna.innerHTML += `
      <option value="${i}">
        Coluna ${String(i).padStart(3, "0")}
      </option>
    `;
  }

  for (let i = 1; i <= 7; i++) {
    nivel.innerHTML += `
      <option value="${i}">
        Nível ${i}
      </option>
    `;
  }
}

function gerarEnderecoManual() {
  const rua = document.getElementById("rua").value;
  const coluna = document.getElementById("coluna").value;
  const nivel = document.getElementById("nivel").value;
  const endereco = document.getElementById("endereco");

  if (!rua || !coluna || !nivel) {
    endereco.value = "";
    return;
  }

  endereco.value =
    `R${String(rua).padStart(2, "0")}-C${String(coluna).padStart(3, "0")}-N${String(nivel).padStart(2, "0")}`;
}

async function carregarProdutosEndereco() {
  try {
    const resposta =
      await fetch(`${API_URL_ENDERECO}/produtos-pendentes-enderecamento`);

    const produtos = await resposta.json();

    produtosPendentes = produtos;

    const select = document.getElementById("produto_id");

    if (!select) return;

    select.innerHTML = `
      <option value="">
        Selecione um produto pendente
      </option>
    `;

    if (produtos.length === 0) {
      select.innerHTML += `
        <option value="">
          Todos os produtos já estão endereçados
        </option>
      `;
      return;
    }

    produtos.forEach(produto => {
      select.innerHTML += `
        <option value="${produto.id}">
          ${produto.nome} | Pendente: ${produto.quantidade_pendente} un
        </option>
      `;
    });

  } catch (erro) {
    console.error("Erro ao carregar produtos pendentes:", erro);
    alert("Erro ao carregar produtos pendentes");
  }
}

function mostrarInfoProduto() {
  const produtoId = document.getElementById("produto_id").value;
  const info = document.getElementById("infoProdutoEndereco");
  const quantidadeInput = document.getElementById("quantidade_unidades");

  const produto = produtosPendentes.find(p => String(p.id) === String(produtoId));

  if (!produto) {
    info.innerHTML = "Selecione um produto para ver o saldo pendente.";
    quantidadeInput.value = "";
    return;
  }

  const capacidadeM3 = 1.8;
  const volumeProduto = Number(produto.volume || 0);
  const quantidadePendente = Number(produto.quantidade_pendente || 0);

  let capacidadeUnidades = 0;

  if (volumeProduto > 0) {
    capacidadeUnidades = Math.floor(capacidadeM3 / volumeProduto);
  }

  const quantidadeSugerida = Math.min(
    capacidadeUnidades,
    quantidadePendente
  );

  info.innerHTML = `
    <strong>${produto.nome}</strong><br>
    Estoque total: ${produto.quantidade_estoque} un<br>
    Já endereçado: ${produto.quantidade_enderecada} un<br>
    Falta endereçar: ${produto.quantidade_pendente} un<br><br>

    Volume unitário: ${volumeProduto.toFixed(4)} m³<br>
    Capacidade da posição-palete: ${capacidadeM3.toFixed(2)} m³<br>
    Cabem aproximadamente: <strong>${capacidadeUnidades} un</strong><br>
    Quantidade sugerida para este endereço: <strong>${quantidadeSugerida} un</strong>
  `;

  quantidadeInput.value = quantidadeSugerida;
}

async function sugerirEndereco() {
  const produtoId = document.getElementById("produto_id").value;

  if (!produtoId) {
    alert("Selecione um produto.");
    return;
  }

  try {
    const resposta =
      await fetch(`${API_URL_ENDERECO}/enderecos/sugerir/${produtoId}`);

    if (!resposta.ok) {
      const erro = await resposta.text();
      alert(erro);
      return;
    }

    const dados = await resposta.json();
    const sugestao = dados.sugestao;

    document.getElementById("posicao_id").value = sugestao.id;

    document.getElementById("rua").value = sugestao.rua;
    document.getElementById("coluna").value = sugestao.coluna;
    document.getElementById("nivel").value = sugestao.nivel;
    document.getElementById("endereco").value = sugestao.endereco;

    mostrarInfoProduto();

    alert(
      `Endereço sugerido: ${sugestao.endereco}\n\n` +
      `Giro: ${dados.giro}\n` +
      `Volume produto: ${dados.volume} m³\n` +
      `Capacidade posição: ${sugestao.capacidade_m3} m³`
    );

  } catch (erro) {
    console.error("Erro ao sugerir posição:", erro);
    alert("Erro ao sugerir posição");
  }
}

async function salvarEndereco(event) {
  event.preventDefault();

  gerarEnderecoManual();

  const dados = {
  produto_id: document.getElementById("produto_id").value,
  posicao_id: document.getElementById("posicao_id").value || null,
  rua: document.getElementById("rua").value,
  coluna: document.getElementById("coluna").value,
  nivel: document.getElementById("nivel").value,
  endereco: document.getElementById("endereco").value,
  quantidade_unidades: document.getElementById("quantidade_unidades").value,
  observacao: document.getElementById("observacao").value
};

  if (
  !dados.produto_id ||
  !dados.quantidade_unidades ||
  !dados.rua ||
  !dados.coluna ||
  !dados.nivel ||
  !dados.endereco
) {
  alert("Selecione o produto, informe rua, coluna, nível e quantidade.");
  return;
}

  try {
    const resposta = await fetch(`${API_URL_ENDERECO}/enderecos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(dados)
    });

    const retorno = await resposta.json();

    if (!resposta.ok) {
      alert(retorno.erro || "Erro ao salvar endereçamento.");
      return;
    }

    if (retorno.quantidade_pendente_depois > 0) {
      alert(
        `Endereçamento salvo parcialmente ✅\n\n` +
        `Produto: ${retorno.produto}\n` +
        `Endereço: ${retorno.endereco}\n` +
        `Capacidade da posição: ${retorno.capacidade_unidades} un\n` +
        `Armazenado: ${retorno.quantidade_armazenada} un\n` +
        `Ainda falta endereçar: ${retorno.quantidade_pendente_depois} un`
      );
    } else {
      alert(
        `Produto totalmente endereçado ✅\n\n` +
        `Produto: ${retorno.produto}\n` +
        `Endereço: ${retorno.endereco}\n` +
        `Quantidade armazenada: ${retorno.quantidade_armazenada} un`
      );
    }

    document.getElementById("formEndereco").reset();
    document.getElementById("infoProdutoEndereco").innerHTML =
      "Selecione um produto para ver o saldo pendente.";

    carregarProdutosEndereco();
    carregarEnderecos();

  } catch (erro) {
    console.error("Erro ao salvar endereçamento:", erro);
    alert("Erro ao salvar endereçamento");
  }
}

async function carregarEnderecos() {
  try {
    const resposta = await fetch(`${API_URL_ENDERECO}/enderecos`);
    const enderecos = await resposta.json();

    const tbody = document.getElementById("listaEnderecos");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (enderecos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9">Nenhum produto endereçado.</td>
        </tr>
      `;
      return;
    }

    enderecos.forEach(item => {
      tbody.innerHTML += `
        <tr>
          <td><strong>${item.endereco}</strong></td>
          <td>${item.produto_nome}</td>
          <td>${item.rua}</td>
          <td>${item.coluna}</td>
          <td>${item.nivel}</td>
          <td>${item.quantidade_unidades}</td>
          <td>${item.capacidade_unidades}</td>
          <td>${Number(item.ocupacao_m3 || 0).toFixed(3)} m³</td>
          <td>
            <button onclick="excluirEndereco(${item.id})">
              Excluir
            </button>
          </td>
        </tr>
      `;
    });

  } catch (erro) {
    console.error("Erro ao carregar endereços:", erro);
    alert("Erro ao carregar endereços");
  }
}

async function excluirEndereco(id) {
  if (!confirm("Deseja excluir este endereçamento?")) return;

  try {
    const resposta = await fetch(`${API_URL_ENDERECO}/enderecos/${id}`, {
      method: "DELETE"
    });

    const mensagem = await resposta.text();

    if (!resposta.ok) {
      alert(mensagem);
      return;
    }

    alert("Endereçamento excluído!");
    carregarProdutosEndereco();
    carregarEnderecos();

  } catch (erro) {
    console.error("Erro ao excluir endereçamento:", erro);
    alert("Erro ao excluir endereçamento");
  }
}