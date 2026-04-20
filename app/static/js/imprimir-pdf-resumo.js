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
        
    window.capturarValoresResumo = () => {
        const elementoAtendimento = document.getElementById("nr_atendimento");
        if (!elementoAtendimento) {
            console.error("Elemento nr_atendimento não encontrado");
            return { nrAtendimento: null };
        }
        const nrAtendimento = elementoAtendimento.textContent;
        return { nrAtendimento };
    };

    window.enviarDadosResumo = async (dados) => {
        try {
            const response = await fetch('/gerar-pdf-resumo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados),
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
                                alert('Não foi possível abrir o diálogo de impressão. Por favor, tente novamente.');
                            }
                            setTimeout(() => {
                                document.body.removeChild(iframe);
                                URL.revokeObjectURL(url);
                            }, 1000);
                        }, 300);
                    };
                } else {
                    const htmlContent = await response.text();

                    const iframe = document.createElement('iframe');
                    iframe.style.display = 'none'; 
                    document.body.appendChild(iframe);

                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    iframeDoc.open();
                    iframeDoc.write(htmlContent);
                    iframeDoc.close();

                    iframe.onload = () => {
                        if (iframe.contentWindow.document.readyState === 'complete') {
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
                }
            } else {
                console.error('Erro ao gerar o PDF:', response);
                exibirMensagem("Erro ao gerar o PDF.", "error");
            }
        } catch (erro) {
            console.error('Erro ao enviar dados:', erro);
            exibirMensagem("Erro ao gerar o resumo.", "error");
        }
    };

    const botaoResumo = document.getElementById('botao-resumo');
    if (botaoResumo) {
        botaoResumo.addEventListener('click', () => {
            const dados = window.capturarValoresResumo();
            window.enviarDadosResumo(dados);
        });
    }
});