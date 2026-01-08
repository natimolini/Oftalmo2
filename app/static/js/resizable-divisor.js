document.addEventListener('DOMContentLoaded', () => {
    const divisor = document.getElementById('divisor-redimensionavel');
    const painelEsquerdo = document.querySelector('.painel-esquerdo');
    const container = document.querySelector('.container-evolucao');
    
    if (!divisor || !painelEsquerdo || !container) {
        console.warn('Elementos do divisor não encontrados');
        return;
    }
    
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    
    const STORAGE_KEY = 'prontuario-painel-width';
    
    // Restaurar largura salva
    const savedWidth = localStorage.getItem(STORAGE_KEY);
    if (savedWidth) {
        painelEsquerdo.style.flex = `0 0 ${savedWidth}`;
    }
    
    // Mouse events
    divisor.addEventListener('mousedown', iniciarRedimensionamento);
    document.addEventListener('mousemove', redimensionar);
    document.addEventListener('mouseup', finalizarRedimensionamento);
    
    // Touch events para mobile
    divisor.addEventListener('touchstart', iniciarRedimensionamentoTouch);
    document.addEventListener('touchmove', redimensionarTouch);
    document.addEventListener('touchend', finalizarRedimensionamento);
    
    function iniciarRedimensionamento(e) {
        isResizing = true;
        startX = e.clientX;
        startWidth = painelEsquerdo.offsetWidth;
        
        divisor.classList.add('dragging');
        document.body.classList.add('resizing');
        
        e.preventDefault();
    }
    
    function iniciarRedimensionamentoTouch(e) {
        isResizing = true;
        startX = e.touches[0].clientX;
        startWidth = painelEsquerdo.offsetWidth;
        
        divisor.classList.add('dragging');
        document.body.classList.add('resizing');
        
        e.preventDefault();
    }
    
    function redimensionar(e) {
        if (!isResizing) return;
        
        const containerWidth = container.offsetWidth;
        const deltaX = e.clientX - startX;
        const newWidth = startWidth + deltaX;
        
        // Limites: mínimo 20%, máximo 80%
        const minWidth = containerWidth * 0.2;
        const maxWidth = containerWidth * 0.8;
        
        if (newWidth >= minWidth && newWidth <= maxWidth) {
            const percentage = (newWidth / containerWidth) * 100;
            painelEsquerdo.style.flex = `0 0 ${percentage}%`;
        }
        
        e.preventDefault();
    }
    
    function redimensionarTouch(e) {
        if (!isResizing) return;
        
        const containerWidth = container.offsetWidth;
        const deltaX = e.touches[0].clientX - startX;
        const newWidth = startWidth + deltaX;
        
        const minWidth = containerWidth * 0.2;
        const maxWidth = containerWidth * 0.8;
        
        if (newWidth >= minWidth && newWidth <= maxWidth) {
            const percentage = (newWidth / containerWidth) * 100;
            painelEsquerdo.style.flex = `0 0 ${percentage}%`;
        }
        
        e.preventDefault();
    }
    
    function finalizarRedimensionamento() {
        if (isResizing) {
            isResizing = false;
            divisor.classList.remove('dragging');
            document.body.classList.remove('resizing');
            
            // Salvar preferência
            const currentFlex = painelEsquerdo.style.flex;
            const widthMatch = currentFlex.match(/0 0 ([\d.]+)%/);
            if (widthMatch) {
                localStorage.setItem(STORAGE_KEY, widthMatch[1] + '%');
            }
        }
    }
    
    // Ajustar ao redimensionar a janela
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Recalcular percentual baseado na nova largura da janela
            const savedPercentage = localStorage.getItem(STORAGE_KEY);
            if (savedPercentage) {
                painelEsquerdo.style.flex = `0 0 ${savedPercentage}`;
            }
        }, 250);
    });
});