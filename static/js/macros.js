// Using dynamic imports instead of static imports
let queixasModule, acuidadeModule, diagnosticoModule, cirurgiasModule, oculosModule;

// Functions to dynamically load modules
async function loadModules() {
    try {
        queixasModule = await import('./queixas.js');
        acuidadeModule = await import('./acuidade.js');
        diagnosticoModule = await import('./diagnostico.js');
        cirurgiasModule = await import('./cirurgia.js');
        oculosModule = await import('./oculos.js');
        
        // Initialize modal types after loading modules
        initializeModalTypes();
        
        // Initialize content
        carregarQueixas();
        carregarAcuidade();
        carregarDiagnostico();
        carregarCirurgias();
        carregarObservacaoOculos();
    } catch (error) {
        console.error("Error loading modules:", error);
    }
}

// Wrapper functions that use the dynamically loaded modules
function carregarQueixas(pesquisa = '') {
    if (queixasModule) queixasModule.carregarQueixas(pesquisa);
}

function carregarAcuidade(pesquisa = '') {
    if (acuidadeModule) acuidadeModule.carregarAcuidade(pesquisa);
}

function carregarDiagnostico(pesquisa = '') {
    if (diagnosticoModule) diagnosticoModule.carregarDiagnostico(pesquisa);
}

function carregarCirurgias(pesquisa = '') {
    if (cirurgiasModule) cirurgiasModule.carregarCirurgias(pesquisa);
}

function carregarObservacaoOculos(pesquisa = '') {
    if (oculosModule) oculosModule.carregarObservacaoOculos(pesquisa);
}

// Will be populated after modules are loaded
let modalTypes = {};

function initializeModalTypes() {
    modalTypes = {
        'queixa': {
            title: 'Queixa Paciente',
            loadContent: carregarQueixas,
            containerId: 'lista-queixas-container',
            textAreaId: 'text-area-anamnese'
        },
        'acuidade': {
            title: 'Acuidade Visual', 
            loadContent: carregarAcuidade,
            containerId: 'lista-acuidade-container',
            textAreaId: 'textarea-acuidade'
        },
        'diagnostico': {
            title: 'Diagnóstico',
            loadContent: carregarDiagnostico,
            containerId: 'lista-diagnostico-container',
            textAreaId: 'text-area-diagnostico'
        },
        'cirurgias': {
            title: 'Cirurgias',
            loadContent: carregarCirurgias,
            containerId: 'lista-cirurgias-container',
            textAreaId: 'text-area-cirurgia'
        },
        'oculos': {
            title: 'Oculos',
            loadContent: carregarObservacaoOculos,
            containerId: 'lista-oculos-container',
            textAreaId: 'textarea-oculos'
        }
    };
}

// Event handlers and DOM initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded'); // Debug
    
    // Load all modules dynamically
    loadModules();
    
    const modalObservacao = document.getElementById("modal-observacao-oculos");
    const buttonFecharObservacao = document.querySelector(".cancelarObservacaoOculos");
    
    if (buttonFecharObservacao && modalObservacao) {
        buttonFecharObservacao.onclick = () => modalObservacao.close();
    }

    const pesquisaInput = document.getElementById('pesquisa-template');
    let timeoutId;

    if (pesquisaInput) {
        pesquisaInput.addEventListener('input', () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                carregarQueixas(pesquisaInput.value);
            }, 300);
        });
    }

    const form = document.getElementById('form-macro');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
        });
    }

    // Process search templates
    document.querySelector('#pesquisa-template')?.addEventListener('input', (e) => {
        const activeContent = document.querySelector('.modal-content.active');
        if (!activeContent || !modalTypes) return;
        
        const type = activeContent.dataset.type;
        modalTypes[type]?.loadContent(e.target.value);
    });

    // Handle modal clicks
    document.addEventListener('click', (event) => {
        if (event.target.matches('.observacao-oculos')) {
            const button = event.target;
            const type = button.dataset.type;
            if (modalTypes && modalTypes[type]) {
                document.querySelectorAll('.modal-content').forEach(el => el.classList.remove('active'));
                document.getElementById(modalTypes[type].containerId)?.classList.add('active');
                modalTypes[type].loadContent();
                const modalTitle = document.querySelector('#modal-observacao-oculos h1');
                if (modalTitle) modalTitle.textContent = modalTypes[type].title;
                if (modalObservacao) modalObservacao.showModal();
            }
        }
    });

    // Handle adding macros
    document.addEventListener('click', async (event) => {
        if (event.target.matches('.buttonAdicionarMacro')) {
            const activeContent = document.querySelector('.modal-content.active');
            if (!activeContent || !modalTypes) return;
            
            const inputElement = document.getElementById('inputAdicionarMacro');
            if (!inputElement) return;
            
            const novaMacro = inputElement.value;
            const type = activeContent.dataset.type;
            const modalConfig = modalTypes[type];
            
            if (!modalConfig || novaMacro === '') return;
            
            try {
                const response = await fetch(`/prontuario/api/novamacro/${novaMacro}/${modalConfig.title}`);
                inputElement.value = '';
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'success') {
                        modalConfig.loadContent();
                    } else {
                        console.error("Erro ao adicionar macro:", data.message);
                    }
                } else {
                    console.error("Erro na requisição:", response.status);
                }    
            } catch (error) {
                console.error("Erro inesperado:", error);
            }
        }
    });

    // Handle removing macros
    document.addEventListener('click', async (event) => {
        if (event.target.matches('.buttonRemoverMacro')) {
            const activeContent = document.querySelector('.modal-content.active');
            if (!activeContent || !modalTypes) return;

            const type = activeContent.dataset.type;
            const modalConfig = modalTypes[type];
            if (!modalConfig) return;

            const selecionados = Array.from(
                document.querySelectorAll(`#${modalConfig.containerId} input:checked`)
            ).map(checkbox => ({
                title: modalConfig.title,
                value: checkbox.value
            }));

            if (selecionados.length === 0) {
                console.log('Nenhum item selecionado para remover.');
                return;
            }
            
            try {
                const promises = selecionados.map(item => 
                    fetch(`/prontuario/api/remover_macro/${item.title}/${item.value}`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Erro ao remover macro: ${item.value}`);
                            }
                            return response.json();
                        })
                );
                await Promise.all(promises); 
                modalConfig.loadContent(); 
            } catch (error) {
                console.error('Erro ao remover macros:', error);
            }
        }
    });

    // Handle confirm button
    const confirmarBtn = document.querySelector('.confirmar-cancelar button');
    if (confirmarBtn) {
        confirmarBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const activeContent = document.querySelector('.modal-content.active');
            if (!activeContent || !modalTypes) return;
    
            const type = activeContent.dataset.type;
            const modalConfig = modalTypes[type];
            
            if (!modalConfig) {
                console.error('No modal config found for type:', type);
                return;
            }
    
            // Get selected items
            const selecionados = Array.from(
                document.querySelectorAll(`#${modalConfig.containerId} input:checked`)
            ).map(checkbox => checkbox.value);
    
            // Update corresponding textarea by appending new content
            const textArea = document.getElementById(modalConfig.textAreaId);
            if (textArea && selecionados.length > 0) {
                const existingContent = textArea.value.trim();
                const newContent = selecionados.map(item => ` - ${item}\n`).join(' ');
                textArea.value = existingContent ? existingContent + ' ' + newContent : newContent;
                textArea.dispatchEvent(new Event('input'));
            }
    
            // Close modal
            if (modalObservacao) {
                modalObservacao.close();
            }

            document.getElementById('macros-condutais-atuais').value = listaDeMacrosSelecionadas.join('\n');
        });
    }
});