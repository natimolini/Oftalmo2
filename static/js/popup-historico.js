class PopupHistorico {
    constructor() {
        this.overlay = null;
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createPopup();
        this.bindEvents();
    }

    createPopup() {
        // Criar o overlay do popup
        this.overlay = document.createElement('div');
        this.overlay.className = 'popup-historico-overlay';
        this.overlay.innerHTML = `
            <div class="popup-historico-content">
                <div class="popup-historico-header">
                    <h2>Dados Históricos do Paciente</h2>
                    <button class="popup-historico-close" type="button">&times;</button>
                </div>
                <div class="popup-historico-body">
                    <div class="popup-historico-content-area" id="popup-historico-content">
                        <div class="popup-historico-loading">Carregando dados...</div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.overlay);
    }

    bindEvents() {
        // Fechar popup ao clicar no botão de fechar
        const closeBtn = this.overlay.querySelector('.popup-historico-close');
        closeBtn.addEventListener('click', () => this.close());

        // Fechar popup ao clicar no overlay (fora do conteúdo)
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        // Fechar popup com a tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    async open(cdPessoaFisica, dataConsulta) {
        if (this.isOpen) return;

        this.isOpen = true;
        this.overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Impedir scroll da página

        // Atualizar o título com a data
        const header = this.overlay.querySelector('.popup-historico-header h2');
        header.textContent = `Dados Históricos - Consulta de ${dataConsulta}`;

        await this.loadContent(cdPessoaFisica);
    }

    // Verificar se esta função existe:
    async openComData(cdPessoaFisica, dataRegistro) {
        if (this.isOpen) return;

        this.isOpen = true;
        this.overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Atualizar o título com a data
        const header = this.overlay.querySelector('.popup-historico-header h2');
        header.textContent = `Dados Históricos - Registro de ${dataRegistro}`;

        await this.loadContentPorData(cdPessoaFisica, dataRegistro);
    }

    close() {
        if (!this.isOpen) return;

        this.isOpen = false;
        this.overlay.style.display = 'none';
        document.body.style.overflow = ''; // Restaurar scroll da página
    }

    async loadContent(cdPessoaFisica) {
        const contentArea = this.overlay.querySelector('#popup-historico-content');

        try {
            // Mostrar loading
            contentArea.innerHTML = '<div class="popup-historico-loading">Carregando dados...</div>';

            // Fazer requisição para buscar dados
            const response = await fetch(`/api/paciente-alergia/${cdPessoaFisica}`);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Exibir conteúdo
            if (data.ds_observacao && data.ds_observacao.trim()) {
                contentArea.innerHTML = data.ds_observacao;
            } else {
                contentArea.innerHTML = '<div class="popup-historico-empty">Nenhum dado histórico encontrado para este paciente.</div>';
            }

        } catch (error) {
            console.error('Erro ao carregar dados históricos:', error);
            contentArea.innerHTML = `
                <div class="popup-historico-error">
                    Erro ao carregar dados históricos:<br>
                    ${error.message}
                </div>
            `;
        }
    }

    async loadContentPorData(cdPessoaFisica, dataRegistro) {
        const contentArea = this.overlay.querySelector('#popup-historico-content');

        try {
            console.log('LoadContentPorData - Iniciando:', { cdPessoaFisica, dataRegistro });
            
            // Mostrar loading
            contentArea.innerHTML = '<div class="popup-historico-loading">Carregando dados históricos...</div>';

            // Usar query parameter ao invés de path parameter
            const url = `/api/paciente-alergia-por-data/${cdPessoaFisica}?data_registro=${encodeURIComponent(dataRegistro)}`;
            console.log('Fazendo requisição para:', url);
            
            const response = await fetch(url);
            console.log('Resposta recebida:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Erro na resposta:', errorText);
                throw new Error(`Erro HTTP: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Dados recebidos:', data);

            if (data.error) {
                throw new Error(data.error);
            }

            // Exibir conteúdo
            if (data.ds_observacao && data.ds_observacao.trim()) {
                console.log('Exibindo observação com', data.ds_observacao.length, 'caracteres');
                contentArea.innerHTML = data.ds_observacao;
            } else {
                console.log('Nenhuma observação encontrada');
                contentArea.innerHTML = '<div class="popup-historico-empty">Nenhum dado histórico encontrado para esta data.</div>';
            }

        } catch (error) {
            console.error('Erro detalhado ao carregar dados históricos:', error);
            contentArea.innerHTML = `
                <div class="popup-historico-error">
                    Erro ao carregar dados históricos:<br>
                    ${error.message}
                </div>
            `;
        }
    }
}

// Função para verificar se uma data é anterior a 01/02/2025
function isDataAnteriorFevereiro2025(dataString) {
    try {
        // Converter data do formato DD/MM/YYYY para objeto Date
        const [dia, mes, ano] = dataString.split('/').map(Number);
        const dataConsulta = new Date(ano, mes - 1, dia); // mes - 1 porque Date usa índice 0 para janeiro
        
        // Data limite: 01/02/2025
        const dataLimite = new Date(2025, 4, 30); // 4 = maio (índice 0), 30 = dia 30
        
        return dataConsulta < dataLimite;
    } catch (error) {
        console.error('Erro ao processar data:', error);
        return false;
    }
}

// Instanciar o popup quando o DOM estiver carregado
let popupHistorico;

document.addEventListener('DOMContentLoaded', () => {
    popupHistorico = new PopupHistorico();
});

// Exportar funções para uso global
window.openPopupHistorico = (cdPessoaFisica, dataConsulta) => {
    if (popupHistorico) {
        popupHistorico.open(cdPessoaFisica, dataConsulta);
    }
};

window.openPopupHistoricoComData = (cdPessoaFisica, dataRegistro) => {
    if (popupHistorico) {
        popupHistorico.openComData(cdPessoaFisica, dataRegistro);
    }
};

window.isDataAnteriorFevereiro2025 = isDataAnteriorFevereiro2025;

export { PopupHistorico, isDataAnteriorFevereiro2025 };