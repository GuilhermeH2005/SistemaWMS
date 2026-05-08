let editandoFuncionarioId = null;

function iniciarFuncionario() {
  const form = document.getElementById("formFuncionario");

  if (!form) return;

  aplicarMascarasFuncionario();
  configurarDescricaoCargo();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const funcionario = {
      nome: document.getElementById("nome").value,
      cpf: document.getElementById("cpf").value,
      telefone: document.getElementById("telefone").value,
      email: document.getElementById("email").value,
      cargo: document.getElementById("cargo").value
    };

    try {
      if (editandoFuncionarioId) {
        await fetch(`http://localhost:3000/funcionarios/${editandoFuncionarioId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(funcionario)
        });

        alert("Funcionário atualizado!");
        editandoFuncionarioId = null;
      } else {
        await fetch("http://localhost:3000/funcionarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(funcionario)
        });

        alert("Funcionário cadastrado!");
      }

      form.reset();
      carregarFuncionarios();

    } catch (err) {
      console.error(err);
      alert("Erro ao salvar funcionário");
    }
  });

  carregarFuncionarios();
}

async function carregarFuncionarios() {
  const res = await fetch("http://localhost:3000/funcionarios");
  const funcionarios = await res.json();

  const lista = document.getElementById("listaFuncionarios");
  lista.innerHTML = "";

  funcionarios.forEach(f => {
    lista.innerHTML += `
      <li>
        <strong>${f.nome}</strong> - ${f.cargo || ""}
        <br>
        CPF: ${f.cpf || ""} | Telefone: ${f.telefone || ""}
        <br>
        E-mail: ${f.email || ""}

        <button onclick='editarFuncionario(${JSON.stringify(f)})'>✏️ Editar</button>
        <button onclick="excluirFuncionario(${f.id})">❌ Excluir</button>
      </li>
    `;
  });
}

function editarFuncionario(f) {
  document.getElementById("nome").value = f.nome || "";
  document.getElementById("cpf").value = f.cpf || "";
  document.getElementById("telefone").value = f.telefone || "";
  document.getElementById("email").value = f.email || "";
  document.getElementById("cargo").value = f.cargo || "";

  editandoFuncionarioId = f.id;
}

async function excluirFuncionario(id) {
  if (!confirm("Deseja excluir este funcionário?")) return;

  await fetch(`http://localhost:3000/funcionarios/${id}`, {
    method: "DELETE"
  });

  carregarFuncionarios();
}

function aplicarMascarasFuncionario() {
  const cpf = document.getElementById("cpf");
  const telefone = document.getElementById("telefone");

  cpf.addEventListener("input", () => {
    let valor = cpf.value.replace(/\D/g, "");

    valor = valor.replace(/^(\d{3})(\d)/, "$1.$2");
    valor = valor.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    valor = valor.replace(/\.(\d{3})(\d)/, ".$1-$2");

    cpf.value = valor.substring(0, 14);
  });

  telefone.addEventListener("input", () => {
    let valor = telefone.value.replace(/\D/g, "");

    valor = valor.replace(/^(\d{2})(\d)/, "($1) $2");
    valor = valor.replace(/(\d{5})(\d)/, "$1-$2");

    telefone.value = valor.substring(0, 15);
  });
}

function configurarDescricaoCargo() {
  const cargo = document.getElementById("cargo");
  const descricao = document.getElementById("descricaoCargo");

  if (!cargo || !descricao) return;

  cargo.addEventListener("change", () => {
    switch (cargo.value) {
      case "Administrador":
        descricao.innerHTML = `
          <strong>Permissões do Administrador:</strong>
          ✔ Acesso total ao sistema<br>
          ✔ Cadastros<br>
          ✔ Estoque<br>
          ✔ Relatórios<br>
          ✔ Usuários e permissões
        `;
        break;

      case "Gerente":
        descricao.innerHTML = `
          <strong>Permissões do Gerente:</strong>
          ✔ Estoque<br>
          ✔ Relatórios<br>
          ✔ Funcionários<br>
          ✔ Entrada e saída
        `;
        break;

      case "Operador":
        descricao.innerHTML = `
          <strong>Permissões do Operador:</strong>
          ✔ Entrada de mercadorias<br>
          ✔ Estoque
        `;
        break;

      case "Conferente":
        descricao.innerHTML = `
          <strong>Permissões do Conferente:</strong>
          ✔ Conferência de entrada<br>
          ✔ Conferência de saída
        `;
        break;

      case "Separador":
        descricao.innerHTML = `
          <strong>Permissões do Separador:</strong>
          ✔ Picking<br>
          ✔ Separação de pedidos
        `;
        break;

      case "Estoquista":
        descricao.innerHTML = `
          <strong>Permissões do Estoquista:</strong>
          ✔ Controle de estoque<br>
          ✔ Entrada de mercadorias<br>
          ✔ Ajustes de estoque
        `;
        break;

      case "Supervisor":
        descricao.innerHTML = `
          <strong>Permissões do Supervisor:</strong>
          ✔ Estoque<br>
          ✔ Entrada e saída<br>
          ✔ Relatórios<br>
          ✔ Auditoria
        `;
        break;

      default:
        descricao.innerHTML = "Selecione um cargo";
    }
  });
}