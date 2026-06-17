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

function carregarScriptPagina(idScript, caminhoScript, callback) {
  const scriptAntigo = document.getElementById(idScript);

  if (scriptAntigo) {
    scriptAntigo.remove();
  }

  const script = document.createElement("script");

  script.id = idScript;
  script.src = caminhoScript;
  script.defer = true;

  script.onload = () => {
    if (typeof callback === "function") {
      callback();
    }
  };

  script.onerror = () => {
    console.error(`Erro ao carregar script: ${caminhoScript}`);
  };

  document.body.appendChild(script);
}

function carregarPagina(pagina, permissaoNecessaria) {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuario) {
    window.location.href = "login.html";
    return;
  }

  const permissoes = usuario.permissoes || [];

  if (permissaoNecessaria && !permissoes.includes(permissaoNecessaria)) {
    alert("Você não possui permissão para acessar esta página ❌");
    return;
  }

  fetch(pagina)
    .then(res => {
      if (!res.ok) {
        throw new Error("Página não encontrada");
      }

      return res.text();
    })
    .then(html => {
      const content = document.querySelector(".content");

      if (!content) {
        console.error("Elemento .content não encontrado");
        return;
      }

      content.innerHTML = html;

      if (pagina.includes("dashboard.html")) {
        carregarScriptPagina(
          "script-dashboard",
          "./js/dashboard.js",
          () => iniciarDashboard()
        );
      }

      if (pagina.includes("produtos.html")) {
        carregarScriptPagina(
          "script-produtos",
          "./js/produtos.js",
          () => iniciarProduto()
        );
      }

      if (pagina.includes("fornecedores.html")) {
        carregarScriptPagina(
          "script-fornecedores",
          "./js/fornecedores.js",
          () => iniciarFornecedor()
        );
      }

      if (pagina.includes("entrada.html")) {
        carregarScriptPagina(
          "script-entrada",
          "./js/entrada.js",
          () => iniciarEntrada()
        );
      }

      if (
        pagina.includes("estoque.html") &&
        !pagina.includes("ajuste-estoque.html")
      ) {
        carregarScriptPagina(
          "script-estoque",
          "./js/estoque.js",
          () => iniciarEstoque()
        );
      }

      if (pagina.includes("ajuste-estoque.html")) {
        carregarScriptPagina(
          "script-ajuste-estoque",
          "./js/ajuste-estoque.js",
          () => iniciarAjusteEstoque()
        );
      }

      if (pagina.includes("alerta_min.html")) {
        carregarScriptPagina(
          "script-alerta-min",
          "./js/alerta_min.js",
          () => iniciarAlertas()
        );
      }

      if (pagina.includes("conferencia.html")) {
        carregarScriptPagina(
          "script-conferencia",
          "./js/conferencia.js",
          () => iniciarConferencia()
        );
      }

      if (pagina.includes("divergencias.html")) {
        carregarScriptPagina(
          "script-divergencias",
          "./js/divergencias.js",
          () => iniciarDivergencias()
        );
      }

      if (pagina.includes("enderecamento.html")) {
        carregarScriptPagina(
          "script-enderecamento",
          "./js/enderecamento.js",
          () => iniciarEnderecamento()
        );
      }

      if (pagina.includes("posicoes.html")) {
        carregarScriptPagina(
          "script-posicoes",
          "./js/posicoes.js",
          () => iniciarPosicoes()
        );
      }

      if (pagina.includes("clientes.html")) {
        carregarScriptPagina(
          "script-clientes",
          "./js/clientes.js",
          () => iniciarClientes()
        );
      }

      if (pagina.includes("pedidos.html")) {
        carregarScriptPagina(
          "script-pedidos",
          "./js/pedidos.js",
          () => iniciarPedidos()
        );
      }

      if (pagina.includes("picking.html")) {
        carregarScriptPagina(
          "script-picking",
          "./js/picking.js",
          () => iniciarPicking()
        );
      }

      if (pagina.includes("romaneio.html")) {
        carregarScriptPagina(
          "script-romaneio",
          "./js/romaneio.js",
          () => iniciarRomaneio()
        );
      }

      if (pagina.includes("nota_fiscal.html")) {
        carregarScriptPagina(
          "script-nota-fiscal",
          "./js/nota_fiscal.js",
          () => iniciarNotaFiscal()
        );
      }

      if (pagina.includes("funcionarios.html")) {
        carregarScriptPagina(
          "script-funcionarios",
          "./js/funcionarios.js",
          () => iniciarFuncionario()
        );
      }

      if (
        pagina.includes("usuarios.html") &&
        !pagina.includes("cadastro-usuario.html")
      ) {
        carregarScriptPagina(
          "script-usuarios",
          "./js/usuarios.js",
          () => consultarUsuarios()
        );
      }

      if (pagina.includes("cadastro-usuario.html")) {
        carregarScriptPagina(
          "script-cadastro-usuario",
          "./js/cadastro-usuario.js",
          () => iniciarCadastroUsuario()
        );
      }

      if (pagina.includes("setores.html")) {
        carregarScriptPagina(
          "script-setores",
          "./js/setores.js",
          () => carregarSetores()
        );
      }

      if (pagina.includes("auditoria.html")) {
        carregarScriptPagina(
          "script-auditoria",
          "./js/auditoria.js",
          () => iniciarAuditoria()
        );
      }

      if (pagina.includes("configuracoes-gerais.html")) {
        carregarScriptPagina(
          "script-configuracoes-gerais",
          "./js/configuracoes-gerais.js",
          () => iniciarConfiguracoesGerais()
        );
      }

      if (pagina.includes("trocar_senha.html")) {
        carregarScriptPagina(
          "script-trocar-senha",
          "./js/trocar_senha.js",
          () => iniciarTrocarSenha()
        );
      }

      if (pagina.includes("cores.html")) {
        carregarScriptPagina(
          "script-cores",
          "./js/cores.js",
          () => iniciarCores()
        );
      }

      if (pagina.includes("cargos.html")) {
        carregarScriptPagina(
          "script-cargos",
          "./js/cargos.js",
          () => iniciarCargos()
        );
      }

      if (pagina.includes("categorias.html")) {
        carregarScriptPagina(
          "script-categorias",
          "./js/categorias.js",
          () => iniciarCategorias()
        );
      }
    })
    .catch(erro => {
      console.error("Erro ao carregar página:", erro);

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

function getUsuarioAuditoria() {
  const usuarioLogado =
    JSON.parse(localStorage.getItem("usuarioLogado"));

  return {
    usuario_id: usuarioLogado?.id || null,
    usuario_nome:
      usuarioLogado?.nomeCompleto ||
      usuarioLogado?.nome ||
      usuarioLogado?.login ||
      "Sistema"
  };
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