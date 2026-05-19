const API_URL_DASHBOARD = "http://localhost:3000";

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

    document.getElementById("totalProdutos").textContent =
      dados.total_produtos ?? 0;

    document.getElementById("totalFornecedores").textContent =
      dados.total_fornecedores ?? 0;

    document.getElementById("totalEntradas").textContent =
      dados.total_entradas ?? 0;

    document.getElementById("estoqueTotal").textContent =
      dados.estoque_total ?? 0;

    document.getElementById("produtosAlerta").textContent =
      dados.produtos_alerta ?? 0;

    document.getElementById("totalAjustes").textContent =
      dados.total_ajustes ?? 0;

    document.getElementById("conferenciasPendentes").textContent =
      dados.conferencias_pendentes ?? 0;

    document.getElementById("totalAuditorias").textContent =
      dados.total_auditorias ?? 0;

  } catch (erro) {
    console.error("Erro ao carregar dashboard:", erro);
    alert("Erro ao conectar com o servidor");
  }
}

async function carregarAuditoriasDashboard() {
  try {
    const resposta =
      await fetch(`${API_URL_DASHBOARD}/dashboard/auditorias-recentes`);

    const auditorias = await resposta.json();

    const lista =
      document.getElementById("listaAuditoriasDashboard");

    if (!lista) return;

    if (auditorias.length === 0) {
      lista.innerHTML = "Nenhum registro encontrado.";
      return;
    }

    lista.innerHTML = "";

    auditorias.forEach(item => {
      lista.innerHTML += `
        <div class="auditoria-item">
          <strong>${item.acao}</strong>
          <p>${item.descricao}</p>
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