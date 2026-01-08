import { exibirMensagem } from './flash_messages.js';

document.addEventListener("click", async (event)=>{
    if(event.target.matches('.btnNovoExame')){

        document.querySelector('.add-pacote').style.display = 'flex'
    }
})

document.addEventListener("click", async (event)=>{
    if(event.target.matches('.cancelaNovoExame')){

        document.querySelector('.add-pacote').style.display = 'none'
        document.querySelector('.inputNovoExame').value = ''
    }
})


/*IMPLEMENTAR MENSAGEM PARA CASO NAO SEJA DIGITADO NENHUMA VALOR NO INPUT*/
/*IMPLEMENTAR MENSAGEM PARA CASO NAO EXISTA NENHUM EXAME SELECIONADO*/
document.addEventListener("click", async (event)=>{
    if(event.target.matches('.confirmarNovoExame')){

        const descricao = document.querySelector('.inputNovoExame').value.trim()

        if(descricao === ''){
            exibirMensagem('Digite um nome para o novo pacote','error')
            return
        }
        
        const codigos = Array.from(document.querySelectorAll('.exam-code'))
            .map(exame => exame.textContent.trim())


        if(codigos.length == 0){
            exibirMensagem('Seleciones exames para seu novo pacote','error')
            return
        }

        const resultado = await fetch(`/api/exames/novo-pacote/${descricao}/${codigos}`)

        const response = await resultado.json()

        exibirMensagem(response.message,response.status)

        document.querySelector('.inputNovoExame').value = ''
        document.querySelector('.add-pacote').style.display = 'none'


    }
})