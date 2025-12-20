let user = JSON.parse(localStorage.getItem('qprep_user')) || null;
let currentAuthMode = 'student';

function setAuthMode(mode) {
    currentAuthMode = mode;
    document.getElementById('studentTab').classList.toggle('active', mode === 'student');
    document.getElementById('adminTab').classList.toggle('active', mode === 'admin');
    document.getElementById('studentFields').style.display = mode === 'student' ? 'block' : 'none';
    document.getElementById('adminFields').style.display = mode === 'admin' ? 'block' : 'none';
    document.getElementById('authTitle').innerText = mode === 'student' ? "Welcome to QPrep" : "Admin Portal";
}

function handleAuth(e) {
    if (e) e.preventDefault();
    if (currentAuthMode === 'admin') {
        const email = document.getElementById('adminEmail').value;
        const pass = document.getElementById('adminPass').value;
        // Standard admin credentials
        if (email === "admin@qprep.com" && pass === "password123") {
            user = { name: "System Admin", role: "admin", dept: "All", level: "Admin" };
        } else {
            alert("Invalid Credentials"); return;
        }
    } else {
        const name = document.getElementById('regName').value;
        if (!name) return alert("Please enter your name");
        user = {
            name: name,
            dept: document.getElementById('regDept').value,
            level: document.getElementById('regLevel').value,
            role: "student"
        };
    }
    localStorage.setItem('qprep_user', JSON.stringify(user));
    location.reload();
}

function logoutUser() {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem('qprep_user');
        location.reload();
    }
}