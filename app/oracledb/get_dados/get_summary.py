from app.oracledb.oracle_connection import OracleConnection

class PatientSummary:
    def __init__(self):
        self.oraconn = OracleConnection('tasy', 'aloisk', '10.250.250.2', '1521', 'dbhomol.oftalmocuritiba.com.br')


    def get_consultation_history(self, cd_pessoa_fisica):
        """Get complete consultation history for a patient."""
        query = """
                WITH ConsultaInfo AS (
                    SELECT DISTINCT
                        ac.dt_agenda,
                        ac.nr_atendimento,
                        oc.nr_sequencia as nr_seq_consulta,
                        ac.cd_medico_req,
                        oc.dt_fim_consulta
                    FROM agenda_consulta ac
                    INNER JOIN oft_consulta oc ON ac.nr_atendimento = oc.nr_atendimento
                    WHERE ac.cd_pessoa_fisica = :cd_pessoa_fisica
                ),
                DiagnosticosAgrupados AS (
                    SELECT 
                        nr_atendimento,
                        LISTAGG(ds_diagnostico, '; ') WITHIN GROUP (ORDER BY ds_diagnostico) as diagnosticos
                    FROM diagnostico_medico
                    GROUP BY nr_atendimento
                )
                SELECT 
                    TO_CHAR(ci.dt_agenda, 'DD/MM/YYYY') as data_consulta,
                    ci.nr_atendimento,
                    m.nm_guerra,
                    oa.ds_anamnese,
                    ofr.ds_observacao as refracao,
                    oca.ds_observacao as acuidade,
                    ot.ds_observacao as pressao,
                    da.diagnosticos,
                    ofc.ds_conduta,
                    pee.ds_solicitacao as exames,
                    oo.ds_orientacao as oculos,
                    CASE 
                        WHEN ci.dt_fim_consulta IS NOT NULL THEN 'Finalizada'
                        ELSE 'Em andamento'
                    END as status_consulta
                FROM ConsultaInfo ci
                LEFT JOIN medico m ON m.cd_pessoa_fisica = ci.cd_medico_req
                LEFT JOIN oft_anamnese oa ON oa.nr_seq_consulta = ci.nr_seq_consulta
                LEFT JOIN oft_refracao ofr ON ofr.nr_seq_consulta = ci.nr_seq_consulta
                LEFT JOIN oft_correcao_atual oca ON oca.nr_seq_consulta = ci.nr_seq_consulta
                LEFT JOIN oft_tonometria ot ON ot.nr_seq_consulta = ci.nr_seq_consulta
                LEFT JOIN DiagnosticosAgrupados da ON da.nr_atendimento = ci.nr_atendimento
                LEFT JOIN oft_conduta ofc ON ofc.nr_seq_consulta = ci.nr_seq_consulta
                LEFT JOIN pedido_exame_externo pee ON pee.nr_atendimento = ci.nr_atendimento
                LEFT JOIN oft_oculos oo ON oo.nr_seq_consulta = ci.nr_seq_consulta
                ORDER BY ci.dt_agenda ASC
        """
        
        results = self.oraconn.execute_select(query, {'cd_pessoa_fisica': cd_pessoa_fisica})
        
        return [
            {
                'data_consulta': row[0] or 'N/A',
                'nr_atendimento': row[1] or 'N/A',
                'medico': row[2] or 'N/A',
                'queixa': row[3] or 'N/A',
                'refracao': row[4] or 'N/A',
                'acuidade': row[5] or 'N/A',
                'pressao': row[6] or 'N/A',
                'diagnostico': row[7] or 'N/A',
                'conduta': row[8] or 'N/A',
                'exames': row[9] or 'N/A',
                'oculos': row[10] or 'N/A',
                'status_consulta': row[11] or 'Em andamento'
            } for row in results
        ]