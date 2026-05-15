function iniciarConfiguracoes() {

  const usuarioLogado =
    JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuarioLogado) {
    return;
  }

  document.getElementById("configLogin").value =
    usuarioLogado.login || "";

  const form =
    document.getElementById("formConfiguracoes");

  form.onsubmit = function(event) {

    event.preventDefault();

    const senhaAtual =
      document.getElementById("senhaAtual").value;

    const novaSenha =
      document.getElementById("novaSenha").value;

    const confirmarSenha =
      document.getElementById("confirmarSenha").value;

    // SENHA ATUAL

    if (senhaAtual !== usuarioLogado.senha) {

      alert("Senha atual incorreta.");

      return;

    }

    // CONFIRMAÇÃO

    if (novaSenha !== confirmarSenha) {

      alert("As senhas não coincidem.");

      return;

    }

    // SENHA FORTE

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

    // ALTERAR SENHA

    usuarioLogado.senha = novaSenha;

    localStorage.setItem(
      "usuarioLogado",
      JSON.stringify(usuarioLogado)
    );

    const usuarios =
      JSON.parse(localStorage.getItem("usuarios")) || [];

    const indice =
      usuarios.findIndex(usuario =>
        usuario.login === usuarioLogado.login
      );

    if (indice !== -1) {

      usuarios[indice].senha = novaSenha;

      localStorage.setItem(
        "usuarios",
        JSON.stringify(usuarios)
      );

    }

    alert("Senha alterada com sucesso!");

    form.reset();

  };

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