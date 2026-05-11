const formLogin =
  document.getElementById("formLogin");

const mensagemErro =
  document.getElementById("mensagemErro");

formLogin.addEventListener("submit", function(event) {

  event.preventDefault();

  const usuarioDigitado =
    document.getElementById("usuario")
      .value
      .trim();

  const senhaDigitada =
    document.getElementById("senha")
      .value
      .trim();

  if (
    usuarioDigitado === "" ||
    senhaDigitada === ""
  ) {

    mensagemErro.textContent =
      "Preencha usuário e senha.";

    return;

  }

  if (
    usuarioDigitado === "admin" &&
    senhaDigitada === "Admin12@"
  ) {

    const admin = {

      nomeCompleto: "Administrador",

      login: "admin",

      senha: "Admin12@",

      email: "admin@lglogistica.com",

      setor: "Administrativo",

      situacao: "ATIVO",

      ultimoAcesso:
        new Date().toLocaleDateString("pt-BR") +
        " " +
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit"
        }),

      permissoes: [

        "dashboard",
        "fornecedores",
        "produtos",
        "entrada_mercadorias",
        "saida_mercadorias",
        "movimentacoes",
        "inventario",
        "conferencia",
        "armazenagem",
        "enderecamento",
        "cubagem",
        "fifo",
        "estoque",
        "alerta_estoque",
        "ajustes_estoque",
        "balanceamento",
        "picking",
        "expedicao",
        "romaneio",
        "nota_fiscal",
        "relatorios",
        "auditoria",
        "funcionarios",
        "usuarios",
        "setores",
        "configuracoes"

      ]

    };

    localStorage.setItem(
      "adminUltimoAcesso",
      admin.ultimoAcesso
    );

    localStorage.setItem(
      "usuarioLogado",
      JSON.stringify(admin)
    );

    window.location.href =
      "index.html";

    return;

  }

  const usuarios =
    JSON.parse(localStorage.getItem("usuarios")) || [];

  const usuarioEncontrado =
    usuarios.find(usuario => {

      return (
        usuario.login === usuarioDigitado &&
        usuario.senha === senhaDigitada
      );

    });

  if (!usuarioEncontrado) {

    mensagemErro.textContent =
      "Usuário ou senha inválidos.";

    return;

  }

  if (usuarioEncontrado.situacao === "INATIVO") {

    mensagemErro.textContent =
      "Usuário inativo.";

    return;

  }

  usuarioEncontrado.ultimoAcesso =
    new Date().toLocaleDateString("pt-BR") +
    " " +
    new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });

  localStorage.setItem(
    "usuarios",
    JSON.stringify(usuarios)
  );

  localStorage.setItem(
    "usuarioLogado",
    JSON.stringify(usuarioEncontrado)
  );

  window.location.href =
    "index.html";

});