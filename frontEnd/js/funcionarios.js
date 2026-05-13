let editandoFuncionarioId = null;

function iniciarFuncionario() {
  const form = document.getElementById("formFuncionario");

  if (!form) return;

  aplicarMascarasFuncionario();


  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const funcionario = {
      nome: document.getElementById("nome").value,
      cpf: document.getElementById("cpf").value,
      rg: document.getElementById("rg").value,
      telefone: document.getElementById("telefone").value,
      email: document.getElementById("email").value,

      rua: document.getElementById("rua").value,
      numero: document.getElementById("numero").value,
      bairro: document.getElementById("bairro").value,
      cidade: document.getElementById("cidade").value,
      cep: document.getElementById("cep").value,

      data_admissao: converterDataParaBanco(
        document.getElementById("data_admissao").value
      )
    };

    try {
      let res;

      if (editandoFuncionarioId) {

        res = await fetch(
          `http://localhost:3000/funcionarios/${editandoFuncionarioId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(funcionario)
          }
        );

        const msg = await res.text();

        if (!res.ok) {
          alert(msg);
          return;
        }

        alert("Funcionário atualizado!");

        editandoFuncionarioId = null;

      } else {

        res = await fetch(
          "http://localhost:3000/funcionarios",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(funcionario)
          }
        );

        const msg = await res.text();

        if (!res.ok) {
          alert(msg);
          return;
        }

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

  const res =
    await fetch("http://localhost:3000/funcionarios");

  const funcionarios = await res.json();

  const lista =
    document.getElementById("listaFuncionarios");

  lista.innerHTML = "";

  funcionarios.forEach(f => {

    lista.innerHTML += `
      <li>

        <strong>${f.nome}</strong>

        <br>

        CPF: ${f.cpf || ""}
        | RG: ${f.rg || ""}

        <br>

        Telefone: ${f.telefone || ""}
        | E-mail: ${f.email || ""}

        <br>

        Endereço:
        ${f.rua || ""},
        ${f.numero || ""}
        -
        ${f.bairro || ""},
        ${f.cidade || ""}

        <br>

        CEP: ${f.cep || ""}

        <br>

        Admissão:
        ${formatarData(f.data_admissao)}

        <button onclick='editarFuncionario(${JSON.stringify(f)})'>
          ✏️ Editar
        </button>

        <button onclick="excluirFuncionario(${f.id})">
          🗑️ Excluir
        </button>

      </li>
    `;
  });
}

function editarFuncionario(f) {

  document.getElementById("nome").value =
    f.nome || "";

  document.getElementById("cpf").value =
    f.cpf || "";

  document.getElementById("rg").value =
    f.rg || "";

  document.getElementById("telefone").value =
    f.telefone || "";

  document.getElementById("email").value =
    f.email || "";

  document.getElementById("rua").value =
    f.rua || "";

  document.getElementById("numero").value =
    f.numero || "";

  document.getElementById("bairro").value =
    f.bairro || "";

  document.getElementById("cidade").value =
    f.cidade || "";

  document.getElementById("cep").value =
    f.cep || "";


  document.getElementById("data_admissao").value =
    formatarData(f.data_admissao);

  editandoFuncionarioId = f.id;
}

async function excluirFuncionario(id) {

  if (!confirm("Deseja excluir este funcionário?"))
    return;

  const res = await fetch(
    `http://localhost:3000/funcionarios/${id}`,
    {
      method: "DELETE"
    }
  );

  const msg = await res.text();

  if (!res.ok) {
    alert(msg);
    return;
  }

  carregarFuncionarios();
}

function aplicarMascarasFuncionario() {

  const cpf =
    document.getElementById("cpf");

  const telefone =
    document.getElementById("telefone");

  const cep =
    document.getElementById("cep");

  const dataAdmissao =
    document.getElementById("data_admissao");

  cpf.addEventListener("input", () => {

    let valor =
      cpf.value.replace(/\D/g, "");

    valor = valor.replace(
      /^(\d{3})(\d)/,
      "$1.$2"
    );

    valor = valor.replace(
      /^(\d{3})\.(\d{3})(\d)/,
      "$1.$2.$3"
    );

    valor = valor.replace(
      /\.(\d{3})(\d)/,
      ".$1-$2"
    );

    cpf.value = valor.substring(0, 14);

  });

  telefone.addEventListener("input", () => {

    let valor =
      telefone.value.replace(/\D/g, "");

    valor = valor.replace(
      /^(\d{2})(\d)/,
      "($1) $2"
    );

    valor = valor.replace(
      /(\d{5})(\d)/,
      "$1-$2"
    );

    telefone.value = valor.substring(0, 15);

  });

  cep.addEventListener("input", () => {

    let valor =
      cep.value.replace(/\D/g, "");

    valor = valor.replace(
      /^(\d{5})(\d)/,
      "$1-$2"
    );

    cep.value = valor.substring(0, 9);

  });

  dataAdmissao.addEventListener("input", () => {

    let valor =
      dataAdmissao.value.replace(/\D/g, "");

    valor = valor.replace(
      /^(\d{2})(\d)/,
      "$1/$2"
    );

    valor = valor.replace(
      /^(\d{2})\/(\d{2})(\d)/,
      "$1/$2/$3"
    );

    dataAdmissao.value = valor.substring(0, 10);

  });

}

function converterDataParaBanco(dataBR) {

  if (!dataBR) return null;

  const partes = dataBR.split("/");

  if (partes.length !== 3) return null;

  const dia = partes[0];
  const mes = partes[1];
  const ano = partes[2];

  return `${ano}-${mes}-${dia}`;
}

function formatarData(data) {

  if (!data) return "";

  const d = new Date(data);

  return d.toLocaleDateString("pt-BR");
}