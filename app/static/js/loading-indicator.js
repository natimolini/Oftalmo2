/**
 * Sistema de indicadores visuais para feedback de operações assíncronas
 */

// Sistema de indicador de salvamento
let isSaving = false;
let saveIndicatorTimeout = null;

/**
 * Exibe o indicador de salvamento em andamento
 */
export function showSavingIndicator() {
    if (saveIndicatorTimeout) {
        clearTimeout(saveIndicatorTimeout);
    }
    
    const indicator = document.getElementById('savingIndicator') || createSavingIndicator();
    indicator.style.display = 'block';
    indicator.style.opacity = '1';
    isSaving = true;
}

/**
 * Esconde o indicador de salvamento
 * @param {number} delay - Atraso em ms antes de esconder o indicador
 */
export function hideSavingIndicator(delay = 500) {
    if (isSaving) {
        saveIndicatorTimeout = setTimeout(() => {
            const indicator = document.getElementById('savingIndicator');
            if (indicator) {
                indicator.style.opacity = '0';
                setTimeout(() => {
                    indicator.style.display = 'none';
                }, 300);
            }
            isSaving = false;
        }, delay);
    }
}

/**
 * Cria o elemento do indicador de salvamento no DOM
 * @returns {HTMLElement} O elemento do indicador criado
 */
function createSavingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'savingIndicator';
    indicator.textContent = 'Salvando...';
    indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 5px 10px;
        border-radius: 3px;
        font-size: 12px;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
        display: none;
    `;
    document.body.appendChild(indicator);
    return indicator;
}

// Sistema de indicador de carregamento geral
let loadingCounter = 0;
const minDisplayTime = 300; // Tempo mínimo de exibição em ms
let loadingTimer = null;

/**
 * Exibe o overlay de carregamento após um pequeno delay
 * para evitar flickering em operações rápidas
 */
export function showLoading() {
    loadingCounter++;
    
    if (loadingCounter === 1) {
        // Evitar flickering para operações rápidas
        loadingTimer = setTimeout(() => {
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay && loadingCounter > 0) {
                loadingOverlay.style.display = 'flex';
            }
        }, 200); // Aguardar 200ms antes de mostrar o loading
    }
}

/**
 * Esconde o overlay de carregamento, considerando um tempo mínimo
 * de exibição para evitar efeitos visuais abruptos
 */
export function hideLoading() {
    loadingCounter = Math.max(0, loadingCounter - 1);
    
    if (loadingCounter === 0) {
        // Garantir tempo mínimo de exibição
        setTimeout(() => {
            if (loadingCounter === 0) {
                const loadingOverlay = document.getElementById('loadingOverlay');
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                }
                
                if (loadingTimer) {
                    clearTimeout(loadingTimer);
                    loadingTimer = null;
                }
            }
        }, minDisplayTime);
    }
}