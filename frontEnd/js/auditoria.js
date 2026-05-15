const API_AUDITORIA =
  "http://localhost:3000";

function iniciarAuditoria() {
  carregarAuditoria();
}

async function carregarAuditoria() {

  try {

    const resposta =
      await fetch(`${API_AUDITORIA}/auditoria`);

    if (!resposta.ok) {

      const erro =
        await resposta.text();

      alert("Erro ao carregar auditoria");

      console.error(erro);

      return;

    }

    const auditorias =
      await resposta.json();

    const lista =
      document.getElementById("listaAuditoria");

    if (!lista) return;

    lista.innerHTML = "";

    if (auditorias.length === 0) {

      lista.innerHTML = `
        <tr>
          <td colspan="7">
            Nenhum registro encontrado.
          </td>
        </tr>
      `;

      return;

    }

    auditorias.forEach(item => {

      lista.innerHTML += `
        <tr>

          <td>${item.id}</td>

          <td>
            ${item.usuario_login || "Sistema"}
          </td>

          <td>
            <span class="badge-acao">
              ${item.acao}
            </span>
          </td>

          <td>
            ${item.tabela_afetada}
          </td>

          <td>
            ${item.registro_id || "-"}
          </td>

          <td class="descricao">
            ${item.descricao}
          </td>

          <td>
            ${formatarData(item.data_hora)}
          </td>

        </tr>
      `;

    });

  } catch (erro) {

    console.error(
      "Erro ao carregar auditoria:",
      erro
    );

    alert("Erro ao carregar auditoria");

  }

}

function formatarData(data) {

  if (!data) return "-";

  return new Date(data)
    .toLocaleString("pt-BR");

}