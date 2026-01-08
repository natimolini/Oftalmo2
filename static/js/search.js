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

const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

let timeoutId = null;

document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
    }
});

searchInput.addEventListener('focus', () => {
    if (searchResults.children.length) {
        searchResults.style.display = 'block';
    }
});

searchInput.addEventListener('keyup', async (e) => {
    clearTimeout(timeoutId);
    
    if (e.target.value.length < 3) {
        searchResults.style.display = 'none';
        return;
    }
    
    timeoutId = setTimeout(async () => {
        try {
            const response = await fetch(`/buscar_paciente?search_term=${e.target.value}`);
            if (!response.ok) throw new Error('Erro na busca');
            
            const data = await response.json();
            displayResults(data);
        } catch (error) {
            console.error('Erro na busca:', error);
            searchResults.innerHTML = '<div class="search-error">Erro ao buscar pacientes</div>';
            searchResults.style.display = 'block';
        }
    }, 300);
});


function displayResults(results) {
    if (!Array.isArray(results) || results.length === 0) {
        searchResults.innerHTML = '<div class="search-no-results">Nenhum paciente encontrado</div>';
        searchResults.style.display = 'block';
        return;
    }
    
    searchResults.innerHTML = '';
    results.forEach(result => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        
        const nome = result[1] || 'Nome não disponível';
        const atendimento = result[2] || '';
        const convenio = result[3] || '';

        div.innerHTML = `
            <div class="patient-name">${nome}</div>
            <div class="patient-details">
                ${atendimento ? `Atendimento: ${atendimento}` : ''}
                ${convenio ? ` - ${convenio}` : ''}
            </div>
        `;
        
        div.onclick = () => selectPatient({
            CD_PESSOA_FISICA: result[0],
            NM_PESSOA_FISICA: nome,
            NR_ATENDIMENTO: atendimento
        });
        
        searchResults.appendChild(div);
    });
    searchResults.style.display = 'block';
}

async function selectPatient(patient) {
    if (patient.NR_ATENDIMENTO) {
        console.log('PACIENTE COM ATENDIMENTO NO SEARCH')
        try {
            const resposta = await fetch(`/prontuario/${patient.NR_ATENDIMENTO}?cd_pessoa_fisica=${patient.CD_PESSOA_FISICA}`);
            const contentType = resposta.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {

                const resultado = await resposta.json();
                exibirMensagem(resultado.message, 'error');
                
            } else {

                const newWindow = window.location.href = `/prontuario/${patient.NR_ATENDIMENTO}?cd_pessoa_fisica=${patient.CD_PESSOA_FISICA}`;
                popularDadosProntuario(newWindow, nrAtendimento);
                
            }
        } catch (error) {
            console.error("Erro ao buscar prontuário:", error);
        }
        
    } else {
        searchInput.value = patient.NM_PESSOA_FISICA;
        searchResults.innerHTML = '<div class="search-warning">Paciente sem atendimento ativo</div>';
        searchResults.style.display = 'block';
    }
}