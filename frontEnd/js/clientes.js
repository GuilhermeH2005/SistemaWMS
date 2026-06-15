function iniciarClientes() {
  const form = document.getElementById("formCliente");

  if (!form) return;

  aplicarMascarasCliente();
  carregarClientes();

  form.onsubmit = async function(e) {
    e.preventDefault();

    const id = document.getElementById("cliente_id").value;

    const cliente = {
      razao_social: document.getElementById("razao_social").value.trim(),
      nome_fantasia: document.getElementById("nome_fantasia").value.trim(),
      cnpj: document.getElementById("cnpj").value.trim(),
      inscricao_estadual: document.getElementById("inscricao_estadual").value.trim(),
      telefone: document.getElementById("telefone").value.trim(),
      email: document.getElementById("email").value.trim(),
      cep: document.getElementById("cep").value.trim(),
      rua: document.getElementById("rua").value.trim(),
      numero: document.getElementById("numero").value.trim(),
      bairro: document.getElementById("bairro").value.trim(),
      cidade: document.getElementById("cidade").value.trim(),
      estado: document.getElementById("estado").value.trim().toUpperCase(),
      ativo: "S",
      ...getUsuarioAuditoria()
    };

    const campoAtivo = document.getElementById("ativo");

    if (campoAtivo) {
      cliente.ativo = campoAtivo.value;
    }

    if (!cliente.razao_social || !cliente.cnpj) {
      alert("Informe razão social e CNPJ.");
      return;
    }

    const url = id
      ? `http://localhost:3000/clientes/${id}`
      : "http://localhost:3000/clientes";

    const metodo = id ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(cliente)
      });

      const msg = await res.text();

      if (!res.ok) {
        alert(msg);
        return;
      }

      alert(msg);

      limparFormularioCliente();
      carregarClientes();

    } catch (err) {
      console.error(err);
      alert("Erro ao salvar cliente.");
    }
  };
}

async function carregarClientes() {
  const busca =
    document.getElementById("buscarCliente")?.value || "";

  try {
    const res = await fetch(
      `http://localhost:3000/clientes?busca=${encodeURIComponent(busca)}`
    );

    const clientes = await res.json();

    const tbody = document.getElementById("tabelaClientes");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (clientes.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">Nenhum cliente encontrado.</td>
        </tr>
      `;
      return;
    }

    clientes.forEach(cliente => {
      tbody.innerHTML += `
        <tr>
          <td>${cliente.id}</td>
          <td>${cliente.razao_social}</td>
          <td>${cliente.nome_fantasia || "-"}</td>
          <td>${cliente.cnpj}</td>
          <td>${cliente.cidade || "-"}</td>
          <td>
            <span class="${cliente.ativo === "S" ? "status-ativo" : "status-inativo"}">
              ${cliente.ativo === "S" ? "Ativo" : "Inativo"}
            </span>
          </td>
          <td>
            <button type="button" onclick='editarCliente(${JSON.stringify(cliente)})'>
              Editar
            </button>

            <button type="button" onclick="desativarCliente(${cliente.id})">
              Desativar
            </button>
          </td>
        </tr>
      `;
    });

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar clientes.");
  }
}

function editarCliente(cliente) {
  document.getElementById("cliente_id").value = cliente.id;
  document.getElementById("razao_social").value = cliente.razao_social || "";
  document.getElementById("nome_fantasia").value = cliente.nome_fantasia || "";
  document.getElementById("cnpj").value = cliente.cnpj || "";
  document.getElementById("inscricao_estadual").value = cliente.inscricao_estadual || "";
  document.getElementById("telefone").value = cliente.telefone || "";
  document.getElementById("email").value = cliente.email || "";
  document.getElementById("cep").value = cliente.cep || "";
  document.getElementById("rua").value = cliente.rua || "";
  document.getElementById("numero").value = cliente.numero || "";
  document.getElementById("bairro").value = cliente.bairro || "";
  document.getElementById("cidade").value = cliente.cidade || "";
  document.getElementById("estado").value = cliente.estado || "";

  mostrarCampoStatusCliente();

  const campoAtivo = document.getElementById("ativo");

  if (campoAtivo) {
    campoAtivo.value = cliente.ativo || "S";
  }

  const btnSalvar = document.querySelector(".btn-salvar");

  if (btnSalvar) {
    btnSalvar.textContent = "Atualizar Cliente";
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function mostrarCampoStatusCliente() {
  const statusBox = document.getElementById("campoStatusCliente");

  if (statusBox) {
    statusBox.style.display = "flex";
  }
}

function ocultarCampoStatusCliente() {
  const statusBox = document.getElementById("campoStatusCliente");

  if (statusBox) {
    statusBox.style.display = "none";
  }
}

async function desativarCliente(id) {
  const confirmar =
    confirm("Deseja realmente desativar este cliente?");

  if (!confirmar) return;

  try {
    const res = await fetch(
      `http://localhost:3000/clientes/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(getUsuarioAuditoria())
      }
    );

    const msg = await res.text();

    if (!res.ok) {
      alert(msg);
      return;
    }

    alert(msg);
    carregarClientes();

  } catch (err) {
    console.error(err);
    alert("Erro ao desativar cliente.");
  }
}

function limparFormularioCliente() {
  document.getElementById("formCliente").reset();
  document.getElementById("cliente_id").value = "";

  ocultarCampoStatusCliente();

  const btnSalvar = document.querySelector(".btn-salvar");

  if (btnSalvar) {
    btnSalvar.textContent = "Salvar Cliente";
  }
}

function aplicarMascarasCliente() {
  const cnpj = document.getElementById("cnpj");
  const telefone = document.getElementById("telefone");
  const cep = document.getElementById("cep");

  if (cnpj) {
    cnpj.addEventListener("input", () => {
      let valor = cnpj.value.replace(/\D/g, "");

      valor = valor.replace(/^(\d{2})(\d)/, "$1.$2");
      valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      valor = valor.replace(/\.(\d{3})(\d)/, ".$1/$2");
      valor = valor.replace(/(\d{4})(\d)/, "$1-$2");

      cnpj.value = valor.substring(0, 18);
    });
  }

  if (cep) {
    cep.addEventListener("input", () => {
      let valor = cep.value.replace(/\D/g, "");
      valor = valor.replace(/^(\d{5})(\d)/, "$1-$2");
      cep.value = valor.substring(0, 9);
    });
  }

  if (telefone) {
    telefone.addEventListener("input", () => {
      let valor = telefone.value.replace(/\D/g, "");

      valor = valor.replace(/^(\d{2})(\d)/, "($1) $2");
      valor = valor.replace(/(\d{5})(\d)/, "$1-$2");

      telefone.value = valor.substring(0, 15);
    });
  }
}