var API_URL_DASHBOARD = "http://localhost:3000";

function iniciarDashboard() {
  carregarDashboard();
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
    setDashboardValor("divergenciasAbertas", dados.divergencias_abertas);

    setDashboardValor("pedidosAbertos", dados.pedidos_abertos);
    setDashboardValor("pedidosPicking", dados.pedidos_picking);
    setDashboardValor("pedidosSeparados", dados.pedidos_separados);
    setDashboardValor("pedidosExpedidos", dados.pedidos_expedidos);

    setDashboardValor("notasEmitidas", dados.notas_emitidas);

    setDashboardValor("totalAjustes", dados.total_ajustes);
    setDashboardValor("totalAuditorias", dados.total_auditorias);

  } catch (erro) {
    console.error("Erro ao carregar dashboard:", erro);
    alert("Erro ao conectar com o servidor");
  }
}

function setDashboardValor(id, valor) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.textContent = valor ?? 0;
  }
}

async function carregarAuditoriasDashboard() {
  try {
    const resposta =
      await fetch(`${API_URL_DASHBOARD}/dashboard/auditorias-recentes`);

    if (!resposta.ok) {
      console.error("Erro ao carregar auditorias recentes");
      return;
    }

    const auditorias = await resposta.json();

    const lista =
      document.getElementById("listaAuditoriasDashboard");

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

          <p>
            ${item.descricao || "-"}
          </p>

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