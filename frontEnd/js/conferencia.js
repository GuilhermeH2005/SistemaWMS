let entradasConferencia = [];

function iniciarConferencia() {
  carregarConferencia();
}

async function carregarConferencia() {
  try {
    const res = await fetch("http://localhost:3000/conferencia");
    entradasConferencia = await res.json();

    renderizarConferencia(entradasConferencia);

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar conferência.");
  }
}

function renderizarConferencia(entradas) {
  const lista = document.getElementById("listaConferencia");

  if (!lista) return;

  lista.innerHTML = "";

  if (entradas.length === 0) {
    lista.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;">
          Nenhuma entrada para conferência.
        </td>
      </tr>
    `;
    return;
  }

  const notasAgrupadas = {};

  entradas.forEach(e => {
    const chave = `${e.numero_nf}-${e.serie_nf || ""}-${e.fornecedor_id}`;

    if (!notasAgrupadas[chave]) {
      notasAgrupadas[chave] = {
        numero_nf: e.numero_nf,
        serie_nf: e.serie_nf,
        fornecedor_nome: e.fornecedor_nome,
        data_nf: e.data_nf,
        status_conferencia: e.status_conferencia,
        itens: []
      };
    }

    notasAgrupadas[chave].itens.push(e);
  });

  Object.values(notasAgrupadas).forEach(nf => {
    const itensHtml = nf.itens.map(item => {
      return `
        <tr>
          <td>${item.produto_nome || "-"}</td>
          <td>${item.produto_codigo || "-"}</td>
          <td>${item.quantidade || 0}</td>
          <td>${item.lote || "-"}</td>
          <td>${formatarDataConferencia(item.validade)}</td>

          <td>
            <span class="${classeStatusConferencia(item.status_conferencia)}">
              ${item.status_conferencia || "PENDENTE"}
            </span>
          </td>

          <td class="acoes-conferencia">
            <button
              class="btn-conferir"
              onclick="atualizarStatusConferencia(${item.id}, 'CONFERIDO')"
            >
              Conferir
            </button>

            <button
              class="btn-divergente"
              onclick="atualizarStatusConferencia(${item.id}, 'DIVERGENTE')"
            >
              Divergente
            </button>
          </td>
        </tr>
      `;
    }).join("");

    lista.innerHTML += `
      <tr class="linha-nf-conferencia">
        <td colspan="8">
          <div class="card-nf-conferencia">

            <div class="topo-nf-conferencia">
              <div>
                <strong>
                  NF ${nf.numero_nf || "-"}
                  ${nf.serie_nf ? " - Série " + nf.serie_nf : ""}
                </strong>

                <p>
                  Fornecedor: ${nf.fornecedor_nome || "-"} |
                  Data NF: ${formatarDataConferencia(nf.data_nf)}
                </p>
              </div>

              <span class="${classeStatusConferencia(nf.status_conferencia)}">
                ${nf.status_conferencia || "PENDENTE"}
              </span>
            </div>

            <div class="tabela-container">
              <table class="tabela-itens-conferencia">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>SKU</th>
                    <th>Qtd</th>
                    <th>Lote</th>
                    <th>Validade</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  ${itensHtml}
                </tbody>
              </table>
            </div>

          </div>
        </td>
      </tr>
    `;
  });
}

async function atualizarStatusConferencia(id, status) {
  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));

  const confirmar = confirm(`Deseja marcar esta entrada como ${status}?`);

  if (!confirmar) return;

  try {
    const res = await fetch(`http://localhost:3000/conferencia/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status_conferencia: status,
        usuario_edicao_id: usuarioLogado ? usuarioLogado.id : null
      })
    });

    const msg = await res.text();

    if (!res.ok) {
      alert(msg);
      return;
    }

    alert(msg);

    carregarConferencia();

  } catch (err) {
    console.error(err);
    alert("Erro ao atualizar conferência.");
  }
}

function filtrarConferencia() {
  const texto = document
    .getElementById("buscarConferencia")
    .value
    .toLowerCase();

  const filtrados = entradasConferencia.filter(e => {
    return (
      String(e.numero_nf || "").toLowerCase().includes(texto) ||
      String(e.produto_nome || "").toLowerCase().includes(texto) ||
      String(e.produto_codigo || "").toLowerCase().includes(texto)
    );
  });

  renderizarConferencia(filtrados);
}

function classeStatusConferencia(status) {
  if (status === "CONFERIDO") return "status-conferido";
  if (status === "DIVERGENTE") return "status-divergente";
  return "status-pendente";
}

function formatarDataConferencia(data) {
  if (!data) return "";
  return new Date(data).toLocaleDateString("pt-BR");
}