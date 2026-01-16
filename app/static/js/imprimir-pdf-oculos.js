function positiveSimbol(val) {
    return ((typeof val == 'string') ? Number(val) : val) > 0 ? '+' : '';
}


    //I will handle static refraction.
window.capturarValoresOculos = () => {
    let tipo = '';
    let valores = {};
    let adicao = '';
    let observacao = '';

    const nmPessoaFisica = document.getElementById("nm_paciente").textContent.trim();
    const elementoPaciente = document.getElementById("nm_paciente");
    const dataNascimento = elementoPaciente.dataset.nascimento;
    const dataCpf = elementoPaciente.dataset.cpf;

    const camposDinamicos = document.querySelectorAll('.dinamica');
    const camposEstaticos = document.querySelectorAll('.estatica');
    
    if (camposDinamicos[0].offsetParent !== null) {
        tipo = 'dinamica';
        valores = extrairValores('.dinamica');
        const campoAdicao = document.querySelector('.adicao');
        if (campoAdicao) {
            adicao = campoAdicao.value.trim() || 'Não informado';
        }
    } else if (camposEstaticos[0].offsetParent !== null) {
        tipo = 'estatica';
        valores = extrairValores('.estatica');
    }

    const campoObservacao = document.querySelector('.ds_observacao_refracao');
    if (campoObservacao) {
        observacao = campoObservacao.value.trim() || 'Não informado';
    }

    return { tipo, valores, adicao, observacao, nmPessoaFisica, dataNascimento, dataCpf };
};

document.addEventListener('DOMContentLoaded', () => {
    const flashMessageDiv = document.getElementById("flash-message");

    const exibirMensagem = (mensagem, tipo = "success") => {
        flashMessageDiv.style.display = "block";
        flashMessageDiv.textContent = mensagem;

        if (tipo === "success") {
            flashMessageDiv.style.backgroundColor = "#d4edda";
            flashMessageDiv.style.color = "#155724";
        } else {
            flashMessageDiv.style.backgroundColor = "#f8d7da";
            flashMessageDiv.style.color = "#721c24";
        }
        setTimeout(() => {
            flashMessageDiv.style.opacity = "0";
            setTimeout(() => {
                flashMessageDiv.style.display = "none"; 
                flashMessageDiv.style.opacity = "1";
            }, 1000);
        }, 3000);
    };


    window.extrairValores = (classe) => {
        const campos = document.querySelectorAll(`${classe} input`);
        const dados = {};

        campos.forEach((campo) => {
            const nome = campo.name;
            const valor = campo.value || null; 
            dados[nome] = valor;
        });
        const elementoData = document.getElementById('data-agenda-display');
        if (elementoData) {
            dados['dt_atendimento'] = elementoData.textContent.trim();
        } else {
            dados['dt_atendimento'] = null;
        }
        return dados;
    };

    window.enviarDados = async (dados) => {
        try {
            const response = await fetch('/gerar-pdf-oculos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados),
            });
    
            if (response.ok) {
                const htmlContent = await response.text();


                const iframe = document.createElement('iframe');
                iframe.style.display = 'none'; 
                document.body.appendChild(iframe);

                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                iframeDoc.open();
                iframeDoc.write(htmlContent);
                iframeDoc.close();

                iframe.onload = () => {
                    // Garantir que o documento está completamente carregado
                    if (iframe.contentWindow.document.readyState === 'complete') {
                        // Pequeno delay para garantir que o navegador está pronto
                        setTimeout(() => {
                            try {
                                iframe.contentWindow.focus();
                                iframe.contentWindow.print();
                            } catch (e) {
                                console.error("Erro ao imprimir:", e);
                                alert("Não foi possível abrir o diálogo de impressão. Por favor, tente novamente.");
                            }
                            
                            setTimeout(() => {
                                document.body.removeChild(iframe);
                            }, 1000);
                        }, 300);
                    } else {
                        // Se ainda não estiver carregado, aguarde
                        iframe.contentWindow.addEventListener('load', () => {
                            setTimeout(() => {
                                try {
                                    iframe.contentWindow.focus();
                                    iframe.contentWindow.print();
                                } catch (e) {
                                    console.error("Erro ao imprimir:", e);
                                    alert("Não foi possível abrir o diálogo de impressão. Por favor, tente novamente.");
                                }
                                
                                setTimeout(() => {
                                    document.body.removeChild(iframe);
                                }, 1000);
                            }, 300);
                        });
                    }
                };
            } else {
                console.error('Erro ao gerar o PDF:', response);
                exibirMensagem("Erro ao gerar o PDF.", "error");
            }
        } catch (erro) {
            console.error('Erro ao enviar dados:', erro);
        }
    };

    const botao = document.getElementById('botao-oculos');
    botao.addEventListener('click', () => {
        const dados = window.capturarValoresOculos();
        
        window.enviarDados(dados);
    });

});


