export async function carregarQueixas(pesquisa = '') {
    const container = document.getElementById('lista-queixas-container');
    if (!container) {
        console.error('Container not found');
        return;
    }
    
    try {
        container.innerHTML = '<div style="text-align: center; padding: 10px;">Carregando...</div>';

        const response = await fetch(`/api/queixas-principais?search=${pesquisa}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar queixas');
        }
        
        const queixas = await response.json();
        
        if (queixas.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 10px;">Nenhuma queixa encontrada</div>';
            return;
        }

        container.innerHTML = '';
        queixas.forEach(queixa => {
            
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = queixa.ds_queixa_principal;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(queixa.ds_queixa_principal));
            container.appendChild(label);
        });
    } catch (error) {
        console.error('Erro ao carregar queixas:', error);
        container.innerHTML = `<div style="text-align: center; padding: 10px; color: red;">
            Erro ao carregar queixas: ${error.message}
        </div>`;
    }
}

