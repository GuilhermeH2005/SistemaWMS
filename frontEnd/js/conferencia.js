var entradasConferencia = [];

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

  if (!entradas || entradas.length === 0) {
    lista.innerHTML = `
      <div class="sem-registro">
        Nenhuma NF pendente para conferência.
      </div>
    `;
    return;
  }

  const notas = {};

  entradas.forEach(e => {
    const chave = `${e.numero_nf}-${e.serie_nf || ""}-${e.fornecedor_id || ""}`;

    if (!notas[chave]) {
      notas[chave] = {
        numero_nf: e.numero_nf,
        serie_nf: e.serie_nf,
        fornecedor_nome: e.fornecedor_nome || "-",
        data_nf: e.data_nf_formatada || e.data_nf || "-",
        status_conferencia: e.status_conferencia || "PENDENTE",
        itens: []
      };
    }

    notas[chave].itens.push(e);
  });

  Object.values(notas).forEach((nf, index) => {
    const totalItens = nf.itens.length;

    const qtdPendente = nf.itens.filter(i =>
      !i.status_conferencia || i.status_conferencia === "PENDENTE"
    ).length;

    const qtdDivergente = nf.itens.filter(i =>
      i.status_conferencia === "DIVERGENTE"
    ).length;

    const qtdConferido = nf.itens.filter(i =>
      i.status_conferencia === "CONFERIDO"
    ).length;

   const itensHtml = nf.itens.map(item => {
  const qtdNF = Number(item.quantidade || 0);

  const qtdContada =
    item.quantidade_conferida ??
    item.quantidade_contada ??
    "";

  return `
    <tr>
      <td>
        <strong>${item.produto_nome || "-"}</strong>
        <small>SKU: ${item.produto_codigo || "-"}</small>
      </td>

      <td>
        <input
          type="number"
          min="0"
          class="input-contagem"
          id="qtd_conferida_${item.id}"
          value="${qtdContada}"
          placeholder="Digite a qtd contada"
        >
      </td>

      <td>${item.lote || "-"}</td>

      <td>
        <span class="${classeStatusConferencia(item.status_conferencia)}">
          ${item.status_conferencia || "PENDENTE"}
        </span>
      </td>

      <td>
        <button
          type="button"
          class="btn-confirmar-item"
          onclick="confirmarConferenciaItem(${item.id}, ${qtdNF})"
        >
          Confirmar
        </button>
      </td>
    </tr>
  `;
}).join("");

    lista.innerHTML += `
      <div class="card-nf-conferencia">

        <div class="topo-nf-conferencia" onclick="alternarItensNFConferencia(${index})">
          <div>
            <strong>
              NF ${nf.numero_nf}
              ${nf.serie_nf ? " - Série " + nf.serie_nf : ""}
            </strong>

            <p>Fornecedor: ${nf.fornecedor_nome}</p>
            <p>Data NF: ${nf.data_nf}</p>
          </div>

          <div class="resumo-conferencia">
            <span>Total: ${totalItens}</span>
            <span>Pendentes: ${qtdPendente}</span>
            <span>Conferidos: ${qtdConferido}</span>
            <span>Divergentes: ${qtdDivergente}</span>
          </div>

          <button type="button" class="btn-abrir-nf">
            Ver produtos
          </button>
        </div>

        <div class="itens-nf-conferencia hidden" id="itens-nf-${index}">
          <div class="tabela-container">
            <table class="tabela-itens-conferencia">
           <thead>
  <tr>
    <th>Produto</th>
    <th>Qtd Conferida</th>
    <th>Lote</th>
    <th>Status</th>
    <th>Ação</th>
  </tr>
</thead>

              <tbody>
                ${itensHtml}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            class="btn-conferir-nf"
            onclick='conferirNotaInteira(${JSON.stringify(nf.itens.map(i => ({
              id: i.id,
              quantidade: i.quantidade
            })))}); event.stopPropagation();'
          >
            Conferir todos os itens da NF
          </button>
        </div>

      </div>
    `;
  });
}

function alternarItensNFConferencia(index) {
  const div = document.getElementById(`itens-nf-${index}`);
  if (!div) return;

  div.classList.toggle("hidden");
}

async function confirmarConferenciaItem(id, quantidadeNF) {
  const qtdConferida = Number(
    document.getElementById(`qtd_conferida_${id}`)?.value || 0
  );

  if (qtdConferida < 0 || isNaN(qtdConferida)) {
    alert("Informe uma quantidade conferida válida.");
    return;
  }

  let motivo = "";
  let justificativa = "";

  if (qtdConferida !== Number(quantidadeNF)) {
    motivo = prompt(
      "Divergência encontrada.\n\n" +
      "Escolha o motivo:\n" +
      "1 - Falta de mercadoria\n" +
      "2 - Sobra de mercadoria\n" +
      "3 - Produto avariado\n" +
      "4 - Produto errado\n" +
      "5 - Divergência de lote\n" +
      "6 - Validade incorreta\n" +
      "7 - Outro"
    );

    const motivos = {
      "1": "FALTA DE MERCADORIA",
      "2": "SOBRA DE MERCADORIA",
      "3": "PRODUTO AVARIADO",
      "4": "PRODUTO ERRADO",
      "5": "DIVERGÊNCIA DE LOTE",
      "6": "VALIDADE INCORRETA",
      "7": "OUTRO"
    };

    motivo = motivos[motivo];

    if (!motivo) {
      alert("Motivo inválido.");
      return;
    }

    justificativa = prompt("Informe a justificativa da divergência:");

    if (!justificativa || justificativa.trim() === "") {
      alert("Justificativa obrigatória para divergência.");
      return;
    }

    justificativa = justificativa.trim();
  }

  const auditoria = getUsuarioAuditoria();

  try {
    const res = await fetch(`http://localhost:3000/conferencia/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        quantidade_conferida: qtdConferida,
        motivo,
        justificativa,
        usuario_edicao_id: auditoria.usuario_id,
        ...auditoria
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
    alert("Erro ao confirmar conferência.");
  }
}

async function conferirNotaInteira(itens) {
  if (!confirm("Deseja conferir todos os itens desta NF?")) return;

  for (const item of itens) {
    const id = item.id;
    const quantidadeNF = Number(item.quantidade || 0);

    const qtdConferida = Number(
      document.getElementById(`qtd_conferida_${id}`)?.value || 0
    );

    if (qtdConferida < 0 || isNaN(qtdConferida)) {
      alert("Informe uma quantidade conferida válida para todos os itens.");
      return;
    }

    let motivo = "";
    let justificativa = "";

    if (qtdConferida !== quantidadeNF) {
      const opcao = prompt(
        `Divergência no item ID ${id}\n\n` +
        `Quantidade NF: ${quantidadeNF}\n` +
        `Quantidade conferida: ${qtdConferida}\n\n` +
        "Escolha o motivo:\n" +
        "1 - Falta de mercadoria\n" +
        "2 - Sobra de mercadoria\n" +
        "3 - Produto avariado\n" +
        "4 - Produto errado\n" +
        "5 - Divergência de lote\n" +
        "6 - Validade incorreta\n" +
        "7 - Outro"
      );

      const motivos = {
        "1": "FALTA DE MERCADORIA",
        "2": "SOBRA DE MERCADORIA",
        "3": "PRODUTO AVARIADO",
        "4": "PRODUTO ERRADO",
        "5": "DIVERGÊNCIA DE LOTE",
        "6": "VALIDADE INCORRETA",
        "7": "OUTRO"
      };

      motivo = motivos[opcao];

      if (!motivo) {
        alert("Motivo inválido.");
        return;
      }

      justificativa = prompt("Informe a justificativa da divergência:");

      if (!justificativa || justificativa.trim() === "") {
        alert("Justificativa obrigatória para divergência.");
        return;
      }

      justificativa = justificativa.trim();
    }

    await enviarConferenciaItem(id, qtdConferida, motivo, justificativa);
  }

  alert("Conferência da NF registrada ✅");
  carregarConferencia();
}

async function enviarConferenciaItem(id, qtdConferida, motivo, justificativa) {
  const auditoria = getUsuarioAuditoria();

  const res = await fetch(`http://localhost:3000/conferencia/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      quantidade_conferida: qtdConferida,
      motivo,
      justificativa,
      usuario_edicao_id: auditoria.usuario_id,
      ...auditoria
    })
  });

  const msg = await res.text();

  if (!res.ok) {
    throw new Error(msg);
  }
}

async function confirmarConferenciaItemSemAlert(id, quantidadeNF) {
  const qtdConferida = Number(
    document.getElementById(`qtd_conferida_${id}`)?.value || 0
  );

  const motivo = document.getElementById(`motivo_${id}`)?.value || "";
  const justificativa = document
    .getElementById(`justificativa_${id}`)
    ?.value
    .trim() || "";

  const auditoria = getUsuarioAuditoria();

  const res = await fetch(`http://localhost:3000/conferencia/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      quantidade_conferida: qtdConferida,
      motivo,
      justificativa,
      usuario_edicao_id: auditoria.usuario_id,
      ...auditoria
    })
  });

  const msg = await res.text();

  if (!res.ok) {
    throw new Error(msg);
  }
}

function filtrarConferencia() {
  const texto = document
    .getElementById("buscarConferencia")
    .value
    .toLowerCase();

  const statusFiltro =
    document.getElementById("filtroStatusConferencia").value;

  const filtrados = entradasConferencia.filter(e => {
    const bateTexto =
      String(e.numero_nf || "").toLowerCase().includes(texto) ||
      String(e.fornecedor_nome || "").toLowerCase().includes(texto) ||
      String(e.produto_nome || "").toLowerCase().includes(texto) ||
      String(e.produto_codigo || "").toLowerCase().includes(texto);

    const statusAtual = e.status_conferencia || "PENDENTE";

    const bateStatus =
      statusFiltro === "TODOS" ||
      statusAtual === statusFiltro;

    return bateTexto && bateStatus;
  });

  renderizarConferencia(filtrados);
}

function classeStatusConferencia(status) {
  if (status === "CONFERIDO") return "status-conferido";
  if (status === "DIVERGENTE") return "status-divergente";
  return "status-pendente";
}