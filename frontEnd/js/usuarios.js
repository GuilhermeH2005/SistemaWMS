let usuarios = [];
let usuarioSelecionadoId = null;
let linhaSelecionada = null;

/* =========================
   ABRIR NOVO USUÁRIO
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
  const areaTabelaUsuarios = document.getElementById("areaTabelaUsuarios");

  if (!areaTabelaUsuarios) return;

  areaTabelaUsuarios.style.display = "block";

  carregarUsuarios();
}

/* =========================
   CARREGAR USUÁRIOS
========================= */

async function carregarUsuarios() {
  const listaUsuarios = document.getElementById("listaUsuarios");

  if (!listaUsuarios) return;

  try {
    const res = await fetch("http://localhost:3000/usuarios");
    usuarios = await res.json();

    listaUsuarios.innerHTML = "";
    usuarioSelecionadoId = null;
    linhaSelecionada = null;

    const codigoFiltro = document.getElementById("filtroCodigo")?.value.trim() || "";
    const nomeFiltro = document.getElementById("filtroNome")?.value.trim().toLowerCase() || "";
    const loginFiltro = document.getElementById("filtroLogin")?.value.trim().toLowerCase() || "";
    const setorFiltro = document.getElementById("filtroSetor")?.value || "";
    const situacaoFiltro = document.getElementById("filtroSituacao")?.value || "";

    const usuariosFiltrados = usuarios.filter(usuario => {
      return (
        (codigoFiltro === "" || String(usuario.id).includes(codigoFiltro)) &&
        (nomeFiltro === "" || usuario.nome_completo.toLowerCase().includes(nomeFiltro)) &&
        (loginFiltro === "" || usuario.login.toLowerCase().includes(loginFiltro)) &&
        (setorFiltro === "" || String(usuario.setor_id || "") === setorFiltro) &&
        (situacaoFiltro === "" || usuario.situacao === situacaoFiltro)
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
    .forEach(item => item.classList.remove("selecionada"));

  document
    .querySelectorAll(".checkbox-usuario")
    .forEach(item => item.checked = false);

  linhaSelecionada = linha;
  linhaSelecionada.classList.add("selecionada");

  const checkbox = linha.querySelector(".checkbox-usuario");

  if (checkbox) {
    checkbox.checked = true;
  }

  usuarioSelecionadoId = id;
}

/* =========================
   EDITAR USUÁRIO
========================= */

function editarUsuario() {
  const areaTabelaUsuarios = document.getElementById("areaTabelaUsuarios");

  if (!areaTabelaUsuarios || areaTabelaUsuarios.style.display === "none") {
    alert("Clique em Consultar antes de editar.");
    return;
  }

  if (usuarioSelecionadoId === null) {
    alert("Selecione um usuário para editar.");
    return;
  }

  localStorage.setItem("usuarioEditar", String(usuarioSelecionadoId));

  carregarPagina(
    "pages/cadastro-usuario.html",
    "usuarios"
  );
}

/* =========================
   EXCLUIR USUÁRIO
========================= */

async function excluirUsuario() {
  const areaTabelaUsuarios = document.getElementById("areaTabelaUsuarios");

  if (!areaTabelaUsuarios || areaTabelaUsuarios.style.display === "none") {
    alert("Clique em Consultar antes de excluir.");
    return;
  }

  if (usuarioSelecionadoId === null) {
    alert("Selecione um usuário para excluir.");
    return;
  }

  const confirmar = confirm("Deseja realmente excluir este usuário?");

  if (!confirmar) return;

  try {
    const res = await fetch(`http://localhost:3000/usuarios/${usuarioSelecionadoId}`, {
      method: "DELETE"
    });

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
  const filtroSetor = document.getElementById("filtroSetor");

  if (!filtroSetor) return;

  try {
    const res = await fetch("http://localhost:3000/setores");
    const setores = await res.json();

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
  const abaDados = document.getElementById("abaDadosUsuario");
  const abaPermissoes = document.getElementById("abaPermissoesUsuario");
  const botoes = document.querySelectorAll(".aba");

  if (!abaDados || !abaPermissoes) return;

  abaDados.classList.remove("ativo");
  abaPermissoes.classList.remove("ativo");

  botoes.forEach(botao => {
    botao.classList.remove("ativa");
  });

  if (aba === "dados") {
    abaDados.classList.add("ativo");
    if (botoes[0]) botoes[0].classList.add("ativa");
  }

  if (aba === "permissoes") {
    abaPermissoes.classList.add("ativo");
    if (botoes[1]) botoes[1].classList.add("ativa");
  }
}

/* =========================
   CARREGAR SETORES CADASTRO
========================= */

async function carregarSetoresNoUsuario() {
  const selectSetor = document.getElementById("setor");

  if (!selectSetor) return;

  try {
    const res = await fetch("http://localhost:3000/setores");
    const setores = await res.json();

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
  const selectFuncionario = document.getElementById("nomeCompleto");
  const inputEmail = document.getElementById("email");

  if (!selectFuncionario) return;

  try {
    const res = await fetch("http://localhost:3000/funcionarios");
    const funcionarios = await res.json();

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
      const opcao = selectFuncionario.options[selectFuncionario.selectedIndex];

      if (inputEmail) {
        inputEmail.value = opcao.dataset.email || "";
      }
    });

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar funcionários.");
  }
}

/* =========================
   INICIAR CADASTRO USUÁRIO
========================= */

async function iniciarCadastroUsuario() {

  const formUsuario =
    document.getElementById("formUsuario");

  if (!formUsuario) return;

  await carregarSetoresNoUsuario();
  await carregarFuncionariosNoUsuario();

  const usuarioEditarId =
    localStorage.getItem("usuarioEditar");

  let modoEdicao = false;

  const campoSituacao =
    document.getElementById("campoSituacao");

  const campoSenha =
    document.getElementById("campoSenha");

  const inputLogin =
    document.getElementById("login");

  const inputSenha =
    document.getElementById("senha");

  const situacao =
    document.getElementById("situacao");

  // NOVO USUÁRIO

  if (campoSituacao)
    campoSituacao.style.display = "none";

  if (campoSenha)
    campoSenha.style.display = "block";

  if (inputLogin)
    inputLogin.readOnly = false;

  if (situacao)
    situacao.value = "ATIVO";

  // EDIÇÃO

  if (usuarioEditarId) {

    modoEdicao = true;

    if (campoSituacao)
      campoSituacao.style.display = "block";

    if (campoSenha)
      campoSenha.style.display = "none";

    if (inputLogin)
      inputLogin.readOnly = true;

    const res =
      await fetch(
        `http://localhost:3000/usuarios/${usuarioEditarId}`
      );

    const usuario =
      await res.json();

    document.getElementById("nomeCompleto").value =
      usuario.funcionario_id || "";

    document.getElementById("login").value =
      usuario.login || "";

    document.getElementById("email").value =
      usuario.email || "";

    document.getElementById("setor").value =
      usuario.setor_id || "";

    if (situacao) {
      situacao.value =
        usuario.situacao || "ATIVO";
    }

    document
      .querySelectorAll(".permissoes-grid input")
      .forEach(item => {

        item.checked =
          usuario.permissoes &&
          usuario.permissoes.includes(item.value);

      });

  }

  configurarRegrasSenhaCadastro();

  formUsuario.onsubmit = async function(event) {

    event.preventDefault();

    const permissoesSelecionadas = [];

    document
      .querySelectorAll(".permissoes-grid input:checked")
      .forEach(item => {

        permissoesSelecionadas.push(item.value);

      });

    const senha =
      inputSenha ? inputSenha.value : "";

    const senhaForte =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;

    if (!modoEdicao && !senhaForte.test(senha)) {

      alert(
        "A senha deve conter:\n\n" +
        "- Pelo menos 8 caracteres\n" +
        "- Uma letra maiúscula\n" +
        "- Um número\n" +
        "- Um caractere especial"
      );

      return;

    }

    const usuario = {

      funcionario_id:
        document.getElementById("nomeCompleto").value,

      setor_id:
        document.getElementById("setor").value || null,

      login:
        document.getElementById("login").value.trim(),

      senha:
        senha,

      email:
        document.getElementById("email").value.trim(),

      situacao:
        situacao ? situacao.value : "ATIVO",

      permissoes:
        permissoesSelecionadas

    };

    try {

      let res;

      if (modoEdicao) {

        const usuarioEdicao = {

          funcionario_id:
            usuario.funcionario_id,

          setor_id:
            usuario.setor_id,

          email:
            usuario.email,

          situacao:
            usuario.situacao,

          permissoes:
            usuario.permissoes

        };

        res = await fetch(
          `http://localhost:3000/usuarios/${usuarioEditarId}`,
          {
            method: "PUT",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify(usuarioEdicao)
          }
        );

      } else {

        res = await fetch(
          "http://localhost:3000/usuarios",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify(usuario)
          }
        );

      }

      const msg =
        await res.text();

      if (!res.ok) {

        alert(msg);
        return;

      }

      localStorage.removeItem("usuarioEditar");

      alert(
        modoEdicao
          ? "Usuário alterado com sucesso!"
          : "Usuário cadastrado com sucesso!"
      );

      carregarPagina(
        "pages/usuarios.html",
        "usuarios"
      );

    } catch (err) {

      console.error(err);

      alert("Erro ao salvar usuário.");

    }

  };

}

/* =========================
   REGRAS SENHA
========================= */

function configurarRegrasSenhaCadastro() {

  const senha =
    document.getElementById("senha");

  const regraTamanho =
    document.getElementById("regraTamanho");

  const regraMaiuscula =
    document.getElementById("regraMaiuscula");

  const regraNumero =
    document.getElementById("regraNumero");

  const regraEspecial =
    document.getElementById("regraEspecial");

  if (!senha) return;

  senha.addEventListener("input", () => {

    const valor = senha.value;

    atualizarRegra(
      regraTamanho,
      valor.length >= 8
    );

    atualizarRegra(
      regraMaiuscula,
      /[A-Z]/.test(valor)
    );

    atualizarRegra(
      regraNumero,
      /\d/.test(valor)
    );

    atualizarRegra(
      regraEspecial,
      /[@$!%*?&.#_-]/.test(valor)
    );

  });

}

function atualizarRegra(elemento, valido) {

  if (!elemento) return;

  if (valido) {

    elemento.classList.add("regra-ok");

  } else {

    elemento.classList.remove("regra-ok");

  }

}