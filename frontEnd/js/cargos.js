function iniciarCargos() {
  const form = document.getElementById("formCargo");

  carregarCargos();

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nome = document.getElementById("nomeCargo").value.trim();

      const res = await fetch("http://localhost:3000/cargos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          ...getUsuarioAuditoria()
        })
      });

      const msg = await res.text();
      alert(msg);

      if (res.ok) {
        form.reset();
        carregarCargos();
      }
    });
  }
}

async function carregarCargos() {
  const res = await fetch("http://localhost:3000/cargos");
  const dados = await res.json();

  const lista = document.getElementById("listaCargos");
  lista.innerHTML = "";

  dados.forEach(c => {
    lista.innerHTML += `
      <li>
        <span>${c.nome}</span>
        <button onclick="excluirCargo(${c.id})">Excluir</button>
      </li>
    `;
  });
}

async function excluirCargo(id) {
  if (!confirm("Deseja excluir este cargo?")) return;

  const res = await fetch(`http://localhost:3000/cargos/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...getUsuarioAuditoria()
    })
  });

  const msg = await res.text();
  alert(msg);

  carregarCargos();
}