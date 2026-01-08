function exibirMensagem(mensagem, tipo = "success"){

    const flashMessageDiv = document.getElementById('flash-message')

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
};

export async function atualizaProntuarioPelaData(element) {
    const nrAtendimento = element.getAttribute('data-nr-atendimento');
    const cdPessoaFisica = element.getAttribute('data-cd-pessoa');
    const dataConsulta = element.textContent.trim();

    if (nrAtendimento && cdPessoaFisica) {
        console.log('Opening with:', { nrAtendimento, cdPessoaFisica, dataConsulta });
        
        // Remover verificação de data - agora as consultas antigas estão separadas
        // if (window.isDataAnteriorFevereiro2025 && window.isDataAnteriorFevereiro2025(dataConsulta)) {
        //     console.log('Data anterior a 01/02/2025, abrindo popup histórico');
        //     
        //     if (window.openPopupHistorico) {
        //         window.openPopupHistorico(cdPessoaFisica, dataConsulta);
        //     } else {
        //         console.error('Função openPopupHistorico não encontrada');
        //     }
        //     return;
        // }
        
        // Código existente para consultas normais
        try {
            const resposta = await fetch(`/prontuario/${nrAtendimento}?cd_pessoa_fisica=${cdPessoaFisica}`);
            const contentType = resposta.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                const resultado = await resposta.json();
                exibirMensagem(resultado.message, 'error');
            } else {
                console.log('Opening patient record:', { nrAtendimento, cdPessoaFisica });
                window.location.href = `/prontuario/${nrAtendimento}?cd_pessoa_fisica=${cdPessoaFisica}`;
                
                setTimeout(async () => {
                    try {
                        console.log('Fetching evolution data...');
                        const response = await fetch(`/api/prontuario/dados-secundarios/${nrAtendimento}?cd_pessoa_fisica=${cdPessoaFisica}`);
                        
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        
                        const evolucaoData = await response.json();
                        console.log('Retrieved evolution data:', evolucaoData);
                        
                        // Update form fields
                        if (evolucaoData.queixa) {
                            console.log('Updating anamnese:', evolucaoData.queixa);
                            const anamneseTextarea = document.getElementById('text-area-anamnese');
                            if (anamneseTextarea) {
                                anamneseTextarea.value = evolucaoData.queixa;
                                anamneseTextarea.dispatchEvent(new Event('input'));
                            }
                        }

                        if (evolucaoData.refracao) {
                            console.log('Updating refracao:', evolucaoData.refracao);
                            const refracaoTextarea = document.getElementById('textarea-refacao');
                            if (refracaoTextarea) {
                                refracaoTextarea.value = evolucaoData.refracao;
                                refracaoTextarea.dispatchEvent(new Event('input'));
                            }
                        }
        
                        
                        if (evolucaoData.acuidade) {
                            console.log('Updating acuidade:', evolucaoData.acuidade);
                            const acuidadeTextarea = document.getElementById('textarea-acuidade');
                            if (acuidadeTextarea) {
                                acuidadeTextarea.value = evolucaoData.acuidade;
                                acuidadeTextarea.dispatchEvent(new Event('input'));
                            }
                        }

                        if (evolucaoData.pressao) {
                            console.log('Updating pressao:', evolucaoData.pressao);
                            const pressaoTextarea = document.getElementById('textarea-tonometria');
                            if (pressaoTextarea) {
                                pressaoTextarea.value = evolucaoData.pressao;
                                pressaoTextarea.dispatchEvent(new Event('input'));
                            }
                        }

                        if (evolucaoData.diagnostico) {
                            console.log('Updating diagnostico:', evolucaoData.diagnostico);
                            const diagnosticoTextarea = document.getElementById('text-area-diagnostico');
                            if (diagnosticoTextarea) {
                                diagnosticoTextarea.value = evolucaoData.diagnostico;
                                diagnosticoTextarea.dispatchEvent(new Event('input'));
                            }
                        }

                        if (evolucaoData.conduta) {
                            // First update conduta textarea
                            const condutaTextarea = targetDocument.getElementById('textarea-conduta');
                            if (condutaTextarea) {
                                condutaTextarea.value = evolucaoData.conduta;
                                condutaTextarea.dispatchEvent(new Event('input'));
                            }
                        
                        }
                        else {
                            console.log('No conduta data in evolucaoData');
                        }

                        if (evolucaoData.exames) {
                            console.log('Updating exames:', evolucaoData.exames);
                            const examesTextarea = document.getElementById('textarea-exames');
                            if (examesTextarea) {
                                examesTextarea.value = evolucaoData.exames;
                                examesTextarea.dispatchEvent(new Event('input'));
                            }
                        }

                        // Novo código para atualizar lentes de contato
                        if (evolucaoData.ds_lentes_contato) {
                            console.log('Updating lentes de contato:', evolucaoData.ds_lentes_contato);
                            const lentesTextarea = document.getElementById('text-area-lentes-contato');
                            if (lentesTextarea) {
                                lentesTextarea.value = evolucaoData.ds_lentes_contato;
                                lentesTextarea.dispatchEvent(new Event('input'));
                            }
                        }

                        // Handle refraction fields
                        if (evolucaoData.vl_od_pl_ard_esf !== undefined) {
                            console.log('Updating refraction fields...');
                            
                            // Set dynamic refraction radio button
                            const radioDinamica = document.querySelector('input[name="tipo_refracao"][value="dinamica"]');
                            if (radioDinamica) {
                                radioDinamica.checked = true;
                                radioDinamica.dispatchEvent(new Event('change'));
                            }

                            // Update refraction values
                            const refractionFields = {
                                'vl_od_pl_ard_esf': evolucaoData.vl_od_pl_ard_esf,
                                'vl_od_pl_ard_cil': evolucaoData.vl_od_pl_ard_cil,
                                'vl_od_pl_ard_eixo': evolucaoData.vl_od_pl_ard_eixo,
                                'vl_oe_pl_ard_esf': evolucaoData.vl_oe_pl_ard_esf,
                                'vl_oe_pl_ard_cil': evolucaoData.vl_oe_pl_ard_cil,
                                'vl_oe_pl_ard_eixo': evolucaoData.vl_oe_pl_ard_eixo,
                                'vl_adicao': evolucaoData.vl_adicao
                            };

                            Object.entries(refractionFields).forEach(([fieldName, value]) => {
                                if (value !== null && value !== undefined) {
                                    console.log(`Setting ${fieldName} to ${value}`);
                                    const input = document.querySelector(`input[name="${fieldName}"]`);
                                    if (input) {
                                        input.value = value;
                                        input.dispatchEvent(new Event('input'));
                                    }
                                }
                            });

                            // Update refraction observation
                            if (evolucaoData.obs_refracao) {
                                const obsRefracaoTextarea = document.querySelector('textarea[name="ds_observacao_refracao"]');
                                if (obsRefracaoTextarea) {
                                    obsRefracaoTextarea.value = evolucaoData.obs_refracao;
                                    obsRefracaoTextarea.dispatchEvent(new Event('input'));
                                }
                            }
                        }

                        // Após carregar os dados, verificar se tem conteúdo
                        const temDados = verificarSeDatasTemDados(evolucaoData);
                        
                        // Se não tem dados, ocultar a data
                        if (!temDados) {
                            element.style.display = 'none';
                        } else {
                            element.style.display = ''; // Mostrar normalmente
                        }
                        
                        console.log('Finished updating all fields');
                        
                    } catch (error) {
                        console.error('Error fetching or updating evolution data:', error);
                    }
                }, 1500); // Wait 1.5 seconds for the window to load
            }
        } catch (error) {
            console.error("Erro ao buscar prontuário:", error);
        }
    }
}

/**
 * Verifica se os dados de evolução contêm algum conteúdo
 * @param {Object} data - Dados da evolução
 * @returns {boolean} - True se tem dados, false caso contrário
 */
function verificarSeDatasTemDados(data) {
    if (!data) return false;
    
    const campos = [
        'queixa',           // Queixa Paciente
        'refracao',         // Refração
        'acuidade',         // Acuidade Visual
        'pressao',          // Pressão Intraocular
        'diagnostico',      // Diagnóstico
        'conduta',          // Conduta
        'exames',           // Exames
        'ds_lentes_contato' // Lente de Contato
    ];
    
    // Verifica se pelo menos um campo tem dados
    return campos.some(campo => {
        const valor = data[campo];
        // Verifica se o valor existe, não é null, não é undefined, não é string vazia
        return valor && 
               String(valor).trim().length > 0 &&
               String(valor).trim().toLowerCase() !== 'n/a' &&
               String(valor).trim().toLowerCase() !== 'null' &&
               String(valor).trim().toLowerCase() !== 'undefined';
    });
}

window.atualizaProntuarioPelaData = atualizaProntuarioPelaData;

// Adicionar após o carregamento das datas
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Iniciando filtragem de datas sem dados...');
    
    // Aguardar um pouco para garantir que as datas foram carregadas
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Filtrar datas sem dados
    await filtrarDatasSemDados();
});

/**
 * Oculta datas que não possuem dados em nenhum campo
 */
async function filtrarDatasSemDados() {
    // AJUSTE ESTE SELETOR DE ACORDO COM SEU HTML
    // Use '.consultas-anteriores' se for esse o nome da classe
    const elementosDatas = document.querySelectorAll('.consultas-anteriores');
    
    console.log(`Encontradas ${elementosDatas.length} datas para verificar`);
    
    for (const elemento of elementosDatas) {
        const nrAtendimento = elemento.getAttribute('data-nr-atendimento');
        const cdPessoaFisica = elemento.getAttribute('data-cd-pessoa');
        
        if (!nrAtendimento || !cdPessoaFisica) {
            console.log('Elemento sem nr_atendimento ou cd_pessoa:', elemento);
            continue;
        }
        
        try {
            console.log(`Verificando dados para nr_atendimento: ${nrAtendimento}`);
            
            const response = await fetch(`/api/prontuario/dados-secundarios/${nrAtendimento}?cd_pessoa_fisica=${cdPessoaFisica}`);
            
            if (!response.ok) {
                console.error(`Erro ao buscar dados: ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            console.log(`Dados recebidos para ${nrAtendimento}:`, data);
            
            const temDados = verificarSeDatasTemDados(data);
            console.log(`Nr ${nrAtendimento} tem dados: ${temDados}`);
            
            if (!temDados) {
                console.log(`Ocultando data ${elemento.textContent.trim()} - Nr: ${nrAtendimento}`);
                elemento.style.display = 'none';
                // Se o elemento pai for um <li>, ocultar também
                if (elemento.parentElement && elemento.parentElement.tagName === 'LI') {
                    elemento.parentElement.style.display = 'none';
                }
            }
        } catch (error) {
            console.error(`Erro ao verificar dados da data ${nrAtendimento}:`, error);
        }
    }
    
    console.log('Filtragem de datas concluída');
}