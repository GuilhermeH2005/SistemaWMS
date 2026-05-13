async function carregarSetores() {

  const listaSetores =
    document.getElementById("listaSetores");

  if (!listaSetores) {
    return;
  }

  listaSetores.innerHTML = "";

  try {

    const resposta =
      await fetch("http://localhost:3000/setores");

    const setores =
      await resposta.json();

    if (setores.length === 0) {

      listaSetores.innerHTML = `
        <li>Nenhum setor cadastrado.</li>
      `;

      return;
    }

    setores.forEach(setor => {

      listaSetores.innerHTML += `
        <li>

          <span>${setor.nome}</span>

          <button
            type="button"
            class="btn-excluir-setor"
            onclick="excluirSetor(${setor.id})"
          >
            Excluir
          </button>

        </li>
      `;

    });

  } catch (erro) {

    console.error(erro);

    alert(
      "Erro ao carregar setores."
    );

  }

}

async function cadastrarSetor() {

  const nomeSetorInput =
    document.getElementById("nomeSetor");

  if (!nomeSetorInput) {
    return;
  }

  const nomeSetor =
    nomeSetorInput.value.trim();

  if (nomeSetor === "") {

    alert("Digite o nome do setor.");

    return;
  }

  try {

    const resposta =
      await fetch(
        "http://localhost:3000/setores",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            nome: nomeSetor
          })
        }
      );

    const mensagem =
      await resposta.text();

    if (!resposta.ok) {

      alert(mensagem);

      return;
    }

    nomeSetorInput.value = "";

    carregarSetores();

    alert("Setor cadastrado com sucesso!");

  } catch (erro) {

    console.error(erro);

    alert(
      "Erro ao cadastrar setor."
    );

  }

}

async function excluirSetor(id) {

  const confirmar =
    confirm(
      "Deseja realmente excluir este setor?"
    );

  if (!confirmar) {
    return;
  }

  try {

    const resposta =
      await fetch(
        `http://localhost:3000/setores/${id}`,
        {
          method: "DELETE"
        }
      );

    const mensagem =
      await resposta.text();

    if (!resposta.ok) {

      alert(mensagem);

      return;
    }

    carregarSetores();

    alert("Setor excluído com sucesso!");

  } catch (erro) {

    console.error(erro);

    alert(
      "Erro ao excluir setor."
    );

  }

}