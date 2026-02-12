// ==========================================
// CONFIGURATION & SETUP
// ==========================================
const API_URL = 'https://qprep-backend-1.onrender.com/api/papers'; 

// Define your departments list here
const deptList = ["ITH","AUD", "BCH", "BMB","EHS", "MBBS","MCB", "MLS", "NUR", "NUT","PHM", "PRT", "PST" ];

let activeSections = [];

// ==========================================
// 1. SECURITY & PERMISSIONS (The New Guard) 🛡️
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    // 1. Hide Admin Button for Students
    const adminBtn = document.querySelector('.fab'); 
    
    if (!user || user.role === 'student') {
        if (adminBtn) adminBtn.style.display = 'none';
    } else {
        if (adminBtn) adminBtn.style.display = 'flex';
    }

    // 2. Render the Checkboxes (Wait for DOM)
    renderDepartmentCheckboxes();
    
    // 3. FORCE MULTI-FILE SUPPORT (In case HTML is missing 'multiple')
    const uploadInput = document.getElementById('pqUpload');
    if (uploadInput) {
        uploadInput.setAttribute('multiple', 'multiple');
    }
});

// A. RENDER CHECKBOXES
function renderDepartmentCheckboxes() {
    const container = document.getElementById('deptCheckboxContainer');
    if (!container) return; // Safety check in case HTML isn't updated yet

    container.innerHTML = ''; // Clear existing

    deptList.forEach(dept => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `
            <input type="checkbox" value="${dept}" id="cb_${dept}">
            <label for="cb_${dept}">${dept}</label>
        `;
        container.appendChild(div);
    });
}

// B. HANDLE PERMISSIONS & LOCKS
function checkScopeConstraints() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    // If Moderator, LOCK their scope
    if (user && user.role === 'moderator' && user.scope) {
        
        // 1. Handle Level (Single Select)
        const levelSelect = document.getElementById('adminLevel');
        if (levelSelect) {
            levelSelect.value = user.scope.level;
            levelSelect.disabled = true; // 🔒 Locked
        }

        // 2. Handle Departments (Checkboxes)
        const myDept = user.scope.department;
        const myBox = document.getElementById(`cb_${myDept}`);
        
        // Uncheck everything first
        const allBoxes = document.querySelectorAll('#deptCheckboxContainer input');
        allBoxes.forEach(box => {
            box.checked = false;
            box.disabled = true; // Disable everyone
        });

        // Check and Enable ONLY the moderator's department
        if (myBox) {
            myBox.checked = true;
            myBox.disabled = true; // Keep disabled but checked to show "Forced"
        }
    }
}

// C. SELECT ALL HELPER
window.toggleAllDepts = function() {
    const user = JSON.parse(localStorage.getItem('user'));
    // Moderators cannot use Select All
    if (user && user.role === 'moderator') return;

    const checkboxes = document.querySelectorAll('#deptCheckboxContainer input');
    // Check if all are currently checked to toggle state
    const allChecked = Array.from(checkboxes).every(c => c.checked);
    checkboxes.forEach(c => c.checked = !allChecked);
};

// ==========================================
// 2. UI & PANEL MANAGEMENT
// ==========================================

function openAdminPanel() {
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = 'block';
        if (activeSections.length === 0) addNewSection();
        
        // Reset checkboxes if Admin (Moderators stay locked)
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.role !== 'moderator') {
            document.querySelectorAll('#deptCheckboxContainer input').forEach(c => c.checked = false);
        }

        // 🔒 Apply Locks
        checkScopeConstraints();
    }
}

function closeAdminPanel() { 
    const panel = document.getElementById('adminPanel');
    if (panel) panel.style.display = 'none'; 
    
    // Clear form safely
    activeSections = [];

    const clearVal = (id) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = "";
            el.disabled = false; 
        }
    };

    clearVal('adminCourseCode');
    clearVal('adminCourseTitle');
    clearVal('adminYear');
    clearVal('adminLevel'); // Reset Level
    clearVal('pqUpload'); 

    // Reset Checkboxes
    document.querySelectorAll('#deptCheckboxContainer input').forEach(c => {
        c.checked = false;
        c.disabled = false;
    });

    const container = document.getElementById('objFieldsContainer');
    if (container) container.innerHTML = "";
}

// --- KEEPING YOUR TYPED QUESTION LOGIC EXACTLY AS IS ---
function addNewSection() {
    const section = {
        id: Date.now(),
        title: "SECTION " + String.fromCharCode(65 + activeSections.length), 
        questions: []
    };
    activeSections.push(section);
    renderAdminWorkspace();
}

function removeSection(id) {
    activeSections = activeSections.filter(s => s.id !== id);
    renderAdminWorkspace();
}

function addQuestionToSection(sectionId) {
    const section = activeSections.find(s => s.id === sectionId);
    if (section) {
        section.questions.push({ text: "" });
        renderAdminWorkspace();
    }
}

function renderAdminWorkspace() {
    const container = document.getElementById('objFieldsContainer');
    if (!container) return;
    
    container.innerHTML = activeSections.map(sec => `
        <div class="admin-section-block glass" style="margin-bottom: 20px; padding: 25px; border: 1px solid var(--glass-border); border-radius: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <input type="text" value="${sec.title}" onchange="updateSecTitle(${sec.id}, this.value)" 
                    class="glass-input" style="width: 70%; font-weight:bold; font-size: 1.1rem; color: var(--accent);">
                <button onclick="removeSection(${sec.id})" class="logout-btn" style="padding: 8px 15px; font-size:0.8rem; border-radius: 8px;">
                    <i class="fas fa-trash-alt"></i> Remove
                </button>
            </div>
            
            <div id="questions-for-${sec.id}" style="display: flex; flex-direction: column; gap: 15px;">
                ${sec.questions.map((q, qi) => `
                    <div style="position: relative;">
                        <textarea placeholder="Type Question ${qi + 1} here..." onchange="updateQText(${sec.id}, ${qi}, this.value)" 
                            class="glass-input" style="width: 100%; min-height: 80px; padding: 15px; line-height: 1.5;">${q.text}</textarea>
                    </div>
                `).join('')}
            </div>
            <button onclick="addQuestionToSection(${sec.id})" class="btn-secondary" style="width:100%; margin-top:20px; padding: 12px; border-style: dashed;">
                <i class="fas fa-plus-circle"></i> Add Question
            </button>
        </div>`).join('');
}

window.updateSecTitle = (id, val) => { activeSections.find(s => s.id === id).title = val; };
window.updateQText = (sid, qi, val) => { activeSections.find(s => s.id === sid).questions[qi].text = val; };


function showNotification(msg, type) {
    if (window.showToast) window.showToast(msg, type);
    else alert(msg);
}

// ==========================================
// 4. SECURE CLOUD UPLOAD LOGIC (MULTI-PAGE) 📸📸
// ==========================================

async function saveNewQuestion() {
    // A. Gather Inputs
    const code = document.getElementById('adminCourseCode').value.toUpperCase().trim();
    const title = document.getElementById('adminCourseTitle').value.trim();
    const level = document.getElementById('adminLevel').value;
    const year = document.getElementById('adminYear').value.trim();
    const semester = document.getElementById('adminSemester').value;

    // B. Gather Selected Departments (The Array!)
    const selectedDepts = Array.from(document.querySelectorAll('#deptCheckboxContainer input:checked'))
                                   .map(cb => cb.value);

    // C. Validation
    if (!code || !year || !title) {
        showNotification("Please fill in Course Code, Title, and Year.", "error");
        return;
    }
    if (selectedDepts.length === 0) {
        showNotification("Please select at least one department.", "error");
        return;
    }

    // D. Get Token (CRITICAL)
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification("Session Expired. Please Login.", "error");
        setTimeout(() => window.location.href = 'login.html', 2000);
        return;
    }

    // E. Button UI Feedback
    const saveBtn = document.querySelector('.admin-actions .btn-primary');
    let originalText = "Save Paper";
    if (saveBtn) {
        originalText = saveBtn.innerText;
        saveBtn.innerText = "Uploading to Cloud..."; 
        saveBtn.disabled = true;
    }

    try {
        // ✅ MULTI-FILE HANDLING
        const fileInput = document.getElementById('pqUpload');
        const files = fileInput ? fileInput.files : [];

        // Validation: Ensure file exists
        if (files.length === 0) {
             throw new Error("Please select at least one PDF or Image.");
        }

        // Update Text to show count
        if (saveBtn) saveBtn.innerText = `Uploading ${files.length} Page(s)...`;

        // F. Create FormData
        const formData = new FormData();
        
        // 1. Loop and Append ALL files (Key must match 'files' in backend)
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        
        // 2. Append Text Data
        formData.append('courseCode', code);
        formData.append('courseTitle', title);
        formData.append('level', level);
        formData.append('year', year);
        formData.append('semester', semester);
        formData.append('departments', selectedDepts.join(','));

        // 3. Metadata (Base type on first file)
        const type = files[0].type.includes('pdf') ? 'pdf' : 'image';
        formData.append('type', type);

        // 4. Sections
        if (activeSections.length > 0) {
            formData.append('sections', JSON.stringify(activeSections));
        }

        // G. Send to Backend
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Authorization': token },
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            showNotification(`Success! ${files.length} pages uploaded.`, "success");
            closeAdminPanel();

            if (typeof window.loadPapersFromBackend === 'function') {
                window.loadPapersFromBackend(); 
            } else {
                setTimeout(() => location.reload(), 1000);
            }

        } else {
            throw new Error(result.error || "Upload Rejected");
        }

    } catch (error) {
        console.error("Upload Error:", error);
        showNotification("Failed: " + error.message, "error");
    } finally {
        if (saveBtn) {
            saveBtn.innerText = originalText;
            saveBtn.disabled = false;
        }
    }
}

// Global Exports
window.openAdminPanel = openAdminPanel;
window.closeAdminPanel = closeAdminPanel;
window.addNewSection = addNewSection;
window.removeSection = removeSection;
window.addQuestionToSection = addQuestionToSection;
window.saveNewQuestion = saveNewQuestion;