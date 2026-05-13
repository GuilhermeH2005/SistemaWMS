const formLogin = document.getElementById("formLogin");
const mensagemErro = document.getElementById("mensagemErro");

const senhaInput = document.getElementById("senha");
const toggleSenha = document.getElementById("toggleSenha");

// Mostrar / ocultar senha
toggleSenha.addEventListener("click", () => {
  if (senhaInput.type === "password") {
    senhaInput.type = "text";
    toggleSenha.textContent = "🙈";
  } else {
    senhaInput.type = "password";
    toggleSenha.textContent = "👁️";
  }
});

// LOGIN
formLogin.addEventListener("submit", async function(event) {
  event.preventDefault();

  mensagemErro.textContent = "";

  const usuarioDigitado = document.getElementById("usuario").value.trim();
  const senhaDigitada = document.getElementById("senha").value.trim();

  if (usuarioDigitado === "" || senhaDigitada === "") {
    mensagemErro.textContent = "Preencha usuário e senha.";
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        login: usuarioDigitado,
        senha: senhaDigitada
      })
    });

    const data = await res.json();

    if (!res.ok) {
      mensagemErro.textContent =
        data.mensagem || "Usuário ou senha inválidos.";
      return;
    }

    const usuarioLogado = {
  id: data.id,
  funcionario_id: data.funcionario_id,
  nomeCompleto: data.nomeCompleto,
  login: data.login,
  email: data.email,
  ultimoAcesso: data.ultimoAcesso,
  permissoes: data.permissoes || []
};

localStorage.setItem("usuarioLogado", JSON.stringify(usuarioLogado));

    localStorage.setItem(
      "usuarioLogado",
      JSON.stringify(usuarioLogado)
    );

    window.location.href = "index.html";

  } catch (err) {
    console.error("Erro no login:", err);
    mensagemErro.textContent = "Erro ao conectar com o servidor.";
  }
});