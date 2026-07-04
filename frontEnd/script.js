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

const paginasSistema = [
  { nome: "Dashboard", pagina: "pages/dashboard.html" },
  { nome: "Fornecedores", pagina: "pages/fornecedores.html", permissao: "fornecedores" },
  { nome: "Entrada de Nota Fiscal", pagina: "pages/entrada.html", permissao: "entrada_mercadorias" },
  { nome: "Nota Fiscal / Saída", pagina: "pages/nota_fiscal.html", permissao: "nota_fiscal" },
  { nome: "Conferência", pagina: "pages/conferencia.html", permissao: "conferencia" },
  { nome: "Divergências", pagina: "pages/divergencias.html", permissao: "divergencias" },
  { nome: "Produtos", pagina: "pages/produtos.html", permissao: "produtos" },
  { nome: "Estoque", pagina: "pages/estoque.html", permissao: "estoque" },
  { nome: "Endereçamento", pagina: "pages/enderecamento.html", permissao: "enderecamento" },
  { nome: "Picking", pagina: "pages/picking.html", permissao: "picking" },
  { nome: "Clientes", pagina: "pages/clientes.html", permissao: "clientes" },
  { nome: "Pedidos", pagina: "pages/pedidos.html", permissao: "pedidos" },
  { nome: "Romaneio", pagina: "pages/romaneio.html", permissao: "romaneio" },
  { nome: "Relatórios", pagina: "pages/relatorios.html", permissao: "relatorios" },
  { nome: "Auditoria", pagina: "pages/auditoria.html", permissao: "auditoria" },
  { nome: "Usuários", pagina: "pages/usuarios.html", permissao: "usuarios" },
  { nome: "Funcionários", pagina: "pages/funcionarios.html", permissao: "funcionarios" }
];

function buscarTelaGlobal() {
  const termo = document.getElementById("buscaGlobal")?.value.toLowerCase().trim();
  const box = document.getElementById("resultadoBuscaGlobal");

  if (!box) return;

  if (!termo) {
    box.classList.add("hidden");
    box.innerHTML = "";
    return;
  }

  const resultados = paginasSistema.filter(p =>
    p.nome.toLowerCase().includes(termo)
  );

  if (resultados.length === 0) {
    box.innerHTML = `<div class="item-busca-global">Nenhuma tela encontrada</div>`;
    box.classList.remove("hidden");
    return;
  }

  box.innerHTML = resultados.map(p => `
    <div class="item-busca-global" onclick="abrirResultadoBusca('${p.pagina}', '${p.permissao || ""}')">
      ${p.nome}
    </div>
  `).join("");

  box.classList.remove("hidden");
}

function abrirResultadoBusca(pagina, permissao) {
  document.getElementById("resultadoBuscaGlobal")?.classList.add("hidden");
  document.getElementById("buscaGlobal").value = "";

  carregarPagina(pagina, permissao || undefined);
}

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

  const usuario =
    JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuario) return;

  // ADMINISTRADOR TEM ACESSO TOTAL
  if (usuario.login === "admin") {
    return;
  }

  const permissoes =
    usuario.permissoes || [];

  // TODOS OS ITENS QUE POSSUEM DATA-PERMISSAO
  document
    .querySelectorAll("[data-permissao]")
    .forEach(item => {

      const permissao =
        item.getAttribute("data-permissao");

      if (!permissoes.includes(permissao)) {
        item.style.display = "none";
      }

    });

  // ESCONDER MENUS VAZIOS
  document
    .querySelectorAll(".has-submenu")
    .forEach(menu => {

      const itensVisiveis =
        [...menu.querySelectorAll(".submenu li")]
          .filter(item =>
            item.style.display !== "none"
          );

      if (itensVisiveis.length === 0) {
        menu.style.display = "none";
      }

    });

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

document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuario) {
    window.location.href = "login.html";
    return;
  }

  carregarPagina("pages/dashboard.html", "dashboard");
});

// INICIAR SISTEMA
atualizarUsuarioTopo();
carregarUsuarioTopo();
configurarLogout();
aplicarPermissoes();