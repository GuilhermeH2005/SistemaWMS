// MENU LATERAL

const menuItems = document.querySelectorAll('.has-submenu');

menuItems.forEach(item => {

  item.addEventListener('click', (e) => {

    if (e.target.closest('.submenu')) {
      return;
    }

    const isOpen =
      item.classList.contains('open');

    menuItems.forEach(i => {
      i.classList.remove('open');
    });

    if (!isOpen) {
      item.classList.add('open');
    }

  });

});

// BOTÃO MENU

const toggleBtn =
  document.getElementById('menu-toggle');

const sidebar =
  document.querySelector('.sidebar');

toggleBtn.addEventListener('click', () => {

  sidebar.classList.toggle('collapsed');

});

// ATUALIZAR USUÁRIO TOPO

function atualizarUsuarioTopo() {

  const areaUsuario =
    document.getElementById("usuarioTopo");

  if (!areaUsuario) {
    return;
  }

  const usuarioLogado =
    JSON.parse(localStorage.getItem("usuarioLogado"));

  if (
    usuarioLogado &&
    usuarioLogado.login
  ) {

    areaUsuario.innerHTML = `
      👤 ${usuarioLogado.login}
    `;

    return;
  }

  areaUsuario.innerHTML = "👤 Usuário";
}

// CARREGAR PÁGINA

function carregarPagina(pagina, permissao = null) {

  const usuarioLogado =
    JSON.parse(localStorage.getItem("usuarioLogado"));

  // ADMIN

  if (
    usuarioLogado &&
    usuarioLogado.login &&
    usuarioLogado.login.toLowerCase() === "admin"
  ) {

    abrirPagina(pagina);
    return;
  }

  // PERMISSÕES

  if (permissao) {

    const permissoes =
      usuarioLogado?.permissoes || [];

    if (!permissoes.includes(permissao)) {

      document.querySelector(".content").innerHTML = `

        <div class="nao-autorizado">

          <h1>
            ⛔ Usuário não autorizado
          </h1>

          <p>
            Você não possui permissão
            para acessar esta funcionalidade.
          </p>

        </div>

      `;

      return;
    }
  }

  abrirPagina(pagina);
}

// ABRIR PÁGINA

function abrirPagina(pagina) {

  fetch(pagina)

    .then(res => {

      if (!res.ok) {
        throw new Error(
          "Erro ao carregar página"
        );
      }

      return res.text();

    })

    .then(html => {

      const content =
        document.querySelector(".content");

      content.innerHTML = html;

      // ATUALIZA TOPO

      atualizarUsuarioTopo();

      // FORNECEDORES

      if (
        pagina.includes("fornecedores") &&
        typeof iniciarFornecedor === "function"
      ) {

        iniciarFornecedor();

      }

      // PRODUTOS

      if (
        pagina.includes("produtos") &&
        typeof iniciarProduto === "function"
      ) {

        iniciarProduto();

      }

      // ENTRADA

      if (
        pagina.includes("entrada") &&
        typeof iniciarEntrada === "function"
      ) {

        iniciarEntrada();

      }

      // ESTOQUE

      if (
        pagina.includes("estoque") &&
        typeof iniciarEstoque === "function"
      ) {

        iniciarEstoque();

      }

      // ALERTAS

      if (
        pagina.includes("alerta_min") &&
        typeof iniciarAlertas === "function"
      ) {

        iniciarAlertas();

      }

      // FUNCIONÁRIOS

      if (
        pagina.includes("funcionarios") &&
        typeof iniciarFuncionario === "function"
      ) {

        iniciarFuncionario();

      }

      // SETORES

      if (
        pagina.includes("setores") &&
        typeof carregarSetores === "function"
      ) {

        carregarSetores();

      }

      // USUÁRIOS

      if (
        pagina.includes("usuarios.html") &&
        !pagina.includes("cadastro-usuario")
      ) {

        if (
          typeof carregarUsuarios === "function"
        ) {

          carregarUsuarios();

        }

      }

      // CADASTRO USUÁRIO

      if (
        pagina.includes("cadastro-usuario") &&
        typeof iniciarCadastroUsuario === "function"
      ) {

        iniciarCadastroUsuario();

      }

      // CONFIGURAÇÕES

      if (
        pagina.includes("configuracoes") &&
        typeof iniciarConfiguracoes === "function"
      ) {

        iniciarConfiguracoes();

      }

    })

    .catch(erro => {

      console.error(
        "Erro ao carregar página:",
        erro
      );

      document.querySelector(".content").innerHTML = `

        <div class="erro-pagina">

          <h1>
            ❌ Erro ao carregar página
          </h1>

          <p>
            Não foi possível carregar
            o conteúdo solicitado.
          </p>

        </div>

      `;

    });

}

// INICIAR SISTEMA

atualizarUsuarioTopo();