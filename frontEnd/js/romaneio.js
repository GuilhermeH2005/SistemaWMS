var API_ROMANEIO = "http://localhost:3000";
var dadosRomaneio = [];

function iniciarRomaneio() {
  carregarRomaneio();
}

async function carregarRomaneio() {
  try {
    const res = await fetch(`${API_ROMANEIO}/romaneio`);

    if (!res.ok) {
      const erro = await res.text();
      alert(erro);
      return;
    }

    dadosRomaneio = await res.json();

    renderizarResumoRomaneio(dadosRomaneio);
    renderizarRomaneio(dadosRomaneio);

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar romaneio.");
  }
}

function renderizarResumoRomaneio(lista) {
  const resumo = document.getElementById("resumoRomaneio");

  if (!resumo) return;

  const totalPedidos = lista.length;

  const totalItens = lista.reduce((soma, pedido) => {
    return soma + Number(pedido.total_itens || 0);
  }, 0);

  const totalClientes = new Set(
    lista.map(p => p.cliente_id)
  ).size;

  resumo.innerHTML = `
    <div class="card-resumo-romaneio">
      <span>Pedidos Separados</span>
      <strong>${totalPedidos}</strong>
    </div>

    <div class="card-resumo-romaneio">
      <span>Clientes</span>
      <strong>${totalClientes}</strong>
    </div>

    <div class="card-resumo-romaneio">
      <span>Total de Itens</span>
      <strong>${totalItens}</strong>
    </div>
  `;
}

function renderizarRomaneio(lista) {
  const tbody = document.getElementById("listaRomaneio");

  if (!tbody) return;

  tbody.innerHTML = "";

  if (!lista || lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">Nenhum pedido separado para romaneio.</td>
      </tr>
    `;
    return;
  }

  lista.forEach((pedido, index) => {
    tbody.innerHTML += `
      <tr>
        <td>#${pedido.id}</td>

        <td>
          <strong>${pedido.cliente_nome || "-"}</strong>
        </td>

        <td>${pedido.cnpj || "-"}</td>

        <td>${pedido.cidade || "-"}/${pedido.estado || "-"}</td>

        <td>
          ${pedido.rua || pedido.endereco || "-"},
          ${pedido.numero || "-"} -
          ${pedido.bairro || "-"}
        </td>

        <td>${pedido.total_itens || 0}</td>

        <td>
          <span class="${classeStatusRomaneio(pedido.status)}">
            ${pedido.status}
          </span>
        </td>

        <td>
          <div class="acoes-romaneio">
            <button
              class="btn-ver-romaneio"
              onclick="alternarDetalhesRomaneio(${index})"
            >
              👁 Ver
            </button>

            <button
              class="btn-expedir"
              onclick="expedirPedido(${pedido.id})"
            >
              Expedir
            </button>
          </div>
        </td>
      </tr>

      <tr
        id="detalhes-romaneio-${index}"
        class="linha-detalhes-romaneio"
      >
        <td colspan="8">
          <div class="box-detalhes-romaneio">
            ${renderizarItensRomaneio(pedido.itens)}
          </div>
        </td>
      </tr>
    `;
  });
}

function renderizarItensRomaneio(itensJson) {
  let itens = [];

  try {
    itens = JSON.parse(itensJson || "[]");
  } catch {
    itens = [];
  }

  if (itens.length === 0) {
    return `<p>Nenhum item encontrado.</p>`;
  }

  let html = `
    <table class="tabela-itens-romaneio">
      <thead>
        <tr>
          <th>Produto</th>
          <th>SKU</th>
          <th>Quantidade</th>
          <th>Separado</th>
        </tr>
      </thead>

      <tbody>
  `;

  itens.forEach(item => {
    html += `
      <tr>
        <td>${item.produto_nome}</td>
        <td>${item.produto_codigo || "-"}</td>
        <td>${item.quantidade}</td>
        <td>${item.quantidade_separada || 0}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  return html;
}

function alternarDetalhesRomaneio(index) {
  const linha = document.getElementById(`detalhes-romaneio-${index}`);

  if (!linha) return;

  linha.classList.toggle("ativo");
}

async function expedirPedido(id) {
  if (!confirm("Deseja marcar este pedido como expedido?")) return;

  try {
    const res = await fetch(`${API_ROMANEIO}/romaneio/${id}/expedir`, {
      method: "PUT",
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

    alert(msg);
    carregarRomaneio();

  } catch (err) {
    console.error(err);
    alert("Erro ao expedir pedido.");
  }
}

function classeStatusRomaneio(status) {
  if (status === "EXPEDIDO") return "status-expedido";
  return "status-separado";
}