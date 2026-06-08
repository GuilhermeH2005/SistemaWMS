async function iniciarTrocarSenha() {
  const usuarioLogado =
    JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuarioLogado) {
    window.location.href = "login.html";
    return;
  }

  await carregarDadosUsuarioSenha(usuarioLogado.id);

  const form = document.getElementById("formConfiguracoes");

  if (!form) return;

  form.onsubmit = async function(event) {
    event.preventDefault();

    const novaSenha =
      document.getElementById("senha").value;

    const confirmarSenha =
      document.getElementById("confirmar_senha").value;

    if (!novaSenha || !confirmarSenha) {
      alert("Preencha a nova senha e a confirmação.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      alert("As senhas não coincidem.");
      return;
    }

    const senhaForte =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;

    if (!senhaForte.test(novaSenha)) {
      alert(
        "A nova senha deve conter:\n\n" +
        "- Pelo menos 8 caracteres\n" +
        "- Uma letra maiúscula\n" +
        "- Um número\n" +
        "- Um caractere especial"
      );
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3000/usuarios/${usuarioLogado.id}/trocar-senha`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            novaSenha
          })
        }
      );

      const msg = await res.text();

      if (!res.ok) {
        alert(msg);
        return;
      }

      alert(msg);

      document.getElementById("senha").value = "";
      document.getElementById("confirmar_senha").value = "";

      await carregarDadosUsuarioSenha(usuarioLogado.id);

    } catch (err) {
      console.error(err);
      alert("Erro ao alterar senha.");
    }
  };
}

async function carregarDadosUsuarioSenha(id) {
  try {
    const res = await fetch(
      `http://localhost:3000/usuarios/${id}/dados-senha`
    );

    const dados = await res.json();

    if (!res.ok) {
      alert("Erro ao carregar dados do usuário.");
      return;
    }

    document.getElementById("configLogin").value =
      dados.login || "";

    document.getElementById("senhaAtual").value =
      dados.senha || "";

  } catch (err) {
    console.error(err);
    alert("Erro ao buscar dados do usuário.");
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