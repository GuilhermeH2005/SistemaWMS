var API_URL_DASHBOARD = "http://localhost:3000";

function iniciarDashboard() {
  carregarDashboard();
  carregarGraficosDashboard();
  carregarAuditoriasDashboard();
}

async function carregarDashboard() {
  try {
    const resposta = await fetch(`${API_URL_DASHBOARD}/dashboard`);

    if (!resposta.ok) {
      alert("Erro ao carregar dashboard");
      return;
    }

    const dados = await resposta.json();

    setDashboardValor("totalProdutos", dados.total_produtos);
    setDashboardValor("totalFornecedores", dados.total_fornecedores);
    setDashboardValor("totalClientes", dados.total_clientes);

    setDashboardValor("totalEntradas", dados.total_entradas);
    setDashboardValor("estoqueTotal", dados.estoque_total);
    setDashboardValor("produtosAlerta", dados.produtos_alerta);

    setDashboardValor("conferenciasPendentes", dados.conferencias_pendentes);
    setDashboardValor("pendentesEnderecamento", dados.pendentes_enderecamento);
    setDashboardValor("divergenciasAbertas", dados.divergencias_abertas);

    setDashboardValor("pedidosAbertos", dados.pedidos_abertos);
    setDashboardValor("pedidosPicking", dados.pedidos_picking);
    setDashboardValor("pedidosSeparados", dados.pedidos_separados);
    setDashboardValor("pedidosExpedidos", dados.pedidos_expedidos);

    setDashboardValor("notasEmitidas", dados.notas_emitidas);
    setDashboardValor("notasRascunho", dados.notas_rascunho);
    setDashboardValor("totalAuditorias", dados.total_auditorias);

    setDashboardValor("valorEstoque", formatarMoedaDashboard(dados.valor_estoque));
    setDashboardValor("faturamentoMes", formatarMoedaDashboard(dados.faturamento_mes));

  } catch (erro) {
    console.error("Erro ao carregar dashboard:", erro);
    alert("Erro ao conectar com o servidor");
  }
}

async function carregarGraficosDashboard() {
  try {
    const resposta = await fetch(`${API_URL_DASHBOARD}/dashboard/graficos`);

    if (!resposta.ok) return;

    const dados = await resposta.json();

    renderizarGraficoBarras("graficoPedidos", [
      { label: "Abertos", valor: dados.pedidos_abertos },
      { label: "Picking", valor: dados.pedidos_picking },
      { label: "Separados", valor: dados.pedidos_separados },
      { label: "Expedidos", valor: dados.pedidos_expedidos },
      { label: "Cancelados", valor: dados.pedidos_cancelados }
    ]);

    renderizarGraficoBarras("graficoOperacao", [
      { label: "Conferência", valor: dados.conferencias_pendentes },
      { label: "Endereçamento", valor: dados.pendentes_enderecamento },
      { label: "Divergências", valor: dados.divergencias_abertas },
      { label: "Estoque baixo", valor: dados.produtos_alerta },
      { label: "NFs rascunho", valor: dados.notas_rascunho }
    ]);

  } catch (err) {
    console.error("Erro ao carregar gráficos:", err);
  }
}

function renderizarGraficoBarras(idElemento, dados) {
  const container = document.getElementById(idElemento);
  if (!container) return;

  const maiorValor = Math.max(...dados.map(d => Number(d.valor || 0)), 1);

  container.innerHTML = "";

  dados.forEach(item => {
    const valor = Number(item.valor || 0);
    const largura = Math.max((valor / maiorValor) * 100, valor > 0 ? 8 : 2);

    container.innerHTML += `
      <div class="linha-grafico">
        <div class="grafico-info">
          <span>${item.label}</span>
          <strong>${valor}</strong>
        </div>

        <div class="barra-grafico-fundo">
          <div class="barra-grafico-preenchida" style="width: ${largura}%"></div>
        </div>
      </div>
    `;
  });
}

function setDashboardValor(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valor ?? 0;
}

async function carregarAuditoriasDashboard() {
  try {
    const resposta =
      await fetch(`${API_URL_DASHBOARD}/dashboard/auditorias-recentes`);

    if (!resposta.ok) return;

    const auditorias = await resposta.json();
    const lista = document.getElementById("listaAuditoriasDashboard");

    if (!lista) return;

    if (!auditorias || auditorias.length === 0) {
      lista.innerHTML = "Nenhum registro encontrado.";
      return;
    }

    lista.innerHTML = "";

    auditorias.forEach(item => {
      lista.innerHTML += `
        <div class="auditoria-item">
          <strong>${item.acao || "-"}</strong>
          <p>${item.descricao || "-"}</p>
          <small>
            Usuário: ${item.usuario_login || "Sistema"} |
            ${formatarDataDashboard(item.data_hora)}
          </small>
        </div>
      `;
    });

  } catch (erro) {
    console.error("Erro ao carregar auditorias:", erro);
  }
}

function formatarDataDashboard(data) {
  if (!data) return "-";
  return new Date(data).toLocaleString("pt-BR");
}

function formatarMoedaDashboard(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}