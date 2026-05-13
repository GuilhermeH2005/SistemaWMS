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

function carregarPagina(pagina, permissaoNecessaria) {

  const usuario =
    JSON.parse(
      localStorage.getItem("usuarioLogado")
    );

  if (!usuario) {

    window.location.href = "login.html";
    return;

  }

  const permissoes =
    usuario.permissoes || [];

  if (
    permissaoNecessaria &&
    !permissoes.includes(permissaoNecessaria)
  ) {

    alert(
      "Você não possui permissão para acessar esta página ❌"
    );

    return;

  }

  fetch(pagina)
    .then(res => res.text())
    .then(html => {

      document.querySelector(".content").innerHTML = html;

      if (pagina.includes("fornecedores")) {
        iniciarFornecedor();
      }

      if (pagina.includes("produtos")) {
        iniciarProduto();
      }

      if (pagina.includes("entrada")) {
        iniciarEntrada();
      }

      if (pagina.includes("estoque")) {
        iniciarEstoque();
      }

      if (pagina.includes("alerta_min")) {
        iniciarAlertas();
      }

      if (pagina.includes("funcionarios")) {
        iniciarFuncionario();
      }

      if (pagina.includes("usuarios")) {
        consultarUsuarios();
      }

      if (pagina.includes("setores")) {
        carregarSetores();
      }

      if (pagina.includes("cadastro-usuario")) {
        iniciarCadastroUsuario();
      }

    });

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

     if (pagina.includes("funcionarios")) {
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

function aplicarPermissoes() {

  const usuario =
    JSON.parse(
      localStorage.getItem("usuarioLogado")
    );

  if (!usuario) return;

  const permissoes =
    usuario.permissoes || [];

  // FORNECEDORES
  if (
    !permissoes.includes("fornecedores")
  ) {

    const menu =
      document.getElementById(
        "menuFornecedores"
      );

    if (menu) {
      menu.style.display = "none";
    }

  }

  // PRODUTOS
  if (
    !permissoes.includes("produtos")
  ) {

    const menu =
      document.getElementById(
        "menuProdutos"
      );

    if (menu) {
      menu.style.display = "none";
    }

  }

  // FUNCIONÁRIOS
  if (
    !permissoes.includes("funcionarios")
  ) {

    const menu =
      document.getElementById(
        "menuFuncionarios"
      );

    if (menu) {
      menu.style.display = "none";
    }

  }

}

function configurarLogout() {

  const btnLogout =
    document.getElementById("btnLogout");

  if (!btnLogout) return;

  btnLogout.addEventListener("click", () => {

    const confirmar =
      confirm("Deseja sair do sistema?");

    if (!confirmar) return;

    localStorage.removeItem("usuarioLogado");

    window.location.href = "login.html";

  });

}

configurarLogout();
function carregarUsuarioTopo() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuario) {
    window.location.href = "login.html";
    return;
  }

  const usuarioTopo = document.getElementById("usuarioTopo");

  if (usuarioTopo) {
    usuarioTopo.innerHTML = `👤 ${usuario.nomeCompleto || usuario.login}`;
  }
}

carregarUsuarioTopo();