/* =========================
   CARREGAR SETORES
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
  const inputCargo = document.getElementById("cargoFuncionario");

  if (!selectFuncionario) return;

  try {
    const res = await fetch("http://localhost:3000/funcionarios?listarTodos=true&limite=500");
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
          data-cargo="${funcionario.cargo || ""}"
        >
          ${funcionario.nome}
        </option>
      `;
    });

    selectFuncionario.onchange = () => {
      const opcao =
        selectFuncionario.options[selectFuncionario.selectedIndex];

      if (inputEmail) {
        inputEmail.value = opcao.dataset.email || "";
      }

      if (inputCargo) {
        inputCargo.value = opcao.dataset.cargo || "";
      }
    };

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar funcionários.");
  }
}
/* =========================
   INICIAR CADASTRO
========================= */

async function iniciarCadastroUsuario() {
  const formUsuario = document.getElementById("formUsuario");

  if (!formUsuario) return;

  await carregarSetoresNoUsuario();
  await carregarFuncionariosNoUsuario();

  const usuarioEditarId = localStorage.getItem("usuarioEditar");

  let modoEdicao = false;

  const campoSituacao = document.getElementById("campoSituacao");
  const campoSenha = document.getElementById("campoSenha");
  const inputLogin = document.getElementById("login");
  const inputSenha = document.getElementById("senha");
  const situacao = document.getElementById("situacao");

  // NOVO USUÁRIO
  if (campoSituacao) campoSituacao.style.display = "none";
  if (campoSenha) campoSenha.style.display = "block";
  if (inputLogin) {
    inputLogin.readOnly = false;
    inputLogin.required = true;
  }
  if (inputSenha) inputSenha.required = true;
  if (situacao) situacao.value = "ATIVO";

  // EDITAR USUÁRIO
  if (usuarioEditarId) {
    modoEdicao = true;

    if (campoSituacao) campoSituacao.style.display = "block";
    if (campoSenha) campoSenha.style.display = "none";

    if (inputLogin) {
      inputLogin.readOnly = true;
      inputLogin.required = false;
    }

    if (inputSenha) {
      inputSenha.required = false;
    }

    try {
      const res = await fetch(`http://localhost:3000/usuarios/${usuarioEditarId}`);
      const usuario = await res.json();

      document.getElementById("nomeCompleto").value =
        usuario.funcionario_id || "";

      document.getElementById("nomeCompleto").dispatchEvent(new Event("change"));

      document.getElementById("login").value =
        usuario.login || "";

      document.getElementById("email").value =
        usuario.email || "";

      document.getElementById("setor").value =
        usuario.setor_id || "";

      if (situacao) {
        situacao.value = usuario.situacao || "ATIVO";
      }

      document
        .querySelectorAll(".permissoes-grid input")
        .forEach(item => {
          item.checked =
            usuario.permissoes &&
            usuario.permissoes.includes(item.value);
        });

    } catch (err) {
      console.error(err);
      alert("Erro ao carregar usuário para edição.");
    }
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

    const senha = inputSenha ? inputSenha.value : "";

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
      funcionario_id: document.getElementById("nomeCompleto").value,
      setor_id: document.getElementById("setor").value || null,
      login: document.getElementById("login").value.trim(),
      senha: senha,
      email: document.getElementById("email").value.trim(),
      situacao: situacao ? situacao.value : "ATIVO",
      permissoes: permissoesSelecionadas
    };

    try {
      let res;

      if (modoEdicao) {
        const usuarioEdicao = {
          funcionario_id: usuario.funcionario_id,
          setor_id: usuario.setor_id,
          email: usuario.email,
          situacao: usuario.situacao,
          permissoes: usuario.permissoes
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
        res = await fetch("http://localhost:3000/usuarios", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(usuario)
        });
      }

      const msg = await res.text();

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

      carregarPagina("pages/usuarios.html", "usuarios");

    } catch (err) {
      console.error(err);
      alert("Erro ao salvar usuário.");
    }
  };
}

/* =========================
   REGRAS DA SENHA
========================= */

function configurarRegrasSenhaCadastro() {
  const senha = document.getElementById("senha");

  const regraTamanho = document.getElementById("regraTamanho");
  const regraMaiuscula = document.getElementById("regraMaiuscula");
  const regraNumero = document.getElementById("regraNumero");
  const regraEspecial = document.getElementById("regraEspecial");

  if (!senha) return;

  senha.oninput = () => {
    const valor = senha.value;

    atualizarRegra(regraTamanho, valor.length >= 8);
    atualizarRegra(regraMaiuscula, /[A-Z]/.test(valor));
    atualizarRegra(regraNumero, /\d/.test(valor));
    atualizarRegra(regraEspecial, /[@$!%*?&.#_-]/.test(valor));
  };
}

function atualizarRegra(elemento, valido) {
  if (!elemento) return;

  if (valido) {
    elemento.classList.add("regra-ok");
  } else {
    elemento.classList.remove("regra-ok");
  }
}

function alternarSenha(idCampo, botao) {
  const campo = document.getElementById(idCampo);

  if (!campo) return;

  if (campo.type === "password") {
    campo.type = "text";
    botao.textContent = "🙈";
  } else {
    campo.type = "password";
    botao.textContent = "👁️";
  }
}