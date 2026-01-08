export async function carregarAcuidade(pesquisa = '') {
    const container = document.getElementById('lista-acuidade-container');
    if (!container) {
        console.error('Container not found');
        return;
    }

    try {
        container.innerHTML = '<div style="text-align: center; padding: 10px;">Carregando...</div>';

        const response = await fetch(`/api/acuidade-templates?search=${pesquisa}`);
        const templates = await response.json();
        
        if (templates.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 10px;">Nenhum template encontrado</div>';
            return;
        }

        container.innerHTML = '';
        templates.forEach(template => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = template.ds_acuidade_visual;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(template.ds_acuidade_visual));
            container.appendChild(label);
        });
    } catch (error) {
        container.innerHTML = `<div style="text-align: center; padding: 10px; color: red;">
            Erro: ${error.message}
        </div>`;
    }
}