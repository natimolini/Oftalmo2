/**
 * Module for saving medical record draft data with optimized performance
 */
import { throttle, debounce } from './utils.js';
import { showSavingIndicator, hideSavingIndicator } from './loading-indicator.js';

// Variáveis para controlar o salvamento
let ultimoSalvamento = Date.now();
let salvamentoPendente = false;
let dadosSalvamentoTimeout = null;
let ultimaSecao = null;

// Tempo mínimo entre salvamentos (3 segundos)
const INTERVALO_MIN_SALVAMENTO = 3000;

// Cache para evitar processar dados desnecessariamente
let cacheColetaDados = {
    timestamp: 0,
    secao: null,
    dados: null
};

// Tempo de expiração do cache (500ms)
const CACHE_EXPIRACAO = 500;

/**
 * Collects and processes data from various form elements based on the active section
 * @param {string} sectionAtiva - The currently active section identifier
 * @returns {Object} Collected form data ready for submission
 */
export async function coletarDadosFormulario(sectionAtiva) {
    const agora = Date.now();
    
    // Usar cache se disponível e válido (mesma seção e tempo não expirado)
    if (cacheColetaDados.secao === sectionAtiva && 
        agora - cacheColetaDados.timestamp < CACHE_EXPIRACAO) {
        return cacheColetaDados.dados;
    }

    let ds_refracao = '';
    let ds_exames = '';
    let ds_conduta = '';
    let codigosExame = [];
    let nomesExame = [];
    let qtdExame = [];

    if (sectionAtiva === 'receituario') {
        const textareaReceita1 = document.getElementById('receita');
        const textareaReceita2 = document.getElementById('receita2');
        
        let ds_observacao = '';
        let ds_observacao2 = '';
        let ds_conduta = '';

        // Processar primeira receita
        if (textareaReceita1) {
            ds_observacao = textareaReceita1.value.trim();
            if (ds_observacao) {
                const linhas = ds_observacao.split('\n');
                const nomesMedicamentos = linhas
                    .filter(linha => linha.includes(':') && !linha.trim().toUpperCase().startsWith('USO'))
                    .map(linha => {
                        const nome = linha.split(':')[0].trim();
                        return nome ? `- ${nome}` : '';
                    })
                    .filter(nome => nome);
                
                ds_conduta = nomesMedicamentos.join('\n');
            }
        }

        // Processar segunda receita
        if (textareaReceita2) {
            ds_observacao2 = textareaReceita2.value.trim();
            if (ds_observacao2) {
                const linhas2 = ds_observacao2.split('\n');
                const nomesMedicamentos2 = linhas2
                    .filter(linha => linha.includes(':') && !linha.trim().toUpperCase().startsWith('USO'))
                    .map(linha => {
                        const nome = linha.split(':')[0].trim();
                        return nome ? `- ${nome}` : '';
                    })
                    .filter(nome => nome);
                
                // Combinar com ds_conduta existente
                if (nomesMedicamentos2.length > 0) {
                    ds_conduta = ds_conduta 
                        ? `${ds_conduta}\n${nomesMedicamentos2.join('\n')}`
                        : nomesMedicamentos2.join('\n');
                }
            }
        }

        return {
            nrAtendimento: document.getElementById('nr_atendimento').textContent.trim(),
            ds_conduta,
            ds_observacao,
            ds_observacao2
        };
    }

    const refracaoTextarea = document.getElementById('textarea-refracao');
    if (sectionAtiva === 'oculos') {
        try {
            const oculosData = [];
            const tipoRefracao = document.querySelector('input[name="tipo_refracao"]:checked')?.value;
    
            if (tipoRefracao === 'dinamica') {
                const dynamicFields = {
                    'od_esf': document.querySelector('input[name="vl_od_pl_ard_esf"]')?.value,
                    'od_cil': document.querySelector('input[name="vl_od_pl_ard_cil"]')?.value,
                    'od_eixo': document.querySelector('input[name="vl_od_pl_ard_eixo"]')?.value,
                    'oe_esf': document.querySelector('input[name="vl_oe_pl_ard_esf"]')?.value,
                    'oe_cil': document.querySelector('input[name="vl_oe_pl_ard_cil"]')?.value,
                    'oe_eixo': document.querySelector('input[name="vl_oe_pl_ard_eixo"]')?.value,
                    'adicao': document.querySelector('input[name="vl_adicao"]')?.value,
                };
    
                if (Object.values(dynamicFields).some(value => value)) {
                    oculosData.push(" Óculos: ");
                    const { od_esf, od_cil, od_eixo, oe_esf, oe_cil, oe_eixo, adicao } = dynamicFields;
                    const replaceDot = (value) => String(value).replace('.', ',');

                    if (od_esf || od_cil || od_eixo) {
                        let od = " OD:";

                        od += od_esf ? ` ${replaceDot(positiveSimbol(od_esf))}` : '';
                        od += od_cil ? ` / ${replaceDot(positiveSimbol(od_cil))}` : '';
                        od += od_eixo ? ` x ${od_eixo}°` : '';
                        oculosData.push(od);
                    }

                    if (oe_esf || oe_cil || oe_eixo) {
                        let oe = " OE:";

                        oe += oe_esf ? ` ${replaceDot(positiveSimbol(oe_esf))}` : '';
                        oe += oe_cil ? ` / ${replaceDot(positiveSimbol(oe_cil))}` : '';
                        oe += oe_eixo ? ` x ${oe_eixo}°` : '';
                        oculosData.push(oe);
                    }

                    if (adicao) oculosData.push(` A=${replaceDot(positiveSimbol(adicao))}`);
                }
            } else if (tipoRefracao === 'estatica') {
                const staticFields = {
                    'od_esf': document.querySelector('input[name="vl_od_pl_are_esf"]')?.value,
                    'od_cil': document.querySelector('input[name="vl_od_pl_are_cil"]')?.value,
                    'od_eixo': document.querySelector('input[name="vl_od_pl_are_eixo"]')?.value,
                    'oe_esf': document.querySelector('input[name="vl_oe_pl_are_esf"]')?.value,
                    'oe_cil': document.querySelector('input[name="vl_oe_pl_are_cil"]')?.value,
                    'oe_eixo': document.querySelector('input[name="vl_oe_pl_are_eixo"]')?.value
                };
    
                if (Object.values(staticFields).some(value => value)) {
                    oculosData.push("Óculos:");
                    if (staticFields.od_esf || staticFields.od_cil || staticFields.od_eixo) {
                        let od = "OD:";
                        od += staticFields.od_esf ? ` ${staticFields.od_esf}` : '';
                        od += staticFields.od_cil ? ` / ${staticFields.od_cil}` : '';
                        od += staticFields.od_eixo ? ` x ${staticFields.od_eixo}°` : '';
                        oculosData.push(od);
                    }
                    if (staticFields.oe_esf || staticFields.oe_cil || staticFields.oe_eixo) {
                        let oe = "OE:";
                        oe += staticFields.oe_esf ? ` ${staticFields.oe_esf}` : '';
                        oe += staticFields.oe_cil ? ` / ${staticFields.oe_cil}` : '';
                        oe += staticFields.oe_eixo ? ` x ${staticFields.oe_eixo}°` : '';
                        oculosData.push(oe);
                    }
                }
            }
    
            const observacao = document.querySelector('textarea[name="ds_observacao_refracao"]')?.value?.trim();
            if (observacao) {
                oculosData.push(`\nObservações: ${observacao}`);
            }
            if (oculosData.length > 0 && refracaoTextarea) {
                refracaoTextarea.value = oculosData.join('');
                refracaoTextarea.dispatchEvent(new Event('input'));
            }
            ds_refracao = refracaoTextarea?.value || '';
        } catch (error) {
            console.error("Erro ao processar dados de óculos:", error);
            throw new Error("Erro ao salvar informações Óculos");
        }
    }
    
    // Process data from the exams section
    if (sectionAtiva === 'exames') {
        const examsTextarea = document.getElementById('textarea-exames');
        if (examsTextarea) {
            ds_exames = examsTextarea.value || '';
            
            const exameRegex = /^([0-9]+\.[0-9]+\.[0-9]+-[0-9]+)\s*-\s*(.+?)\s*(?:\(([0-9]+)x\))?$/gm;
            let match;
            
            codigosExame = [];
            nomesExame = [];
            qtdExame = [];
            
            while ((match = exameRegex.exec(ds_exames)) !== null) {
                const codigo = match[1];
                const nome = match[2].trim();
                const quantidade = match[3] || '1';
                
                codigosExame.push(codigo);
                nomesExame.push(nome);
                qtdExame.push(quantidade);
            }
            
            console.log('Exames extraídos do texto:', {codigosExame, nomesExame, qtdExame});
        }
    }

    const nrAtendimento = document.getElementById("nr_atendimento")?.textContent?.trim();
    if (!nrAtendimento) {
        throw new Error("Número de atendimento não encontrado!");
    }

    const ds_anamnese = document.querySelector('textarea[name="ds_anamnese"]')?.value || '';
    const ds_acuidade = document.querySelector('textarea[name="ds_acuidade"]')?.value || '';
    const ds_tonometria = document.querySelector('textarea[name="ds_tonometria"]')?.value || '';
    const ds_diagnostico = document.querySelector('textarea[name="ds_diagnostico"]')?.value || '';
    const ds_lentes_contato = document.getElementById('text-area-lentes-contato')?.value || '';
    
    // CORREÇÃO: Sempre coletar o campo conduta, independente da seção
    if (!ds_conduta) { // Só coletar se não foi definido acima (no caso do receituário)
        ds_conduta = document.getElementById('textarea-conduta')?.value || '';
    }
    
    const ds_cirurgias = document.getElementById('text-area-cirurgia')?.value || '';

    const dadosColetados = {
        nrAtendimento,
        ds_anamnese,
        ds_refracao,
        ds_acuidade,
        ds_tonometria,
        ds_diagnostico,
        ds_conduta,
        ds_exames,
        ds_cirurgias,
        ds_lentes_contato,
        codigosExame, // CORREÇÃO: Era "coligosExame" - erro de digitação
        nomesExame,
        qtdExame
    };
    
    cacheColetaDados = {
        timestamp: agora,
        secao: sectionAtiva,
        dados: dadosColetados
    };
    
    return dadosColetados;
}

/**
 * @param {string|number} value - The value to format
 * @returns {string} Formatted value with appropriate sign
 */
function positiveSimbol(value) {
    if (!value) return '';
    // Troca vírgula por ponto antes de parseFloat
    const num = parseFloat(String(value).replace(',', '.'));
    if (isNaN(num)) return value;
    // Formata sempre com duas casas e vírgula
    let formatted = num.toFixed(2).replace('.', ',');
    return num < 0 ? formatted : `+${formatted}`;
}

/**
 * Separa texto livre e medicamentos do campo conduta
 * @param {string} textoConduta
 * @returns {{livre: string[], medicamentos: string[]}}
 */
function separarTextoLivreEMedicamentos(textoConduta) {
    const linhas = (textoConduta || '').split('\n').map(l => l.trim()).filter(Boolean);
    const medicamentos = linhas.filter(l => l.startsWith('- '));
    const livre = linhas.filter(l => !l.startsWith('- '));
    return { livre, medicamentos };
}

/**
 * Mescla texto livre e medicamentos, evitando duplicatas de medicamentos
 * @param {string[]} livre
 * @param {string[]} medicamentos
 * @returns {string}
 */
function mesclarConduta(livre, medicamentos) {
    const medicamentosUnicos = Array.from(new Set(medicamentos));
    return [...livre, ...medicamentosUnicos].join('\n');
}

/**
 * Versão otimizada da função salvarRascunho com throttling
 * @param {string} sectionAtiva - A seção atualmente ativa
 * @param {Function} enviarDadosProntuario - Função para enviar dados ao servidor
 * @param {Function} exibirMensagem - Função para exibir mensagens ao usuário
 * @param {boolean} forceImediato - Se deve forçar o salvamento imediato
 * @returns {Promise<Object|null>} Resultado da operação de salvamento ou null
 */
export async function salvarRascunho(sectionAtiva, enviarDadosProntuario, exibirMensagem, forceImediato = false) {
    // Se a seção mudou, salvamos os dados da seção anterior
    const mudancaDeSecao = ultimaSecao && ultimaSecao !== sectionAtiva;
    
    // Cancelar timeout existente se houver mudança de seção
    if (mudancaDeSecao && dadosSalvamentoTimeout) {
        clearTimeout(dadosSalvamentoTimeout);
        dadosSalvamentoTimeout = null;
    }
    
    ultimaSecao = sectionAtiva;
    
    // Verificar se precisamos salvar imediatamente
    const agora = Date.now();
    const tempoDesdeUltimoSalvamento = agora - ultimoSalvamento;
    
    // Salvar imediatamente se forçado ou se passou tempo suficiente desde o último salvamento
    if (forceImediato || tempoDesdeUltimoSalvamento > INTERVALO_MIN_SALVAMENTO) {
        // Se já temos um salvamento pendente, cancelamos o agendamento
        if (dadosSalvamentoTimeout) {
            clearTimeout(dadosSalvamentoTimeout);
            dadosSalvamentoTimeout = null;
        }
        
        // Executamos imediatamente
        return executarSalvamento(sectionAtiva, enviarDadosProntuario, exibirMensagem);
    } else {
        // Se já temos um salvamento agendado, não fazemos nada
        if (dadosSalvamentoTimeout) return null;
        
        // Agendar salvamento para depois do intervalo mínimo
        return new Promise((resolve) => {
            dadosSalvamentoTimeout = setTimeout(async () => {
                dadosSalvamentoTimeout = null;
                const resultado = await executarSalvamento(sectionAtiva, enviarDadosProntuario, exibirMensagem);
                resolve(resultado);
            }, INTERVALO_MIN_SALVAMENTO - tempoDesdeUltimoSalvamento);
        });
    }
}

/**
 * Função que realmente executa o salvamento
 * @private
 */
async function executarSalvamento(sectionAtiva, enviarDadosProntuario, exibirMensagem) {
    if (salvamentoPendente) return null;
    
    try {
        salvamentoPendente = true;
        showSavingIndicator();
        console.log(`[Status] Iniciando salvamento. Seção ativa: ${sectionAtiva}`);
        
        // --- LÓGICA PARA SEÇÃO DE EXAMES ---
        if (sectionAtiva === 'exames') {
            const examsTextarea = document.getElementById('textarea-exames');
            const selectedExamsTable = document.querySelector('.tabela-exames-selecionados tbody');
            
            if (examsTextarea && selectedExamsTable) {
                const selectedExams = Array.from(selectedExamsTable.querySelectorAll('tr:not(.nenhum-exame)'))
                    .map(row => ({
                        examCode: row.querySelector('.exam-code')?.textContent.trim(),
                        examName: row.querySelector('.exam-name')?.textContent.trim()
                    }))
                    .filter(exam => exam.examCode && exam.examName);

                if (selectedExams.length > 0) {
                    const formattedExams = selectedExams.map(exam => `${exam.examCode} - ${exam.examName}`).join('\n');
                    const existingContent = examsTextarea.value?.trim() || '';
                    const existingLines = existingContent.split('\n');
                    
                    // Filtrar apenas exames que ainda não estão no textarea para evitar duplicidade
                    const uniqueNewLines = formattedExams.split('\n').filter(newLine => {
                        const newCode = newLine.split(' - ')[0].trim();
                        return !existingLines.some(line => line.trim().startsWith(newCode));
                    });
                    
                    if (uniqueNewLines.length > 0) {
                        const newContent = uniqueNewLines.join('\n');
                        examsTextarea.value = existingContent ? `${existingContent}\n${newContent}` : newContent;
                        examsTextarea.dispatchEvent(new Event('input'));
                        examsTextarea.setAttribute('data-user-edited', 'true');
                        console.log('Exames adicionados:', uniqueNewLines);
                    }
                }
            }
        } 
        
        // --- LÓGICA PARA SEÇÃO DE RECEITUÁRIO ---
        else if (sectionAtiva === 'receituario') {
            const dados = await coletarDadosFormulario(sectionAtiva);
            const condutaTextarea = document.getElementById('textarea-conduta');
            const textoCondutaAtual = condutaTextarea?.value || '';

            // Processamento de mesclagem (Livre + Medicamentos)
            const { livre: textoLivre } = separarTextoLivreEMedicamentos(textoCondutaAtual);
            const medicamentosNovos = (dados.ds_conduta || '').split('\n').map(l => l.trim()).filter(Boolean);
            const condutaFinal = mesclarConduta(textoLivre, medicamentosNovos);

            if (condutaTextarea) {
                condutaTextarea.value = condutaFinal;
                condutaTextarea.dispatchEvent(new Event('input'));
            }

            // Log de monitoramento (Estilo Código 2, mas seguro)
            console.log(`[Debug] Salvando Receituário. Atendimento: ${dados.nrAtendimento}`);

            const response = await fetch('/api/receituario/salvar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nr_atendimento: dados.nrAtendimento,
                    ds_conduta: condutaFinal,
                    ds_observacao: dados.ds_observacao || '',
                    ds_observacao2: dados.ds_observacao2 || ''
                })
            });

            const data = await response.json();
            hideSavingIndicator();
            
            if (data.status === 'success') {
                if (sectionAtiva === 'botao-clicado') exibirMensagem('Receituário salvo com sucesso!', 'success');
            } else {
                if (sectionAtiva === 'botao-clicado') exibirMensagem(data.mensagem || 'Erro ao salvar.', 'error');
            }
            return data;
        }

        // --- LÓGICA PADRÃO (OUTRAS SEÇÕES) ---
        const condutaTextarea = document.getElementById('textarea-conduta');
        if (condutaTextarea) {
            let textoUsuario = condutaTextarea.value || '';
            let dadosAutomaticos = document.getElementById('macros-conduta-atuais')?.value || '';

            if (dadosAutomaticos) {
                const linhasUsuario = textoUsuario.split('\n').map(l => l.trim()).filter(Boolean);
                const linhasAutomaticas = dadosAutomaticos.split('\n').map(l => l.trim()).filter(Boolean);
                const linhasUnicas = Array.from(new Set([...linhasUsuario, ...linhasAutomaticas]));
                
                condutaTextarea.value = linhasUnicas.join('\n');
                condutaTextarea.dispatchEvent(new Event('input'));
            }
        }

        const dados = await coletarDadosFormulario(sectionAtiva);

        const response = await enviarDadosProntuario(
            dados.nrAtendimento,
            dados.ds_anamnese,
            dados.ds_refracao, 
            dados.ds_acuidade,
            dados.ds_tonometria,
            dados.ds_diagnostico,
            dados.ds_conduta,
            dados.ds_exames,
            dados.ds_lentes_contato,
            dados.codigosExame, // Corrigido
            dados.nomesExame,
            dados.qtdExame,
            dados.ds_cirurgias
        );
        
        ultimoSalvamento = Date.now();

        if (response) {
            const responseData = await response.json();
            if (sectionAtiva === 'botao-clicado') {
                if (response.ok) {
                    exibirMensagem(responseData.mensagem || "Rascunho salvo com sucesso", "success");
                } else {
                    exibirMensagem(responseData.mensagem || "Erro ao salvar rascunho", "error");
                }
            }
            hideSavingIndicator();
            return responseData;
        }

        hideSavingIndicator();
        return null;

    } catch (error) {
        console.error("Erro crítico no processo de salvamento:", error);
        if (sectionAtiva === 'botao-clicado') {
            exibirMensagem("Erro de conexão ou processamento ao salvar.", "error");
        }
        hideSavingIndicator();
        return null;
    } finally {
        salvamentoPendente = false;
    }
}

/**
 * Reloads the page with a loading overlay
 */
function reloadPage() {
    // Display loading overlay
    document.getElementById('loadingOverlay').style.display = 'flex';

    // Reload after short delay
    setTimeout(() => {
        location.reload();
    }, 500);
}

function parseInputValue(val) {
    // Converte string tipo "+1,50" ou "-23,25" para número corretamente
    if (!val) return '';
    let clean = val.replace(',', '.').replace(/[^\d\.\-+]/g, '');
    let num = parseFloat(clean);
    if (isNaN(num)) return val; // Se não for número, retorna original
    return num;
}

function formatValue(val) {
    // Formata número para string com vírgula e sinal
    if (val === '' || val === null || val === undefined) return '';
    let num = typeof val === 'string' ? parseInputValue(val) : val;
    if (isNaN(num)) return val;
    let formatted = num.toFixed(2).replace('.', ',');
    return num < 0 ? formatted : `+${formatted}`;
}

// Exemplo de uso ao montar o campo de refração:
let od_esf = formatValue(document.querySelector('input[name="vl_od_pl_ard_esf"]').value);
let od_cil = formatValue(document.querySelector('input[name="vl_od_pl_ard_cil"]').value);
let od_eixo = formatValue(document.querySelector('input[name="vl_od_pl_ard_eixo"]').value);
let oe_esf = formatValue(document.querySelector('input[name="vl_oe_pl_ard_esf"]').value);
let oe_cil = formatValue(document.querySelector('input[name="vl_oe_pl_ard_cil"]').value);
let oe_eixo = formatValue(document.querySelector('input[name="vl_oe_pl_ard_eixo"]').value);
let adicao = formatValue(document.querySelector('input[name="vl_adicao"]').value);