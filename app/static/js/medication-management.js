class MedicationManager {
    constructor() {
        this.initialized = false;
        this.patientId = null;
        this.currentTab = 'receita1';

        this.checkAndInitialize();

        if (!this.initialized) {
            this.initializationInterval = setInterval(() => {
                this.checkAndInitialize();
            }, 500);
        }
    }

    destroy() {
        if (this.initializationInterval) {
            clearInterval(this.initializationInterval);
        }
    }

    updatePatientId() {
        const patientElement = document.getElementById('nr_atendimento');
        if (patientElement) {
            const newId = patientElement.textContent || patientElement.value;
            if (this.patientId !== newId) {
                this.patientId = newId;
                this.textareaKey1 = `medicationTextareaContent1_${this.patientId}`;
                this.textareaKey2 = `medicationTextareaContent2_${this.patientId}`;
            }
        } else {
            this.patientId = null;
        }
    }

    checkAndInitialize() {
        const searchInput = document.getElementById('pesquisa-medicamento');
        const medicationList = document.querySelector('.lista-medicamento-protocolo ul');
        const textarea1 = document.getElementById('receita');
        const textarea2 = document.getElementById('receita2');

        this.updatePatientId();

        if (searchInput && medicationList && textarea1 && textarea2 && this.patientId && !this.initialized) {
            if (this.initializationInterval) clearInterval(this.initializationInterval);
            this.initialized = true;
            this.initialize(searchInput, medicationList, textarea1, textarea2);
        }
    }

    initialize(searchInput, medicationList, textarea1, textarea2) {
        this.searchInput = searchInput;
        this.medicationList = medicationList;
        this.textarea1 = textarea1;
        this.textarea2 = textarea2;

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
                tabs.forEach(t => t.classList.remove('active'));
                panes.forEach(p => p.classList.remove('active'));

                tab.classList.add('active');
                const tabId = tab.dataset.tab;
                this.currentTab = tabId;
                
                const targetPane = document.getElementById(`${tabId}-pane`);
                if (targetPane) targetPane.classList.add('active');
            });
        });
    }

    getCurrentTextarea() {
        return this.currentTab === 'receita1' ? this.textarea1 : this.textarea2;
    }

    initializeEventListeners() {
        let timeout;
        this.searchInput.addEventListener('input', (event) => {
            clearTimeout(timeout);
            const term = event.target.value.trim();
            
            timeout = setTimeout(() => {
                if (term.length >= 3) {
                    this.handleMedicationSearch(term);
                } else if (term.length === 0) {
                    this.loadAllMedications();
                }
            }, 300); 
        });

        this.textarea1.addEventListener('input', () => {
            localStorage.setItem(this.textareaKey1, this.textarea1.value);
        });

        this.textarea2.addEventListener('input', () => {
            localStorage.setItem(this.textareaKey2, this.textarea2.value);
        });

        window.addEventListener('beforeunload', () => this.saveTextareaContent());
    }

    saveTextareaContent() {
        if (this.textarea1 && this.textareaKey1) localStorage.setItem(this.textareaKey1, this.textarea1.value);
        if (this.textarea2 && this.textareaKey2) localStorage.setItem(this.textareaKey2, this.textarea2.value);
    }

    loadTextareaContent() {
        const savedContent1 = localStorage.getItem(this.textareaKey1);
        const savedContent2 = localStorage.getItem(this.textareaKey2);
        
        if (this.textarea1) this.textarea1.value = savedContent1 || '';
        if (this.textarea2) this.textarea2.value = savedContent2 || '';
    }

    async loadAllMedications() {
        try {
            const response = await fetch('/api/medications');
            if (!response.ok) throw new Error();
            const medications = await response.json();
            this.updateMedicationList(medications);
        } catch (error) {
            this.showError('Erro ao carregar medicamentos');
        }
    }

    async handleMedicationSearch(term) {
        try {
            const response = await fetch(`/api/search-medications?term=${encodeURIComponent(term)}`);
            if (!response.ok) throw new Error();
            const medications = await response.json();
            this.updateMedicationList(medications);
        } catch (error) {
            this.showError('Erro ao buscar medicamentos');
        }
    }

    updateMedicationList(medications) {
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
                const activeTextarea = this.getCurrentTextarea();
                const currentText = activeTextarea.value;
                
                const tipoDeUso = med.ds_uso_medicamento ? `USO: ${med.ds_uso_medicamento}` : '';
                const posologiaComUso = tipoDeUso ? `${tipoDeUso}\n${med.ds_posologia}` : med.ds_posologia;
                
                const blocos = currentText.split('\n\n').map(b => b.trim());
                const medicamentoExiste = blocos.some(bloco => {
                    return bloco.replace(/\s+/g, ' ').trim() === posologiaComUso.replace(/\s+/g, ' ').trim();
                });
                
                if (medicamentoExiste) {
                    this.removeMedication(posologiaComUso, activeTextarea);
                    this.applyFeedback(li, '#ffcccc');
                } else {
                    activeTextarea.value = currentText ? `${currentText}\n\n${posologiaComUso}` : posologiaComUso;
                    this.applyFeedback(li, '#ccffcc');
                }
                
                activeTextarea.dispatchEvent(new Event('input'));
                this.saveTextareaContent();
            });
            
            this.medicationList.appendChild(li);
        });
    }

    applyFeedback(element, color) {
        element.style.backgroundColor = color;
        setTimeout(() => element.style.backgroundColor = '', 300);
    }

    removeMedication(medicationText, textarea) {
        const medicationBlocks = textarea.value.split('\n\n').map(block => block.trim());
        const normalizedMedText = medicationText.replace(/\s+/g, ' ').trim();
        
        const filteredBlocks = medicationBlocks.filter(block => {
            return block.replace(/\s+/g, ' ').trim() !== normalizedMedText;
        });
        
        textarea.value = filteredBlocks.join('\n\n');
    }

    showError(message) {
        if (!this.medicationList) return;
        this.medicationList.innerHTML = `<li style="color: red;">${message}</li>`;
    }
}

let medicationManager;

document.addEventListener('sectionChanged', () => {
    if (medicationManager) {
        medicationManager.destroy();
    }
    medicationManager = new MedicationManager();
});