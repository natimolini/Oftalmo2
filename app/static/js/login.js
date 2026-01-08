document.getElementById("login-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const formData = new FormData(event.target); 
    const flashMessageDiv = document.getElementById("flash-message"); 

    try {
        const response = await fetch("/login", {
            method: "POST",
            body: formData,
        });

        if (response.redirected) {
            window.location.href = response.url;
            return;
        }

        const data = await response.json();

        flashMessageDiv.style.display = "block";
        flashMessageDiv.textContent = data.message;
        flashMessageDiv.style.backgroundColor = "#f8d7da";
        flashMessageDiv.style.color = "#721c24";


        setTimeout(() => {
            flashMessageDiv.style.opacity = "0"; 
            setTimeout(() => {
                flashMessageDiv.style.display = "none"; 
                flashMessageDiv.style.opacity = "1"; 
            }, 1000); 
        }, 3000); 
    } catch (error) {
        console.error("Erro na requisição:", error);

        flashMessageDiv.style.display = "block";
        flashMessageDiv.textContent = "Ocorreu um erro ao processar a solicitação.";
        flashMessageDiv.style.backgroundColor = "#f8d7da";
        flashMessageDiv.style.color = "#721c24";

   
        setTimeout(() => {
            flashMessageDiv.style.opacity = "0";
            setTimeout(() => {
                flashMessageDiv.style.display = "none"; 
                flashMessageDiv.style.opacity = "1"; 
            }, 1000); 
        }, 3000); 
    }
});
