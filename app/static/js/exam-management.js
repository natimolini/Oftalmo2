console.log('EXAM MANAGEMENT MODULE LOADED');

class ExamManager {
    constructor() {
        console.log('ExamManager constructor called');
        this.initializeElements();
        this.initializeExamRemoval();
        this.initializeExamTransfer();

        this.nrAtendimento = document.getElementById('nr_atendimento')?.textContent;
        if (this.nrAtendimento) {
            this.storageKey = `selected_exams_${this.nrAtendimento}`;
            // Load exams from evolution textarea first, then from local storage as fallback
            this.loadExamsFromEvolution() || this.loadSavedExams();
        }
    }

    // Add this new method to load exams from the evolution textarea
    loadExamsFromEvolution() {
        const evolutionTextarea = document.getElementById('textarea-exames');
        if (!evolutionTextarea || !evolutionTextarea.value || !this.selectedExamsTable) return false;

        try {
            console.log('Loading exams from evolution textarea');
            const content = evolutionTextarea.value.trim();
            if (!content) return false;

            // Parse content to extract exam codes and names
            // Format expected: "CODE - DESCRIPTION" or "CODE - DESCRIPTION (QTYx)"
            const examRegex = /^([0-9]+\.[0-9]+\.[0-9]+-[0-9]+)\s*-\s*(.+?)(?:\s*\((\d+)x\))?$/gm;
            const exams = [];
            let match;

            while ((match = examRegex.exec(content)) !== null) {
                exams.push({
                    code: match[1].trim(),
                    name: match[2].trim(),
                    quantity: match[3] ? match[3] : '1'
                });
            }

            if (exams.length === 0) return false;

            // Clear the table first
            const rows = this.selectedExamsTable.querySelectorAll('tr:not(.nenhum-exame)');
            rows.forEach(row => row.remove());

            // Hide "no exams" row if it exists
            const nenhumExame = this.selectedExamsTable.querySelector('.nenhum-exame');
            if (nenhumExame) {
                nenhumExame.style.display = 'none';
            }

            // Add exams to the table
            exams.forEach(exam => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="exam-code" title="Click to remove">${exam.code}</td>
                    <td class="exam-name" title="Click to remove">${exam.name}</td>
                `;
                this.selectedExamsTable.appendChild(tr);
            });

            this.updateExamCount();
            this.initializeQuantityInputs();
            this.saveExamsToStorage();
            return true;
        } catch (error) {
            console.error('Error loading exams from evolution:', error);
            return false;
        }
    }

    saveExamsToStorage() {
        if (!this.selectedExamsTable || !this.nrAtendimento) return;
    
        const examsToSave = Array.from(this.selectedExamsTable.querySelectorAll('tr'))
            .filter(row => !row.classList.contains('nenhum-exame'))
            .map(row => ({
                examCode: row.querySelector('.exam-code')?.textContent || '',
                examName: row.querySelector('.exam-name')?.textContent || '',
                quantity: row.querySelector('.exam-quantity')?.value || '1'
            }))
            .filter(exam => exam.examCode && exam.examName);
    
        console.log('Saving exams to storage:', examsToSave);
        localStorage.setItem(this.storageKey, JSON.stringify(examsToSave));
    }

    loadSavedExams() {
        if (!this.selectedExamsTable || !this.nrAtendimento) return;
    
        try {
            const savedExams = localStorage.getItem(this.storageKey);
            if (savedExams) {
                const exams = JSON.parse(savedExams);
                console.log('Loading saved exams:', exams);
                
                const nenhumExame = this.selectedExamsTable.querySelector('.nenhum-exame');
                if (nenhumExame) {
                    nenhumExame.style.display = 'none';
                }
    
                exams.forEach(exam => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="exam-code" title="Click to remove">${exam.examCode}</td>
                        <td class="exam-name" title="Click to remove">${exam.examName}</td>
                    `;
                    tr.style.cursor = 'pointer';
                    this.selectedExamsTable.appendChild(tr);
                });
    
                this.updateExamCount();
                this.initializeQuantityInputs();
            }
        } catch (error) {
            console.error('Error loading saved exams:', error);
        }
    }

    initializeElements() {
        console.log('Initializing elements...');
        
        // Initialize elements without validation first
        this.searchPackageInput = document.getElementById('search-packages');
        this.packagesDropdown = document.getElementById('packages-dropdown');
        this.selectedExamsTable = document.querySelector('.tabela-exames-selecionados tbody');
        this.examsCountDisplay = document.querySelector('.exames-selecionados');
        this.searchExamInput = document.getElementById('search-exams');
        
        // Log element status
        console.log('Elements found:', {
            searchPackageInput: !!this.searchPackageInput,
            packagesDropdown: !!this.packagesDropdown,
            selectedExamsTable: !!this.selectedExamsTable,
            examsCountDisplay: !!this.examsCountDisplay,
            searchExamInput: !!this.searchExamInput
        });

        // Proceed with initialization regardless of element existence
        this.initialize();
    }

    initialize() {
        console.log('Running initialization...');
        
        // Initialize package search with dropdown behavior
        if (this.searchPackageInput && this.packagesDropdown) {
            // Load all packages when input is focused
            this.searchPackageInput.addEventListener('focus', () => this.loadAllPackages());
            
            // Filter packages on input
            this.searchPackageInput.addEventListener('input', 
                this.debounce(this.filterPackages.bind(this), 300));
                
            // Hide dropdown when clicking outside
            document.addEventListener('click', (event) => {
                if (!this.searchPackageInput.contains(event.target) && 
                    !this.packagesDropdown.contains(event.target)) {
                    this.packagesDropdown.style.display = 'none';
                }
            });
        }

        // Initialize exam search
        if (this.searchExamInput) {
            this.searchExamInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const rows = document.querySelectorAll('.tabela-exames tbody tr');
                
                rows.forEach(row => {
                    const code = row.cells[0].textContent.toLowerCase();
                    const description = row.cells[1].textContent.toLowerCase();
                    row.style.display = code.includes(term) || description.includes(term) ? '' : 'none';
                });
            });
        }

        this.initializeExamSelection();
        this.loadAvailableExams();
    }

    async loadAllPackages() {
        if (!this.packagesDropdown) return;
        
        try {
            // Show dropdown while loading
            this.packagesDropdown.style.display = 'block';
            this.packagesDropdown.innerHTML = '<div class="loading">Carregando pacotes...</div>';
            
            const response = await fetch('/api/all-packages');
            if (!response.ok) throw new Error('Failed to fetch packages');
            
            const packages = await response.json();
            this.allPackages = packages; // Store all packages for filtering
            
            this.renderPackagesDropdown(packages);
        } catch (error) {
            console.error('Error loading packages:', error);
            this.packagesDropdown.innerHTML = '<div class="error">Erro ao carregar pacotes</div>';
        }
    }

    filterPackages(event) {
        if (!this.allPackages || !this.packagesDropdown) return;
        
        const term = event.target.value.toLowerCase();
        const filteredPackages = this.allPackages.filter(pkg => 
            pkg.cd_pacote.toLowerCase().includes(term) || 
            pkg.ds_pacote.toLowerCase().includes(term)
        );
        
        this.renderPackagesDropdown(filteredPackages);
    }

    renderPackagesDropdown(packages) {
        if (!this.packagesDropdown) return;
        
        if (packages.length === 0) {
            this.packagesDropdown.innerHTML = '<div class="no-results">Nenhum pacote encontrado</div>';
            return;
        }
        
        this.packagesDropdown.innerHTML = packages.map(pkg => `
            <div class="dropdown-item" data-code="${pkg.cd_pacote}">
                <strong>${pkg.cd_pacote}</strong> - ${pkg.ds_pacote}
            </div>
        `).join('');
        
        // Add click handlers to dropdown items
        this.packagesDropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const packageCode = item.dataset.code;
                this.searchPackageInput.value = packageCode;
                this.handlePackageSelection({ target: { value: packageCode } });
                this.packagesDropdown.style.display = 'none';
            });
        });
    }

    addExamToSelected(code, description) {
        if (!code || !description || !this.selectedExamsTable) return;
    
        const existingRows = this.selectedExamsTable.querySelectorAll('tr td:first-child');
        
        for (let row of existingRows) {
            if (row.textContent === code) return;
        }
    
        // Hide "no exams" row if it exists
        const nenhumExame = this.selectedExamsTable.querySelector('.nenhum-exame');
        if (nenhumExame) {
            nenhumExame.style.display = 'none';
        }
    
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="exam-code" title="Click to remove">${code}</td>
            <td class="exam-name" title="Click to remove">${description}</td>
        `;
        this.selectedExamsTable.appendChild(row);
        this.updateExamCount();
        this.initializeQuantityInputs();
        this.saveExamsToStorage();
        
        // Update evolution textarea when a new exam is added
        this.updateEvolutionTextarea();
    }

    initializeExamRemoval() {
        if (this.selectedExamsTable) {
            this.selectedExamsTable.addEventListener('click', (event) => {
                if (event.target.classList.contains('exam-quantity')) {
                    return;
                }

                const row = event.target.closest('tr');
                if (!row) return;
    
                row.remove();
                this.updateExamCount();
                this.saveExamsToStorage();
                
                // Update the evolution textarea when an exam is removed
                this.updateEvolutionTextarea();
            });

            this.selectedExamsTable.addEventListener('change', (event) => {
                if (event.target.classList.contains('exam-quantity')) {
                    this.saveExamsToStorage();
                    // Update the evolution textarea when quantity changes
                    this.updateEvolutionTextarea();
                }
            });
        }
    }

    updateExamCount() {
        if (!this.selectedExamsTable || !this.examsCountDisplay) return;
        
        const count = this.selectedExamsTable.querySelectorAll('tr:not(.nenhum-exame)').length;
        this.examsCountDisplay.textContent = count;

        // Show/hide "no exams" row based on count
        const nenhumExame = this.selectedExamsTable.querySelector('.nenhum-exame');
        if (nenhumExame) {
            nenhumExame.style.display = count === 0 ? '' : 'none';
        }
    }

    initializeQuantityInputs() {
        document.querySelectorAll('.exam-quantity').forEach(input => {
            input.addEventListener('change', event => {
                const value = parseInt(event.target.value);
                if (isNaN(value) || value < 1) {
                    event.target.value = 1;
                }
            });
        });
    }

    initializeExamSelection() {
        const examTable = document.querySelector('.tabela-exames tbody');
        if (examTable) {
            examTable.addEventListener('click', (event) => {
                const row = event.target.closest('tr');
                if (!row) return;
                
                const code = row.cells[0].textContent;
                const description = row.cells[1].textContent;
                this.addExamToSelected(code, description);
            });
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async handlePackageSearch(event) {
        const term = event.target.value;
        if (term.length < 3) {
            this.clearSuggestions();
            return;
        }

        try {
            const response = await fetch(`/api/search-packages?term=${term}`);
            const packages = await response.json();
            this.updatePackageSuggestions(packages);
        } catch (error) {
            console.error('Error searching packages:', error);
        }
    }

    clearSuggestions() {
        const datalist = document.getElementById('package-suggestions');
        if (datalist) {
            datalist.innerHTML = '';
        }
    }

    updatePackageSuggestions(packages) {
        const datalist = document.getElementById('package-suggestions');
        if (!datalist) return;

        datalist.innerHTML = '';
        packages.forEach(pkg => {
            const option = document.createElement('option');
            option.value = pkg.cd_pacote;
            option.textContent = `${pkg.cd_pacote} - ${pkg.ds_pacote}`;
            datalist.appendChild(option);
        });
    }

    async handlePackageSelection(event) {
        const selectedPackage = event.target.value;
        if (!selectedPackage) return;
    
        try {
            console.log('Selected package:', selectedPackage);
            const response = await fetch(`/api/package-exams/${selectedPackage}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const exams = await response.json();
            console.log('API Response:', exams);
            this.populateSelectedExams(exams);
        } catch (error) {
            console.error('Error loading package exams:', error);
        }
    }

    populateSelectedExams(newExams) {
        if (!this.selectedExamsTable) return;
        
        console.log('New exams to be added:', newExams);
    
        // Hide "no exams" message if it exists
        const nenhumExame = this.selectedExamsTable.querySelector('.nenhum-exame');
        if (nenhumExame) {
            nenhumExame.style.display = 'none';
        }
        
        // Get array of existing exam codes
        const existingExamCodes = Array.from(this.selectedExamsTable.querySelectorAll('tr'))
            .filter(row => !row.classList.contains('nenhum-exame'))
            .map(row => row.querySelector('.exam-code')?.textContent?.trim());
        
        let examAdded = false;
        
        // Only add new exams that aren't already in the table
        newExams.forEach(newExam => {
            if (!existingExamCodes.includes(newExam.cd_exame)) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="exam-code" title="Click to remove">${newExam.cd_exame}</td>
                    <td class="exam-name" title="Click to remove">${newExam.ds_exame}</td>
                `;
                tr.style.cursor = 'pointer';
                this.selectedExamsTable.appendChild(tr);
                examAdded = true;
            }
        });
    
        if (examAdded) {
            this.updateExamCount();
            this.initializeQuantityInputs();
            this.saveExamsToStorage();
            
            // Update evolution textarea when new exams are added from a package
            this.updateEvolutionTextarea();
        }
    }

    async loadAvailableExams() {
        try {
            const response = await fetch('/api/list-exams');
            if (!response.ok) throw new Error('Failed to fetch exams');
            const exams = await response.json();
            
            const tbody = document.getElementById('available-exams');
            if (!tbody) return;
    
            tbody.innerHTML = exams.map(exam => `
                <tr>
                    <td style="display: none;">${exam.cd_exame}</td>
                    <td>${exam.ds_exame}</td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading exams:', error);
        }
    }

    initializeExamTransfer() {
        const transferButton = document.getElementById('transfer-exams-button');
        if (transferButton) {
            transferButton.addEventListener('click', () => {
                this.transferExamsToEvolution();
            });
        }
    }  

    
    async transferExamsToEvolution() {
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
    
        try {
            console.log('Starting exam transfer to evolution...');
            
            if (!this.selectedExamsTable) {
                console.error('Selected exams table not found');
                exibirMensagem("Erro: Tabela de exames não encontrada.", "error");
                return;
            }
    
            const selectedExams = Array.from(this.selectedExamsTable.querySelectorAll('tr:not(.nenhum-exame)'))
                .map(row => ({
                    examCode: row.querySelector('.exam-code')?.textContent.trim(), 
                    examName: row.querySelector('.exam-name')?.textContent.trim(),
                    quantity: row.querySelector('.exam-quantity')?.value || '1'
                }))
                .filter(exam => exam.examCode && exam.examName); 
    
            console.log('Selected exams:', selectedExams);
    
            if (selectedExams.length === 0) {
                exibirMensagem('Nenhum exame selecionado.', "error")
                return;
            }
    
            const examsTextarea = document.getElementById('textarea-exames');
            
            console.log('Data being sent to server:', JSON.stringify(selectedExams, null, 2));
    
            const response = await fetch('/transfer-exams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(selectedExams)
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
    
            const result = await response.json();
            
            if (examsTextarea) {
                const existingContent = examsTextarea.value?.trim() || '';
                examsTextarea.value = existingContent
                    ? `${existingContent}\n${result.formatted_exams}`
                    : result.formatted_exams;
    
                examsTextarea.dispatchEvent(new Event('input'));
                
                // Marcar o textarea como editado pelo usuário
                examsTextarea.setAttribute('data-user-edited', 'true');
            }
    
        } catch (error) {
            console.error('Error transferring exams:', error);
            exibirMensagem('Erro ao transferir exames. Por favor, tente novamente.', "error")
        }
    }

    // Add this new method to update the evolution textarea
    updateEvolutionTextarea() {
        const evolutionTextarea = document.getElementById('textarea-exames');
        if (!evolutionTextarea || !this.selectedExamsTable) return;

        const exams = Array.from(this.selectedExamsTable.querySelectorAll('tr:not(.nenhum-exame)'))
            .map(row => {
                const code = row.querySelector('.exam-code')?.textContent.trim();
                const name = row.querySelector('.exam-name')?.textContent.trim();
                const quantity = row.querySelector('.exam-quantity')?.value || '1';
                
                return quantity > 1 ? 
                    `${code} - ${name} (${quantity}x)` : 
                    `${code} - ${name}`;
            })
            .join('\n');

        evolutionTextarea.value = exams;
        evolutionTextarea.dispatchEvent(new Event('input'));
        
        // Mark the textarea as user-edited to preserve it during future operations
        evolutionTextarea.setAttribute('data-user-edited', 'true');
    }

    static init() {
        return new ExamManager();
    }
}

export default ExamManager;