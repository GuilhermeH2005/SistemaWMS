const API_URL_POSICOES = "http://localhost:3000";

function iniciarPosicoes() {
  carregarRuasFiltro();
  carregarResumoPosicoes();
  carregarPosicoes();

  const btnGerar = document.getElementById("btnGerarPosicoes");
  const btnFiltrar = document.getElementById("btnFiltrarPosicoes");
  const btnLimpar = document.getElementById("btnLimparFiltros");

  if (btnGerar) {
    btnGerar.addEventListener("click", gerarPosicoes);
  }

  if (btnFiltrar) {
    btnFiltrar.addEventListener("click", carregarPosicoes);
  }

  if (btnLimpar) {
    btnLimpar.addEventListener("click", limparFiltros);
  }
}

function carregarRuasFiltro() {
  const filtroRua = document.getElementById("filtroRua");

  if (!filtroRua) return;

  filtroRua.innerHTML = `<option value="">Todas as ruas</option>`;

  for (let i = 1; i <= 24; i++) {
    filtroRua.innerHTML += `
      <option value="${i}">
        Rua ${String(i).padStart(2, "0")}
      </option>
    `;
  }
}

async function gerarPosicoes() {
  const confirmar = confirm(
    "Deseja gerar as posições do armazém?\n\nEssa ação cria as posições físicas conforme a planta."
  );

  if (!confirmar) return;

  try {
    const resposta = await fetch(`${API_URL_POSICOES}/posicoes/gerar`, {
      method: "POST"
    });

    const mensagem = await resposta.text();

    if (!resposta.ok) {
      alert(mensagem);
      return;
    }

    alert(mensagem);

    carregarResumoPosicoes();
    carregarPosicoes();

  } catch (erro) {
    console.error("Erro ao gerar posições:", erro);
    alert("Erro ao gerar posições");
  }
}

async function carregarResumoPosicoes() {
  try {
    const resposta = await fetch(`${API_URL_POSICOES}/posicoes/resumo`);

    if (!resposta.ok) {
      console.error("Erro ao carregar resumo das posições");
      return;
    }

    const resumo = await resposta.json();

    document.getElementById("totalPosicoes").textContent =
      resumo.total || 0;

    document.getElementById("posicoesLivres").textContent =
      resumo.livres || 0;

    document.getElementById("posicoesOcupadas").textContent =
      resumo.ocupadas || 0;

    document.getElementById("posicoesBloqueadas").textContent =
      resumo.bloqueadas || 0;

  } catch (erro) {
    console.error("Erro ao carregar resumo:", erro);
  }
}

async function carregarPosicoes() {
  try {
    const status = document.getElementById("filtroStatus")?.value || "";
    const rua = document.getElementById("filtroRua")?.value || "";
    const endereco = document.getElementById("filtroEndereco")?.value || "";
    const produto = document.getElementById("filtroProduto")?.value || "";

    const params = new URLSearchParams();

    if (status) params.append("status", status);
    if (rua) params.append("rua", rua);
    if (endereco) params.append("endereco", endereco);
    if (produto) params.append("produto", produto);

    const url = `${API_URL_POSICOES}/posicoes?${params.toString()}`;

    const resposta = await fetch(url);

    if (!resposta.ok) {
      const erro = await resposta.text();
      console.error(erro);
      alert("Erro ao carregar posições");
      return;
    }

    const posicoes = await resposta.json();

    const tbody = document.getElementById("listaPosicoes");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (posicoes.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">Nenhuma posição encontrada.</td>
        </tr>
      `;
      return;
    }

    posicoes.forEach(p => {
      const classe =
        p.status === "LIVRE"
          ? "status-livre"
          : p.status === "BLOQUEADA"
            ? "status-bloqueado"
            : "status-ocupado";

      tbody.innerHTML += `
        <tr>
          <td><strong>${p.endereco}</strong></td>
          <td>${p.rua}</td>
          <td>${p.coluna}</td>
          <td>${p.nivel}</td>
          <td class="${classe}">${p.status}</td>
          <td>${p.produto_nome || "-"}</td>
          <td>${p.quantidade_unidades || "-"}</td>
          <td>
            ${p.ocupacao_m3
              ? Number(p.ocupacao_m3).toFixed(3) + " m³"
              : "-"
            }
          </td>
        </tr>
      `;
    });

  } catch (erro) {
    console.error("Erro ao carregar posições:", erro);
    alert("Erro ao carregar posições");
  }
}

function limparFiltros() {
  document.getElementById("filtroStatus").value = "";
  document.getElementById("filtroRua").value = "";
  document.getElementById("filtroEndereco").value = "";
  document.getElementById("filtroProduto").value = "";

  carregarPosicoes();
}