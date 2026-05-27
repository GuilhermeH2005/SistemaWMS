function iniciarConfiguracoesGerais() {
  const formCategoria = document.getElementById("formCategoria");
  const formCor = document.getElementById("formCor");
  const formCargo = document.getElementById("formCargo");

  carregarCategoriasConfig();
  carregarCoresConfig();
  carregarCargosConfig();

  if (formCategoria) {
    formCategoria.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nome = document.getElementById("nomeCategoria").value.trim();

      const res = await fetch("http://localhost:3000/categorias-produto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nome })
      });

      const msg = await res.text();

      if (!res.ok) {
        alert(msg);
        return;
      }

      alert(msg);
      formCategoria.reset();
      carregarCategoriasConfig();
    });
  }

  if (formCor) {
    formCor.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nome = document.getElementById("nomeCor").value.trim();

      const res = await fetch("http://localhost:3000/cores-produto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nome })
      });

      const msg = await res.text();

      if (!res.ok) {
        alert(msg);
        return;
      }

      alert(msg);
      formCor.reset();
      carregarCoresConfig();
    });
  }

  if (formCargo) {
    formCargo.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nome = document.getElementById("nomeCargo").value.trim();

      const res = await fetch("http://localhost:3000/cargos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nome })
      });

      const msg = await res.text();

      if (!res.ok) {
        alert(msg);
        return;
      }

      alert(msg);
      formCargo.reset();
      carregarCargosConfig();
    });
  }
}

async function carregarCategoriasConfig() {
  const res = await fetch("http://localhost:3000/categorias-produto");
  const categorias = await res.json();

  const lista = document.getElementById("listaCategorias");

  if (!lista) return;

  lista.innerHTML = "";

  categorias.forEach(c => {
    lista.innerHTML += `
      <li>
        <span>${c.nome}</span>

        <button onclick="excluirCategoria(${c.id})">
          Excluir
        </button>
      </li>
    `;
  });
}

async function carregarCoresConfig() {
  const res = await fetch("http://localhost:3000/cores-produto");
  const cores = await res.json();

  const lista = document.getElementById("listaCores");

  if (!lista) return;

  lista.innerHTML = "";

  cores.forEach(c => {
    lista.innerHTML += `
      <li>
        <span>${c.nome}</span>

        <button onclick="excluirCor(${c.id})">
          Excluir
        </button>
      </li>
    `;
  });
}

async function carregarCargosConfig() {
  const res = await fetch("http://localhost:3000/cargos");
  const cargos = await res.json();

  const lista = document.getElementById("listaCargos");

  if (!lista) return;

  lista.innerHTML = "";

  cargos.forEach(c => {
    lista.innerHTML += `
      <li>
        <span>${c.nome}</span>

        <button onclick="excluirCargo(${c.id})">
          Excluir
        </button>
      </li>
    `;
  });
}

async function excluirCategoria(id) {
  if (!confirm("Deseja excluir esta categoria?")) return;

  const res = await fetch(`http://localhost:3000/categorias-produto/${id}`, {
    method: "DELETE"
  });

  const msg = await res.text();
  alert(msg);

  carregarCategoriasConfig();
}

async function excluirCor(id) {
  if (!confirm("Deseja excluir esta cor?")) return;

  const res = await fetch(`http://localhost:3000/cores-produto/${id}`, {
    method: "DELETE"
  });

  const msg = await res.text();
  alert(msg);

  carregarCoresConfig();
}

async function excluirCargo(id) {
  if (!confirm("Deseja excluir este cargo?")) return;

  const res = await fetch(`http://localhost:3000/cargos/${id}`, {
    method: "DELETE"
  });

  const msg = await res.text();
  alert(msg);

  carregarCargosConfig();
}