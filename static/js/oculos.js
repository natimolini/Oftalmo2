document.addEventListener("DOMContentLoaded", () => {
    const divAdicao = document.querySelector(".div-adicao.dinamica");

    verificarEstiloRefracao();

    document.addEventListener("change", (event) => {
        if (event.target.id === "dinamica" || event.target.id === "estatica") {
            toggleRefacao(event.target.id);
        }
    });

    function verificarEstiloRefracao() {
        const nCheck = document.querySelector('input[name="vl_od_pl_are_esf"]').value[0];
    
        setTimeout(() => {
            if (nCheck == "+" || nCheck == "-") {
                return;
            }
            if (nCheck !== undefined) { 
                fetchDinamicaData();
            }
            verificarEstiloRefracao();
        }, 800);
    }

    function toggleRefacao(selectedId) {
        const camposDinamica = document.querySelectorAll('.dinamica');
        const camposEstatica = document.querySelectorAll('.estatica');

        if (selectedId === "dinamica") {
            camposDinamica.forEach(el => el.style.display = '');
            camposEstatica.forEach(el => el.style.display = 'none');
            divAdicao.style.opacity = '1';
            fetchDinamicaData(); // Fetch dynamic data when 'dinamica' is selected
        } else if (selectedId === "estatica") {
            camposEstatica.forEach(el => el.style.display = '');
            camposDinamica.forEach(el => el.style.display = 'none');
            divAdicao.style.opacity = '0';
            
            fetchEstaticaData();
        }
    }

    function formatNumber(value, isEixo = false, isAdicao = false) {
        if (!value || String(value).trim() === '') return '';
        
        const cleanValue = String(value).trim().replace(',', '.');
        const num = parseFloat(cleanValue);
        
        if (isNaN(num)) return '';
        
        if (isEixo) {
            return Math.round(num).toString();
        }
        
        const formatted = num.toFixed(2).replace('.', ',');
        return num < 0 ? formatted : `+${formatted}`;
    }

    function displayFormatted(input, value) {
        const isEixo = input.name.toLowerCase().includes('eixo');
        const isAdicao = input.name === 'vl_adicao';
        const formatted = formatNumber(value, isEixo, isAdicao);

        if (isEixo) {
            input.value = formatted;
        } else if (formatted) {
            input.value = formatted;
        } else {
            input.value = value;
        }
        return formatted || value;
    }

    function handleChangeEvent(event) {
        const input = event.target;
        const value = input.value;
       
        if (!value && value !== '0') return;       
       
        const formattedValue = displayFormatted(input, value);    
       
        if (formattedValue !== '') {
            input.value = formattedValue;
        }
    }

    function checkAndSelectEstatica() {
        const dinamicaInputs = document.querySelectorAll('.dinamica input[type="text"], .dinamica input[type="number"]');
        const estaticaInputs = document.querySelectorAll('.estatica input[type="text"], .estatica input[type="number"]');

        let dinamicaHasValue = false;
        let estaticaHasValue = false;

        dinamicaInputs.forEach(input => {
            if (input.value.trim() !== '') {
                dinamicaHasValue = true;
            }
        });

        estaticaInputs.forEach(input => {
            if (input.value.trim() !== '') {
                estaticaHasValue = true;
            }
        });

        if (!dinamicaHasValue && estaticaHasValue) {
            document.getElementById('estatica').checked = true;
            toggleRefacao('estatica');
        } else {
            document.getElementById('dinamica').checked = true;
            toggleRefacao('dinamica');
        }
    }

    async function fetchEstaticaData() {
        const nrAtendimento = document.querySelector('input[name="nr_atendimento"]').value;

        if (nrAtendimento) {
            try {
                const response = await fetch(`/api/evolucao/${nrAtendimento}`);
                const data = await response.json();

                //console.log("Response data:", data); // Debugging line

                // Update static fields
                displayFormatted(document.querySelector('input[name="vl_od_pl_are_esf"]'), data.vl_od_pl_are_esf || '');
                displayFormatted(document.querySelector('input[name="vl_od_pl_are_cil"]'), data.vl_od_pl_are_cil || '');
                displayFormatted(document.querySelector('input[name="vl_od_pl_are_eixo"]'), data.vl_od_pl_are_eixo || '');
                displayFormatted(document.querySelector('input[name="vl_oe_pl_are_esf"]'), data.vl_oe_pl_are_esf || '');
                displayFormatted(document.querySelector('input[name="vl_oe_pl_are_cil"]'), data.vl_oe_pl_are_cil || '');
                displayFormatted(document.querySelector('input[name="vl_oe_pl_are_eixo"]'), data.vl_oe_pl_are_eixo || '');
            } catch (error) {
                console.error("Erro ao buscar evolução:", error);
            }
        }
    }

    async function fetchDinamicaData() {
        const nrAtendimento = document.querySelector('input[name="nr_atendimento"]').value;

        if (nrAtendimento) {
            try {
                const response = await fetch(`/api/evolucao/${nrAtendimento}`);
                const data = await response.json();

                //console.log("Response data:", data); // Debugging line

                // Update dynamic fields
                displayFormatted(document.querySelector('input[name="vl_od_pl_ard_esf"]'), data.vl_od_pl_ard_esf || '');
                displayFormatted(document.querySelector('input[name="vl_od_pl_ard_cil"]'), data.vl_od_pl_ard_cil || '');
                displayFormatted(document.querySelector('input[name="vl_od_pl_ard_eixo"]'), data.vl_od_pl_ard_eixo || '');
                displayFormatted(document.querySelector('input[name="vl_oe_pl_ard_esf"]'), data.vl_oe_pl_ard_esf || '');
                displayFormatted(document.querySelector('input[name="vl_oe_pl_ard_cil"]'), data.vl_oe_pl_ard_cil || '');
                displayFormatted(document.querySelector('input[name="vl_oe_pl_ard_eixo"]'), data.vl_oe_pl_ard_eixo || '');
                displayFormatted(document.querySelector('input[name="vl_adicao"]'), data.vl_adicao || '');
                document.querySelector('textarea[name="ds_observacao_refracao"]').value = data.obs_refracao || '';
            } catch (error) {
                console.error("Erro ao buscar evolução:", error);
            }
        }
    }

    // Initialize numeric inputs
    const numericInputs = document.querySelectorAll('input[type="text"].input-oculos, input[name="vl_adicao"]');
    numericInputs.forEach(input => {
        input.addEventListener('change', handleChangeEvent);
        input.addEventListener('keydown', (e) => {
            // Handle both Tab and Enter keys
            if (e.key === 'Tab' || e.key === 'Enter') {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent form submission
                    
                    // Find all inputs in the form and get current input's index
                    const allInputs = Array.from(input.form.querySelectorAll('input[type="text"], input[type="number"]'));
                    const currentIndex = allInputs.indexOf(input);
                    
                    // Focus the next input if available
                    if (currentIndex > -1 && currentIndex < allInputs.length - 1) {
                        allInputs[currentIndex + 1].focus();
                    }
                }
                
                handleChangeEvent({ target: input });
            }
        });
        if (input.value) handleChangeEvent({ target: input });
    });

    // Fetch and display data
    const nrAtendimento = document.querySelector('input[name="nr_atendimento"]').value;

    if (nrAtendimento) {
        fetch(`/api/evolucao/${nrAtendimento}`)
            .then(response => response.json())
            .then(data => {
                //console.log("Response data:", data); // Debugging line

                // Update dynamic fields
                if (data.vl_od_pl_ard_esf !== undefined) {
                    displayFormatted(document.querySelector('input[name="vl_od_pl_ard_esf"]'), data.vl_od_pl_ard_esf || '');
                    displayFormatted(document.querySelector('input[name="vl_od_pl_ard_cil"]'), data.vl_od_pl_ard_cil || '');
                    displayFormatted(document.querySelector('input[name="vl_od_pl_ard_eixo"]'), data.vl_od_pl_ard_eixo || '');
                    displayFormatted(document.querySelector('input[name="vl_oe_pl_ard_esf"]'), data.vl_oe_pl_ard_esf || '');
                    displayFormatted(document.querySelector('input[name="vl_oe_pl_ard_cil"]'), data.vl_oe_pl_ard_cil || '');
                    displayFormatted(document.querySelector('input[name="vl_oe_pl_ard_eixo"]'), data.vl_oe_pl_ard_eixo || '');
                    displayFormatted(document.querySelector('input[name="vl_adicao"]'), data.vl_adicao || '');
                    document.querySelector('textarea[name="ds_observacao_refracao"]').value = data.obs_refracao || '';
                }

                // Update static fields
                if (data.vl_od_pl_are_esf !== undefined) {
                    displayFormatted(document.querySelector('input[name="vl_od_pl_are_esf"]'), data.vl_od_pl_are_esf || '');
                    displayFormatted(document.querySelector('input[name="vl_od_pl_are_cil"]'), data.vl_od_pl_are_cil || '');
                    displayFormatted(document.querySelector('input[name="vl_od_pl_are_eixo"]'), data.vl_od_pl_are_eixo || '');
                    displayFormatted(document.querySelector('input[name="vl_oe_pl_are_esf"]'), data.vl_oe_pl_are_esf || '');
                    displayFormatted(document.querySelector('input[name="vl_oe_pl_are_cil"]'), data.vl_oe_pl_are_cil || '');
                    displayFormatted(document.querySelector('input[name="vl_oe_pl_are_eixo"]'), data.vl_oe_pl_are_eixo || '');
                }

                // Apply formatting to all inputs after data is loaded
                numericInputs.forEach(input => {
                    handleChangeEvent({ target: input });
                });

                // Check and select 'estatica' if conditions are met
                checkAndSelectEstatica();
            })
            .catch(error => {
                console.error("Erro ao buscar evolução:", error);
            });
    }

    // Initialize radio button state
    checkAndSelectEstatica();

    // Função para atualizar o campo de refração na evolução
    function atualizarCampoRefracao() {
        try {
            const oculosData = [];
            const tipoRefracao = document.querySelector('input[name="tipo_refracao"]:checked')?.value;
            const refracaoTextarea = document.getElementById('textarea-refracao');
            
            if (!refracaoTextarea) return; // Se o campo não existir, saímos da função
    
            if (tipoRefracao === 'dinamica') {
                const dynamicFields = {
                    'od_esf': document.querySelector('input[name="vl_od_pl_ard_esf"]')?.value,
                    'od_cil': document.querySelector('input[name="vl_od_pl_ard_cil"]')?.value,
                    'od_eixo': document.querySelector('input[name="vl_od_pl_ard_eixo"]')?.value,
                    'oe_esf': document.querySelector('input[name="vl_oe_pl_ard_esf"]')?.value,
                    'oe_cil': document.querySelector('input[name="vl_oe_pl_ard_cil"]')?.value,
                    'oe_eixo': document.querySelector('input[name="vl_oe_pl_ard_eixo"]')?.value,
                    'adicao': document.querySelector('input[name="vl_adicao"]')?.value,
                };
    
                if (Object.values(dynamicFields).some(value => value)) {
                    oculosData.push("Óculos:");
                    const { od_esf, od_cil, od_eixo, oe_esf, oe_cil, oe_eixo, adicao } = dynamicFields;
                    const replaceDot = (value) => value.replace('.', ',');
                    const positiveSimbol = (val) => {
                        if (!val) return val;
                        const numVal = parseFloat(val);
                        return numVal > 0 ? `${val}` : val;
                    };
    
                    if (od_esf || od_cil || od_eixo) {
                        let od = " OD:";
                        od += od_esf ? ` ${replaceDot(positiveSimbol(od_esf))}` : '';
                        od += od_cil ? ` / ${replaceDot(positiveSimbol(od_cil))}` : '';
                        od += od_eixo ? ` x ${od_eixo}°` : '';
                        oculosData.push(od);
                    }
    
                    if (oe_esf || oe_cil || oe_eixo) {
                        let oe = " OE:";
                        oe += oe_esf ? ` ${replaceDot(positiveSimbol(oe_esf))}` : '';
                        oe += oe_cil ? ` / ${replaceDot(positiveSimbol(oe_cil))}` : '';
                        oe += oe_eixo ? ` x ${oe_eixo}°` : '';
                        oculosData.push(oe);
                    }
    
                    if (adicao) oculosData.push(` A=${replaceDot(positiveSimbol(adicao))}`);
                }
            } else if (tipoRefracao === 'estatica') {
                const staticFields = {
                    'od_esf': document.querySelector('input[name="vl_od_pl_are_esf"]')?.value,
                    'od_cil': document.querySelector('input[name="vl_od_pl_are_cil"]')?.value,
                    'od_eixo': document.querySelector('input[name="vl_od_pl_are_eixo"]')?.value,
                    'oe_esf': document.querySelector('input[name="vl_oe_pl_are_esf"]')?.value,
                    'oe_cil': document.querySelector('input[name="vl_oe_pl_are_cil"]')?.value,
                    'oe_eixo': document.querySelector('input[name="vl_oe_pl_are_eixo"]')?.value
                };
    
                if (Object.values(staticFields).some(value => value)) {
                    oculosData.push("Óculos:");
                    if (staticFields.od_esf || staticFields.od_cil || staticFields.od_eixo) {
                        let od = "OD:";
                        od += staticFields.od_esf ? ` ${staticFields.od_esf}` : '';
                        od += staticFields.od_cil ? ` / ${staticFields.od_cil}` : '';
                        od += staticFields.od_eixo ? ` x ${staticFields.od_eixo}°` : '';
                        oculosData.push(od);
                    }
                    if (staticFields.oe_esf || staticFields.oe_cil || staticFields.oe_eixo) {
                        let oe = "OE:";
                        oe += staticFields.oe_esf ? ` ${staticFields.oe_esf}` : '';
                        oe += staticFields.oe_cil ? ` / ${staticFields.oe_cil}` : '';
                        oe += staticFields.oe_eixo ? ` x ${staticFields.oe_eixo}°` : '';
                        oculosData.push(oe);
                    }
                }
            }
    
            const observacao = document.querySelector('textarea[name="ds_observacao_refracao"]')?.value?.trim();
            if (observacao) {
                oculosData.push(`\nObservações: ${observacao}`);
            }
            if (oculosData.length > 0) {
                refracaoTextarea.value = oculosData.join('');
                refracaoTextarea.dispatchEvent(new Event('input'));
            }
        } catch (error) {
            console.error("Erro ao atualizar campo de refração:", error);
        }
    }

    // Adiciona listener para todos os campos do formulário de óculos
    const oculosInputs = document.querySelectorAll('#form-oculos input[type="text"], #form-oculos input[type="number"], #form-oculos textarea');
    oculosInputs.forEach(input => {
        input.addEventListener('blur', atualizarCampoRefracao);
        input.addEventListener('change', atualizarCampoRefracao);
    });

    // Adiciona listener para os radio buttons de tipo de refração
    const radioButtons = document.querySelectorAll('input[name="tipo_refracao"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
            setTimeout(atualizarCampoRefracao, 100); // Pequeno delay para garantir que a UI foi atualizada
        });
    });

    // Function to debounce the textarea updates
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // Add debounce for observation field
    const observacaoTextarea = document.querySelector('textarea[name="ds_observacao_refracao"]');
    if (observacaoTextarea) {
        const debouncedUpdate = debounce(atualizarCampoRefracao, 2000); // 2 seconds
        observacaoTextarea.addEventListener('input', debouncedUpdate);
    }

    document.addEventListener('dadosSecundariosCarregados', () => {
        console.log('Dados secundários carregados, atualizando campo de refração');
        setTimeout(() => {
            atualizarCampoRefracao();
            console.log('Campo de refração atualizado após evento customizado');
        }, 500);
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Get all inputs in the form
    const allFormInputs = document.querySelectorAll('#form-oculos input[type="text"], #form-oculos input[type="number"], #form-oculos select');
    
    // Add keydown event listener to all inputs
    allFormInputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent form submission
                
                // Get all interactive elements in the form in the desired tab order
                const allElements = Array.from(document.querySelectorAll('#form-oculos input:not([type="hidden"]):not([type="radio"]), #form-oculos textarea'));
                const currentIndex = allElements.indexOf(input);
                
                // Check if we're on the last refraction field
                if (input.name === 'vl_oe_pl_ard_eixo' || input.name === 'vl_oe_pl_are_eixo') {
                    // Find and focus the addition field
                    const adicaoField = document.querySelector('input[name="vl_adicao"]');
                    if (adicaoField) {
                        adicaoField.focus();
                        return;
                    }
                } 
                // Check if we're on the addition field
                else if (input.name === 'vl_adicao') {
                    // Find and focus the observation textarea
                    const observacaoField = document.querySelector('textarea[name="ds_observacao_refracao"]');
                    if (observacaoField) {
                        observacaoField.focus();
                        return;
                    }
                }
                // Default behavior - go to next input
                else if (currentIndex > -1 && currentIndex < allElements.length - 1) {
                    allElements[currentIndex + 1].focus();
                }
            }
        });
    });
});

export async function carregarObservacaoOculos(pesquisa = '') {
    const container = document.getElementById('lista-oculos-container');
    if (!container) {
        console.error('Container not found');
        return;
    }
    
    try {
        container.innerHTML = '<div style="text-align: center; padding: 10px;">Carregando...</div>';

        const response = await fetch(`/api/observacao-oculos?search=${pesquisa}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar observacao oculos');
        }
        
        const observacoes = await response.json();
        
        if (observacoes.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 10px;">Nenhuma observacao encontrada</div>';
            return;
        }

        container.innerHTML = '';
        observacoes.forEach(observacao => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = observacao.ds_observacao;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(observacao.ds_observacao));
            container.appendChild(label);
        });
    } catch (error) {
        console.error('Erro ao carregar observacoes:', error);
        container.innerHTML = `<div style="text-align: center; padding: 10px; color: red;">
            Erro ao carregar observacoes: ${error.message}
        </div>`;
    }
}

