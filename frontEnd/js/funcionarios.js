var editandoFuncionarioId = null;

function iniciarFuncionario() {
  const form = document.getElementById("formFuncionario");

  if (!form) return;

  aplicarMascarasFuncionario();
  carregarCargosFuncionario();


  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const funcionario = {
      nome: document.getElementById("nome").value,
      cpf: document.getElementById("cpf").value,
      rg: document.getElementById("rg").value,
      telefone: document.getElementById("telefone").value,
      email: document.getElementById("email").value,
      cargo_id: document.getElementById("cargo_id").value,

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
             body: JSON.stringify({
    ...funcionario,
    ...getUsuarioAuditoria()
  })


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
              body: JSON.stringify({
    ...funcionario,
    ...getUsuarioAuditoria()
  })

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

      limparBuscaFuncionarios();

    } catch (err) {

      console.error(err);

      alert("Erro ao salvar funcionário");

    }

  });

  limparBuscaFuncionarios();
}

async function carregarCargosFuncionario() {
  const select = document.getElementById("cargo_id");

  if (!select) return;

  const res = await fetch("http://localhost:3000/cargos");
  const cargos = await res.json();

  select.innerHTML = `<option value="">Selecione o cargo</option>`;

  cargos.forEach(c => {
    select.innerHTML += `
      <option value="${c.id}">
        ${c.nome}
      </option>
    `;
  });
}

async function carregarFuncionarios() {
  try {
    const id = document.getElementById("buscarFuncionarioId")?.value.trim() || "";
    const nome = document.getElementById("buscarFuncionarioNome")?.value.trim() || "";
    const cpf = document.getElementById("buscarFuncionarioCpf")?.value.trim() || "";

    const lista = document.getElementById("listaFuncionarios");
    if (!lista) return;

    const params = new URLSearchParams();

    if (id) params.append("id", id);
    if (nome) params.append("nome", nome);
    if (cpf) params.append("cpf", cpf);

    if (!id && !nome && !cpf) {
      const confirmar = confirm(
        "Você não informou nenhum filtro.\n\nDeseja listar os 50 primeiros funcionários?"
      );

      if (!confirmar) {
        limparBuscaFuncionarios();
        return;
      }

      params.append("listarTodos", "true");
      params.append("limite", "50");
    }

    const res = await fetch(
      `http://localhost:3000/funcionarios?${params.toString()}`
    );

    if (!res.ok) {
      alert(await res.text());
      return;
    }

    const funcionarios = await res.json();
    console.log(funcionarios);

    lista.innerHTML = "";

    if (funcionarios.length === 0) {
      lista.innerHTML = `
        <li class="sem-registro">
          Nenhum funcionário encontrado.
        </li>
      `;
      return;
    }

    funcionarios.forEach(f => {
      lista.innerHTML += `
        <li>
          <div class="funcionario-topo">
            <strong>${f.nome}</strong>
            <span>ID: ${f.id}</span>
          </div>

          <div class="funcionario-grid">
            <div><span>CPF</span><strong>${f.cpf || "-"}</strong></div>
            <div><span>RG</span><strong>${f.rg || "-"}</strong></div>
            <div><span>Telefone</span><strong>${f.telefone || "-"}</strong></div>
            <div><span>Email</span><strong>${f.email || "-"}</strong></div>
            <div><span>Cargo</span><strong>${f.cargo_nome || "-"}</strong></div>
            <div><span>Rua</span><strong>${f.rua || "-"}</strong></div>
            <div><span>Número</span><strong>${f.numero || "-"}</strong></div>
            <div><span>Bairro</span><strong>${f.bairro || "-"}</strong></div>
            <div><span>Cidade</span><strong>${f.cidade || "-"}</strong></div>
          </div>

          <div class="acoes-funcionario">
            <button onclick='editarFuncionario(${JSON.stringify(f)})'>✏️ Editar</button>
            <button onclick="excluirFuncionario(${f.id})">🗑️ Excluir</button>
          </div>
        </li>
      `;
    });

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar funcionários.");
  }
}

function limparBuscaFuncionarios() {
  document.getElementById("buscarFuncionarioId").value = "";
  document.getElementById("buscarFuncionarioNome").value = "";
  document.getElementById("buscarFuncionarioCpf").value = "";

  const lista = document.getElementById("listaFuncionarios");

  if (lista) {
    lista.innerHTML = `
      <li class="sem-registro">
        Digite ID, nome ou CPF para pesquisar funcionários.
      </li>
    `;
  }
}

async function carregarCargosFuncionario() {
  const res = await fetch("http://localhost:3000/cargos");

  const cargos = await res.json();

  const select = document.getElementById("cargo_id");

  select.innerHTML = `
    <option value="">
      Selecione o cargo
    </option>
  `;

  cargos.forEach(c => {
    select.innerHTML += `
      <option value="${c.id}">
        ${c.nome}
      </option>
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

  document.getElementById("cargo_id").value =
   f.cargo_id || "";

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
  if (!confirm("Deseja excluir este funcionário?")) return;

  try {
    const res = await fetch(`http://localhost:3000/funcionarios/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...getUsuarioAuditoria()
      })
    });

    const msg = await res.text();

    if (!res.ok) {
      alert(msg);
      return;
    }

    alert(msg || "Funcionário excluído com sucesso ✅");

    const lista = document.getElementById("listaFuncionarios");
    if (lista) {
      lista.innerHTML = `
        <li class="sem-registro">
          Carregando os 50 primeiros funcionários...
        </li>
      `;
    }

    document.getElementById("buscarFuncionarioId").value = "";
    document.getElementById("buscarFuncionarioNome").value = "";
    document.getElementById("buscarFuncionarioCpf").value = "";

    const resLista = await fetch(
      "http://localhost:3000/funcionarios?listarTodos=true&limite=50"
    );

    const funcionarios = await resLista.json();

    renderizarFuncionarios(funcionarios);

  } catch (err) {
    console.error(err);
    alert("Erro ao excluir funcionário.");
  }
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

function renderizarFuncionarios(funcionarios) {
  const lista = document.getElementById("listaFuncionarios");
  if (!lista) return;

  lista.innerHTML = "";

  if (funcionarios.length === 0) {
    lista.innerHTML = `
      <li class="sem-registro">
        Nenhum funcionário encontrado.
      </li>
    `;
    return;
  }

  funcionarios.forEach(f => {
    lista.innerHTML += `
      <li>
        <div class="funcionario-topo">
          <strong>${f.nome}</strong>
          <span>ID: ${f.id}</span>
        </div>

        <div class="funcionario-grid">
          <div><span>CPF</span><strong>${f.cpf || "-"}</strong></div>
          <div><span>RG</span><strong>${f.rg || "-"}</strong></div>
          <div><span>Telefone</span><strong>${f.telefone || "-"}</strong></div>
          <div><span>Email</span><strong>${f.email || "-"}</strong></div>
          <div><span>Cargo</span><strong>${f.cargo_nome || "-"}</strong></div>
          <div><span>Rua</span><strong>${f.rua || "-"}</strong></div>
          <div><span>Número</span><strong>${f.numero || "-"}</strong></div>
          <div><span>Bairro</span><strong>${f.bairro || "-"}</strong></div>
          <div><span>Cidade</span><strong>${f.cidade || "-"}</strong></div>
        </div>

        <div class="acoes-funcionario">
          <button onclick='editarFuncionario(${JSON.stringify(f)})'>✏️ Editar</button>
          <button onclick="excluirFuncionario(${f.id})">🗑️ Excluir</button>
        </div>
      </li>
    `;
  });
}