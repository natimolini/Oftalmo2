async function mostrarEstatiscas() {

    const dataSelecionada = document.getElementById('calendario').value;
    if (!dataSelecionada) return;
    
    const [ano, mes, dia] = dataSelecionada.split('-');
    const dataFormatada = `${dia}-${mes}-${ano}`;

    try {
        const resposta = await fetch(`/get_estatisticas/${dataFormatada}`);

        if (!resposta.ok) {
            throw new Error(`Erro na requisição: ${resposta.status}`);
        }

        const resultado = await resposta.json();

        if (resultado.status === "success") {
            const estatisticas = resultado.estatisticas;

            document.querySelector('.qtd_consultas').innerText = estatisticas.qtd_consultas;
            document.querySelector('.qtd_retorno').innerText = estatisticas.qtd_retorno;
            document.querySelector('.qtd_retornos_cirurgia').innerText = estatisticas.qtd_retornos_cirurgia;
            document.querySelector('.qtd_resultado_exame').innerText = estatisticas.qtd_resultado_exame;
            document.querySelector('.qtd_consulta_resultado').innerText = estatisticas.qtd_consulta_resultado;
            document.querySelector('.qtd_opd').innerText = estatisticas.qtd_opd;
            document.querySelector('.qtd_teste_lente').innerText = estatisticas.qtd_teste_lente;
            document.querySelector('.qtd_yag').innerText = estatisticas.qtd_yag;
            document.querySelector('.qtd_ava_cirurgica').innerText = estatisticas.qtd_ava_cirurgica;
            document.querySelector('.qtd_emergencia').innerText = estatisticas.qtd_emergencia;
            document.querySelector('.qtd_conversar').innerText = estatisticas.qtd_conversar;
            document.querySelector('.qtd_refracao').innerText = estatisticas.qtd_refracao;
            document.querySelector('.qtd_telefone').innerText = estatisticas.qtd_telefone;
            document.querySelector('.qtd_ver_ficha').innerText = estatisticas.qtd_ver_ficha;
            document.querySelector('.qtd_ver_lente').innerText = estatisticas.qtd_ver_lente;
            document.querySelector('.qtd_laudo').innerText = estatisticas.qtd_laudo;
            document.querySelector('.qtd_prk').innerText = estatisticas.qtd_prk;
            document.querySelector('.qtd_em_andamento').innerText = estatisticas.qtd_em_andamento;
            document.querySelector('.qtd_marcada').innerText = estatisticas.qtd_marcada;
            document.querySelector('.qtd_cancelada').innerText = estatisticas.qtd_cancelada;
            document.querySelector('.qtd_confirmada').innerText = estatisticas.qtd_confirmada;
            document.querySelector('.qtd_faltas').innerText = estatisticas.qtd_faltas;
            document.querySelector('.qtd_aguardando').innerText = estatisticas.qtd_aguardando;
            document.querySelector('.qtd_em_triagem').innerText = estatisticas.qtd_em_triagem;
            document.querySelector('.qtd_atendido').innerText = estatisticas.qtd_atendido;
            document.querySelector('.qtd_executada').innerText = estatisticas.qtd_executada;

            document.querySelector('.popup-overlay').classList.add('active');
        } else {
            throw new Error(`Erro no servidor: ${resultado.message}`);
        }
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
    }
}

function esconderEstatiscas(event) {
    const popupContent = document.querySelector('.popup-content');
    if (!popupContent.contains(event.target)) {
        document.querySelector('.popup-overlay').classList.remove('active');
    }
}