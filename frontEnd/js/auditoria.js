var API_AUDITORIA = "http://localhost:3000";
var auditoriasCarregadas = [];

function iniciarAuditoria() {
  const lista = document.getElementById("listaAuditoria");

  if (lista) {
    lista.innerHTML = `
      <tr>
        <td colspan="7">
          Use os filtros acima ou clique em "Últimas 20".
        </td>
      </tr>
    `;
  }
}

async function pesquisarAuditoria() {
  await carregarAuditoria(false);
}

async function carregarUltimasAuditorias() {
  await carregarAuditoria(true);
}

async function carregarAuditoria(ultimas20 = false) {
  try {
    const busca = document.getElementById("filtroBuscaAuditoria")?.value || "";
    const tabela = document.getElementById("filtroTabelaAuditoria")?.value || "TODAS";
    const acao = document.getElementById("filtroAcaoAuditoria")?.value || "TODAS";
    const usuario = document.getElementById("filtroUsuarioAuditoria")?.value || "";
    const dataInicio = document.getElementById("filtroDataInicioAuditoria")?.value || "";
    const dataFim = document.getElementById("filtroDataFimAuditoria")?.value || "";

    const params = new URLSearchParams({
      busca,
      tabela,
      acao,
      usuario,
      data_inicio: dataInicio,
      data_fim: dataFim,
      limite: ultimas20 ? "20" : ""
    });

    const resposta = await fetch(
      `${API_AUDITORIA}/auditoria?${params.toString()}`
    );

    if (!resposta.ok) {
      const erro = await resposta.text();
      alert("Erro ao carregar auditoria");
      console.error(erro);
      return;
    }

    auditoriasCarregadas = await resposta.json();

    renderizarAuditoria(auditoriasCarregadas);

  } catch (erro) {
    console.error("Erro ao carregar auditoria:", erro);
    alert("Erro ao carregar auditoria");
  }
}

function renderizarAuditoria(auditorias) {
  const lista = document.getElementById("listaAuditoria");

  if (!lista) return;

  lista.innerHTML = "";

  if (auditorias.length === 0) {
    lista.innerHTML = `
      <tr>
        <td colspan="7">
          Nenhum registro encontrado.
        </td>
      </tr>
    `;
    return;
  }

  auditorias.forEach((item, index) => {
    const tabela =
      item.tabela_afetada || item.tabela || "-";

   const registroFormatado =
  item.registro_id || "-";
  
    lista.innerHTML += `
      <tr
        class="linha-auditoria"
        ondblclick="alternarDetalheAuditoria(${index})"
      >
        <td>${formatarDataAuditoria(item.data_hora)}</td>

        <td>${item.usuario_nome || "Sistema"}</td>

        <td>${gerarBadgeAcao(item.acao)}</td>

        <td>${tabela}</td>

        <td>${registroFormatado}</td>

        <td class="resumo-auditoria">
          ${resumirTexto(item.descricao || "-", 65)}
        </td>

        <td>
          <button
            type="button"
            class="btn-detalhes-auditoria"
            onclick="alternarDetalheAuditoria(${index})"
          >
            👁 Ver
          </button>
        </td>
      </tr>

      <tr
        id="detalhe-auditoria-${index}"
        class="linha-detalhe-auditoria hidden"
      >
        <td colspan="7">
          <div class="box-detalhe-auditoria">

            <div class="detalhe-grid-auditoria">

              <div>
                <span>ID Auditoria</span>
                <strong>${item.id}</strong>
              </div>

              <div>
                <span>Usuário</span>
                <strong>${item.usuario_nome || "Sistema"}</strong>
              </div>

              <div>
                <span>Ação</span>
                <strong>${item.acao || "-"}</strong>
              </div>

              <div>
                <span>Tabela</span>
                <strong>${tabela}</strong>
              </div>

              <div>
                <span>Registro</span>
                <strong>${registroFormatado}</strong>
              </div>

              <div>
                <span>Data/Hora</span>
                <strong>${formatarDataAuditoria(item.data_hora)}</strong>
              </div>

            </div>

            <div class="descricao-detalhe-auditoria">
              <span>Descrição completa</span>
              <p>${item.descricao || "-"}</p>
            </div>

          </div>
        </td>
      </tr>
    `;
  });
}

function abrirDetalhesAuditoria(index) {
  const item = auditoriasCarregadas[index];

  if (!item) return;

  const detalhes = document.getElementById("detalhesAuditoria");

  detalhes.innerHTML = `
    <div class="detalhe-grid">
      <div>
        <span>ID</span>
        <strong>${item.id}</strong>
      </div>

      <div>
        <span>Usuário</span>
        <strong>${item.usuario_nome || "Sistema"}</strong>
      </div>

      <div>
        <span>Ação</span>
        <strong>${item.acao || "-"}</strong>
      </div>

      <div>
        <span>Tabela</span>
        <strong>${item.tabela_afetada || item.tabela || "-"}</strong>
      </div>

      <div>
        <span>Registro</span>
        <strong>${item.registro_id || "-"}</strong>
      </div>

      <div>
        <span>Data/Hora</span>
        <strong>${formatarDataAuditoria(item.data_hora)}</strong>
      </div>
    </div>

    <div class="descricao-completa-auditoria">
      <span>Descrição completa</span>
      <p>${item.descricao || "-"}</p>
    </div>
  `;

  document
    .getElementById("modalAuditoria")
    .classList
    .remove("hidden");
}

function fecharModalAuditoria() {
  document
    .getElementById("modalAuditoria")
    .classList
    .add("hidden");
}

function limparFiltrosAuditoria() {
  document.getElementById("filtroBuscaAuditoria").value = "";
  document.getElementById("filtroTabelaAuditoria").value = "TODAS";
  document.getElementById("filtroAcaoAuditoria").value = "TODAS";
  document.getElementById("filtroUsuarioAuditoria").value = "";
  document.getElementById("filtroDataInicioAuditoria").value = "";
  document.getElementById("filtroDataFimAuditoria").value = "";

  auditoriasCarregadas = [];

  document.getElementById("listaAuditoria").innerHTML = `
    <tr>
      <td colspan="7">
        Use os filtros acima ou clique em "Últimas 20".
      </td>
    </tr>
  `;
}

function resumirTexto(texto, limite) {
  if (!texto) return "-";

  if (texto.length <= limite) return texto;

  return texto.substring(0, limite) + "...";
}

function formatarDataAuditoria(data) {
  if (!data) return "-";

  return new Date(data).toLocaleString("pt-BR");
}

function gerarBadgeAcao(acao) {

  const texto = (acao || "").toUpperCase();

  if (texto.includes("CADASTRO")) {
    return `
      <span class="badge-acao badge-cadastro">
        🟢 ${acao}
      </span>
    `;
  }

  if (
    texto.includes("EDIÇÃO") ||
    texto.includes("EDICAO") ||
    texto.includes("ALTER")
  ) {
    return `
      <span class="badge-acao badge-edicao">
        🟡 ${acao}
      </span>
    `;
  }

  if (
    texto.includes("EXCLUS")
  ) {
    return `
      <span class="badge-acao badge-exclusao">
        🔴 ${acao}
      </span>
    `;
  }

  if (
    texto.includes("ENTRADA")
  ) {
    return `
      <span class="badge-acao badge-entrada">
        📥 ${acao}
      </span>
    `;
  }

  if (
    texto.includes("SAIDA")
  ) {
    return `
      <span class="badge-acao badge-saida">
        📤 ${acao}
      </span>
    `;
  }

  if (
    texto.includes("CONFER")
  ) {
    return `
      <span class="badge-acao badge-conferencia">
        🔵 ${acao}
      </span>
    `;
  }

  if (
    texto.includes("DIVERG")
  ) {
    return `
      <span class="badge-acao badge-divergencia">
        🟣 ${acao}
      </span>
    `;
  }

  if (
    texto.includes("AJUSTE")
  ) {
    return `
      <span class="badge-acao badge-ajuste">
        🟠 ${acao}
      </span>
    `;
  }

  if (
    texto.includes("ENDEREC")
  ) {
    return `
      <span class="badge-acao badge-enderecamento">
        📍 ${acao}
      </span>
    `;
  }

  if (
    texto.includes("PICKING")
  ) {
    return `
      <span class="badge-acao badge-picking">
        🛒 ${acao}
      </span>
    `;
  }

  if (
    texto.includes("ROMANEIO")
  ) {
    return `
      <span class="badge-acao badge-romaneio">
        🚚 ${acao}
      </span>
    `;
  }

  if (
    texto.includes("CLIENTE")
  ) {
    return `
      <span class="badge-acao badge-cliente">
        🏢 ${acao}
      </span>
    `;
  }

  if (
    texto.includes("FORNECEDOR")
  ) {
    return `
      <span class="badge-acao badge-fornecedor">
        🏭 ${acao}
      </span>
    `;
  }

  if (
    texto.includes("USUARIO") ||
    texto.includes("USUÁRIO")
  ) {
    return `
      <span class="badge-acao badge-usuario">
        👤 ${acao}
      </span>
    `;
  }

  return `
    <span class="badge-acao badge-default">
      ⚪ ${acao || "-"}
    </span>
  `;
}

window.alternarDetalheAuditoria = function(index) {
  const linha = document.getElementById(`detalhe-auditoria-${index}`);

  if (!linha) return;

  linha.classList.toggle("hidden");
};