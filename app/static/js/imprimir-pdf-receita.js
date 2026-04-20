import { exibirMensagem } from './flash_messages.js';

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

    window.capturarValoresReceita = () => {
        let receita = '';
        
        // Capturar apenas da aba ativa
        const activeTab = document.querySelector('.receita-tab.active');
        const activeTabId = activeTab ? activeTab.dataset.tab : 'receita1';
        
        const textareaReceita = document.getElementById(activeTabId === 'receita1' ? 'receita' : 'receita2');
        const nmPessoaFisica = document.getElementById("nm_paciente").textContent.trim();
        const elementoPaciente = document.getElementById("nm_paciente");
        const dataNascimento = elementoPaciente.dataset.nascimento;
        const dataCpf = elementoPaciente.dataset.cpf;

        if (textareaReceita && textareaReceita.offsetParent !== null) {
            receita = textareaReceita.value.trim();
        }

        // Retornar com os nomes padronizados
        return { 
            receita, 
            nm_pessoa_fisica: nmPessoaFisica,  // ← Padronizado
            data_nascimento: dataNascimento,    // ← Padronizado
            data_cpf: dataCpf                   // ← Padronizado
        };
    };

    window.enviarDadosReceita = async (dados) => {
        try {
            const qtdCopiasInput = document.getElementById('qtd-copias');
            const nr_copias = qtdCopiasInput ? parseInt(qtdCopiasInput.value) || 1 : 1;

            const dadosCompletos = {
                ...dados,
                nr_copias: nr_copias
            };

            console.log('Enviando dados para impressão:', dadosCompletos);

            const response = await fetch('/gerar-pdf-receita', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosCompletos),
            });

            if (response.ok) {
                const contentType = response.headers.get('Content-Type') || '';

                if (contentType.includes('application/pdf')) {
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const iframe = document.createElement('iframe');
                    iframe.style.display = 'none';
                    iframe.src = url;
                    document.body.appendChild(iframe);

                    iframe.onload = () => {
                        setTimeout(() => {
                            try {
                                iframe.contentWindow.focus();
                                iframe.contentWindow.print();
                            } catch (e) {
                                console.error('Erro ao imprimir PDF:', e);
                                exibirMensagem("Não foi possível abrir o diálogo de impressão", "error");
                            }
                            setTimeout(() => {
                                document.body.removeChild(iframe);
                                URL.revokeObjectURL(url);
                            }, 1000);
                        }, 500);
                    };
                } else {
                    const htmlContent = await response.text();

                    const iframe = document.createElement('iframe');
                    iframe.style.position = 'absolute';
                    iframe.style.width = '0';
                    iframe.style.height = '0';
                    iframe.style.border = 'none';
                    document.body.appendChild(iframe);

                    const iframeDoc = iframe.contentWindow.document;
                    iframeDoc.open();
                    iframeDoc.write(htmlContent);
                    iframeDoc.close();

                    iframe.contentWindow.addEventListener('load', () => {
                        setTimeout(() => {
                            try {
                                iframe.contentWindow.focus();
                                iframe.contentWindow.print();
                            } catch (e) {
                                console.error("Erro ao imprimir:", e);
                                exibirMensagem("Não foi possível abrir o diálogo de impressão", "error");
                            }

                            setTimeout(() => {
                                document.body.removeChild(iframe);
                            }, 1000);
                        }, 500);
                    });
                }

                exibirMensagem('Documento preparado para impressão!', 'success');
            } else {
                const errorText = await response.text();
                console.error('Erro na resposta:', errorText);
                exibirMensagem('Erro ao gerar o PDF da receita', 'error');
            }
        } catch (error) {
            console.error('Erro ao enviar dados:', error);
            exibirMensagem('Erro ao processar a solicitação', 'error');
        }
    };

    const botaoReceita = document.getElementById('botao-receita');
    botaoReceita.addEventListener('click', () => {
        const dados = window.capturarValoresReceita();

        window.enviarDadosReceita(dados);
    });
});