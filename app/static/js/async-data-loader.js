document.addEventListener('DOMContentLoaded', () => {
    // Mostrar indicador de carregamento
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
    
    // Obter parâmetros necessários
    const nrAtendimento = document.getElementById('nr_atendimento')?.textContent?.trim();
    const urlParams = new URLSearchParams(window.location.search);
    const cdPessoaFisica = urlParams.get('cd_pessoa_fisica');
    
    if (!nrAtendimento || !cdPessoaFisica) {
        console.error('Dados de atendimento não encontrados');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        return;
    }
    
    // Carregar dados secundários
    carregarDadosSecundarios(nrAtendimento, cdPessoaFisica);
});

async function carregarDadosSecundarios(nrAtendimento, cdPessoaFisica) {
    try {
        console.log('Carregando dados secundários...');
        
        const response = await fetch(`/api/prontuario/dados-secundarios/${nrAtendimento}?cd_pessoa_fisica=${cdPessoaFisica}`);
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.statusText}`);
        }
        
        const dados = await response.json();
        console.log('Dados secundários recebidos:', dados);
        
        // Atualizar campos com os dados recebidos
        preencherDadosFormulario(dados);
        
        // Atualizar histórico de consultas
        atualizarHistoricoConsultas(dados.consultas_anteriores);
        
        // ADICIONAR ESTA LINHA - Carregar consultas antigas
        await carregarConsultasAntigas(cdPessoaFisica);
        
        // Ocultar indicador de carregamento
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        console.log('Carregamento assíncrono concluído');
        
        document.dispatchEvent(new CustomEvent('dadosSecundariosCarregados', { 
            detail: { timestamp: Date.now() } 
        }));
        console.log('Evento dadosSecundariosCarregados disparado');
    } catch (error) {
        console.error('Erro ao carregar dados secundários:', error);
        // Ocultar indicador de carregamento mesmo em caso de erro
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
}

// ADICIONAR ESTAS NOVAS FUNÇÕES ao final do arquivo:

async function carregarConsultasAntigas(cdPessoaFisica) {
    try {
        console.log('Carregando consultas antigas...');
        
        // MUDAR PARA O ENDPOINT REAL
        const response = await fetch(`/api/consultas-antigas/${cdPessoaFisica}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na resposta:', errorText);
            throw new Error(`Erro na requisição: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Consultas antigas recebidas:', data);
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Atualizar a lista de consultas antigas
        atualizarListaConsultasAntigas(data.consultas_antigas);
        
    } catch (error) {
        console.error('Erro ao carregar consultas antigas:', error);
        // Exibir erro na interface
        const listaConsultas = document.querySelector('ul.arvore-prontuario');
        if (listaConsultas) {
            const errorElement = document.createElement('div');
            errorElement.className = 'consultas-antigas-error';
            errorElement.textContent = `Erro ao carregar consultas antigas: ${error.message}`;
            listaConsultas.appendChild(errorElement);
        }
    }
}

function atualizarListaConsultasAntigas(consultasAntigas) {
    const listaConsultas = document.querySelector('ul.arvore-prontuario');
    if (!listaConsultas) return;
    
    // NÃO criar separador - apenas adicionar as consultas antigas diretamente na lista
    if (!consultasAntigas || consultasAntigas.length === 0) {
        return; // Não adicionar nada se não houver consultas antigas
    }
    
    // Adicionar separador simples como um item da lista
    const separadorLi = document.createElement('li');
    separadorLi.className = 'separador-consultas-antigas-item';
    separadorLi.textContent = 'Consultas Antigas';
    listaConsultas.appendChild(separadorLi);
    
    // Adicionar consultas antigas diretamente como itens da lista
    consultasAntigas.forEach(consulta => {
        const li = document.createElement('li');
        li.className = 'consultas-antigas-item';
        li.setAttribute('data-cd-pessoa', consulta.cd_pessoa_fisica);
        li.setAttribute('data-data-registro', consulta.data_formatada);
        li.textContent = consulta.data_formatada;
        
        // Adicionar evento de clique para abrir popup
        li.onclick = function() {
            abrirPopupConsultaAntiga(this);
        };
        
        listaConsultas.appendChild(li);
    });
}


async function abrirPopupConsultaAntiga(element) {
    const cdPessoaFisica = element.getAttribute('data-cd-pessoa');
    const dataRegistro = element.getAttribute('data-data-registro');
    
    console.log('Abrindo consulta antiga:', { cdPessoaFisica, dataRegistro });
    
    // Verificar se o popup está disponível
    if (typeof window.openPopupHistoricoComData === 'function') {
        window.openPopupHistoricoComData(cdPessoaFisica, dataRegistro);
    } else if (typeof window.openPopupHistorico === 'function') {
        // Fallback para função original se a nova não existir
        window.openPopupHistorico(cdPessoaFisica, dataRegistro);
    } else {
        console.error('Nenhuma função de popup histórico encontrada');
        alert('Erro ao abrir popup histórico');
    }
}


function preencherDadosFormulario(dados) {
    // Preencher campos de refração
    const refracao = dados.refracao || {};
    const camposRefracao = [
        'vl_od_pl_ard_esf', 'vl_od_pl_ard_cil', 'vl_od_pl_ard_eixo',
        'vl_oe_pl_ard_esf', 'vl_oe_pl_ard_cil', 'vl_oe_pl_ard_eixo',
        'vl_adicao'
    ];
    
    camposRefracao.forEach(campo => {
        const input = document.querySelector(`input[name="${campo}"]`);
        if (input && refracao[campo]) {
            input.value = refracao[campo];
            input.dispatchEvent(new Event('input'));
        }
    });
    
    // Preencher observação de refração
    const obsRefracao = document.querySelector('textarea[name="ds_observacao_refracao"]');
    if (obsRefracao && refracao.ds_observacao) {
        obsRefracao.value = refracao.ds_observacao;
        obsRefracao.dispatchEvent(new Event('input'));
    }
    
    // Preencher outros campos de texto, apenas se não foram editados manualmente
    const camposTexto = {
        'ds_anamnese': 'text-area-anamnese',
        'ds_acuidade_visual': 'textarea-acuidade',
        'ds_pressao': 'textarea-tonometria',
        'ds_diagnostico': 'text-area-diagnostico',
        'ds_conduta': 'textarea-conduta',
        'ds_exames': 'textarea-exames',
        'ds_lentes_contato': 'text-area-lentes-contato'
    };
    
    Object.entries(camposTexto).forEach(([chave, id]) => {
        const textarea = document.getElementById(id);
        // Só preencher se o textarea existe, tem dados e não foi editado manualmente
        if (textarea && dados[chave] && !textarea.hasAttribute('data-user-edited')) {
            textarea.value = dados[chave];
            textarea.dispatchEvent(new Event('input'));
        }
    });

    // Preencher campo de cirurgias
    const cirurgiaTextarea = document.getElementById('text-area-cirurgia');
    if (cirurgiaTextarea && dados.cirurgia) {
        cirurgiaTextarea.value = dados.cirurgia;
        cirurgiaTextarea.dispatchEvent(new Event('input'));
    }
}

function atualizarHistoricoConsultas(consultas) {
    if (!consultas || !consultas.length) return;
    
    const listaConsultas = document.querySelector('ul.arvore-prontuario');
    if (!listaConsultas) return;
    
    // Limpar placeholder de carregamento se existir
    listaConsultas.innerHTML = '';
    
    consultas.forEach(consulta => {
        const li = document.createElement('li');
        li.className = 'consultas-anteriores';
        li.setAttribute('data-nr-atendimento', consulta.nr_atendimento);
        li.setAttribute('data-cd-pessoa', consulta.cd_pessoa_fisica);
        li.textContent = consulta.data;
        li.onclick = function() {
            window.saveAndUpdateDate(this);
        };
        listaConsultas.appendChild(li);
    });
}