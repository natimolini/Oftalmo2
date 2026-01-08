const prescricoes = {
    1: "=> USO OCULAR\nCOMPRESSAS FRIAS:\nUso local 3x / dia / quando necessário.",
    2: "=> USO OCULAR\nCOMPRESSAS QUENTES:\nUso local 3x / dia / quando necessário.",
    3: "=> USO OCULAR\nPATANOL S COLÍRIO: 1 CX\nPingar 1 gota 2x / dia / quando necessário.",
    4: "=> USO OCULAR\nALPHAGAN Z COLÍRIO: 1 FRASCO\nPingar 1 gota 12 / 12 horas / por tempo indeterminado.",
    5: "=> USO OCULAR\nADAPTIS GEL OFTÁLMICO: 1 CX\nUso local 3 a 4x / dia.",
    6: "=> USO OCULAR\nALPHABRIN 2 MG / ML COLÍRIO: 1 CX\nPingar 1 gota 12/ 12 horas / por tempo indeterminado.",
    7: "=> USO OCULAR\nADAPTIS 1% COLÍRIO: 1 CX\nPingar 1 gota de 3 a 4x / dia / quando necessário.",
    8: "=> USO OCULAR\nMEDICAMENTO 8: 1 FRASCO\nPingar 2 gotas 8 / 8 horas / por dois dias.",
    9: "=> USO OCULAR\nMEDICAMENTO 9: 1 CX\nUso local 1 a 2x / dia / quando necessário."
};

document.addEventListener("DOMContentLoaded", async () => {
    const nrAtendimento = document.getElementById('nr_atendimento')?.textContent?.trim();
    const textareaReceita = document.getElementById('receita');
    if (nrAtendimento && textareaReceita) {
        try {
            const response = await fetch(`/api/receituario/observacao/${nrAtendimento}`);
            if (response.ok) {
                const data = await response.json();
                textareaReceita.value = data.ds_observacao || '';
            }
        } catch (e) {
            console.error("Erro ao buscar observação do receituário:", e);
        }
    }

    const receituarioContainer = document.querySelector(".container-receituario");

    if (!receituarioContainer.classList.contains("read-only")) {
        document.querySelectorAll(".lista-medicamento-protocolo ul li").forEach((medicamento) => {
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

            medicamento.addEventListener("click", () => {
                const id = medicamento.getAttribute("data-id");
                const prescricao = prescricoes[id];
                const textarea = document.getElementById("receita");

                if (prescricao) {
                    // Split current textarea content into individual prescriptions
                    const existingContent = textarea.value.trim();
                    const existingPrescriptions = existingContent ? existingContent.split('\n\n') : [];
                    
                    // Check if this exact prescription text already exists
                    if (existingPrescriptions.some(item => item.trim() === prescricao.trim())) {
                        // Show message that item is already in the list
                        exibirMensagem("Este medicamento já foi adicionado à receita.", "warning");
                        return;
                    }
                    
                    // If not a duplicate, add it to the textarea
                    textarea.value = existingContent 
                        ? existingContent + '\n\n' + prescricao 
                        : prescricao;
                        
                    textarea.dispatchEvent(new Event("input", { bubbles: true }));
                } else {
                    exibirMensagem("Prescrição não encontrada para este medicamento.", "error");
                }
            });
        });

        // Find the click event handler for medication items
        document.querySelectorAll('.lista-medicamento-protocolo li').forEach(medicamento => {
            medicamento.addEventListener("click", () => {
                const id = medicamento.getAttribute("data-id");
                const prescricao = prescricoes[id];
                const textarea = document.getElementById("receita");

                if (prescricao) {
                    // Check if this exact prescription already exists in the textarea
                    if (textarea.value.includes(prescricao)) {
                        // Alert user that this item is already in the prescription
                        exibirMensagem("Este medicamento já foi adicionado à receita.", "warning");
                        return;
                    }
                    
                    // Add prescription text with proper separator
                    textarea.value += (textarea.value ? "\n\n" : "") + prescricao;
                    textarea.dispatchEvent(new Event("input", { bubbles: true }));
                } else {
                    exibirMensagem("Prescrição não encontrada para este medicamento.", "error");
                }
            });
        });
    }
});

export async function carregarReceituario(nrAtendimento) {
    const textareaReceita1 = document.getElementById('receita');
    const textareaReceita2 = document.getElementById('receita2');
    
    if (nrAtendimento) {
        try {
            // Carregar primeira receita
            if (textareaReceita1) {
                const response1 = await fetch(`/api/receituario/observacao/${nrAtendimento}`);
                if (response1.ok) {
                    const data1 = await response1.json();
                    textareaReceita1.value = data1.ds_observacao || '';
                }
            }

            // Carregar segunda receita
            if (textareaReceita2) {
                const response2 = await fetch(`/api/receituario/observacao2/${nrAtendimento}`);
                if (response2.ok) {
                    const data2 = await response2.json();
                    textareaReceita2.value = data2.ds_observacao2 || '';
                }
            }
        } catch (e) {
            console.error("Erro ao buscar observações do receituário:", e);
        }
    }

    const receituarioContainer = document.querySelector(".container-receituario");

    if (!receituarioContainer.classList.contains("read-only")) {
        document.querySelectorAll(".lista-medicamento-protocolo ul li").forEach((medicamento) => {
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

            medicamento.addEventListener("click", () => {
                const id = medicamento.getAttribute("data-id");
                const prescricao = prescricoes[id];
                const textarea1 = document.getElementById("receita");
                const textarea2 = document.getElementById("receita2");

                if (prescricao) {
                    // Split current textarea content into individual prescriptions
                    const existingContent1 = textarea1.value.trim();
                    const existingPrescriptions1 = existingContent1 ? existingContent1.split('\n\n') : [];
                    const existingContent2 = textarea2.value.trim();
                    const existingPrescriptions2 = existingContent2 ? existingContent2.split('\n\n') : [];
                    
                    // Check if this exact prescription text already exists in either textarea
                    if (existingPrescriptions1.some(item => item.trim() === prescricao.trim()) || existingPrescriptions2.some(item => item.trim() === prescricao.trim())) {
                        // Show message that item is already in the list
                        exibirMensagem("Este medicamento já foi adicionado à receita.", "warning");
                        return;
                    }
                    
                    // Determine target textarea (receita or receita2) based on current focus
                    const targetTextarea = document.activeElement === textarea1 ? textarea2 : textarea1;
                    
                    // If not a duplicate, add it to the target textarea
                    targetTextarea.value = existingContent2 
                        ? existingContent2 + '\n\n' + prescricao 
                        : prescricao;
                        
                    targetTextarea.dispatchEvent(new Event("input", { bubbles: true }));
                } else {
                    exibirMensagem("Prescrição não encontrada para este medicamento.", "error");
                }
            });
        });
    }
}

async function salvarReceituario() {
    const nrAtendimento = document.getElementById('nr_atendimento').textContent.trim();
    const dsObservacao = document.getElementById('receita').value.trim();

    // Aqui você deve extrair/tratar o nome do medicamento para ds_conduta
    // Exemplo simples: pegar apenas as primeiras palavras de cada linha
    const linhas = dsObservacao.split('\n');
    const nomesMedicamentos = linhas
        .map(linha => linha.split(' ')[0]) // Ajuste conforme sua regra de extração
        .filter(nome => nome); // Remove linhas vazias
    const dsConduta = nomesMedicamentos.join('\n');

    const response = await fetch('/api/receituario/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nr_atendimento: nrAtendimento,
            ds_conduta: dsConduta,
            ds_observacao: dsObservacao
        })
    });

    const data = await response.json();
    if (data.status === 'success') {
        exibirMensagem('Receituário salvo com sucesso!', 'success');
    } else {
        exibirMensagem(data.mensagem || 'Erro ao salvar receituário.', 'error');
    }
}
