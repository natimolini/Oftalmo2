export async function carregarDiagnostico(pesquisa = '') {
    const container = document.getElementById('lista-diagnostico-container');
    if (!container) {
        console.error('Container not found');
        return;
    }

    try {
        container.innerHTML = '<div style="text-align: center; padding: 10px;">Carregando...</div>';

        const response = await fetch(`/api/diagnostico-templates?search=${pesquisa}`);
        
        // Obter texto bruto para diagnóstico do problema
        const responseText = await response.text();
        console.log('Resposta bruta:', responseText);
        
        // Tentar analisar a resposta
        let templates;
        try {
            templates = JSON.parse(responseText);
            console.log('Tipo de dados recebido:', typeof templates);
            console.log('É um array?', Array.isArray(templates));
            console.log('Conteúdo:', templates);
        } catch (parseError) {
            console.error('Erro ao analisar JSON:', parseError);
            container.innerHTML = `<div style="text-align: center; padding: 10px; color: red;">
                Erro ao analisar resposta: ${parseError.message}
            </div>`;
            return;
        }
        
        // Corrigir o problema quando templates não é um array
        let templatesArray = [];
        if (!Array.isArray(templates)) {
            console.error('Resposta não é um array:', templates);
            
            // Tentar converter para array se for um objeto
            if (templates && typeof templates === 'object') {
                if (templates.data && Array.isArray(templates.data)) {
                    templatesArray = templates.data;
                } else if (templates.rows && Array.isArray(templates.rows)) {
                    // Para formato { rows: [...] } que é comum em respostas PostgreSQL
                    templatesArray = templates.rows;
                } else {
                    templatesArray = Object.values(templates);
                }
                console.log('Convertido para array:', templatesArray);
            } else {
                container.innerHTML = `<div style="text-align: center; padding: 10px; color: red;">
                    Erro: formato de resposta inválido
                </div>`;
                return;
            }
        } else {
            templatesArray = templates;
        }
        
        if (templatesArray.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 10px;">Nenhum diagnóstico encontrado</div>';
            return;
        }

        container.innerHTML = '';
        templatesArray.forEach(template => {
            // Verificar se o template tem a propriedade ds_diagnosticos
            const diagnosticoText = template.ds_diagnosticos || template.ds_diagnostico || template.descricao || template.nome || template[0] || "Diagnóstico sem descrição";
            
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = diagnosticoText;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(diagnosticoText));
            container.appendChild(label);
        });
    } catch (error) {
        console.error('Erro ao carregar diagnósticos:', error);
        container.innerHTML = `<div style="text-align: center; padding: 10px; color: red;">
            Erro ao carregar diagnósticos: ${error.message}
        </div>`;
    }
}

// Função mais robusta para carregar diagnósticos isoladamente de outros erros
function carregarDiagnosticosSeguro() {
    try {
        // Usar uma IIFE (Immediately Invoked Function Expression) para isolamento
        (function() {
            // Espera um pouco mais para garantir que a página esteja totalmente carregada
            setTimeout(function() {
                try {
                    // Código exatamente igual ao que funciona no console do navegador
                    (async function() {
                        try {
                            const nrAtendimentoInput = document.querySelector('input[name="nr_atendimento"]');
                            if (!nrAtendimentoInput) {
                                console.error('Elemento nr_atendimento não encontrado');
                                return;
                            }
                            const nrAtendimento = nrAtendimentoInput.value;
                            if (!nrAtendimento) {
                                console.error('Valor de nr_atendimento está vazio');
                                return;
                            }
                            
                            console.log('Carregando diagnósticos para atendimento:', nrAtendimento);
                            
                            const response = await fetch(`/api/diagnosticos/${nrAtendimento}`);
                            const data = await response.json();
                            console.log('Dados recebidos da API:', data);
                            
                            const diagnosticoTextarea = document.getElementById('text-area-diagnostico');
                            if (!diagnosticoTextarea) {
                                console.error('Elemento text-area-diagnostico não encontrado');
                                return;
                            }
                            
                            if (data && data.ds_diagnosticos && Array.isArray(data.ds_diagnosticos)) {
                                console.log('Processando', data.ds_diagnosticos.length, 'diagnósticos');
                                diagnosticoTextarea.value = data.ds_diagnosticos.join('\n');
                                diagnosticoTextarea.dispatchEvent(new Event('input'));
                                console.log('Diagnósticos aplicados com sucesso!');
                            } else {
                                console.warn('Formato de dados inesperado:', data);
                            }
                        } catch (innerError) {
                            console.error('Erro dentro da função assíncrona:', innerError);
                        }
                    })();
                } catch (timeoutError) {
                    console.error('Erro no timeout:', timeoutError);
                }
            }, 2000); // Aumentado para 2 segundos
        })();
    } catch (outerError) {
        console.error('Erro externo isolado:', outerError);
    }
}

// Execute a função segura assim que o script for carregado
carregarDiagnosticosSeguro();

// Adicione um event listener para carregar quando a página estiver pronta
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded executado');
    
    try {
        // Configurar listeners para textareas
        document.querySelectorAll('textarea').forEach(textarea => {
            if (textarea) {
                textarea.addEventListener('input', function() {
                    try {
                        const container = document.getElementById('lista-diagnostico-container') || document.createElement('div');
                        if (typeof adjustHeight === 'function') {
                            adjustHeight(this);
                        }
                    } catch (e) {
                        console.error('Erro no evento input:', e);
                    }
                });
            }
        });
        
        // Tenta carregar novamente após um tempo
        setTimeout(() => {
            carregarDiagnosticosSeguro();
        }, 3000); // Tenta novamente após 3 segundos
    } catch (domError) {
        console.error('Erro no DOMContentLoaded:', domError);
    }
});

// Expor função global para uso no console
window.carregarDiagnosticos = carregarDiagnosticosSeguro;