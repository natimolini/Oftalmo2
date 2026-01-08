export function enviarDadosProntuario(
    nrAtendimento,
    ds_anamnese,
    ds_refracao,
    ds_acuidade,
    ds_tonometria,
    ds_diagnostico,
    ds_conduta,
    ds_exames,
    ds_lentes_contato,
    codigosExame,
    nomesExame,
    qtdExame,
    ds_cirurgias // <-- Adicione este parâmetro
) {
    const tipoRefracaoEl = document.querySelector('input[name="tipo_refracao"]:checked');
    const tipo_refracao = tipoRefracaoEl ? tipoRefracaoEl.value : 'dinamica';

    const formData = new FormData();
    
    formData.append('ds_anamnese', ds_anamnese || '');
    formData.append('ds_refracao', ds_refracao || '');
    formData.append('tipo_refracao', tipo_refracao);
    
    const dynamicFields = {
        'vl_od_pl_ard_esf': document.querySelector('input[name="vl_od_pl_ard_esf"]')?.value || '',
        'vl_od_pl_ard_cil': document.querySelector('input[name="vl_od_pl_ard_cil"]')?.value || '',
        'vl_od_pl_ard_eixo': document.querySelector('input[name="vl_od_pl_ard_eixo"]')?.value || '',
        'vl_oe_pl_ard_esf': document.querySelector('input[name="vl_oe_pl_ard_esf"]')?.value || '',
        'vl_oe_pl_ard_cil': document.querySelector('input[name="vl_oe_pl_ard_cil"]')?.value || '',
        'vl_oe_pl_ard_eixo': document.querySelector('input[name="vl_oe_pl_ard_eixo"]')?.value || '',
        'vl_adicao': document.querySelector('input[name="vl_adicao"]')?.value || ''
    };

    const staticFields = {
        'vl_od_pl_are_esf': document.querySelector('input[name="vl_od_pl_are_esf"]')?.value || '',
        'vl_od_pl_are_cil': document.querySelector('input[name="vl_od_pl_are_cil"]')?.value || '',
        'vl_od_pl_are_eixo': document.querySelector('input[name="vl_od_pl_are_eixo"]')?.value || '',
        'vl_oe_pl_are_esf': document.querySelector('input[name="vl_oe_pl_are_esf"]')?.value || '',
        'vl_oe_pl_are_cil': document.querySelector('input[name="vl_oe_pl_are_cil"]')?.value || '',
        'vl_oe_pl_are_eixo': document.querySelector('input[name="vl_oe_pl_are_eixo"]')?.value || ''
    };

    Object.entries(dynamicFields).forEach(([key, value]) => formData.append(key, value));
    Object.entries(staticFields).forEach(([key, value]) => formData.append(key, value));

    
    formData.append('ds_observacao_refracao', document.querySelector('textarea[name="ds_observacao_refracao"]')?.value || '');
    formData.append('ds_acuidade', ds_acuidade || '');
    formData.append('ds_tonometria', ds_tonometria || '');
    formData.append('ds_diagnostico', ds_diagnostico || '');
    formData.append('ds_conduta', ds_conduta || '');
    formData.append('ds_exames', ds_exames || '');
    formData.append('ds_cirurgias', ds_cirurgias || ''); // <-- Adicione esta linha
    formData.append('ds_lentes_contato', ds_lentes_contato || '');
    codigosExame.forEach(codigo => formData.append('codigosExame', codigo));
    nomesExame.forEach(nome => formData.append('nomesExame', nome));
    qtdExame.forEach(quantidade => formData.append('qtdExame', quantidade));
    
    return fetch(`/salvar_rascunho_prontuario/${nrAtendimento}`, {
        method: 'POST',
        body: formData,
    });
}