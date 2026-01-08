export function exibirMensagem(mensagem, tipo = "success"){

    const flashMessageDiv = document.getElementById('flash-message')

    flashMessageDiv.style.display = "block";
    flashMessageDiv.textContent = mensagem;

    // Common styles for all message types
    flashMessageDiv.style.padding = "10px";
    flashMessageDiv.style.margin = "0"; // Remove margin
    flashMessageDiv.style.borderRadius = "5px";
    flashMessageDiv.style.opacity = "1";
    flashMessageDiv.style.transition = "opacity 1s ease";
    flashMessageDiv.style.width = "1000px"; // Define uma largura menor para a mensagem

    // Positioning styles to center the message
    flashMessageDiv.style.position = "fixed";
    flashMessageDiv.style.left = "50%";
    flashMessageDiv.style.top = "5%";
    flashMessageDiv.style.transform = "translate(-50%, -50%)";

    if (tipo === "success") {
        flashMessageDiv.style.backgroundColor = "#d4edda";
        flashMessageDiv.style.color = "#155724";
    } else if (tipo === "info") {
        flashMessageDiv.style.backgroundColor = "#d1ecf1";
        flashMessageDiv.style.color = "#0c5460";
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