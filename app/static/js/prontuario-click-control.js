/**
 * Controla cliques para abertura de prontuários, prevenindo múltiplas aberturas
 */

let ultimoClickProntuario = 0;
const INTERVALO_BLOQUEIO = 10000; // 10 segundos em ms

/**
 * Verifica se pode abrir um prontuário
 * @returns {boolean} true se pode abrir, false se ainda está no período de bloqueio
 */
export function podeAbrirProntuario() {
    const agora = Date.now();
    const tempoDecorrido = agora - ultimoClickProntuario;
    
    if (tempoDecorrido < INTERVALO_BLOQUEIO) {
        const tempoRestante = Math.ceil((INTERVALO_BLOQUEIO - tempoDecorrido) / 1000);
        return { 
            pode: false, 
            tempoRestante 
        };
    }
    
    return { pode: true };
}

/**
 * Registra que um prontuário foi aberto
 */
export function registrarAberturaProntuario() {
    ultimoClickProntuario = Date.now();
}

/**
 * Reseta o bloqueio (útil para testes ou situações especiais)
 */
export function resetarBloqueio() {
    ultimoClickProntuario = 0;
}