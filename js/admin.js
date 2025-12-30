// ==========================================
// CONFIGURATION & SETUP
// ==========================================

// ✅ 1. CONNECT TO LIVE RENDER BACKEND
const API_URL = 'https://qprep-backend-1.onrender.com/api/papers'; 

let activeSections = [];

// ==========================================
// 2. UI & PANEL MANAGEMENT (Your Existing UI Logic)
// ==========================================

function openAdminPanel() {
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = 'block';
        if (activeSections.length === 0) addNewSection();
    }
}

function closeAdminPanel() { 
    const panel = document.getElementById('adminPanel');
    if (panel) panel.style.display = 'none'; 
    
    // Clear form safely
    activeSections = [];

    // Helper to safely clear value
    const clearVal = (id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    };

    clearVal('adminCourseCode');
    clearVal('adminCourseTitle');
    clearVal('adminYear');
    clearVal('adminInstructions');
    clearVal('pqUpload'); 

    // Safely clear innerHTML
    const container = document.getElementById('objFieldsContainer');
    if (container) {
        container.innerHTML = "";
    }
}
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


// ==========================================
// 3. FILE CONVERSION ENGINE (The New Part)
// ==========================================
const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

function showNotification(msg, type) {
    showToast(msg);
}

// ==========================================
// 4. MAIN UPLOAD LOGIC (Connected to Render)
// ==========================================

async function saveNewQuestion() {
    // A. Gather Inputs
    const code = document.getElementById('adminCourseCode').value.toUpperCase().trim();
    const title = document.getElementById('adminCourseTitle').value.trim();
    const dept = document.getElementById('adminDept').value;
    const level = document.getElementById('adminLevel').value;
    const year = document.getElementById('adminYear').value.trim();
    const semester = document.getElementById('adminSemester').value;
    
    // B. Validation
    if (!code || !year || !title) {
        showNotification("Please fill in Course Code, Title, and Year.", "error");
        return;
    }

    // C. Button UI Feedback (Safe Version)
    const saveBtn = document.querySelector('.admin-actions .btn-primary');
    let originalText = "Save Paper";
    
    if (saveBtn) {
        originalText = saveBtn.innerText;
        saveBtn.innerText = "Uploading...";
        saveBtn.disabled = true;
    }

    try {
        // D. Handle File Upload
        const fileInput = document.getElementById('pqUpload');
        const file = fileInput ? fileInput.files[0] : null;
        
        let base64Data = "";
        let fileType = "image"; 

        if (file) {
            base64Data = await convertToBase64(file);
            fileType = file.type.includes('pdf') ? 'pdf' : 'image';
        } else {
             // If no file, check if manual questions exist
            if(activeSections.length === 0) {
                 throw new Error("Please upload a PDF/Image OR type questions.");
            }
        }

        // E. Construct Payload
        const payload = {
            courseCode: code,
            courseTitle: title,
            department: dept,
            level: level,
            year: year,
            semester: semester,
            type: fileType, 
            fileData: base64Data, 
            sections: activeSections
        };

        // F. Send to Render
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            showNotification(`Success! ${code} uploaded.`, "success");
            closeAdminPanel();

            // 🚀 THE FIX: Tell the Dashboard to Refresh!
            if (typeof window.loadPapersFromBackend === 'function') {
                console.log("Triggering Dashboard Refresh...");
                window.loadPapersFromBackend(); 
            } else {
                // Fallback if the function isn't found
                console.warn("Refresh function missing. Reloading page...");
                setTimeout(() => location.reload(), 1000);
            }

        } else {
            throw new Error(result.error || "Server rejected the data");
        }

    } catch (error) {
        console.error("Upload Error:", error);
        showNotification("Upload Failed: " + error.message, "error");
    } finally {
        // Reset Button
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
window.editPaper = (dept, level, code) => { 
    showNotification("Edit feature coming soon to cloud version!", "info"); 
};