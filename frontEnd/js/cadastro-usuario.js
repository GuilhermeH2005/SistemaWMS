let usuarios =
  JSON.parse(localStorage.getItem("usuarios")) || [];

let indiceSelecionado = null;
let linhaSelecionada = null;

// CONSULTAR USUÁRIOS

function consultarUsuarios() {

  const areaTabelaUsuarios =
    document.getElementById("areaTabelaUsuarios");

  if (!areaTabelaUsuarios) {
    return;
  }

  areaTabelaUsuarios.style.display = "block";

  carregarUsuarios();

}

// CARREGAR USUÁRIOS

function carregarUsuarios() {

  const listaUsuarios =
    document.getElementById("listaUsuarios");

  if (!listaUsuarios) {
    return;
  }

  usuarios =
    JSON.parse(localStorage.getItem("usuarios")) || [];

  listaUsuarios.innerHTML = "";

  const usuarioPadrao = {

    codigo: 1,

    nomeCompleto: "Administrador",

    login: "admin",

    setor: "Administrativo",

    ultimoAcesso:
      localStorage.getItem("adminUltimoAcesso") || "Sem acesso",

    situacao: "ATIVO"

  };

  const todosUsuarios = [

    usuarioPadrao,

    ...usuarios.map((usuario, index) => ({

      codigo: index + 2,

      nomeCompleto:
        usuario.nomeCompleto || "-",

      login:
        usuario.login || "-",

      setor:
        usuario.setor || "-",

      ultimoAcesso:
        usuario.ultimoAcesso || "-",

      situacao:
        usuario.situacao || "ATIVO"

    }))

  ];

  const codigoFiltro =
    document.getElementById("filtroCodigo")
      ?.value
      .trim() || "";

  const nomeFiltro =
    document.getElementById("filtroNome")
      ?.value
      .trim()
      .toLowerCase() || "";

  const loginFiltro =
    document.getElementById("filtroLogin")
      ?.value
      .trim()
      .toLowerCase() || "";

  const setorFiltro =
    document.getElementById("filtroSetor")
      ?.value || "";

  const situacaoFiltro =
    document.getElementById("filtroSituacao")
      ?.value || "";

  const usuariosFiltrados =
    todosUsuarios.filter(usuario => {

      return (

        (codigoFiltro === "" ||

          String(usuario.codigo)
            .includes(codigoFiltro))

        &&

        (nomeFiltro === "" ||

          usuario.nomeCompleto
            .toLowerCase()
            .includes(nomeFiltro))

        &&

        (loginFiltro === "" ||

          usuario.login
            .toLowerCase()
            .includes(loginFiltro))

        &&

        (setorFiltro === "" ||

          usuario.setor === setorFiltro)

        &&

        (situacaoFiltro === "" ||

          usuario.situacao === situacaoFiltro)

      );

    });

  if (usuariosFiltrados.length === 0) {

    listaUsuarios.innerHTML = `

      <tr>

        <td colspan="6"
          style="text-align:center;">

          Nenhum usuário encontrado.

        </td>

      </tr>

    `;

    return;

  }

  usuariosFiltrados.forEach(usuario => {

    const indiceOriginal =
      usuario.codigo - 1;

    listaUsuarios.innerHTML += `

      <tr
        onclick="selecionarLinha(
          this,
          ${indiceOriginal}
        )"
      >

        <td>${usuario.codigo}</td>

        <td>${usuario.nomeCompleto}</td>

        <td>${usuario.login}</td>

        <td>${usuario.setor}</td>

        <td>${usuario.ultimoAcesso}</td>

        <td>${usuario.situacao}</td>

      </tr>

    `;

  });

}

// SELECIONAR LINHA

function selecionarLinha(linha, indice) {

  if (linhaSelecionada) {

    linhaSelecionada
      .classList
      .remove("selecionada");

  }

  linhaSelecionada = linha;

  linhaSelecionada
    .classList
    .add("selecionada");

  indiceSelecionado = indice;

}

// EDITAR USUÁRIO

function editarUsuario() {

  const areaTabelaUsuarios =
    document.getElementById("areaTabelaUsuarios");

  if (
    !areaTabelaUsuarios ||
    areaTabelaUsuarios.style.display === "none"
  ) {

    alert(
      "Clique em Consultar antes de editar."
    );

    return;

  }

  if (indiceSelecionado === null) {

    alert(
      "Selecione um usuário para editar."
    );

    return;

  }

  if (indiceSelecionado === 0) {

    alert(
      "O administrador não pode ser editado."
    );

    return;

  }

  localStorage.setItem(
    "usuarioEditar",
    String(indiceSelecionado - 1)
  );

  carregarPagina(
    "pages/cadastro-usuario.html",
    "usuarios"
  );

}

// EXCLUIR USUÁRIO

function excluirUsuario() {

  const areaTabelaUsuarios =
    document.getElementById("areaTabelaUsuarios");

  if (
    !areaTabelaUsuarios ||
    areaTabelaUsuarios.style.display === "none"
  ) {

    alert(
      "Clique em Consultar antes de excluir."
    );

    return;

  }

  if (indiceSelecionado === null) {

    alert(
      "Selecione um usuário para excluir."
    );

    return;

  }

  if (indiceSelecionado === 0) {

    alert(
      "O usuário administrador não pode ser excluído."
    );

    return;

  }

  const confirmar =
    confirm(
      "Deseja realmente excluir este usuário?"
    );

  if (!confirmar) {
    return;
  }

  usuarios.splice(indiceSelecionado - 1, 1);

  localStorage.setItem(
    "usuarios",
    JSON.stringify(usuarios)
  );

  indiceSelecionado = null;

  linhaSelecionada = null;

  carregarUsuarios();

  alert("Usuário excluído com sucesso!");

}

// CARREGAR SETORES FILTRO

function carregarSetoresFiltroUsuario() {

  const filtroSetor =
    document.getElementById("filtroSetor");

  if (!filtroSetor) {
    return;
  }

  const setores =
    JSON.parse(localStorage.getItem("setores")) || [];

  filtroSetor.innerHTML = `

    <option value="">
      TODOS
    </option>

  `;

  setores.forEach(setor => {

    const nomeSetor =
      typeof setor === "string"
        ? setor
        : setor.nome;

    if (!nomeSetor) {
      return;
    }

    filtroSetor.innerHTML += `

      <option value="${nomeSetor}">
        ${nomeSetor}
      </option>

    `;

  });

}

// ABRIR ABA

function abrirAbaUsuario(aba) {

  const abaDados =
    document.getElementById("abaDadosUsuario");

  const abaPermissoes =
    document.getElementById("abaPermissoesUsuario");

  const botoes =
    document.querySelectorAll(".aba");

  if (!abaDados || !abaPermissoes) {
    return;
  }

  abaDados.classList.remove("ativo");
  abaPermissoes.classList.remove("ativo");

  botoes.forEach(botao => {
    botao.classList.remove("ativa");
  });

  if (aba === "dados") {

    abaDados.classList.add("ativo");

    if (botoes[0]) {
      botoes[0].classList.add("ativa");
    }

  }

  if (aba === "permissoes") {

    abaPermissoes.classList.add("ativo");

    if (botoes[1]) {
      botoes[1].classList.add("ativa");
    }

  }

}

// CARREGAR SETORES CADASTRO

function carregarSetoresNoUsuario() {

  const selectSetor =
    document.getElementById("setor");

  if (!selectSetor) {
    return;
  }

  const setores =
    JSON.parse(localStorage.getItem("setores")) || [];

  selectSetor.innerHTML = `

    <option value="">
      Selecione o Setor
    </option>

  `;

  setores.forEach(setor => {

    const nomeSetor =
      typeof setor === "string"
        ? setor
        : setor.nome;

    if (!nomeSetor) {
      return;
    }

    selectSetor.innerHTML += `

      <option value="${nomeSetor}">
        ${nomeSetor}
      </option>

    `;

  });

}

// CARREGAR FUNCIONÁRIOS

async function carregarFuncionariosNoUsuario() {

  const selectFuncionario =
    document.getElementById("nomeCompleto");

  if (!selectFuncionario) {
    return;
  }

  selectFuncionario.innerHTML = `
    <option value="">
      Selecione o Funcionário
    </option>
  `;

  try {

    const resposta =
      await fetch("http://localhost:3000/funcionarios");

    const funcionarios =
      await resposta.json();

    funcionarios.forEach(funcionario => {

      selectFuncionario.innerHTML += `
        <option value="${funcionario.nome}">
          ${funcionario.nome}
        </option>
      `;

    });

  } catch (erro) {

    console.error("Erro ao carregar funcionários:", erro);
    alert("Erro ao buscar funcionários cadastrados.");

  }

}

// INICIAR CADASTRO

async function iniciarCadastroUsuario() {

  const formUsuario =
    document.getElementById("formUsuario");

  if (!formUsuario) {
    return;
  }

  carregarSetoresNoUsuario();

  await carregarFuncionariosNoUsuario();

  const indiceEditar =
    localStorage.getItem("usuarioEditar");

  const listaUsuariosSalvos =
    JSON.parse(localStorage.getItem("usuarios")) || [];

  let modoEdicao = false;

  if (
    indiceEditar !== null &&
    indiceEditar !== "" &&
    listaUsuariosSalvos[Number(indiceEditar)]
  ) {

    modoEdicao = true;

    const usuarioEditar =
      listaUsuariosSalvos[Number(indiceEditar)];

    document.getElementById("nomeCompleto").value =
      usuarioEditar.nomeCompleto || "";

    document.getElementById("login").value =
      usuarioEditar.login || "";

    document.getElementById("senha").value =
      usuarioEditar.senha || "";

    document.getElementById("email").value =
      usuarioEditar.email || "";

    document.getElementById("setor").value =
      usuarioEditar.setor || "";

    document.getElementById("situacao").value =
      usuarioEditar.situacao || "ATIVO";

    document
      .querySelectorAll(".permissoes-grid input")
      .forEach(item => {

        item.checked =
          usuarioEditar.permissoes &&
          usuarioEditar.permissoes.includes(item.value);

      });

  }

  formUsuario.onsubmit = function(event) {

    event.preventDefault();

    const permissoesSelecionadas = [];

    document
      .querySelectorAll(".permissoes-grid input:checked")
      .forEach(item => {

        permissoesSelecionadas.push(item.value);

      });

    const senha =
      document.getElementById("senha").value;

    const senhaForte =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;

    if (!senhaForte.test(senha)) {

      alert(
        "A senha deve conter:\n\n" +
        "- Pelo menos 8 caracteres\n" +
        "- Uma letra maiúscula\n" +
        "- Um número\n" +
        "- Um caractere especial"
      );

      return;

    }

    const agora = new Date();

    const data =
      agora.toLocaleDateString("pt-BR");

    const hora =
      agora.toLocaleTimeString("pt-BR", {

        hour: "2-digit",
        minute: "2-digit"

      });

    const usuario = {

      nomeCompleto:
        document.getElementById("nomeCompleto").value,

      login:
        document.getElementById("login").value,

      senha: senha,

      email:
        document.getElementById("email").value,

      setor:
        document.getElementById("setor").value,

      situacao:
        document.getElementById("situacao").value,

      ultimoAcesso:
        modoEdicao
          ? listaUsuariosSalvos[Number(indiceEditar)].ultimoAcesso || "-"
          : `${data} ${hora}`,

      permissoes:
        permissoesSelecionadas

    };

    if (modoEdicao) {

      listaUsuariosSalvos[Number(indiceEditar)] =
        usuario;

      localStorage.removeItem("usuarioEditar");

      alert("Usuário alterado com sucesso!");

    } else {

      listaUsuariosSalvos.push(usuario);

      alert("Usuário cadastrado com sucesso!");

    }

    localStorage.setItem(
      "usuarios",
      JSON.stringify(listaUsuariosSalvos)
    );

    carregarPagina(
      "pages/usuarios.html",
      "usuarios"
    );

  };

}