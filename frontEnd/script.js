// MENU LATERAL
const menuItems = document.querySelectorAll(".has-submenu");

menuItems.forEach(item => {
  item.addEventListener("click", (e) => {
    if (e.target.closest(".submenu")) {
      return;
    }

    const isOpen = item.classList.contains("open");

    menuItems.forEach(i => {
      i.classList.remove("open");
    });

    if (!isOpen) {
      item.classList.add("open");
    }
  });
});

// BOTÃO MENU
const toggleBtn = document.getElementById("menu-toggle");
const sidebar = document.querySelector(".sidebar");

if (toggleBtn && sidebar) {
  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });
}

// ATUALIZAR USUÁRIO TOPO
function atualizarUsuarioTopo() {
  const areaUsuario = document.getElementById("usuarioTopo");

  if (!areaUsuario) return;

  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));

  if (usuarioLogado && usuarioLogado.login) {
    areaUsuario.innerHTML = `👤 ${usuarioLogado.login}`;
    return;
  }

  areaUsuario.innerHTML = "👤 Usuário";
}

// CARREGAR SCRIPT DA PÁGINA
function carregarScriptPagina(idScript, caminhoScript, funcaoInicializacao) {
  const scriptAntigo = document.getElementById(idScript);

  if (scriptAntigo) {
    scriptAntigo.remove();
  }

  const script = document.createElement("script");
  script.src = caminhoScript;
  script.id = idScript;

  script.onload = () => {
    if (typeof funcaoInicializacao === "function") {
      funcaoInicializacao();
    }
  };

  document.body.appendChild(script);
}

// CARREGAR PÁGINA
function carregarPagina(pagina, permissaoNecessaria) {

  const usuario =
    JSON.parse(localStorage.getItem("usuarioLogado"));

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

      const content =
        document.querySelector(".content");

      if (!content) {
        console.error("Elemento .content não encontrado");
        return;
      }

      content.innerHTML = html;

      // PRODUTOS
      if (pagina.includes("produtos.html")) {

        carregarScriptPagina(
          "script-produtos",
          "./js/produtos.js",
          () => iniciarProduto()
        );

      }

      // AJUSTE ESTOQUE
      if (pagina.includes("ajuste-estoque.html")) {

        carregarScriptPagina(
          "script-ajuste-estoque",
          "./js/ajuste-estoque.js",
          () => iniciarAjusteEstoque()
        );

      }

      // AUDITORIA
      if (pagina.includes("auditoria.html")) {

        carregarScriptPagina(
          "script-auditoria",
          "./js/auditoria.js",
          () => iniciarAuditoria()
        );

      }

      // CONFERÊNCIA
      if (pagina.includes("conferencia")) {

        carregarScriptPagina(
          "script-conferencia",
          "./js/conferencia.js",
          () => iniciarConferencia()
        );

      }

      // FORNECEDORES
      if (
        pagina.includes("fornecedores") &&
        typeof iniciarFornecedor === "function"
      ) {

        iniciarFornecedor();

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
        !pagina.includes("ajuste-estoque") &&
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

      // USUÁRIOS
      if (
        pagina.includes("usuarios.html") &&
        !pagina.includes("cadastro-usuario") &&
        typeof consultarUsuarios === "function"
      ) {

        consultarUsuarios();

      }

      // SETORES
      if (
        pagina.includes("setores") &&
        typeof carregarSetores === "function"
      ) {

        carregarSetores();

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
          <h1>❌ Erro ao carregar página</h1>
          <p>Não foi possível carregar o conteúdo solicitado.</p>
        </div>
      `;

    });

}

// ABRIR PÁGINA
function abrirPagina(pagina) {
  carregarPagina(pagina);
}

// PERMISSÕES DO MENU
function aplicarPermissoes() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuario) return;

  const permissoes = usuario.permissoes || [];

  if (!permissoes.includes("fornecedores")) {
    const menu = document.getElementById("menuFornecedores");
    if (menu) menu.style.display = "none";
  }

  if (!permissoes.includes("produtos")) {
    const menu = document.getElementById("menuProdutos");
    if (menu) menu.style.display = "none";
  }

  if (!permissoes.includes("funcionarios")) {
    const menu = document.getElementById("menuFuncionarios");
    if (menu) menu.style.display = "none";
  }
}

// LOGOUT
function configurarLogout() {
  const btnLogout = document.getElementById("btnLogout");

  if (!btnLogout) return;

  btnLogout.addEventListener("click", () => {
    const confirmar = confirm("Deseja sair do sistema?");

    if (!confirmar) return;

    localStorage.removeItem("usuarioLogado");
    window.location.href = "login.html";
  });
}

// CARREGAR USUÁRIO TOPO
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

// INICIAR SISTEMA
atualizarUsuarioTopo();
carregarUsuarioTopo();
configurarLogout();
aplicarPermissoes();