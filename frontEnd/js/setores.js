function carregarSetores() {
  const listaSetores = document.getElementById("listaSetores");

  if (!listaSetores) {
    return;
  }

  const setores = JSON.parse(localStorage.getItem("setores")) || [];

  listaSetores.innerHTML = "";

  if (setores.length === 0) {
    listaSetores.innerHTML = `
      <li>Nenhum setor cadastrado.</li>
    `;
    return;
  }

  setores.forEach((setor, index) => {
    listaSetores.innerHTML += `
      <li>
        <span>${setor.nome}</span>

        <button
          type="button"
          class="btn-excluir-setor"
          onclick="excluirSetor(${index})"
        >
          Excluir
        </button>
      </li>
    `;
  });
}

function cadastrarSetor() {
  const nomeSetorInput = document.getElementById("nomeSetor");

  if (!nomeSetorInput) {
    return;
  }

  const nomeSetor = nomeSetorInput.value.trim();

  if (nomeSetor === "") {
    alert("Digite o nome do setor.");
    return;
  }

  let setores = JSON.parse(localStorage.getItem("setores")) || [];

  const setorExiste = setores.some(setor =>
    setor.nome.toLowerCase() === nomeSetor.toLowerCase()
  );

  if (setorExiste) {
    alert("Setor já cadastrado.");
    return;
  }

  setores.push({
    nome: nomeSetor
  });

  localStorage.setItem("setores", JSON.stringify(setores));

  nomeSetorInput.value = "";

  carregarSetores();

  alert("Setor cadastrado com sucesso!");
}

function excluirSetor(index) {
  let setores = JSON.parse(localStorage.getItem("setores")) || [];

  const confirmar = confirm("Deseja realmente excluir este setor?");

  if (!confirmar) {
    return;
  }

  setores.splice(index, 1);

  localStorage.setItem("setores", JSON.stringify(setores));

  carregarSetores();

  alert("Setor excluído com sucesso!");
}