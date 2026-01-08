class BuscaAvancada {
    constructor() {
        this.modal = null;
        this.popupAtendimentos = null;
        this.abaAtiva = 'nome';
        this.init();
    }

    init() {
        this.criarModal();
        this.criarPopupAtendimentos();
        this.bindEvents();
    }

    criarModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'modal-busca-avancada';
        this.modal.innerHTML = `
            <div class="modal-busca-content">
                <div class="modal-busca-header">
                    <h2>Busca Avançada de Pacientes</h2>
                    <button class="modal-busca-close">&times;</button>
                </div>
                <div class="modal-busca-body">
                    <div class="busca-tabs">
                        <button class="busca-tab active" data-tab="nome">Buscar por Nome</button>
                        <button class="busca-tab" data-tab="nascimento">Buscar por Data de Nascimento</button>
                    </div>

                    <div class="busca-form active" data-form="nome">
                        <div class="busca-input-group">
                            <label>Nome do Paciente:</label>
                            <input type="text" id="busca-nome-input" placeholder="Digite o nome (mínimo 3 caracteres)">
                        </div>
                        <button class="busca-btn" id="busca-nome-btn">Buscar</button>
                    </div>

                    <div class="busca-form" data-form="nascimento">
                        <div class="busca-input-group">
                            <label>Data de Nascimento:</label>
                            <input type="text" id="busca-nascimento-input" placeholder="DD/MM/AAAA" maxlength="10">
                        </div>
                        <button class="busca-btn" id="busca-nascimento-btn">Buscar</button>
                    </div>

                    <div class="busca-resultados" id="busca-resultados-container" style="display: none;">
                        <h3>Resultados da Busca</h3>
                        <div class="busca-lista" id="busca-lista"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
    }

    criarPopupAtendimentos() {
        this.popupAtendimentos = document.createElement('div');
        this.popupAtendimentos.id = 'popup-atendimentos';
        this.popupAtendimentos.className = 'popup-atendimentos-overlay';
        this.popupAtendimentos.style.display = 'none';
        
        this.popupAtendimentos.innerHTML = `
            <div class="popup-atendimentos-content">
                <div class="popup-atendimentos-header">
                    <h2 id="popup-atendimentos-titulo">Atendimentos do Paciente</h2>
                    <button class="popup-atendimentos-close" type="button">&times;</button>
                </div>
                <div class="popup-atendimentos-body">
                    <div id="popup-atendimentos-lista"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.popupAtendimentos);
        
        // Aguardar o próximo ciclo do event loop para garantir que o elemento está no DOM
        setTimeout(() => {
            const closeBtn = this.popupAtendimentos.querySelector('.popup-atendimentos-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.fecharPopupAtendimentos());
            }
            
            this.popupAtendimentos.addEventListener('click', (e) => {
                if (e.target === this.popupAtendimentos) {
                    this.fecharPopupAtendimentos();
                }
            });
        }, 0);
    }

    bindEvents() {
        const closeBtn = this.modal.querySelector('.modal-busca-close');
        closeBtn.addEventListener('click', () => this.fechar());

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.fechar();
            }
        });

        const tabs = this.modal.querySelectorAll('.busca-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => this.trocarAba(tab.dataset.tab));
        });

        const nomeInput = document.getElementById('busca-nome-input');
        const nomeBtn = document.getElementById('busca-nome-btn');

        nomeBtn.addEventListener('click', () => this.buscarPorNome());
        nomeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.buscarPorNome();
            }
        });

        const nascimentoInput = document.getElementById('busca-nascimento-input');
        const nascimentoBtn = document.getElementById('busca-nascimento-btn');

        nascimentoBtn.addEventListener('click', () => this.buscarPorNascimento());
        nascimentoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.buscarPorNascimento();
            }
        });

        nascimentoInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2);
            }
            if (value.length >= 5) {
                value = value.substring(0, 5) + '/' + value.substring(5, 9);
            }
            e.target.value = value;
        });
    }

    trocarAba(aba) {
        const tabs = this.modal.querySelectorAll('.busca-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === aba);
        });

        const forms = this.modal.querySelectorAll('.busca-form');
        forms.forEach(form => {
            form.classList.toggle('active', form.dataset.form === aba);
        });

        this.abaAtiva = aba;
        this.limparResultados();
    }

    async buscarPorNome() {
        const input = document.getElementById('busca-nome-input');
        const termo = input.value.trim();

        if (termo.length < 3) {
            this.exibirMensagem('Digite pelo menos 3 caracteres', 'error');
            return;
        }

        this.exibirCarregando();

        try {
            const response = await fetch(`/api/buscar-todos-pacientes?termo=${encodeURIComponent(termo)}`);
            
            if (!response.ok) {
                throw new Error('Erro ao buscar pacientes');
            }

            const pacientes = await response.json();
            this.exibirResultados(pacientes);
        } catch (error) {
            console.error('Erro:', error);
            this.exibirMensagem('Erro ao buscar pacientes', 'error');
        }
    }

    async buscarPorNascimento() {
        const input = document.getElementById('busca-nascimento-input');
        const data = input.value.trim();

        const regex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!regex.test(data)) {
            this.exibirMensagem('Digite uma data válida (DD/MM/AAAA)', 'error');
            return;
        }

        this.exibirCarregando();

        try {
            const response = await fetch(`/api/buscar-pacientes-nascimento?data=${encodeURIComponent(data)}`);
            
            if (!response.ok) {
                throw new Error('Erro ao buscar pacientes');
            }

            const pacientes = await response.json();
            this.exibirResultados(pacientes);
        } catch (error) {
            console.error('Erro:', error);
            this.exibirMensagem('Erro ao buscar pacientes', 'error');
        }
    }

    exibirCarregando() {
        const container = document.getElementById('busca-resultados-container');
        const lista = document.getElementById('busca-lista');
        
        container.style.display = 'block';
        lista.innerHTML = '<div class="busca-loading">Buscando pacientes...</div>';
    }

    exibirResultados(pacientes) {
        const container = document.getElementById('busca-resultados-container');
        const lista = document.getElementById('busca-lista');

        container.style.display = 'block';

        if (pacientes.length === 0) {
            lista.innerHTML = '<div class="busca-vazio">Nenhum paciente encontrado</div>';
            return;
        }

        lista.innerHTML = '';

        pacientes.forEach(paciente => {
            const item = document.createElement('div');
            item.className = 'busca-item';
            
            item.innerHTML = `
                <div class="busca-item-info">
                    <div class="busca-item-nome">${paciente.nm_pessoa_fisica}</div>
                    <div class="busca-item-detalhes">
                        Nascimento: ${paciente.dt_nascimento || 'Não informado'} | 
                        CPF: ${paciente.nr_cpf || 'Não informado'}
                    </div>
                </div>
                <div class="busca-item-acoes">
                    <button class="busca-item-btn btn-atendimentos" 
                            data-pessoa="${paciente.cd_pessoa_fisica}"
                            data-nome="${paciente.nm_pessoa_fisica}">
                        Todos Atendimentos
                    </button>
                    <button class="busca-item-btn btn-especial" 
                            data-pessoa="${paciente.cd_pessoa_fisica}"
                            data-nome="${paciente.nm_pessoa_fisica}">
                        Receita Especial
                    </button>
                </div>
            `;

            lista.appendChild(item);
        });

        lista.querySelectorAll('.btn-prontuario').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const nrAtendimento = e.target.dataset.atendimento;
                const cdPessoa = e.target.dataset.pessoa;
                this.abrirProntuario(nrAtendimento, cdPessoa);
            });
        });

        lista.querySelectorAll('.btn-atendimentos').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cdPessoa = e.target.dataset.pessoa;
                const nmPessoa = e.target.dataset.nome;
                this.abrirListaAtendimentos(cdPessoa, nmPessoa);
            });
        });

        lista.querySelectorAll('.btn-especial').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cdPessoa = e.target.dataset.pessoa;
                const nmPessoa = e.target.dataset.nome;
                this.abrirProntuarioEspecial(cdPessoa, nmPessoa);
            });
        });
    }

    async abrirListaAtendimentos(cdPessoa, nmPessoa) {
        if (!this.popupAtendimentos) {
            console.error('Popup de atendimentos não foi criado');
            return;
        }

        // Usar getElementById para garantir que pegamos o elemento correto
        const lista = document.getElementById('popup-atendimentos-lista');
        const titulo = document.getElementById('popup-atendimentos-titulo');
        
        if (!lista || !titulo) {
            console.error('Elementos do popup não encontrados');
            return;
        }
        
        // Atualizar título
        titulo.textContent = `Atendimentos - ${nmPessoa}`;
        
        // Mostrar popup
        this.popupAtendimentos.style.display = 'flex';
        lista.innerHTML = '<div class="atendimentos-loading">Carregando atendimentos...</div>';
        
        try {
            console.log('Buscando atendimentos para:', cdPessoa);
            const response = await fetch(`/api/lista-atendimentos/${cdPessoa}`);
            
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            
            const atendimentos = await response.json();
            console.log('Atendimentos recebidos:', atendimentos);
            
            if (!atendimentos || atendimentos.length === 0) {
                lista.innerHTML = '<div class="atendimentos-vazio">Nenhum atendimento encontrado</div>';
                return;
            }
            
            lista.innerHTML = '';
            
            atendimentos.forEach(atendimento => {
                const item = document.createElement('div');
                item.className = 'atendimento-item';

                // Verifica se o atendimento está lançado
                const oftalmologiaGerada = !!atendimento.nr_atendimento;

                // Ícone e tooltip
                const statusIcon = document.createElement('span');
                statusIcon.className = 'atendimento-status-icon';
                statusIcon.style.marginRight = '8px';
                if (oftalmologiaGerada) {
                    statusIcon.innerHTML = '<img src="/static/img/status-consulta/aceitar1.png" title="Oftalmologia Gerada" style="width:20px;">';
                } else {
                    statusIcon.innerHTML = '<img src="/static/img/status-consulta/sinal-de-parada.png" title="Oftalmologia não gerada" style="width:20px;">';
                }

                const statusClass = atendimento.status === 'Atendido' ? 'status-atendido' : 'status-aguardando';

                item.innerHTML = `
                    <div class="atendimento-info">
                        <div class="atendimento-data">${atendimento.data}</div>
                        <div class="atendimento-medico">Dr(a). ${atendimento.medico}</div>
                    </div>
                    <div class="atendimento-status ${statusClass}">
                        ${atendimento.status}
                    </div>
                `;

                // Adiciona o ícone antes das informações
                item.querySelector('.atendimento-info').prepend(statusIcon);

                item.addEventListener('click', () => {
                    this.abrirProntuario(atendimento.nr_atendimento, cdPessoa);
                    this.fecharPopupAtendimentos();
                });
                
                lista.appendChild(item);
            });
            
        } catch (error) {
            console.error('Erro ao carregar atendimentos:', error);
            lista.innerHTML = '<div class="atendimentos-vazio">Erro ao carregar atendimentos: ' + error.message + '</div>';
        }
    }

    fecharPopupAtendimentos() {
        if (this.popupAtendimentos) {
            this.popupAtendimentos.style.display = 'none';
        }
    }

    abrirProntuario(nrAtendimento, cdPessoa) {
        window.open(`/prontuario/${nrAtendimento}?cd_pessoa_fisica=${cdPessoa}`, '_blank');
        this.fechar();
    }

    abrirProntuarioEspecial(cdPessoa, nmPessoa) {
        sessionStorage.setItem('prontuario_especial', 'true');
        sessionStorage.setItem('cd_pessoa_fisica_especial', cdPessoa);
        sessionStorage.setItem('nm_pessoa_especial', nmPessoa);
        
        window.open(`/prontuario-especial?cd_pessoa_fisica=${cdPessoa}`, '_blank');
        this.fechar();
    }

    limparResultados() {
        const container = document.getElementById('busca-resultados-container');
        const lista = document.getElementById('busca-lista');
        
        container.style.display = 'none';
        lista.innerHTML = '';
    }

    abrir() {
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        document.getElementById('busca-nome-input').value = '';
        document.getElementById('busca-nascimento-input').value = '';
        this.limparResultados();
    }

    fechar() {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    exibirMensagem(mensagem, tipo = 'success') {
        const flashMessageDiv = document.getElementById('flash-message');
        if (flashMessageDiv) {
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
        }
    }
}

// Instanciar quando o DOM carregar
let buscaAvancada;

document.addEventListener('DOMContentLoaded', () => {
    buscaAvancada = new BuscaAvancada();
});

// Exportar para uso global
window.abrirBuscaAvancada = () => {
    if (buscaAvancada) {
        buscaAvancada.abrir();
    }
};