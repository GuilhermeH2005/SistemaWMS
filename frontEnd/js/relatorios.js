var API_RELATORIOS = "http://localhost:3000";

function iniciarRelatorios() {
  preencherDatasFaturamento();

  const inicioES = document.getElementById("dataInicioES");
  const fimES = document.getElementById("dataFimES");

  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  if (inicioES && !inicioES.value) {
    inicioES.value = primeiroDia.toISOString().split("T")[0];
  }

  if (fimES && !fimES.value) {
    fimES.value = hoje.toISOString().split("T")[0];
  }

  trocarRelatorio();
}

function carregarRelatorios() {
  carregarDashboardRelatorios();
  carregarRelatorioEstoque();
  carregarRelatorioFaturamento();
}

function preencherDatasFaturamento() {
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const inicio = document.getElementById("dataInicioFaturamento");
  const fim = document.getElementById("dataFimFaturamento");

  if (inicio && !inicio.value) {
    inicio.value = primeiroDia.toISOString().split("T")[0];
  }

  if (fim && !fim.value) {
    fim.value = hoje.toISOString().split("T")[0];
  }
}

async function carregarDashboardRelatorios() {
  try {
    const res = await fetch(`${API_RELATORIOS}/relatorios/dashboard`);

    if (!res.ok) {
      alert(await res.text());
      return;
    }

    const dados = await res.json();
    const box = document.getElementById("cardsDashboardRelatorios");

    if (!box) return;

    box.innerHTML = `
      ${cardDashboard("Produtos", dados.total_produtos)}
      ${cardDashboard("Clientes", dados.total_clientes)}
      ${cardDashboard("Fornecedores", dados.total_fornecedores)}
      ${cardDashboard("Pedidos Abertos", dados.pedidos_abertos)}
      ${cardDashboard("Em Picking", dados.pedidos_picking)}
      ${cardDashboard("Separados", dados.pedidos_separados)}
      ${cardDashboard("Expedidos", dados.pedidos_expedidos)}
      ${cardDashboard("Faturamento", formatarMoedaRelatorio(dados.valor_faturado))}
    `;

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar dashboard.");
  }
}

function cardDashboard(titulo, valor) {
  return `
    <div class="card-dashboard-relatorio">
      <span>${titulo}</span>
      <strong>${valor || 0}</strong>
    </div>
  `;
}

async function carregarRelatorioEstoque() {
  const busca = document.getElementById("buscaEstoqueRelatorio")?.value || "";

  try {
    const res = await fetch(
      `${API_RELATORIOS}/relatorios/estoque?busca=${encodeURIComponent(busca)}`
    );

    if (!res.ok) {
      alert(await res.text());
      return;
    }

    const dados = await res.json();
    const tbody = document.getElementById("listaRelatorioEstoque");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (dados.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">Nenhum produto encontrado.</td>
        </tr>
      `;
      return;
    }

    dados.forEach(item => {
      const estoque = Number(item.quantidade_estoque || 0);
      const minimo = Number(item.estoque_minimo || 0);

      const status =
        estoque <= 0
          ? "SEM ESTOQUE"
          : estoque <= minimo
            ? "BAIXO"
            : "OK";

      const classe =
        status === "OK"
          ? "status-ok-relatorio"
          : status === "BAIXO"
            ? "status-alerta-relatorio"
            : "status-erro-relatorio";

      tbody.innerHTML += `
        <tr>
          <td>${item.nome}</td>
          <td>${item.codigo || "-"}</td>
          <td>${estoque}</td>
          <td>${minimo}</td>
          <td>
            <span class="${classe}">${status}</span>
          </td>
          <td>${item.enderecos || "Sem endereço"}</td>
          <td>${formatarMoedaRelatorio(item.valor_estoque || 0)}</td>
        </tr>
      `;
    });

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar relatório de estoque.");
  }
}

async function carregarRelatorioFaturamento() {
  const inicio = document.getElementById("dataInicioFaturamento")?.value || "";
  const fim = document.getElementById("dataFimFaturamento")?.value || "";
  const busca = document.getElementById("buscaFaturamentoRelatorio")?.value || "";

  try {
    const res = await fetch(
      `${API_RELATORIOS}/relatorios/faturamento?inicio=${inicio}&fim=${fim}&busca=${encodeURIComponent(busca)}`
    );

    if (!res.ok) {
      alert(await res.text());
      return;
    }

    const dados = await res.json();

    renderizarResumoFaturamento(dados.resumo);
    renderizarTabelaFaturamento(dados.notas);

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar faturamento.");
  }
}

function renderizarResumoFaturamento(resumo) {
  const box = document.getElementById("resumoFaturamentoRelatorio");
  if (!box) return;

  box.innerHTML = `
    <div class="card-resumo-fat">
      <span>Notas</span>
      <strong>${resumo.total_notas || 0}</strong>
    </div>

    <div class="card-resumo-fat">
      <span>Total Produtos</span>
      <strong>${formatarMoedaRelatorio(resumo.valor_produtos || 0)}</strong>
    </div>

    <div class="card-resumo-fat">
      <span>Frete</span>
      <strong>${formatarMoedaRelatorio(resumo.valor_frete || 0)}</strong>
    </div>

    <div class="card-resumo-fat">
      <span>Descontos</span>
      <strong>${formatarMoedaRelatorio(resumo.valor_desconto || 0)}</strong>
    </div>

    <div class="card-resumo-fat destaque">
      <span>Total Faturado</span>
      <strong>${formatarMoedaRelatorio(resumo.valor_total || 0)}</strong>
    </div>
  `;
}

function renderizarTabelaFaturamento(notas) {
  const tbody = document.getElementById("listaRelatorioFaturamento");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!notas || notas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">Nenhuma nota encontrada.</td>
      </tr>
    `;
    return;
  }

  notas.forEach(n => {
    tbody.innerHTML += `
      <tr>
        <td>${n.numero_nf}</td>
        <td>${n.serie_nf || "-"}</td>
        <td>${n.cliente_nome || "-"}</td>
        <td>${formatarDataRelatorio(n.data_nf)}</td>
        <td>${formatarMoedaRelatorio(n.valor_produtos || 0)}</td>
        <td>${formatarMoedaRelatorio(n.valor_frete || 0)}</td>
        <td>${formatarMoedaRelatorio(n.valor_desconto || 0)}</td>
        <td><strong>${formatarMoedaRelatorio(n.valor_total || 0)}</strong></td>
        <td>${n.status}</td>
      </tr>
    `;
  });
}

function imprimirRelatorio(idArea) {
  const area = document.getElementById(idArea);

  if (!area) {
    alert("Área de impressão não encontrada.");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório LG Logística</title>

      <style>
        body {
          font-family: Arial, Helvetica, sans-serif;
          padding: 24px;
          color: #111827;
        }

        h1 {
          color: #003641;
          border-bottom: 3px solid #003641;
          padding-bottom: 10px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        th {
          background: #003641;
          color: white;
          padding: 9px;
          text-align: left;
        }

        td {
          border-bottom: 1px solid #ddd;
          padding: 9px;
        }
      </style>
    </head>

    <body>
      <h1>Relatório - LG Logística</h1>
      <p>Emitido em: ${new Date().toLocaleString("pt-BR")}</p>

      ${area.innerHTML}

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

function formatarMoedaRelatorio(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarDataRelatorio(data) {
  if (!data) return "-";

  const texto = String(data).split("T")[0];
  const partes = texto.split("-");

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return data;
}

function trocarRelatorio() {
  const tipo = document.getElementById("tipoRelatorio").value;

  const secoes = [
    "relatorioDashboard",
    "relatorioEstoque",
    "relatorioFaturamento",
    "relatorioEntradasSaidas",
    "relatorioDivergencias",
    "relatorioEnderecamento",
    "relatorioMovimentacoes"
  ];

  secoes.forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });

  if (tipo === "dashboard") {
    document.getElementById("relatorioDashboard")?.classList.remove("hidden");
    carregarDashboardRelatorios();
  }

  if (tipo === "estoque") {
    document.getElementById("relatorioEstoque")?.classList.remove("hidden");
    carregarRelatorioEstoque();
  }

  if (tipo === "faturamento") {
    document.getElementById("relatorioFaturamento")?.classList.remove("hidden");
    carregarRelatorioFaturamento();
  }

  if (tipo === "entradas-saidas") {
    document.getElementById("relatorioEntradasSaidas")?.classList.remove("hidden");
    carregarRelatorioEntradasSaidas();
  }

  if (tipo === "divergencias") {
    document.getElementById("relatorioDivergencias")?.classList.remove("hidden");
    carregarRelatorioDivergencias();
  }

  if (tipo === "enderecamento") {
    document.getElementById("relatorioEnderecamento")?.classList.remove("hidden");
    carregarRelatorioEnderecamento();
  }

  if (tipo === "movimentacoes") {
    document.getElementById("relatorioMovimentacoes")?.classList.remove("hidden");
    carregarRelatorioMovimentacoes();
  }
}

async function carregarRelatorioEntradasSaidas() {
  const inicio = document.getElementById("dataInicioES")?.value || "";
  const fim = document.getElementById("dataFimES")?.value || "";

  const res = await fetch(`${API_RELATORIOS}/relatorios/entradas-saidas?inicio=${inicio}&fim=${fim}`);
  const dados = await res.json();

if (!res.ok) {
  alert(dados.erro + "\n" + (dados.detalhe || ""));
  return;
}

  document.getElementById("resumoEntradasSaidas").innerHTML = `
    <div class="card-resumo-fat">
      <span>Total Entradas</span>
      <strong>${formatarMoedaRelatorio(dados.resumo.total_entradas)}</strong>
    </div>
    <div class="card-resumo-fat">
      <span>Total Saídas</span>
      <strong>${formatarMoedaRelatorio(dados.resumo.total_saidas)}</strong>
    </div>
    <div class="card-resumo-fat destaque">
      <span>Saldo</span>
      <strong>${formatarMoedaRelatorio(dados.resumo.saldo)}</strong>
    </div>
  `;

  const tbody = document.getElementById("listaEntradasSaidas");
  tbody.innerHTML = "";

  dados.movimentos.forEach(m => {
    tbody.innerHTML += `
      <tr>
        <td>${m.tipo}</td>
        <td>${m.documento}</td>
        <td>${formatarDataRelatorio(m.data_movimento)}</td>
        <td>${m.parceiro || "-"}</td>
        <td>${formatarMoedaRelatorio(m.valor || 0)}</td>
      </tr>
    `;
  });
}

async function carregarRelatorioDivergencias() {
  const busca = document.getElementById("buscaDivergencias")?.value || "";

  const res = await fetch(`${API_RELATORIOS}/relatorios/divergencias?busca=${encodeURIComponent(busca)}`);
  const dados = await res.json();

  const tbody = document.getElementById("listaDivergencias");
  tbody.innerHTML = "";

  dados.forEach(d => {
    tbody.innerHTML += `
      <tr>
        <td>${d.numero_nf}</td>
        <td>${d.produto_nome}</td>
        <td>${d.quantidade_nf}</td>
        <td>${d.quantidade_conferida}</td>
        <td>${d.diferenca}</td>
        <td>${d.motivo}</td>
        <td>${d.status}</td>
      </tr>
    `;
  });
}

async function carregarRelatorioEnderecamento() {
  const busca = document.getElementById("buscaEnderecamento")?.value || "";

  const res = await fetch(`${API_RELATORIOS}/relatorios/enderecamento?busca=${encodeURIComponent(busca)}`);
  const dados = await res.json();

  const tbody = document.getElementById("listaEnderecamentoRelatorio");
  tbody.innerHTML = "";

  dados.forEach(e => {
    tbody.innerHTML += `
      <tr>
        <td>${e.endereco}</td>
        <td>${e.produto_nome}</td>
        <td>${e.produto_codigo || "-"}</td>
        <td>${e.quantidade_unidades}</td>
        <td>${e.capacidade_unidades || "-"}</td>
        <td>${Number(e.ocupacao_m3 || 0).toFixed(3)} m³</td>
      </tr>
    `;
  });
}

async function carregarRelatorioMovimentacoes() {
  const busca = document.getElementById("buscaMovimentacoes")?.value || "";

  const res = await fetch(`${API_RELATORIOS}/relatorios/movimentacoes?busca=${encodeURIComponent(busca)}`);
  const dados = await res.json();

if (!res.ok) {
  alert(dados.erro + "\n" + (dados.detalhe || ""));
  return;
}

  const tbody = document.getElementById("listaMovimentacoes");
  tbody.innerHTML = "";

  dados.forEach(a => {
    tbody.innerHTML += `
      <tr>
        <td>${formatarDataRelatorio(a.data_registro || a.data)}</td>
        <td>${a.usuario_nome || "-"}</td>
        <td>${a.acao || "-"}</td>
        <td>${a.tabela || "-"}</td>
        <td>${a.descricao || "-"}</td>
      </tr>
    `;
  });
}