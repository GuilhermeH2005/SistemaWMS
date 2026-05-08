// MENU LATERAL
const menuItems = document.querySelectorAll('.has-submenu');

menuItems.forEach(item => {
  item.addEventListener('click', (e) => {
    if (e.target.closest('.submenu')) return;

    const isOpen = item.classList.contains('open');

    menuItems.forEach(i => i.classList.remove('open'));

    if (!isOpen) {
      item.classList.add('open');
    }
  });
});

// BOTÃO COLAPSAR MENU
const toggleBtn = document.getElementById('menu-toggle');
const sidebar = document.querySelector('.sidebar');

toggleBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

function carregarPagina(pagina) {
  fetch(pagina)
    .then(res => res.text())
    .then(html => {
      const content = document.querySelector(".content");
      content.innerHTML = html;

      if (pagina.includes("fornecedores")) {
        iniciarFornecedor();
      }

      if (pagina.includes("produtos")) {
  iniciarProduto();
}

      if (pagina.includes("entrada")) {
  iniciarEntrada();
}

      if (pagina.includes("estoque")) {
  iniciarEstoque();
}

      if (pagina.includes("alerta_min")) {
  iniciarAlertas();
}

      if (pagina.includes("funcionarios")) {
  iniciarFuncionario();
}

    });
}
