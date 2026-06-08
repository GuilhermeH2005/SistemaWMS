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

  if (entradas.length === 0) {
    lista.innerHTML = `
      <div class="sem-registro">
        Nenhuma NF pendente para conferência.
      </div>
    `;
    return;
  }

  const notas = {};

  entradas.forEach(e => {
    const chave = `${e.numero_nf}-${e.serie_nf || ""}`;

    if (!notas[chave]) {
      notas[chave] = {
        numero_nf: e.numero_nf,
        serie_nf: e.serie_nf,
        fornecedor_nome: e.fornecedor_nome || "-",
        data_nf: e.data_nf,
        itens: []
      };
    }

    notas[chave].itens.push(e);
  });

  Object.values(notas).forEach(nf => {
    const itensHtml = nf.itens.map(item => `
      <tr>
        <td>${item.produto_nome || "-"}</td>
        <td>${item.produto_codigo || "-"}</td>
      <td id="qtd-nf-${item.id}">
  ${item.quantidade || 0}
</td>

        <td>
          <input
            type="number"
            min="0"
            class="input-contagem"
            id="contagem-${item.id}"
            value="${item.quantidade_contada || item.quantidade || 0}"
          >
        </td>

        <td>${item.lote || "-"}</td>

        <td>
          <span class="${classeStatusConferencia(item.status_conferencia)}">
            ${item.status_conferencia || "PENDENTE"}
          </span>
            ${item.status_conferencia === "COMPLEMENTO_PENDENTE" ? `
  <button onclick="receberComplemento(${item.id}, ${item.quantidade_pendente_complemento || 0})">
    Receber complemento
  </button>
` : ""}
        </td>
      </tr>
    `).join("");

    lista.innerHTML += `
      <div class="card-nf-conferencia">
        <div class="topo-nf-conferencia">
          <div>
            <strong>
              NF ${nf.numero_nf}
              ${nf.serie_nf ? " - Série " + nf.serie_nf : ""}
            </strong>

            <p>
              Fornecedor: ${nf.fornecedor_nome}
            </p>
          </div>

          <button
            class="btn-conferir"
            onclick='conferirNotaInteira(${JSON.stringify(nf.itens.map(i => i.id))})'
          >
            Conferir NF inteira
          </button>
        </div>

        <div class="tabela-container">
          <table class="tabela-itens-conferencia">
            <thead>
              <tr>
                <th>Produto</th>
                <th>SKU</th>
                <th>Qtd NF</th>
                <th>Qtd Contada</th>
                <th>Lote</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              ${itensHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });
}

async function receberComplemento(id, pendente) {
  const qtd = prompt(
    `Quantidade pendente: ${pendente}\nInforme a quantidade recebida agora:`,
    pendente
  );

  if (!qtd || Number(qtd) <= 0) return;

  const auditoria = getUsuarioAuditoria();

  const res = await fetch(`http://localhost:3000/conferencia/${id}/complemento`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      quantidade_recebida: Number(qtd),
      ...auditoria
    })
  });

  const msg = await res.text();
  alert(msg);

  if (res.ok) {
    carregarConferencia();
  }
}

async function atualizarStatusConferencia(id, quantidadeNF) {
  const qtdContada = prompt(
    `Quantidade na NF: ${quantidadeNF}\nDigite a quantidade contada fisicamente:`,
    quantidadeNF
  );

  if (!qtdContada) return;

  const auditoria = getUsuarioAuditoria();

  const res = await fetch(`http://localhost:3000/conferencia/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      quantidade_contada: Number(qtdContada),
      usuario_edicao_id: auditoria.usuario_id,
      ...auditoria
    })
  });

  const msg = await res.text();
  alert(msg);

  if (res.ok) {
    carregarConferencia();
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

async function conferirNotaInteira(ids) {
  if (!confirm("Deseja conferir todos os itens desta NF?")) return;

  const auditoria = getUsuarioAuditoria();

  for (const id of ids) {
    const input = document.getElementById(`contagem-${id}`);
    const quantidadeContada = Number(input?.value);

    const qtdNF = Number(
      document.getElementById(`qtd-nf-${id}`)?.textContent || 0
    );

    if (!input || isNaN(quantidadeContada) || quantidadeContada <= 0) {
      alert("Informe uma quantidade contada válida para todos os itens.");
      return;
    }

    let decisaoDivergencia = null;
    let justificativa = null;

    if (quantidadeContada !== qtdNF) {
      const opcao = prompt(
        `Divergência encontrada!\n\n` +
        `Quantidade NF: ${qtdNF}\n` +
        `Quantidade contada: ${quantidadeContada}\n\n` +
        `Escolha uma opção:\n` +
        `1 - Aceitar quantidade física\n` +
        `2 - Complemento pendente\n` +
        `3 - Devolução pendente`
      );

      if (!["1", "2", "3"].includes(opcao)) {
        alert("Opção inválida.");
        return;
      }

      if (opcao === "1") decisaoDivergencia = "ACEITAR_FISICO";
      if (opcao === "2") decisaoDivergencia = "COMPLEMENTO_PENDENTE";
      if (opcao === "3") decisaoDivergencia = "DEVOLUCAO_PENDENTE";

      justificativa = prompt("Informe a justificativa da divergência:");

      if (!justificativa || justificativa.trim() === "") {
        alert("Justificativa obrigatória.");
        return;
      }
    }

    const res = await fetch(`http://localhost:3000/conferencia/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        quantidade_contada: quantidadeContada,
        decisao_divergencia: decisaoDivergencia,
        justificativa_divergencia: justificativa,
        usuario_edicao_id: auditoria.usuario_id,
        ...auditoria
      })
    });

    const msg = await res.text();

    if (!res.ok) {
      alert(msg);
      return;
    }
  }

  alert("Conferência registrada ✅");
  carregarConferencia();
}