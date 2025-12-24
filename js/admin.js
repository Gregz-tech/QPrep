// CONFIGURATION
const API_URL = 'http://localhost:5000/api/papers'; 

let activeSections = [];

// ==========================================
// 1. UI & PANEL MANAGEMENT
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
    
    // Clear form
    activeSections = [];
    document.getElementById('adminCourseCode').value = "";
    document.getElementById('adminCourseTitle').value = "";
    document.getElementById('adminYear').value = "";
    document.getElementById('adminInstructions').value = "";
    document.getElementById('pqUpload').value = ""; 
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
                    <i class="fas fa-trash-alt"></i> Remove Section
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
                <i class="fas fa-plus-circle"></i> Add Another Question
            </button>
        </div>`).join('');
}

window.updateSecTitle = (id, val) => { activeSections.find(s => s.id === id).title = val; };
window.updateQText = (sid, qi, val) => { activeSections.find(s => s.id === sid).questions[qi].text = val; };


// ==========================================
// 2. MAIN SAVE LOGIC (Frontend -> Node.js)
// ==========================================

async function saveNewQuestion() {
    const code = document.getElementById('adminCourseCode').value.toUpperCase().trim();
    const title = document.getElementById('adminCourseTitle').value.trim();
    const dept = document.getElementById('adminDept').value;
    const level = document.getElementById('adminLevel').value;
    const year = document.getElementById('adminYear').value.trim();
    const semester = document.getElementById('adminSemester').value;
    const fileInput = document.getElementById('pqUpload');
    const instructions = document.getElementById('adminInstructions').value.trim();

    if (!code || !year || !title) {
        showNotification("Please fill in Course Code, Title, and Year.", "error");
        return;
    }

    const saveBtn = document.querySelector('.btn-primary');
    const originalText = saveBtn.innerText;
    saveBtn.innerHTML = `Uploading...`;
    saveBtn.disabled = true;

    try {
        // Process Files
        let processedImages = [];
        let processedDocs = [];

        if (fileInput && fileInput.files.length > 0) {
            const uploadPromises = Array.from(fileInput.files).map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve({ name: file.name, type: file.type, data: e.target.result });
                    reader.onerror = (error) => reject(error);
                    reader.readAsDataURL(file);
                });
            });

            const results = await Promise.all(uploadPromises);
            
            results.forEach(f => {
                if (f.type.startsWith('image/')) {
                    processedImages.push(f.data);
                } else {
                    processedDocs.push(f);
                }
            });
        }

        const paperPayload = {
            courseCode: code,
            courseTitle: title,
            department: dept,
            level: level,
            year: year,
            semester: semester,
            instructions: instructions,
            sections: activeSections,
            imagePaths: processedImages,
            documents: processedDocs
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paperPayload)
        });

        const result = await response.json();

        if (response.ok) {
            showNotification(`Success! ${code} saved to database.`, "success");
            closeAdminPanel();
            setTimeout(() => location.reload(), 1500); 
        } else {
            throw new Error(result.error || result.message || "Server rejected the data");
        }

    } catch (error) {
        console.error("Save Error:", error);
        showNotification("Upload Failed: " + error.message, "error");
        saveBtn.innerText = originalText;
        saveBtn.disabled = false;
    }
}

function editPaper(dept, level, code, year, sem) {
    const course = questionBank[dept]?.[level]?.[code];
    if (!course) return showNotification("Paper not found locally. Try refreshing.", "error");

    const paper = course.data[year]?.[sem];
    if (!paper) return showNotification("Specific year data not found.", "error");

    openAdminPanel();
    
    document.getElementById('adminCourseCode').value = code;
    document.getElementById('adminCourseTitle').value = course.name;
    document.getElementById('adminDept').value = dept;
    document.getElementById('adminLevel').value = level;
    document.getElementById('adminYear').value = year;
    document.getElementById('adminSemester').value = sem;
    document.getElementById('adminInstructions').value = paper.instructions || "";

    if (paper.sections && paper.sections.length > 0) {
        activeSections = paper.sections;
        renderAdminWorkspace();
    } else {
        activeSections = [];
        addNewSection();
    }
    showNotification(`Editing ${code} (${year}).`, "info");
}

window.openAdminPanel = openAdminPanel;
window.closeAdminPanel = closeAdminPanel;
window.addNewSection = addNewSection;
window.removeSection = removeSection;
window.addQuestionToSection = addQuestionToSection;
window.saveNewQuestion = saveNewQuestion;
window.editPaper = editPaper;