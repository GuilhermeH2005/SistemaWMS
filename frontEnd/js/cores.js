function iniciarCores() {
  const form = document.getElementById("formCor");

  carregarCores();

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nome = document.getElementById("nomeCor").value.trim();

      const res = await fetch("http://localhost:3000/cores-produto", {
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
        carregarCores();
      }
    });
  }
}

async function carregarCores() {
  const res = await fetch("http://localhost:3000/cores-produto");
  const dados = await res.json();

  const lista = document.getElementById("listaCores");
  lista.innerHTML = "";

  dados.forEach(c => {
    lista.innerHTML += `
      <li>
        <span>${c.nome}</span>
        <button onclick="excluirCor(${c.id})">Excluir</button>
      </li>
    `;
  });
}

async function excluirCor(id) {
  if (!confirm("Deseja excluir esta cor?")) return;

  const res = await fetch(`http://localhost:3000/cores-produto/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...getUsuarioAuditoria()
    })
  });

  const msg = await res.text();
  alert(msg);

  carregarCores();
}