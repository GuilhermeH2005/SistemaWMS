var usuarios = [];
var usuarioSelecionadoId = null;
var linhaSelecionada = null;

/* =========================
   NOVO USUÁRIO
========================= */

function novoUsuario() {

  localStorage.removeItem("usuarioEditar");

  carregarPagina(
    "pages/cadastro-usuario.html",
    "usuarios"
  );

}

/* =========================
   CONSULTAR USUÁRIOS
========================= */

function consultarUsuarios() {

  const areaTabelaUsuarios =
    document.getElementById("areaTabelaUsuarios");

  if (!areaTabelaUsuarios) return;

  areaTabelaUsuarios.style.display = "block";

  carregarUsuarios();

}

/* =========================
   CARREGAR USUÁRIOS
========================= */

async function carregarUsuarios() {

  const listaUsuarios =
    document.getElementById("listaUsuarios");

  if (!listaUsuarios) return;

  try {

    const res =
      await fetch("http://localhost:3000/usuarios");

    usuarios = await res.json();

    listaUsuarios.innerHTML = "";

    usuarioSelecionadoId = null;
    linhaSelecionada = null;

    const codigoFiltro =
      document.getElementById("filtroCodigo")
        ?.value.trim() || "";

    const nomeFiltro =
      document.getElementById("filtroNome")
        ?.value.trim().toLowerCase() || "";

    const loginFiltro =
      document.getElementById("filtroLogin")
        ?.value.trim().toLowerCase() || "";

    const setorFiltro =
      document.getElementById("filtroSetor")
        ?.value || "";

    const situacaoFiltro =
      document.getElementById("filtroSituacao")
        ?.value || "";

    const usuariosFiltrados =
      usuarios.filter(usuario => {

        return (

          (codigoFiltro === "" ||
            String(usuario.id).includes(codigoFiltro))

          &&

          (nomeFiltro === "" ||
            usuario.nome_completo
              .toLowerCase()
              .includes(nomeFiltro))

          &&

          (loginFiltro === "" ||
            usuario.login
              .toLowerCase()
              .includes(loginFiltro))

          &&

          (setorFiltro === "" ||
            String(usuario.setor_id || "") === setorFiltro)

          &&

          (situacaoFiltro === "" ||
            usuario.situacao === situacaoFiltro)

        );

      });

    if (usuariosFiltrados.length === 0) {

      listaUsuarios.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;">
            Nenhum usuário encontrado.
          </td>
        </tr>
      `;

      return;

    }

    usuariosFiltrados.forEach(usuario => {

      listaUsuarios.innerHTML += `

        <tr onclick="selecionarLinha(this, ${usuario.id})">

          <td class="td-checkbox">

            <input
              type="checkbox"
              class="checkbox-usuario"
              onclick="event.stopPropagation(); selecionarLinha(this.closest('tr'), ${usuario.id})"
            >

          </td>

          <td>${usuario.id}</td>

          <td>${usuario.nome_completo}</td>

          <td>${usuario.login}</td>

          <td>${usuario.setor_nome || "-"}</td>

          <td>${usuario.ultimo_acesso || "-"}</td>

          <td>${usuario.situacao || "ATIVO"}</td>

        </tr>

      `;

    });

  } catch (err) {

    console.error(err);

    alert("Erro ao carregar usuários.");

  }

}

/* =========================
   SELECIONAR LINHA
========================= */

function selecionarLinha(linha, id) {

  document
    .querySelectorAll("#listaUsuarios tr")
    .forEach(item =>
      item.classList.remove("selecionada")
    );

  document
    .querySelectorAll(".checkbox-usuario")
    .forEach(item =>
      item.checked = false
    );

  linhaSelecionada = linha;

  linhaSelecionada
    .classList
    .add("selecionada");

  const checkbox =
    linha.querySelector(".checkbox-usuario");

  if (checkbox) {
    checkbox.checked = true;
  }

  usuarioSelecionadoId = id;

}

/* =========================
   EDITAR USUÁRIO
========================= */

function editarUsuario() {

  const areaTabelaUsuarios =
    document.getElementById("areaTabelaUsuarios");

  if (
    !areaTabelaUsuarios ||
    areaTabelaUsuarios.style.display === "none"
  ) {

    alert("Clique em Consultar antes de editar.");

    return;

  }

  if (usuarioSelecionadoId === null) {

    alert("Selecione um usuário para editar.");

    return;

  }

  if (usuarioSelecionadoId === 1) {

    alert("O administrador não pode ser editado.");

    return;

  }

  localStorage.setItem(
    "usuarioEditar",
    String(usuarioSelecionadoId)
  );

  carregarPagina(
    "pages/cadastro-usuario.html",
    "usuarios"
  );

}

/* =========================
   EXCLUIR USUÁRIO
========================= */

async function excluirUsuario() {

  const areaTabelaUsuarios =
    document.getElementById("areaTabelaUsuarios");

  if (
    !areaTabelaUsuarios ||
    areaTabelaUsuarios.style.display === "none"
  ) {

    alert("Clique em Consultar antes de excluir.");

    return;

  }

  if (usuarioSelecionadoId === null) {

    alert("Selecione um usuário para excluir.");

    return;

  }

  if (usuarioSelecionadoId === 1) {

    alert("O usuário administrador não pode ser excluído.");

    return;

  }

  const confirmar =
    confirm("Deseja realmente excluir este usuário?");

  if (!confirmar) return;

  try {

    const res = await fetch(
      `http://localhost:3000/usuarios/${usuarioSelecionadoId}`,
      {
        method: "DELETE",
        headers: {
    "Content-Type": "application/json"
  },

  body: JSON.stringify({
    ...getUsuarioAuditoria()
  })
      }
    );

    const msg = await res.text();

    if (!res.ok) {

      alert(msg);

      return;

    }

    usuarioSelecionadoId = null;

    linhaSelecionada = null;

    carregarUsuarios();

    alert("Usuário excluído com sucesso!");

  } catch (err) {

    console.error(err);

    alert("Erro ao excluir usuário.");

  }

}

/* =========================
   CARREGAR SETORES FILTRO
========================= */

async function carregarSetoresFiltroUsuario() {

  const filtroSetor =
    document.getElementById("filtroSetor");

  if (!filtroSetor) return;

  try {

    const res =
      await fetch("http://localhost:3000/setores");

    const setores =
      await res.json();

    filtroSetor.innerHTML = `
      <option value="">TODOS</option>
    `;

    setores.forEach(setor => {

      filtroSetor.innerHTML += `

        <option value="${setor.id}">
          ${setor.nome}
        </option>

      `;

    });

  } catch (err) {

    console.error(err);

    alert("Erro ao carregar setores.");

  }

}

/* =========================
   ABRIR ABA
========================= */

function abrirAbaUsuario(aba) {

  const abaDados =
    document.getElementById("abaDadosUsuario");

  const abaPermissoes =
    document.getElementById("abaPermissoesUsuario");

  const botoes =
    document.querySelectorAll(".aba");

  if (!abaDados || !abaPermissoes) return;

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

/* =========================
   CARREGAR SETORES
========================= */

async function carregarSetoresNoUsuario() {

  const selectSetor =
    document.getElementById("setor");

  if (!selectSetor) return;

  try {

    const res =
      await fetch("http://localhost:3000/setores");

    const setores =
      await res.json();

    selectSetor.innerHTML = `
      <option value="">
        Selecione o Setor
      </option>
    `;

    setores.forEach(setor => {

      selectSetor.innerHTML += `

        <option value="${setor.id}">
          ${setor.nome}
        </option>

      `;

    });

  } catch (err) {

    console.error(err);

    alert("Erro ao carregar setores.");

  }

}

/* =========================
   CARREGAR FUNCIONÁRIOS
========================= */

async function carregarFuncionariosNoUsuario() {

  const selectFuncionario =
    document.getElementById("nomeCompleto");

  const inputEmail =
    document.getElementById("email");

  if (!selectFuncionario) return;

  try {

    const res =
      await fetch("http://localhost:3000/funcionarios");

    const funcionarios =
      await res.json();

    selectFuncionario.innerHTML = `
      <option value="">
        Selecione o Funcionário
      </option>
    `;

    funcionarios.forEach(funcionario => {

      selectFuncionario.innerHTML += `

        <option
          value="${funcionario.id}"
          data-email="${funcionario.email || ""}"
        >
          ${funcionario.nome}
        </option>

      `;

    });

    selectFuncionario.addEventListener("change", () => {

      const opcao =
        selectFuncionario.options[
          selectFuncionario.selectedIndex
        ];

      if (inputEmail) {

        inputEmail.value =
          opcao.dataset.email || "";

      }

    });

  } catch (err) {

    console.error(err);

    alert("Erro ao carregar funcionários.");

  }

}