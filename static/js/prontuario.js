document.addEventListener('DOMContentLoaded', function() {
    const examesTextarea = document.getElementById('textarea-exames');
    if (examesTextarea) {
        examesTextarea.addEventListener('input', function() {
            // Marcar que o textarea foi editado pelo usuário
            this.setAttribute('data-user-edited', 'true');
            console.log('Campo exames foi editado manualmente pelo usuário');
        });
    }
});