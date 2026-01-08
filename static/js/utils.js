/**
 * Implementa throttle para limitar a frequência de execução de uma função
 * @param {Function} func - Função a ser executada
 * @param {number} limit - Limite de tempo em ms
 * @returns {Function} - Função com throttle
 */
export function throttle(func, limit) {
    let inThrottle;
    let lastResult;
    
    return function(...args) {
        if (!inThrottle) {
            inThrottle = true;
            lastResult = func.apply(this, args);
            
            setTimeout(() => inThrottle = false, limit);
        }
        
        return lastResult;
    };
}

/**
 * Implementa debounce para atrasar a execução de uma função até que
 * não seja chamada por um período específico
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} - Função com debounce
 */
export function debounce(func, wait) {
    let timeout;
    
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}