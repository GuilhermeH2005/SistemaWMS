function iniciarDivergencias() {
  carregarDivergencias();
}

async function carregarDivergencias() {
  const busca = document.getElementById("buscarDivergencia")?.value || "";
  const status = document.getElementById("filtroStatusDivergencia")?.value || "ABERTAS";

  try {
    const res = await fetch(
      `http://localhost:3000/divergencias?busca=${encodeURIComponent(busca)}&status=${encodeURIComponent(status)}`
    );

    const dados = await res.json();

    renderizarDivergencias(dados);

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar divergências.");
  }
}

function renderizarDivergencias(lista) {
  const div = document.getElementById("listaDivergencias");

  if (!div) return;

  div.innerHTML = "";

  if (!lista.length) {
    div.innerHTML = `
      <div class="sem-registro">
        Nenhuma divergência encontrada.
      </div>
    `;
    return;
  }

  lista.forEach(item => {
    const diferenca =
      Number(item.quantidade_conferida || 0) -
      Number(item.quantidade || 0);

    div.innerHTML += `
      <div class="card-divergencia">

        <div class="topo-divergencia">
          <div>
            <strong>NF ${item.numero_nf}</strong>
            <p>Fornecedor: ${item.fornecedor_nome || "-"}</p>
            <p>Produto: ${item.produto_nome || "-"}</p>
          </div>

          <span class="${classeStatusDivergencia(item.status_divergencia)}">
            ${item.status_divergencia || "ABERTA"}
          </span>
        </div>

        <div class="grid-divergencia">
          <div>
            <span>Qtd NF</span>
            <strong>${item.quantidade}</strong>
          </div>

          <div>
            <span>Qtd Conferida</span>
            <strong>${item.quantidade_conferida}</strong>
          </div>

          <div>
            <span>Diferença</span>
            <strong>${diferenca}</strong>
          </div>

          <div>
            <span>Motivo</span>
            <strong>${item.motivo_divergencia || "-"}</strong>
          </div>
        </div>

        <p class="texto-justificativa">
          <strong>Justificativa:</strong>
          ${item.justificativa_divergencia || "-"}
        </p>

        <textarea
          id="obs-div-${item.id}"
          placeholder="Observação da resolução"
        ></textarea>
<div class="acoes-divergencia">
  ${
    item.status_divergencia === "AGUARDANDO_COMPLEMENTO"
      ? `
        <button onclick="receberComplemento(${item.id})">
          Receber Complemento
        </button>
      `
      : `
        <button onclick="resolverDivergencia(${item.id}, 'AGUARDANDO_COMPLEMENTO')">
          Aguardar Complemento
        </button>

        <button onclick="resolverDivergencia(${item.id}, 'DEVOLUCAO')">
          Devolução Pendente
        </button>

        <button onclick="resolverDivergencia(${item.id}, 'ABATIMENTO')">
          Abatimento Financeiro
        </button>
      `
  }
</div>
    `;
  });
}

async function receberComplemento(id) {
  const quantidade = prompt("Informe a quantidade recebida agora:");

  if (!quantidade || Number(quantidade) <= 0) {
    alert("Informe uma quantidade válida.");
    return;
  }

  const observacao = prompt("Observação do recebimento do complemento:");

  if (!observacao || !observacao.trim()) {
    alert("Informe uma observação.");
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/divergencias/${id}/complemento`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        quantidade_recebida: Number(quantidade),
        observacao,
        ...getUsuarioAuditoria()
      })
    });

    const msg = await res.text();

    if (!res.ok) {
      alert(msg);
      return;
    }

    alert(msg);
    carregarDivergencias();

  } catch (err) {
    console.error(err);
    alert("Erro ao receber complemento.");
  }
}

async function resolverDivergencia(id, tipo) {
  const observacao = document
    .getElementById(`obs-div-${id}`)
    .value
    .trim();

  if (!observacao) {
    alert("Informe uma observação para resolver a divergência.");
    return;
  }

  const confirmar = confirm("Deseja atualizar essa divergência?");

  if (!confirmar) return;

  try {
    const res = await fetch(`http://localhost:3000/divergencias/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tipo,
        observacao,
        ...getUsuarioAuditoria()
      })
    });

    const msg = await res.text();

    if (!res.ok) {
      alert(msg);
      return;
    }

    alert(msg);
    carregarDivergencias();

  } catch (err) {
    console.error(err);
    alert("Erro ao resolver divergência.");
  }
}

function classeStatusDivergencia(status) {
  if (status === "RESOLVIDA") return "status-conferido";
  if (status === "ABATIMENTO") return "status-abatimento";
  if (status === "DEVOLUCAO") return "status-divergente";
  if (status === "AGUARDANDO_COMPLEMENTO") return "status-pendente";

  return "status-divergente";
}