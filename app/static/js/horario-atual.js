function atualizarHora() {
    const elementoHora = document.querySelector('.hora-atual');
    const agora = new Date();
    const horaFormatada = agora.toLocaleTimeString([], {hour12:false}); 
    elementoHora.textContent = horaFormatada;
}

setInterval(atualizarHora, 1000);
