// js/admin.js
let activeSections = [];

function openAdminPanel() {
    document.getElementById('adminPanel').style.display = 'block';
    activeSections = [];
    addNewSection();
}

function closeAdminPanel() { 
    document.getElementById('adminPanel').style.display = 'none'; 
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
        <div class="admin-section-block glass" style="margin-bottom: 20px; padding: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <input type="text" value="${sec.title}" onchange="updateSecTitle(${sec.id}, this.value)" class="glass-input" style="width: 70%;">
                <button onclick="removeSection(${sec.id})" class="logout-btn" style="padding: 5px 10px;">Delete Section</button>
            </div>
            <button onclick="addQuestionToSection(${sec.id})" class="btn-secondary" style="margin-bottom: 15px;">+ Add Question</button>
            <div id="questions-for-${sec.id}">
                ${sec.questions.map((q, qi) => `
                    <div style="position: relative; margin-bottom: 10px;">
                        <textarea placeholder="Question ${qi + 1}" onchange="updateQText(${sec.id}, ${qi}, this.value)" class="glass-input" style="width: 100%; min-height: 60px;">${q.text}</textarea>
                    </div>
                `).join('')}
            </div>
        </div>`).join('');
}

function updateSecTitle(id, val) { activeSections.find(s => s.id === id).title = val; }
function updateQText(sid, qi, val) { activeSections.find(s => s.id === sid).questions[qi].text = val; }

// MAIN SAVE LOGIC
async function saveNewQuestion() {
    const code = document.getElementById('adminCourseCode').value.toUpperCase().trim();
    const title = document.getElementById('adminCourseTitle').value.trim();
    const dept = document.getElementById('adminDept').value;
    const level = document.getElementById('adminLevel').value;
    const year = document.getElementById('adminYear').value.trim();
    const semester = document.getElementById('adminSemester').value;
    const fileInput = document.getElementById('pqUpload');

    if (!code || !year || !title) {
        showNotification("Course Code, Title, and Year are required.", "error");
        return;
    }

    const saveBtn = document.querySelector('.btn-primary');
    const originalText = saveBtn.innerText;
    saveBtn.innerText = "Processing...";
    saveBtn.disabled = true;

    // Build the Paper Object
    const paperEntry = {
        instructions: document.getElementById('adminInstructions').value.trim(),
        isImagePaper: false,
        isDocument: false,
        imagePaths: [],
        documents: [],
        sections: activeSections
    };

    try {
        if (fileInput && fileInput.files.length > 0) {
            const uploadPromises = Array.from(fileInput.files).map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve({ name: file.name, type: file.type, data: e.target.result });
                    reader.readAsDataURL(file); //
                });
            });

            const results = await Promise.all(uploadPromises);
            results.forEach(f => {
                if (f.type.includes('image')) {
                    paperEntry.isImagePaper = true;
                    paperEntry.imagePaths.push(f.data);
                } else {
                    paperEntry.isDocument = true;
                    paperEntry.documents.push(f);
                }
            });
        }

        // Deep structure initialization
        if (!questionBank[dept]) questionBank[dept] = {};
        if (!questionBank[dept][level]) questionBank[dept][level] = {};
        if (!questionBank[dept][level][code]) questionBank[dept][level][code] = { name: title, data: {} };
        if (!questionBank[dept][level][code].data[year]) questionBank[dept][level][code].data[year] = {};

        questionBank[dept][level][code].data[year][semester] = paperEntry;
        
        localStorage.setItem('qprep_bank', JSON.stringify(questionBank)); //
        showNotification(`Success! ${code} integrated.`, "success");
        setTimeout(() => location.reload(), 1500);

    } catch (error) {
        showNotification("Storage Full or Save Error.", "error"); //
        saveBtn.innerText = originalText;
        saveBtn.disabled = false;
    }
}

// ==========================================
// EDIT FUNCTIONALITY
// ==========================================

function editPaper(dept, level, code, year, sem) {
    // 1. Retrieve the specific paper object
    const course = questionBank[dept][level][code];
    const paper = course.data[year][sem];

    if (!paper) {
        showNotification("Error: Paper data not found.", "error");
        return;
    }

    // 2. Open the Admin Panel
    openAdminPanel();

    // 3. Pre-fill Metadata Fields
    document.getElementById('adminCourseCode').value = code;
    document.getElementById('adminCourseTitle').value = course.name;
    document.getElementById('adminDept').value = dept;
    document.getElementById('adminLevel').value = level;
    document.getElementById('adminYear').value = year;
    document.getElementById('adminSemester').value = sem;
    document.getElementById('adminInstructions').value = paper.instructions || "";

    // 4. Handle Text Sections (If it's a typed paper)
    if (paper.sections && paper.sections.length > 0) {
        // Load the existing questions into the global activeSections array
        activeSections = paper.sections; 
        renderAdminWorkspace(); // Re-render the form with these questions
    } else {
        // Reset sections if it's purely an image paper
        activeSections = [];
        addNewSection(); // Start with one empty section
    }

    // 5. Handle Images/Docs (User Feedback)
    // Note: We cannot pre-fill the <input type="file"> due to browser security.
    if (paper.isImagePaper || paper.isDocument) {
        const fileCount = (paper.imagePaths?.length || 0) + (paper.documents?.length || 0);
        showNotification(`Editing: This paper has ${fileCount} existing file(s). Uploading new files will REPLACE them.`, "info");
    } else {
        showNotification("Editing Mode Enabled.", "success");
    }
}

// Make it globally accessible for the onclick event in HTML
window.editPaper = editPaper;