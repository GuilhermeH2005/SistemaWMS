var API_ROMANEIO = "http://localhost:3000";
var dadosRomaneio = [];
var tipoRomaneioAtual = "ATIVO";
var romaneiosSelecionados = [];

function iniciarRomaneio() {
  carregarRomaneio();
}

async function carregarRomaneio() {
  try {
    const busca = document.getElementById("buscaRomaneio")?.value || "";

    const res = await fetch(
      `${API_ROMANEIO}/romaneio?tipo=${tipoRomaneioAtual}&busca=${encodeURIComponent(busca)}`
    );

    if (!res.ok) {
      alert(await res.text());
      return;
    }

    dadosRomaneio = await res.json();
    romaneiosSelecionados = [];

    renderizarResumoRomaneio(dadosRomaneio);
    renderizarRomaneio(dadosRomaneio);

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar romaneio.");
  }
}

function mudarTipoRomaneio(tipo) {
  tipoRomaneioAtual = tipo;
  romaneiosSelecionados = [];

  const titulo = document.querySelector(".subtitulo");

  if (titulo) {
    titulo.textContent =
      tipo === "EXPEDIDO"
        ? "Histórico de Romaneios Expedidos"
        : "Pedidos Separados";
  }

  carregarRomaneio();
}

function alternarSelecaoRomaneio(index) {
  const pedido = dadosRomaneio[index];
  if (!pedido) return;

  const jaSelecionado = romaneiosSelecionados.includes(index);

  if (jaSelecionado) {
    romaneiosSelecionados = romaneiosSelecionados.filter(i => i !== index);
  } else {
    romaneiosSelecionados.push(index);
  }
}

function selecionarTodosRomaneio() {
  const check = document.getElementById("checkTodosRomaneio");

  if (!check) return;

  if (check.checked) {
    romaneiosSelecionados = dadosRomaneio.map((_, index) => index);

    document.querySelectorAll(".check-romaneio").forEach(c => {
      c.checked = true;
    });
  } else {
    romaneiosSelecionados = [];

    document.querySelectorAll(".check-romaneio").forEach(c => {
      c.checked = false;
    });
  }
}

function renderizarResumoRomaneio(lista) {
  const resumo = document.getElementById("resumoRomaneio");
  if (!resumo) return;

  const totalPedidos = lista.length;
  const totalClientes = new Set(lista.map(p => p.cliente_id)).size;

  const totalItens = lista.reduce((soma, pedido) => {
    return soma + Number(pedido.total_itens || 0);
  }, 0);

  resumo.innerHTML = `
    <div class="card-resumo-romaneio">
      <span>Pedidos no Romaneio</span>
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
        <td colspan="10">Nenhum pedido separado para romaneio.</td>
      </tr>
    `;
    return;
  }

 lista.forEach((pedido, index) => {
  tbody.innerHTML += `
    <tr>
      <td>
        <input
          type="checkbox"
          class="check-romaneio"
          onchange="alternarSelecaoRomaneio(${index})"
        >
      </td>

      <td>#${pedido.id}</td>

      <td><strong>${pedido.cliente_nome || "-"}</strong></td>

      <td>${pedido.cnpj || "-"}</td>

      <td>${pedido.cidade || "-"}/${pedido.estado || "-"}</td>

      <td>
        ${pedido.rua || "-"}, ${pedido.numero || "-"} -
        ${pedido.bairro || "-"}
      </td>

      <td>${pedido.numero_nf || "-"}</td>

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
            class="btn-imprimir-romaneio"
            onclick="imprimirRomaneio(${index})"
          >
            🖨 Individual
          </button>
        </div>
      </td>
    </tr>

    <tr id="detalhes-romaneio-${index}" class="linha-detalhes-romaneio">
      <td colspan="10">
        <div class="box-detalhes-romaneio">
          ${renderizarItensRomaneio(pedido.itens)}
        </div>
      </td>
    </tr>
  `;
});
}

function imprimirRomaneioSelecionados() {
  if (!dadosRomaneio || dadosRomaneio.length === 0) {
    alert("Nenhum pedido no romaneio para imprimir.");
    return;
  }

  const selecionados = romaneiosSelecionados
    .map(index => dadosRomaneio[index])
    .filter(Boolean);

  if (selecionados.length === 0) {
    alert("Selecione pelo menos um romaneio para imprimir.");
    return;
  }

  imprimirListaRomaneio(selecionados, "Romaneio Selecionado de Carga");
}

function imprimirListaRomaneio(lista, titulo) {
  const dataAtual = new Date().toLocaleString("pt-BR");

  let entregasHtml = "";

  lista.forEach((pedido, index) => {
    let itens = [];

    try {
      itens = JSON.parse(pedido.itens || "[]");
    } catch {
      itens = [];
    }

    let linhasItens = "";

    itens.forEach(item => {
      const qtdPedido = Number(item.quantidade || 0);
      const qtdSeparada = Number(item.quantidade_separada || 0);
      const pendente = Math.max(qtdPedido - qtdSeparada, 0);

      linhasItens += `
        <tr>
          <td>${item.produto_nome || "-"}</td>
          <td>${item.produto_codigo || "-"}</td>
          <td>${qtdPedido}</td>
          <td>${qtdSeparada}</td>
          <td>${pendente}</td>
        </tr>
      `;
    });

    entregasHtml += `
      <section class="entrega">
        <h2>Entrega ${index + 1} - Pedido #${pedido.id}</h2>

        <div class="info">
          <p><strong>Cliente:</strong> ${pedido.cliente_nome || "-"}</p>
          <p><strong>CNPJ:</strong> ${pedido.cnpj || "-"}</p>
          <p><strong>Status:</strong> ${pedido.status || "-"}</p>
          <p><strong>NF:</strong> ${pedido.numero_nf || "-"}</p>
          <p>
            <strong>Endereço:</strong>
            ${pedido.rua || "-"}, ${pedido.numero || "-"} -
            ${pedido.bairro || "-"} -
            ${pedido.cidade || "-"}/${pedido.estado || "-"}
          </p>
          <p><strong>CEP:</strong> ${pedido.cep || "-"}</p>
          <p><strong>Telefone:</strong> ${pedido.telefone || "-"}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>SKU</th>
              <th>Qtd Pedido</th>
              <th>Qtd Separada</th>
              <th>Pendente</th>
            </tr>
          </thead>

          <tbody>
            ${
              linhasItens ||
              `<tr><td colspan="5">Nenhum item encontrado.</td></tr>`
            }
          </tbody>
        </table>
      </section>
    `;
  });

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${titulo}</title>

      <style>
        body {
          font-family: Arial, Helvetica, sans-serif;
          color: #111827;
          padding: 28px;
        }

        .cabecalho {
          border-bottom: 4px solid #003641;
          padding-bottom: 14px;
          margin-bottom: 24px;
        }

        .cabecalho h1 {
          margin: 0;
          color: #003641;
          font-size: 28px;
        }

        .cabecalho p {
          margin: 5px 0;
          color: #374151;
        }

        .entrega {
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 22px;
          page-break-inside: avoid;
        }

        .entrega h2 {
          margin: 0 0 12px;
          color: #003641;
          font-size: 20px;
        }

        .info {
          background: #f9fafb;
          border-left: 5px solid #00ae90;
          padding: 12px;
          margin-bottom: 14px;
          border-radius: 8px;
        }

        .info p {
          margin: 4px 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        th {
          background: #003641;
          color: white;
          padding: 9px;
          text-align: left;
        }

        td {
          border-bottom: 1px solid #e5e7eb;
          padding: 9px;
        }

        .assinatura {
          margin-top: 50px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 50px;
        }

        .linha-assinatura {
          border-top: 1px solid #111827;
          text-align: center;
          padding-top: 8px;
          font-size: 13px;
        }

        @media print {
          body {
            padding: 10px;
          }

          .entrega {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>

    <body>
      <div class="cabecalho">
        <h1>${titulo}</h1>
        <p><strong>LG Logística</strong></p>
        <p>Emitido em: ${dataAtual}</p>
        <p>Total de entregas: ${lista.length}</p>
      </div>

      ${entregasHtml}

      <div class="assinatura">
        <div class="linha-assinatura">
          Conferente
        </div>

        <div class="linha-assinatura">
          Motorista / Responsável
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  const janela = window.open("", "_blank");

  janela.document.open();
  janela.document.write(html);
  janela.document.close();
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
          <th>Pedido</th>
          <th>Separado/Físico</th>
          <th>Pendente</th>
        </tr>
      </thead>
      <tbody>
  `;

  itens.forEach(item => {
    const pedido = Number(item.quantidade || 0);
    const separado = Number(item.quantidade_separada || 0);
    const pendente = Math.max(pedido - separado, 0);

    html += `
      <tr>
        <td>${item.produto_nome}</td>
        <td>${item.produto_codigo || "-"}</td>
        <td>${pedido}</td>
        <td>${separado}</td>
        <td>${pendente}</td>
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

function classeStatusRomaneio(status) {
  if (status === "SEPARADO") return "status-separado";

  if (status === "EXPEDIDO_PARCIAL")
    return "status-parcial";

  return "status-separado";
}


function imprimirRomaneio(index) {
  const pedido = dadosRomaneio[index];

  if (!pedido) {
    alert("Pedido não encontrado para impressão.");
    return;
  }

  let itens = [];

  try {
    itens = JSON.parse(pedido.itens || "[]");
  } catch {
    itens = [];
  }

  const dataAtual = new Date().toLocaleString("pt-BR");

  let linhasItens = "";

  itens.forEach(item => {
    const pedidoQtd = Number(item.quantidade || 0);
    const separado = Number(item.quantidade_separada || 0);
    const pendente = Math.max(pedidoQtd - separado, 0);

    linhasItens += `
      <tr>
        <td>${item.produto_nome || "-"}</td>
        <td>${item.produto_codigo || "-"}</td>
        <td>${pedidoQtd}</td>
        <td>${separado}</td>
        <td>${pendente}</td>
      </tr>
    `;
  });

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Romaneio Pedido #${pedido.id}</title>

      <style>
        body {
          font-family: Arial, Helvetica, sans-serif;
          color: #111827;
          padding: 30px;
        }

        .cabecalho {
          border-bottom: 3px solid #003641;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }

        .cabecalho h1 {
          margin: 0;
          color: #003641;
          font-size: 26px;
        }

        .cabecalho p {
          margin: 4px 0;
          color: #374151;
        }

        .info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 22px;
        }

        .box {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 12px;
        }

        .box strong {
          color: #003641;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }

        th {
          background: #003641;
          color: white;
          padding: 10px;
          text-align: left;
        }

        td {
          border-bottom: 1px solid #e5e7eb;
          padding: 10px;
        }

        .assinatura {
          margin-top: 60px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }

        .linha-assinatura {
          border-top: 1px solid #111827;
          text-align: center;
          padding-top: 8px;
          font-size: 13px;
        }

        @media print {
          button {
            display: none;
          }

          body {
            padding: 10px;
          }
        }
      </style>
    </head>

    <body>
      <div class="cabecalho">
        <h1>Romaneio de Carga</h1>
        <p><strong>LG Logística</strong></p>
        <p>Emitido em: ${dataAtual}</p>
      </div>

      <div class="info">
        <div class="box">
          <p><strong>Pedido:</strong> #${pedido.id}</p>
          <p><strong>Status:</strong> ${pedido.status}</p>
          <p><strong>Cliente:</strong> ${pedido.cliente_nome || "-"}</p>
          <p><strong>CNPJ:</strong> ${pedido.cnpj || "-"}</p>
        </div>

        <div class="box">
          <p><strong>Endereço:</strong></p>
          <p>
            ${pedido.rua || "-"}, ${pedido.numero || "-"} -
            ${pedido.bairro || "-"}
          </p>
          <p>${pedido.cidade || "-"}/${pedido.estado || "-"}</p>
          <p><strong>CEP:</strong> ${pedido.cep || "-"}</p>
        </div>
      </div>

      <h2>Itens Separados</h2>

      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>SKU</th>
            <th>Qtd Pedido</th>
            <th>Qtd Separada</th>
            <th>Pendente</th>
          </tr>
        </thead>

        <tbody>
          ${linhasItens || `
            <tr>
              <td colspan="5">Nenhum item encontrado.</td>
            </tr>
          `}
        </tbody>
      </table>

      <div class="assinatura">
        <div class="linha-assinatura">
          Separador / Conferente
        </div>

        <div class="linha-assinatura">
          Motorista / Responsável
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  const janela = window.open("", "_blank");

  janela.document.open();
  janela.document.write(html);
  janela.document.close();
}

function imprimirRomaneioGeral() {
  if (!dadosRomaneio || dadosRomaneio.length === 0) {
    alert("Nenhum pedido no romaneio para imprimir.");
    return;
  }

  imprimirListaRomaneio(dadosRomaneio, "Romaneio Geral de Carga");
}