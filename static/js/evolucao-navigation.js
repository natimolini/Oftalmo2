// Track the original attendance number
let originalNrAtendimento = null;
let originalCdPessoa = null;

// Initialize tracking when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Evolucao navigation initialized'); // Debug
    
    // Get original attendance from URL or page
    const nrAtendimentoElement = document.getElementById('nr_atendimento');
    
    if (nrAtendimentoElement) {
        originalNrAtendimento = nrAtendimentoElement.textContent.trim();
        console.log('Original nr_atendimento:', originalNrAtendimento); // Debug
    }
    
    // Get person code from patient name element
    const nmPacienteElement = document.getElementById('nm_paciente');
    if (nmPacienteElement) {
        originalCdPessoa = nmPacienteElement.getAttribute('data-cd-pessoa-fisica');
        console.log('Original cd_pessoa:', originalCdPessoa); // Debug
    }
    
    // Store in sessionStorage for persistence
    if (!sessionStorage.getItem('originalNrAtendimento')) {
        sessionStorage.setItem('originalNrAtendimento', originalNrAtendimento);
        sessionStorage.setItem('originalCdPessoa', originalCdPessoa);
        console.log('Stored in sessionStorage'); // Debug
    } else {
        // Restore from session if exists
        originalNrAtendimento = sessionStorage.getItem('originalNrAtendimento');
        originalCdPessoa = sessionStorage.getItem('originalCdPessoa');
        console.log('Restored from sessionStorage:', originalNrAtendimento); // Debug
    }
    
    // Setup the evolution button
    setupEvolucaoButton();
    
    // Check state immediately
    setTimeout(() => {
        checkAndUpdateEvolucaoState();
    }, 500);
});

function setupEvolucaoButton() {
    const evolucaoButton = document.querySelector('.botao-navegacao > a');
    
    if (evolucaoButton && evolucaoButton.textContent.trim() === 'Evolução') {
        console.log('Setting up evolution button'); // Debug
        evolucaoButton.style.cursor = 'pointer';
        
        evolucaoButton.addEventListener('click', async (e) => {
            const currentNrAtendimento = document.getElementById('nr_atendimento')?.textContent.trim();
            
            console.log('Button clicked. Current:', currentNrAtendimento, 'Original:', originalNrAtendimento); // Debug
            
            // Only navigate if we're not already on the original
            if (currentNrAtendimento !== originalNrAtendimento) {
                e.preventDefault();
                e.stopPropagation();
                await voltarParaOriginal();
            }
        });
    }
}

function checkAndUpdateEvolucaoState() {
    const evolucaoButton = document.querySelector('.botao-navegacao > a');
    const currentNrAtendimento = document.getElementById('nr_atendimento')?.textContent.trim();
    
    console.log('Checking state. Current:', currentNrAtendimento, 'Original:', originalNrAtendimento); // Debug
    
    if (!evolucaoButton || evolucaoButton.textContent.trim() !== 'Evolução') {
        console.log('Evolution button not found'); // Debug
        return;
    }
    
    if (currentNrAtendimento && currentNrAtendimento !== originalNrAtendimento) {
        // User is viewing a different record
        console.log('Setting modified state - RED'); // Debug
        evolucaoButton.classList.add('modified');
        evolucaoButton.title = `Clique para voltar ao prontuário original (${originalNrAtendimento})`;
    } else {
        // User is on the original record
        console.log('Removing modified state - NORMAL'); // Debug
        evolucaoButton.classList.remove('modified');
        evolucaoButton.title = 'Evolução';
    }
}

async function voltarParaOriginal() {
    if (!originalNrAtendimento || !originalCdPessoa) {
        console.error('Dados do prontuário original não encontrados');
        return;
    }
    
    try {
        console.log('Returning to original:', originalNrAtendimento); // Debug
        
        // Navigate back to original
        window.location.href = `/prontuario/${originalNrAtendimento}?cd_pessoa_fisica=${originalCdPessoa}`;
        
    } catch (error) {
        console.error('Erro ao voltar para prontuário original:', error);
        // Navigate anyway even if save fails
        window.location.href = `/prontuario/${originalNrAtendimento}?cd_pessoa_fisica=${originalCdPessoa}`;
    }
}

// Listen for prontuario changes
window.addEventListener('prontuarioChanged', () => {
    console.log('Prontuario changed event received'); // Debug
    checkAndUpdateEvolucaoState();
});

// Export functions for use in other modules
export { checkAndUpdateEvolucaoState, voltarParaOriginal };