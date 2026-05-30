var editandoId = null;

function iniciarFornecedor() {
  const form = document.getElementById("formFornecedor");

  if (!form) return;

  aplicarMascaras();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fornecedor = {
      nome: document.getElementById("nome").value,
      cnpj: document.getElementById("cnpj").value,
      telefone: document.getElementById("telefone").value,
      email: document.getElementById("email").value,
      rua: document.getElementById("rua").value,
      numero: document.getElementById("numero").value,
      bairro: document.getElementById("bairro").value,
      cidade: document.getElementById("cidade").value,
      cep: document.getElementById("cep").value,
      inscricao_estadual: document.getElementById("inscricao_estadual").value
    };

   try {
  let res;

  if (editandoId) {
    res = await fetch(`http://localhost:3000/fornecedores/${editandoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
    ...fornecedor,
    ...getUsuarioAuditoria()
  })


    });
  } else {
    res = await fetch("http://localhost:3000/fornecedores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
    ...fornecedor,
    ...getUsuarioAuditoria()
  })

    });
  }

  const msg = await res.text();

  if (!res.ok) {
    alert(msg);
    return;
  }

  if (editandoId) {
    alert("Fornecedor atualizado!");
    editandoId = null;
  } else {
    alert("Fornecedor cadastrado!");
  }

  form.reset();
  carregarLista();

} catch (err) {
  console.error("Erro:", err);
  alert("Erro ao salvar fornecedor");
}
  });

  carregarLista();
}

async function carregarLista() {
  const res = await fetch("http://localhost:3000/fornecedores");
  const dados = await res.json();

  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  dados.forEach(f => {
    lista.innerHTML += `
      <li>
        <div class="fornecedor-topo">
          <strong>${f.nome}</strong>
          <span>CNPJ: ${f.cnpj || "-"}</span>
        </div>

        <div class="fornecedor-grid">
          <div>
            <span>Telefone</span>
            <strong>${f.telefone || "-"}</strong>
          </div>

          <div>
            <span>Email</span>
            <strong>${f.email || "-"}</strong>
          </div>

          <div>
            <span>Inscrição Estadual</span>
            <strong>${f.inscricao_estadual || "-"}</strong>
          </div>

          <div>
            <span>CEP</span>
            <strong>${f.cep || "-"}</strong>
          </div>

          <div>
            <span>Rua</span>
            <strong>${f.rua || "-"}</strong>
          </div>

          <div>
            <span>Número</span>
            <strong>${f.numero || "-"}</strong>
          </div>

          <div>
            <span>Bairro</span>
            <strong>${f.bairro || "-"}</strong>
          </div>

          <div>
            <span>Cidade</span>
            <strong>${f.cidade || "-"}</strong>
          </div>
        </div>

        <div class="acoes-fornecedor">
          <button onclick='editarFornecedor(${JSON.stringify(f)})'>
            ✏️ Editar
          </button>

          <button onclick="excluir(${f.id})">
            🗑️ Excluir
          </button>
        </div>
      </li>
    `;
  });
}

function editarFornecedor(f) {
  document.getElementById("nome").value = f.nome || "";
  document.getElementById("cnpj").value = f.cnpj || "";
  document.getElementById("telefone").value = f.telefone || "";
  document.getElementById("email").value = f.email || "";
  document.getElementById("rua").value = f.rua || "";
  document.getElementById("numero").value = f.numero || "";
  document.getElementById("bairro").value = f.bairro || "";
  document.getElementById("cidade").value = f.cidade || "";
  document.getElementById("cep").value = f.cep || "";
  document.getElementById("inscricao_estadual").value = f.inscricao_estadual || "";

  editandoId = f.id;
}

async function excluir(id) {
  if (!confirm("Deseja excluir este fornecedor?")) return;

  await fetch(`http://localhost:3000/fornecedores/${id}`, {
    method: "DELETE",

      headers: {
    "Content-Type": "application/json"
  },

    body: JSON.stringify({
    ...getUsuarioAuditoria()
  })
  });

  carregarLista();
}

function aplicarMascaras() {
  const cnpj = document.getElementById("cnpj");
  const telefone = document.getElementById("telefone");
  const cep = document.getElementById("cep");

  cnpj.addEventListener("input", () => {
    let valor = cnpj.value.replace(/\D/g, "");

    valor = valor.replace(/^(\d{2})(\d)/, "$1.$2");
    valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    valor = valor.replace(/\.(\d{3})(\d)/, ".$1/$2");
    valor = valor.replace(/(\d{4})(\d)/, "$1-$2");

    cnpj.value = valor.substring(0, 18);
  });

  telefone.addEventListener("input", () => {
    let valor = telefone.value.replace(/\D/g, "");

    valor = valor.replace(/^(\d{2})(\d)/, "($1) $2");
    valor = valor.replace(/(\d{5})(\d)/, "$1-$2");

    telefone.value = valor.substring(0, 15);
  });

  cep.addEventListener("input", () => {
    let valor = cep.value.replace(/\D/g, "");

    valor = valor.replace(/^(\d{5})(\d)/, "$1-$2");

    cep.value = valor.substring(0, 9);
  });
}