// ================================================================
//  CONFIGURATION
// ================================================================

// Use your live backend URL
const API_URL = 'https://qprep-backend-1.onrender.com/api/auth';

const mainCard = document.getElementById('mainCard');
const triggerSignUp = document.getElementById('triggerSignUp');
const triggerSignIn = document.getElementById('triggerSignIn');

// --- 1. FLIP ANIMATION TOGGLE ---
// Simple: Just toggle the 'is-flipped' class on the card container.
triggerSignUp.addEventListener('click', (e) => {
    e.preventDefault();
    mainCard.classList.add("is-flipped");
});

triggerSignIn.addEventListener('click', (e) => {
    e.preventDefault();
    mainCard.classList.remove("is-flipped");
});


// ================================================================
//  API & FORM LOGIC
// ================================================================

// --- 2. API HELPER FUNCTION ---
async function sendAuthRequest(endpoint, data, btnId, originalText) {
    const btn = document.getElementById(btnId);
    
    // UI Loading State
    btn.innerText = "Processing...";
    btn.style.opacity = "0.8";
    btn.disabled = true;
    btn.style.cursor = 'not-allowed';

    try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            return { success: true, data: result };
        } else {
            // Put button back to normal state immediately on error
            btn.innerText = originalText;
            btn.style.opacity = "1";
            btn.disabled = false;
            btn.style.cursor = 'pointer';
            
            // ✅ USE TOAST FOR ERROR
            showToast(result.error || "An error occurred. Please check your inputs.", "error");
            return { success: false };
        }
    } catch (error) {
        console.error("Auth Connection Error:", error);
        // Put button back to normal state immediately on error
        btn.innerText = originalText;
        btn.style.opacity = "1";
        btn.disabled = false;
        btn.style.cursor = 'pointer';
        
        // ✅ USE TOAST FOR NETWORK ERROR
        showToast("Cannot connect to server. Check internet connection.", "error");
        return { success: false };
    }
}

// --- 3. HANDLE REGISTRATION ---
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect Data
    const formData = {
        firstName: document.getElementById('regFirstname').value.trim(),
        lastName: document.getElementById('regLastname').value.trim(),
        username: document.getElementById('regUsername').value.trim(),
        matricNumber: document.getElementById('regMatric').value.trim(),
        email: document.getElementById('regEmail').value.trim(),
        department: document.getElementById('regDept').value,
        level: document.getElementById('regLevel').value,
        password: document.getElementById('regPass').value,
        role: document.getElementById('regRole').value
    };

    // Send Request
    const result = await sendAuthRequest('register', formData, 'regBtn', 'Register');

    if (result.success) {
        // ✅ USE TOAST FOR SUCCESS (Replaces alert)
        showToast("Registration Successful! Please sign in.", "success");

        // Flip back to login side automatically
        mainCard.classList.remove("is-flipped");
        
        // Clear form & reset button
        document.getElementById('registerForm').reset();
        const btn = document.getElementById('regBtn');
        btn.innerText = 'Register';
        btn.style.opacity = "1";
        btn.disabled = false;
        btn.style.cursor = 'pointer';
    }
});

// --- 4. HANDLE LOGIN ---
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect Data
    const formData = {
        identifier: document.getElementById('loginIdentifier').value.trim(),
        password: document.getElementById('loginPass').value,
        // Context data for verification
        department: document.getElementById('loginDept').value,
        level: document.getElementById('loginLevel').value
    };

    // Send Request
    const result = await sendAuthRequest('login', formData, 'loginBtn', 'Enter Portal');

    if (result.success) {
        // ✅ ADDED SUCCESS TOAST
        showToast("Login Successful! Redirecting...", "success");

        // 1. Save user token/data to Browser Memory
        localStorage.setItem('user', JSON.stringify(result.data));
        
        // 2. Redirect to Dashboard (Small delay to let user see the toast)
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
});

// --- 5. AUTO-REDIRECT ---
window.addEventListener('DOMContentLoaded', () => {
    // If a user is already saved in memory, skip login and go straight to dashboard
    if(localStorage.getItem('user')) {
       // Uncomment below to enable auto-redirect for logged-in users
       // window.location.href = 'index.html'; 
    }
});