class MedicationManager {
    constructor() {
        this.updatePatientId(); // Atualizar o ID do paciente ao inicializar
        this.checkAndInitialize();
        this.currentTab = 'receita1'; // Aba ativa padrão

        // Checa periodicamente se os elementos têm sido carregados corretamente (ajuste conforme necessário)
        this.initializationInterval = setInterval(() => {
            this.checkAndInitialize();
        }, 500);
    }

    updatePatientId() {
        // Obtém dinamicamente o ID do paciente diretamente do elemento
        const patientElement = document.getElementById('nr_atendimento');
        if (patientElement) {
            this.patientId = patientElement.textContent || patientElement.value;
            this.textareaKey1 = `medicationTextareaContent1_${this.patientId}`; // Define a chave do storage
            this.textareaKey2 = `medicationTextareaContent2_${this.patientId}`; // Define a chave do storage
            console.log(`Patient ID updated to: ${this.patientId}`);
        } else {
            console.error('Patient ID element not found');
            this.patientId = null;
        }
    }

    checkAndInitialize() {
        const searchInput = document.getElementById('pesquisa-medicamento');
        const medicationList = document.querySelector('.lista-medicamento-protocolo ul');
        const textarea1 = document.getElementById('receita');
        const textarea2 = document.getElementById('receita2');

        // Atualiza sempre o ID do paciente para garantir consistência
        this.updatePatientId();

        if (searchInput && medicationList && textarea1 && textarea2 && this.patientId && !this.initialized) {
            console.log('Found required elements, initializing...');
            clearInterval(this.initializationInterval);
            this.initialized = true;
            this.initialize(searchInput, medicationList, textarea1, textarea2);
        }
    }

    initialize(searchInput, medicationList, textarea1, textarea2) {
        this.searchInput = searchInput;
        this.medicationList = medicationList;
        this.textarea1 = textarea1;
        this.textarea2 = textarea2;
        
        console.log('Initializing with elements:', {
            searchInput: this.searchInput,
            medicationList: this.medicationList,
            textarea1: this.textarea1,
            textarea2: this.textarea2,
            patientId: this.patientId
        });

        this.initializeEventListeners();
        this.initializeTabSwitching();
        this.loadAllMedications();
        this.loadTextareaContent();
    }

    initializeTabSwitching() {
        const tabs = document.querySelectorAll('.receita-tab');
        const panes = document.querySelectorAll('.receita-pane');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remover active de todas as abas e painéis
                tabs.forEach(t => t.classList.remove('active'));
                panes.forEach(p => p.classList.remove('active'));

                // Adicionar active na aba clicada
                tab.classList.add('active');
                
                // Mostrar o painel correspondente
                const tabId = tab.dataset.tab;
                this.currentTab = tabId;
                document.getElementById(`${tabId}-pane`).classList.add('active');

                console.log(`Switched to tab: ${tabId}`);
            });
        });
    }

    getCurrentTextarea() {
        return this.currentTab === 'receita1' ? this.textarea1 : this.textarea2;
    }

    getCurrentTextareaKey() {
        return this.currentTab === 'receita1' ? this.textareaKey1 : this.textareaKey2;
    }

    initializeEventListeners() {
        this.searchInput.addEventListener('input', (event) => {
            const term = event.target.value.trim();
            console.log('Search term:', term);
            
            if (term.length >= 3) {
                this.handleMedicationSearch(event);
            } else if (term.length === 0) {
                this.loadAllMedications();
            }
        });

        // Event listeners para ambos os textareas
        this.textarea1.addEventListener('input', () => {
            localStorage.setItem(this.textareaKey1, this.textarea1.value);
        });

        this.textarea2.addEventListener('input', () => {
            localStorage.setItem(this.textareaKey2, this.textarea2.value);
        });

        window.addEventListener('beforeunload', () => {
            this.saveTextareaContent();
        });
    }

    saveTextareaContent() {
        if (this.textarea1) {
            console.log('Saving textarea1 content to storage');
            localStorage.setItem(this.textareaKey1, this.textarea1.value);
        }
        if (this.textarea2) {
            console.log('Saving textarea2 content to storage');
            localStorage.setItem(this.textareaKey2, this.textarea2.value);
        }
    }

    loadTextareaContent() {
        const savedContent1 = localStorage.getItem(this.textareaKey1);
        const savedContent2 = localStorage.getItem(this.textareaKey2);
        
        if (savedContent1) {
            console.log('Loading saved textarea1 content');
            this.textarea1.value = savedContent1;
        } else {
            this.textarea1.value = '';
        }

        if (savedContent2) {
            console.log('Loading saved textarea2 content');
            this.textarea2.value = savedContent2;
        } else {
            this.textarea2.value = '';
        }
    }

    async loadAllMedications() {
        try {
            console.log('Loading all medications...');
            const response = await fetch('/api/medications');
            if (!response.ok) throw new Error('Failed to fetch medications');
            const medications = await response.json();
            console.log('All medications received:', medications);
            this.updateMedicationList(medications);
        } catch (error) {
            console.error('Error loading medications:', error);
            this.showError('Erro ao carregar medicamentos');
        }
    }

    async handleMedicationSearch(event) {
        const term = event.target.value.trim();
        console.log('Handling search for term:', term);
        
        try {
            const response = await fetch(`/api/search-medications?term=${encodeURIComponent(term)}`);
            if (!response.ok) throw new Error('Failed to fetch medications');
            const medications = await response.json();
            console.log('Search results:', medications);
            this.updateMedicationList(medications);
        } catch (error) {
            console.error('Error searching medications:', error);
            this.showError('Erro ao buscar medicamentos');
        }
    }

    updateMedicationList(medications) {
        console.log('Updating medication list with:', medications);
        
        this.medicationList.innerHTML = '';
        
        if (!medications.length) {
            const li = document.createElement('li');
            li.textContent = 'Nenhum medicamento encontrado';
            this.medicationList.appendChild(li);
            return;
        }

        medications.forEach(med => {
            const li = document.createElement('li');
            li.dataset.id = med.cd_medicamento;
            li.innerHTML = `<span title="${med.ds_medicamento}">${med.ds_medicamento}</span>`;
            
            li.addEventListener('click', () => {
                console.log('Medication clicked:', med);
                
                // Usar o textarea da aba ativa
                const activeTextarea = this.getCurrentTextarea();
                const currentText = activeTextarea.value;
                
                // Montar o bloco completo que será adicionado/removido
                const tipoDeUso = med.ds_uso_medicamento ? `USO: ${med.ds_uso_medicamento}` : '';
                const posologiaComUso = tipoDeUso 
                    ? `${tipoDeUso}\n${med.ds_posologia}` 
                    : med.ds_posologia;
                
                // Verificar se o medicamento já está no textarea
                // Comparar pelo bloco completo, não apenas pela posologia
                const blocos = currentText.split('\n\n').map(b => b.trim());
                const medicamentoExiste = blocos.some(bloco => {
                    // Normalizar ambos os textos para comparação
                    const blocoNormalizado = bloco.replace(/\s+/g, ' ').trim();
                    const medicamentoNormalizado = posologiaComUso.replace(/\s+/g, ' ').trim();
                    return blocoNormalizado === medicamentoNormalizado;
                });
                
                if (medicamentoExiste) {
                    // Medicamento já existe - REMOVER
                    this.removeMedication(posologiaComUso, activeTextarea);
                    // Adicionar feedback visual (vermelho)
                    li.style.backgroundColor = '#ffcccc';
                    setTimeout(() => {
                        li.style.backgroundColor = '';
                    }, 300);
                } else {
                    // Medicamento não existe - ADICIONAR
                    activeTextarea.value = currentText 
                        ? `${currentText}\n\n${posologiaComUso}` 
                        : posologiaComUso;
                    
                    // Adicionar feedback visual (verde)
                    li.style.backgroundColor = '#ccffcc';
                    setTimeout(() => {
                        li.style.backgroundColor = '';
                    }, 300);
                }
                
                activeTextarea.dispatchEvent(new Event('input'));
                this.saveTextareaContent();
            });
            
            this.medicationList.appendChild(li);
        });
    }

    /**
     * Remove um medicamento específico do textarea
     * @param {string} medicationText - Texto completo do medicamento a ser removido
     */
    removeMedication(medicationText, textarea) {
        const currentText = textarea.value;
        
        // Dividir o texto em blocos de medicamentos (separados por \n\n)
        const medicationBlocks = currentText.split('\n\n').map(block => block.trim());
        
        // Normalizar o texto do medicamento para comparação
        const normalizedMedText = medicationText.replace(/\s+/g, ' ').trim();
        
        // Filtrar removendo o bloco que corresponde exatamente ao medicamento
        const filteredBlocks = medicationBlocks.filter(block => {
            const normalizedBlock = block.replace(/\s+/g, ' ').trim();
            return normalizedBlock !== normalizedMedText;
        });
        
        // Reconstruir o texto
        textarea.value = filteredBlocks.join('\n\n');
        
        console.log('Medicamento removido');
    }

    showError(message) {
        console.error('Showing error:', message);
        if (!this.medicationList) return;
        
        this.medicationList.innerHTML = '';
        const li = document.createElement('li');
        li.textContent = message;
        li.style.color = 'red';
        this.medicationList.appendChild(li);
    }
}

// Aqui devemos instanciar o MedicationManager e passá-lo para a lógica relevante quando necessário
let medicationManager;

document.addEventListener('sectionChanged', () => {
    // Re-obtém o ID do paciente na transição de seção
    medicationManager = new MedicationManager();
});