function iniciarCategorias() {
  const form = document.getElementById("formCategoria");

  carregarCategorias();

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nome = document.getElementById("nomeCategoria").value.trim();

      const res = await fetch("http://localhost:3000/categorias-produto", {
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
        carregarCategorias();
      }
    });
  }
}

async function carregarCategorias() {
  const res = await fetch("http://localhost:3000/categorias-produto");
  const dados = await res.json();

  const lista = document.getElementById("listaCategorias");
  lista.innerHTML = "";

  dados.forEach(c => {
    lista.innerHTML += `
      <li>
        <span>${c.nome}</span>
        <button onclick="excluirCategoria(${c.id})">Excluir</button>
      </li>
    `;
  });
}

async function excluirCategoria(id) {
  if (!confirm("Deseja excluir esta categoria?")) return;

  const res = await fetch(`http://localhost:3000/categorias-produto/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...getUsuarioAuditoria()
    })
  });

  const msg = await res.text();
  alert(msg);

  carregarCategorias();
}