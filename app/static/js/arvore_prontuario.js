const botoesNav = document.querySelectorAll('.botao-navegacao');

botoesNav.forEach((botao, idx) => {
    // Só adiciona o toggle para os itens a partir do segundo (índice 1)
    if (idx > 0) {
        botao.addEventListener('click', () => {
            const lista = botao.querySelector('.arvore-prontuario');
            if (lista) {
                lista.style.display = lista.style.display === 'none' ? 'block' : 'none';
            }
        });
    }
});

// Sempre manter a lista de datas da evolução visível
const evolucaoLista = document.querySelector('.botao-navegacao:first-child .arvore-prontuario');
if (evolucaoLista) {
    evolucaoLista.style.display = 'block';
}

// Se clicar em qualquer data, garantir que a lista permaneça visível
document.querySelectorAll('.consultas-anteriores').forEach(item => {
    item.addEventListener('click', () => {
        if (evolucaoLista) evolucaoLista.style.display = 'block';
    });
});