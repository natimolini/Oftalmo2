document.addEventListener("DOMContentLoaded", () => {
    const botaoSalvar = document.getElementById("botao-salvar");
    const saveIcon = document.getElementById("save-icon"); // Ensure this ID is correct
    const patientRecord = document.querySelector(".container-evolucao"); // Ensure this class is correct

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

    botaoSalvar.addEventListener("click", async () => {
        const nrAtendimento = document.getElementById("nr_atendimento").textContent.trim();
        const saveIcon = document.querySelector(".save-icon"); // Get the save icon element

        if (!nrAtendimento) {
            exibirMensagem("Número de atendimento não encontrado!", "error");
            return;
        }

        try {
            const response = await fetch(`/salvar_liberar/${nrAtendimento}`, {
                method: 'POST',
            });

            if (response.ok) {
                const data = await response.json();
                exibirMensagem(data.mensagem, "success");
                
                // Update UI to read-only state only if elements exist
                if (saveIcon) {
                    saveIcon.src = "../static/img/estatisticas/pensil_read_only_1.png";
                }
                
                if (patientRecord) {
                    patientRecord.classList.add("read-only");
                }
                
                // Add reload timer after successful save
                setTimeout(() => {
                    window.location.href = window.location.href;
                }, 3000);
            } else {
                const errorData = await response.json();
                exibirMensagem(errorData.mensagem || "Erro ao salvar.", "error");
            }
        } catch (error) {
            console.error("Erro:", error);
            exibirMensagem("Erro desconhecido ao salvar.", "error");
        }
    });
});
