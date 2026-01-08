import { enviarDadosProntuario } from './enviar_dados_prontuario.js';
import { salvarRascunho } from './salvar_rascunho.js';
import { fecharPopup } from './popup-prontuario.js';
import { atualizaProntuarioPelaData } from './dt-evolucao.js';
import { throttle, debounce } from './utils.js';

// Flash message function
function exibirMensagem(mensagem, tipo = "success") {
    const flashMessageDiv = document.getElementById("flash-message");
    if (!flashMessageDiv) return;
    
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
}

// Wrapper function for section buttons
export async function saveAndUpdateSection(funcionalidade) {
    console.log(`Preparando para mudar para a janela ${funcionalidade}`);
    
    try {
        // Get current active section
        const sectionAtiva = document.querySelector('.section-dinamica')?.getAttribute('data-section');
        
        // Forçar salvamento imediato ao mudar de seção
        if (sectionAtiva) {
            await salvarRascunho(sectionAtiva, enviarDadosProntuario, exibirMensagem, true);
        }
        
        // After saving, proceed with the original function
        window.atualizaSectionProntuario(funcionalidade);
    } catch (error) {
        console.error("Erro ao mudar de seção:", error);
        // Continue with section change even if save fails
        window.atualizaSectionProntuario(funcionalidade);
    }
}

window.saveAndUpdateSection = saveAndUpdateSection;

// Wrapper function for close button
export async function saveAndClosePopup() {
    console.log("Salvando rascunho antes de fechar prontuário");
    
    try {
        // Get current active section
        const sectionAtiva = document.querySelector('.section-dinamica')?.getAttribute('data-section');
        
        // Only save if we have an active section - force immediate save
        if (sectionAtiva) {
            await salvarRascunho(sectionAtiva, enviarDadosProntuario, exibirMensagem, true);
        }
        
        // After saving, proceed with the original close function
        fecharPopup();
    } catch (error) {
        console.error("Error saving draft before closing:", error);
        // Continue with closing even if save fails
        fecharPopup();
    }
}

// Make it available globally
window.saveAndClosePopup = saveAndClosePopup;

// Wrapper function for historical date links
export async function saveAndUpdateDate(element) {
    console.log("Salvando rascunho antes de mudar para consulta anterior");
    
    try {
        // Get current active section
        const sectionAtiva = document.querySelector('.section-dinamica')?.getAttribute('data-section');
        
        // Only save if we have an active section - force immediate save
        if (sectionAtiva) {
            await salvarRascunho(sectionAtiva, enviarDadosProntuario, exibirMensagem, true);
        }
        
        // After saving, call the original function
        atualizaProntuarioPelaData(element);
    } catch (error) {
        console.error("Erro ao salvar rascunho antes de mudar para consulta anterior:", error);
        // Continue with the navigation even if save fails
        atualizaProntuarioPelaData(element);
    }
}

// Wrapper function for print button
export async function saveAndPrint() {
    console.log("Salvando rascunho antes de imprimir");
    
    try {
        // Get current active section
        const sectionAtiva = document.querySelector('.section-dinamica')?.getAttribute('data-section');
        
        // Only save if we have an active section - force immediate save
        if (sectionAtiva) {
            await salvarRascunho(sectionAtiva, enviarDadosProntuario, exibirMensagem, true);
            console.log("Rascunho salvo, iniciando impressão...");
        }
        
        // After saving, proceed with printing
        if (typeof window.imprimirSecaoAtual === 'function') {
            window.imprimirSecaoAtual();
        } else {
            console.error("Função imprimirSecaoAtual não encontrada");
            exibirMensagem("Erro ao imprimir: função não encontrada", "error");
        }
    } catch (error) {
        console.error("Error saving draft before printing:", error);
        // Try to continue with printing even if save fails
        if (typeof window.imprimirSecaoAtual === 'function') {
            window.imprimirSecaoAtual();
        }
    }
}

// Make it available globally
window.saveAndPrint = saveAndPrint;
// Make it available globally
window.saveAndUpdateDate = saveAndUpdateDate;