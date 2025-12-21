// QPrep Bootloader
// This file initializes the modules defined in other JS files

document.addEventListener('DOMContentLoaded', () => {
    console.log("QPrep System Initializing...");

    // 1. Check if a user is already logged in (Logic from auth.js)
    if (user) {
        // Hide the login screen
        const authModal = document.getElementById('authModal');
        if (authModal) authModal.style.display = 'none';

        // 2. Build the dashboard (Logic from ui.js)
        renderDashboard();
        
        // 3. Update the mobile sidebar info (Logic from ui.js)
        if (typeof updateMobileUserInfo === 'function') {
            updateMobileUserInfo();
        }
    } else {
        console.log("No active session. Waiting for login...");
    }

    // 4. Global Search Listener (Logic from ui.js)
    const searchInput = document.getElementById('courseSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
    }
});

// Ensure the form actually triggers the handleAuth function
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm');
    if (form) {
        form.addEventListener('submit', handleAuth);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    renderDashboard();
    setupSearchFeature(); // Initializes the search listener
});