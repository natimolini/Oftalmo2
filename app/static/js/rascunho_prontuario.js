import { enviarDadosProntuario } from './enviar_dados_prontuario.js';
import { salvarRascunho } from './salvar_rascunho.js';
import { debounce, throttle } from './utils.js';

// Para detectar mudanças que realmente precisam ser salvas
let estadoInputsAnterior = {};
let formEditado = false;

// Substituir o auto-salvamento baseado em timer por um baseado em eventos
document.addEventListener("DOMContentLoaded", () => {
    const botaoRascunho = document.getElementById("botao-rascunho");
    if (!botaoRascunho) {
        console.error("Botão rascunho não encontrado");
        return;
    }

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

    // Inicializar monitoramento de alterações
    inicializarMonitoramentoDeAlteracao();
    
    // Configurar botão de salvamento manual
    botaoRascunho.addEventListener("click", async () => {
        const sectionAtiva = document.querySelector('.section-dinamica')?.getAttribute('data-section');
        console.log("Salvamento manual iniciado para seção:", sectionAtiva);
        
        await salvarRascunho(sectionAtiva, enviarDadosProntuario, exibirMensagem, true);
        
        formEditado = false;
        atualizarEstadoAnterior();
        
        document.querySelectorAll('[data-modificado="true"]').forEach(el => {
            delete el.dataset.modificado;
        });
    });
    

    document.addEventListener('input', throttle(function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            e.target.dataset.modificado = 'true';
            formEditado = true;
        }
    }, 500));

    // Safety net: salvamento periódico a cada 15 minutos, caso algo dê errado com o evento
    const safetyInterval = 900000; // 15 minutos
    setInterval(async () => {
        if (formEditado && houveAlteracoes()) {
            const sectionAtiva = document.querySelector('.section-dinamica')?.getAttribute('data-section');
            console.log("Safety save check - detectadas alterações não salvas:", sectionAtiva);
            
            await salvarRascunho(sectionAtiva, enviarDadosProntuario, exibirMensagem);
            
            formEditado = false;
            atualizarEstadoAnterior();
            document.querySelectorAll('[data-modificado="true"]').forEach(el => {
                delete el.dataset.modificado;
            });
        }
    }, safetyInterval);

    // Salvamento adicional quando o usuário sair da página
    window.addEventListener('beforeunload', async (event) => {
        if (formEditado && houveAlteracoes()) {
            const sectionAtiva = document.querySelector('.section-dinamica')?.getAttribute('data-section');
            if (sectionAtiva) {
                try {
                    console.log("Salvando alterações antes de sair da página");
                    await salvarRascunho(sectionAtiva, enviarDadosProntuario, exibirMensagem, true);
                } catch (e) {
                    console.error("Erro ao salvar antes de sair da página:", e);
                }
            }
        }
    });
});

// Monitorar alterações nos campos importantes
function inicializarMonitoramentoDeAlteracao() {
    // Coletar estado inicial de todos os campos relevantes
    atualizarEstadoAnterior();
    
    // Monitorar mudanças nos campos do formulário
    document.addEventListener('input', throttle(function(e) {
        // Apenas reagir a campos de formulário
        if (e.target.tagName === 'INPUT' || 
            e.target.tagName === 'TEXTAREA' || 
            e.target.tagName === 'SELECT') {
            
            // Marcar que houve alteração
            e.target.dataset.modificado = 'true';
            formEditado = true;
        }
    }, 500));
    
    // Também monitorar mudanças em eventos change (para selects e checkboxes)
    document.addEventListener('change', throttle(function(e) {
        if (e.target.tagName === 'SELECT' || 
            (e.target.tagName === 'INPUT' && 
             (e.target.type === 'checkbox' || e.target.type === 'radio'))) {
            
            e.target.dataset.modificado = 'true';
            formEditado = true;
        }
    }, 500));
}

function atualizarEstadoAnterior() {
    const campos = document.querySelectorAll('input, textarea, select');
    campos.forEach(campo => {
        const id = campo.id || campo.name;
        if (id) {
            estadoInputsAnterior[id] = campo.value;
        }
    });
}

// Verificar se houve mudanças significativas que justificam salvamento
function houveAlteracoes() {
    const campos = document.querySelectorAll('input[data-modificado="true"], textarea[data-modificado="true"], select[data-modificado="true"]');
    
    if (campos.length === 0) return false;
    
    // Verificar se algum campo realmente mudou de valor
    for (const campo of campos) {
        const id = campo.id || campo.name;
        if (id && estadoInputsAnterior[id] !== campo.value) {
            return true;
        }
    }
    
    return false;
}