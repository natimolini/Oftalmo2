export function fecharPopup() {
    // Realiza a requisição para limpar a sessão
    fetch('/fechar_prontuario', { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            console.log("Sessão limpa", data);
            window.close();
        })
        .catch(error => {
            console.error("Erro ao limpar a sessão", error);
        });
}
