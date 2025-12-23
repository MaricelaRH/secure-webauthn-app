
document.addEventListener('DOMContentLoaded', async () => {
    const userNameSpan = document.getElementById('user-name');
    const logoutBtn = document.getElementById('btn-logout');

    // Verificar identidad
    try {
        const resAuth = await fetch("/api/auth/me");
        if (!resAuth.ok) {
            window.location.href = "/";
            return;
        }
        const authData = await resAuth.json();
        userNameSpan.innerText = authData.username;

        // Intentar cargar datos protegidos
        const resData = await fetch("/api/protected/dashboard-data");
        if (resData.ok) {
            const protectedData = await resData.json();
            console.log("Datos protegidos:", protectedData.message);
        }
    } catch (err) {
        console.error("Error en dashboard:", err);
        window.location.href = "/";
    }

    // Manejar el cierre de sesión (Sin usar onclick en el HTML)
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/";
        });
    }
});