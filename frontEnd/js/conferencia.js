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

  entradas.forEach(e => {
    lista.innerHTML += `
      <tr>
        <td>${e.numero_nf || "-"}</td>
        <td>${e.produto_nome || "-"}</td>
        <td>${e.produto_codigo || "-"}</td>
        <td>${e.quantidade || 0}</td>
        <td>${e.lote || "-"}</td>
        <td>${formatarDataConferencia(e.validade)}</td>

        <td>
          <span class="${classeStatusConferencia(e.status_conferencia)}">
            ${e.status_conferencia || "PENDENTE"}
          </span>
        </td>

        <td class="acoes-conferencia">
          <button class="btn-conferir" onclick="atualizarStatusConferencia(${e.id}, 'CONFERIDO')">
            Conferir
          </button>

          <button class="btn-divergente" onclick="atualizarStatusConferencia(${e.id}, 'DIVERGENTE')">
            Divergente
          </button>
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