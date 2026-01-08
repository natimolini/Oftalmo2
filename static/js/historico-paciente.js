document.addEventListener('DOMContentLoaded', () => {
    const botaoHistorico = document.getElementById('botao-historico');
    const popup = document.getElementById('popup-historico-paciente');
    const closeBtn = popup.querySelector('.popup-historico-paciente-close');
    const scrollArea = document.getElementById('popup-historico-paciente-scroll');

    botaoHistorico.addEventListener('click', async () => {
        popup.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        scrollArea.innerHTML = '<div>Carregando histórico...</div>';
        try {
            const nmPaciente = document.getElementById('nm_paciente').textContent.trim();
            const cdPessoaFisica = document.getElementById('nm_paciente').dataset.cdPessoaFisica;
            // Buscar histórico do backend (ajuste a rota conforme sua API)
            const response = await fetch(`/api/historico-paciente/${cdPessoaFisica}`);
            if (!response.ok) throw new Error('Erro ao buscar histórico');
            const historico = await response.json();
            scrollArea.innerHTML = renderHistorico(historico, nmPaciente);
        } catch (e) {
            scrollArea.innerHTML = `<div style="color:red;">Erro ao carregar histórico: ${e.message}</div>`;
        }
    });

    closeBtn.addEventListener('click', () => {
        popup.style.display = 'none';
        document.body.style.overflow = '';
    });

    function renderHistorico(historico, nmPaciente) {
        if (!historico || !historico.length) {
            return `<div>Nenhum histórico encontrado para ${nmPaciente}.</div>`;
        }
        // Filtra itens cujo conteúdo é vazio, nulo, undefined ou "Sem informações"
        const historicoFiltrado = historico.filter(item => {
            const conteudo = (item.conteudo ?? item.ds_observacao ?? '').trim();
            return conteudo && conteudo !== 'Sem informações';
        });
        if (!historicoFiltrado.length) {
            return `<div>Nenhum histórico encontrado para ${nmPaciente}.</div>`;
        }
        return historicoFiltrado.map(item => `
            <div class="historico-bloco">
                <div style="font-weight:bold; color:#2c8ef0; margin-bottom:4px;">
                    ${item.data_consulta} - ${item.tipo === 'antiga' ? 'Consulta Antiga' : 'Consulta'}
                </div>
                <div style="margin-bottom:8px;">
                    <strong>Médico:</strong> ${item.medico || '-'}<br>
                </div>
                <div>
                    <strong>Conteúdo:</strong><br>
                    <div style="white-space:pre-line; background:#fff; border-radius:6px; border:1px solid #e0e0e0; padding:10px;">
                        ${item.conteudo ?? item.ds_observacao ?? 'Sem informações'}
                    </div>
                </div>
            </div>
        `).join('<hr style="margin:18px 0;">');
    }
});