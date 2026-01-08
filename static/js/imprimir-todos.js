import { exibirMensagem } from './flash_messages.js';

document.addEventListener('DOMContentLoaded', () => {
    const botaoGerarTodos = document.getElementById('botao-imprimir-tudo');

    try{

        if (botaoGerarTodos) {
            botaoGerarTodos.addEventListener('click', async () => {
                // Capturar os valores de todas as funções
                const dadosReceita = window.capturarValoresReceita();
                const dadosOculos = window.capturarValoresOculos();
                const dadosExames = window.capturarValoresExames();
    
                // Enviar os dados para as respectivas funções
                await window.enviarDadosReceita(dadosReceita);
                await window.enviarDados(dadosOculos);
                await window.enviarDadosExames(dadosExames);
    
                // Mensagem de sucesso
                exibirMensagem("Todos os PDFs foram gerados com sucesso!","success");
            });
        }
    }catch{
        exibirMensagem("Erro ao imprimir todos os exames, tente novamente!","error")
    }
});
