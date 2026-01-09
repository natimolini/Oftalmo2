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
    codigosExame = [],
    nomesExame = [],
    qtdExame = [],
    ds_cirurgias
) {
    const formData = new FormData();
    
    // Dados básicos
    formData.append('ds_anamnese', ds_anamnese || '');
    formData.append('ds_refracao', ds_refracao || '');
    formData.append('ds_acuidade', ds_acuidade || '');
    formData.append('ds_tonometria', ds_tonometria || '');
    formData.append('ds_diagnostico', ds_diagnostico || '');
    formData.append('ds_conduta', ds_conduta || '');
    formData.append('ds_exames', ds_exames || '');
    formData.append('ds_lentes_contato', ds_lentes_contato || '');
    formData.append('ds_cirurgias', ds_cirurgias || '');

    // Refração - Busca dinâmica apenas para campos específicos de óculos
    const tipoRefracaoEl = document.querySelector('input[name="tipo_refracao"]:checked');
    formData.append('tipo_refracao', tipoRefracaoEl ? tipoRefracaoEl.value : 'dinamica');
    formData.append('ds_observacao_refracao', document.querySelector('textarea[name="ds_observacao_refracao"]')?.value || '');

    // Mapeamento automático de campos numéricos de óculos
    const oculosFields = [
        'vl_od_pl_ard_esf', 'vl_od_pl_ard_cil', 'vl_od_pl_ard_eixo',
        'vl_oe_pl_ard_esf', 'vl_oe_pl_ard_cil', 'vl_oe_pl_ard_eixo', 'vl_adicao',
        'vl_od_pl_are_esf', 'vl_od_pl_are_cil', 'vl_od_pl_are_eixo',
        'vl_oe_pl_are_esf', 'vl_oe_pl_are_cil', 'vl_oe_pl_are_eixo'
    ];

    oculosFields.forEach(field => {
        const val = document.querySelector(`input[name="${field}"]`)?.value || '';
        formData.append(field, val);
    });

    // Listas de Exames (Garante que sejam arrays antes de iterar)
    (codigosExame || []).forEach(c => formData.append('codigosExame', c));
    (nomesExame || []).forEach(n => formData.append('nomesExame', n));
    (qtdExame || []).forEach(q => formData.append('qtdExame', q));
    
    return fetch(`/salvar_rascunho_prontuario/${nrAtendimento}`, {
        method: 'POST',
        body: formData,
    });
}