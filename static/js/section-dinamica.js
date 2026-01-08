import ExamManager from './exam-management.js';
import { carregarReceituario } from './receituario.js';

// Define the function
export async function atualizaSectionProntuario(funcionalidade) {
    console.log('Updating section to:', funcionalidade);
    const sectionDinamica = document.querySelector('.section-dinamica');
    const nrAtendimento = document.querySelector("#nr_atendimento").innerText;
    const urlParams = new URLSearchParams(window.location.search);
    const cdPessoaFisica = urlParams.get('cd_pessoa_fisica');
    
    // Marcar seção antiga como inativa para economizar recursos
    const secaoAnterior = sectionDinamica.getAttribute('data-section');
    if (secaoAnterior) {
        console.log('Desativando seção anterior:', secaoAnterior);
        document.dispatchEvent(new CustomEvent('secao-desativada', { 
            detail: { secao: secaoAnterior } 
        }));
    }

    if (!nrAtendimento) {
        console.error('Error: nrAtendimento is undefined or empty');
        return;
    }

    let arquivoHtml;
    if (funcionalidade === 'resumo') {
        const cdPessoaFisica = urlParams.get('cd_pessoa_fisica');
        arquivoHtml = `/prontuario/${nrAtendimento}/resumo?cd_pessoa_fisica=${cdPessoaFisica}`;
    } else {
        arquivoHtml = `/prontuario/${nrAtendimento}/${funcionalidade}`;
    }
    sectionDinamica.setAttribute('data-section', funcionalidade);

    try {
        const response = await fetch(arquivoHtml);
        if (!response.ok) {
            throw new Error(`Error loading ${arquivoHtml}: ${response.statusText}`);
        }
        const html = await response.text();
        
        // Update the section content
        sectionDinamica.innerHTML = html;

        // Initialize specific functionality based on section
        if (funcionalidade === 'receituario') {
            // Aguarde o HTML ser inserido antes de buscar o campo
            setTimeout(() => {
                const nrAtendimentoAtual = document.getElementById('nr_atendimento')?.textContent?.trim();
                carregarReceituario(nrAtendimentoAtual);
            }, 100); // Pequeno delay para garantir que o DOM foi atualizado
        } else if (funcionalidade === 'exames') {
            console.log('Initializing exam manager...');
            ExamManager.init();
        } else if (funcionalidade === 'resumo') {
            console.log('Loading summary view...');
            // Any specific initialization for summary view can go here
        } else if (funcionalidade === 'oculos'){
            reloadPage();
        }

        // Dispatch custom event after content is loaded and managers initialized
        const event = new CustomEvent('sectionChanged', {
            detail: {
                section: funcionalidade
            }
        });
        document.dispatchEvent(event);
        console.log('Section changed event dispatched:', funcionalidade);
        
        // Notificar que a nova seção está ativa
        console.log('Ativando nova seção:', funcionalidade);
        document.dispatchEvent(new CustomEvent('secao-ativada', { 
            detail: { secao: funcionalidade } 
        }));

    } catch (error) {
        console.error('Error loading HTML:', error);
        sectionDinamica.innerHTML = `<p>Error loading functionality. Please try again.</p>`;
    }
}

// Make it available globally
window.atualizaSectionProntuario = atualizaSectionProntuario;

function reloadPage() {
    // Exibe o overlay de loading
    document.getElementById('loadingOverlay').style.display = 'flex';

    // Aguarda um curto tempo antes de recarregar
    setTimeout(() => {
        location.reload();
    }, 500); // Aguarde 500ms (meio segundo)
}