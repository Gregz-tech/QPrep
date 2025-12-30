// ================================================================
// 1. CONFIGURATION & DATA
// ================================================================
const API_URL = 'https://qprep-backend-1.onrender.com/api/auth';

const universityData = {
    "FUHSI": ["ITH","AUD", "BCH", "BMB","EHS", "MBBS","MCB", "MLS", "NUR", "NUT","PHM", "PRT", "PST" ],
    "OAU": ["Computer Science", "Medicine", "Pharmacy", "Law", "Accounting", "Microbiology"],
    "UNILAG": ["Systems Engineering", "Data Science", "Business Admin", "Economics"],
    "UI": ["Computer Science", "Economics", "Medicine", "Agriculture"],
    "OOU": ["Computer Science", "Mass Comm", "Political Science"],
    "OTHER": ["General Science", "Arts", "Commercial", "Engineering"]
};

// ================================================================
// 2. UI HELPERS
// ================================================================

// A. Flip Card Logic
const mainCard = document.getElementById('mainCard');
const triggerSignUp = document.getElementById('triggerSignUp');
const triggerSignIn = document.getElementById('triggerSignIn');

if(triggerSignUp) {
    triggerSignUp.addEventListener('click', (e) => {
        e.preventDefault();
        mainCard.classList.add("is-flipped");
    });
}

if(triggerSignIn) {
    triggerSignIn.addEventListener('click', (e) => {
        e.preventDefault();
        mainCard.classList.remove("is-flipped");
    });
}

// B. Dynamic Department Loader
window.populateDepartments = function() {
    const institution = document.getElementById('regInstitution').value;
    const deptSelect = document.getElementById('regDept');
    
    // Reset
    deptSelect.innerHTML = '<option value="">Select Department</option>';
    
    if (institution && universityData[institution]) {
        deptSelect.disabled = false;
        universityData[institution].forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            option.innerText = dept;
            deptSelect.appendChild(option);
        });
    } else {
        deptSelect.disabled = true;
        deptSelect.innerHTML = '<option value="">Select Institution First</option>';
    }
};

// C. Password Toggle
window.togglePass = function(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = "password";
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
};

// ================================================================
// 3. API & FORM LOGIC
// ================================================================

async function sendAuthRequest(endpoint, data, btnId, originalText) {
    const btn = document.getElementById(btnId);
    btn.innerText = "Processing...";
    btn.style.opacity = "0.8";
    btn.disabled = true;

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
            showToast(result.error || "An error occurred.", "error");
            return { success: false };
        }
    } catch (error) {
        showToast("Connection Error. Check internet.", "error");
        return { success: false };
    } finally {
        btn.innerText = originalText;
        btn.style.opacity = "1";
        btn.disabled = false;
    }
}

// --- HANDLE REGISTRATION ---
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        username: document.getElementById('regUsername').value.trim(),
        email: document.getElementById('regEmail').value.trim(),
        institution: document.getElementById('regInstitution').value,
        department: document.getElementById('regDept').value,
        level: document.getElementById('regLevel').value,
        password: document.getElementById('regPass').value,
        role: document.getElementById('regRole').value
    };

    const result = await sendAuthRequest('register', formData, 'regBtn', 'Register');

    if (result.success) {
        showToast("Registration Successful! Please sign in.", "success");
        mainCard.classList.remove("is-flipped");
        document.getElementById('registerForm').reset();
    }
});

// --- HANDLE LOGIN ---
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        identifier: document.getElementById('loginIdentifier').value.trim(), // Can be email or username
        password: document.getElementById('loginPass').value
    };

    const result = await sendAuthRequest('login', formData, 'loginBtn', 'Enter Portal');

  if (result.success) {
        showToast("Login Successful! Redirecting...", "success");

        // 1. Unpack the response (Separate Token from User Data)
        // Backend sends: { token: "...", user: { username: "...", department: "..." } }
        const { token, user } = result.data; 

        // 2. Save them separately
        localStorage.setItem('token', token);       // Save the ID Card
        localStorage.setItem('user', JSON.stringify(user)); // Save the User Details

        // 3. Redirect
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
});