export async function carregarCirurgias(pesquisa = '') {
    const container = document.getElementById('lista-cirurgias-container');
    if (!container) {
        console.error('Container not found');
        return;
    }

    try {
        container.innerHTML = '<div style="text-align: center; padding: 10px;">Carregando...</div>';

        const response = await fetch(`/api/cirurgias-templates?search=${pesquisa}`);
        const templates = await response.json();
        
        if (templates.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 10px;">Nenhuma cirurgia encontrada</div>';
            return;
        }

        container.innerHTML = '';
        templates.forEach(template => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = template.ds_cirurgia;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(template.ds_cirurgia));
            container.appendChild(label);
        });
    } catch (error) {
        container.innerHTML = `<div style="text-align: center; padding: 10px; color: red;">
            Erro: ${error.message}
        </div>`;
    }
}