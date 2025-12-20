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
        marks: "",
        questions: []
    };
    activeSections.push(section);
    renderAdminWorkspace();
}

// Function to remove a section
function removeSection(id) {
    activeSections = activeSections.filter(s => s.id !== id);
    renderAdminWorkspace();
}

function addQuestionToSection(sectionId) {
    const section = activeSections.find(s => s.id === sectionId);
    if (section) {
        section.questions.push({ text: "", options: ["", "", "", ""], correct: 0 });
        renderAdminWorkspace();
    }
}

// Function to remove a specific question
function removeQuestion(sectionId, qIndex) {
    const section = activeSections.find(s => s.id === sectionId);
    if (section) {
        section.questions.splice(qIndex, 1);
        renderAdminWorkspace();
    }
}

function renderAdminWorkspace() {
    const container = document.getElementById('objFieldsContainer');
    if (!container) return;

    container.innerHTML = activeSections.map(sec => `
        <div class="admin-section-block glass" style="margin-bottom: 20px; padding: 20px; border: 1px solid var(--glass-border);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <input type="text" value="${sec.title}" onchange="updateSecTitle(${sec.id}, this.value)" class="glass-input" style="width: 70%;">
                <button onclick="removeSection(${sec.id})" class="logout-btn" style="padding: 5px 10px; font-size: 0.8rem;">Delete Section</button>
            </div>
            
            <button onclick="addQuestionToSection(${sec.id})" class="btn-secondary" style="margin-bottom: 15px; width: auto; padding: 8px 15px;">+ Add Question Text</button>
            
            <div id="questions-for-${sec.id}">
                ${sec.questions.map((q, qi) => `
                    <div style="margin-bottom: 12px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px; position: relative;">
                        <textarea placeholder="Type Question ${qi + 1} here..." onchange="updateQText(${sec.id}, ${qi}, this.value)" 
                                  style="width: 100%; min-height: 60px; background: transparent; color: white; border: 1px solid rgba(255,255,255,0.1); border-radius: 5px; padding: 10px;">${q.text}</textarea>
                        <button onclick="removeQuestion(${sec.id}, ${qi})" style="position: absolute; top: 5px; right: 5px; background: transparent; border: none; color: #f87171; cursor: pointer;">&times;</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function updateSecTitle(id, val) { 
    const section = activeSections.find(s => s.id === id);
    if (section) section.title = val; 
}

function updateQText(sid, qi, val) { 
    const section = activeSections.find(s => s.id === sid);
    if (section && section.questions[qi]) section.questions[qi].text = val; 
}

// THE CLEANED MAIN SAVE FUNCTION
async function saveNewQuestion() {
    console.log("Initiating save process...");
    
    // Capture fields
    const code = document.getElementById('adminCourseCode').value.toUpperCase().trim();
    const title = document.getElementById('adminCourseTitle').value.trim();
    const dept = document.getElementById('adminDept').value;
    const level = document.getElementById('adminLevel').value;
    const year = document.getElementById('adminYear').value.trim();
    const semester = document.getElementById('adminSemester').value;
    const fileInput = document.getElementById('pqUpload');

    // Validation
    if (!code || !year || !title) {
        alert("Missing Information: Please ensure Course Code, Title, and Year are filled.");
        return;
    }

    // Initialize the nested structure
    if (!questionBank[dept]) questionBank[dept] = {};
    if (!questionBank[dept][level]) questionBank[dept][level] = {};
    if (!questionBank[dept][level][code]) {
        questionBank[dept][level][code] = { name: title, data: {} };
    }
    if (!questionBank[dept][level][code].data[year]) {
        questionBank[dept][level][code].data[year] = {};
    }

    const paperEntry = {
        instructions: document.getElementById('adminInstructions').value.trim(),
        isImagePaper: false,
        imagePaths: [] 
    };

    try {
        // Handle Images
        if (fileInput && fileInput.files.length > 0) {
            paperEntry.isImagePaper = true;
            
            const uploadPromises = Array.from(fileInput.files).map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = (err) => reject(err);
                    reader.readAsDataURL(file);
                });
            });

            paperEntry.imagePaths = await Promise.all(uploadPromises);
        } else {
            // Only save text sections if no images are provided
            paperEntry.sections = activeSections;
        }

        // Assign to questionBank
        questionBank[dept][level][code].data[year][semester] = paperEntry;

        // Try to save to localStorage
        localStorage.setItem('qprep_bank', JSON.stringify(questionBank));
        
        alert(`Success! Paper for ${code} (${year}) saved successfully.`);
        location.reload();

    } catch (error) {
        console.error("Save Error:", error);
        if (error.name === 'QuotaExceededError' || error.code === 22) {
            alert("STORAGE FULL: The images are too high-resolution. Try selecting fewer pages or smaller files.");
        } else {
            alert("An error occurred while saving. Check console for details.");
        }
    }
}

function clearStorage() {
    const confirmed = confirm("WARNING: This will permanently delete ALL uploaded past questions. Are you sure you want to reset the question bank?");
    if (confirmed) {
        localStorage.removeItem('qprep_bank');
        alert("Storage cleared successfully.");
        location.reload(); 
    }
}

function deletePaper(dept, level, code, year, sem) {
    if (confirm(`Are you sure you want to delete ${code} (${year} ${sem} Semester)?`)) {
        // Delete specifically that semester's data
        delete questionBank[dept][level][code].data[year][sem];
        
        // Cleanup: If year is empty, delete year. If course is empty, delete course.
        if (Object.keys(questionBank[dept][level][code].data[year]).length === 0) {
            delete questionBank[dept][level][code].data[year];
        }
        if (Object.keys(questionBank[dept][level][code].data).length === 0) {
            delete questionBank[dept][level][code];
        }

        saveQuestionBank(); // From data.js
        renderDashboard(); // Refresh the list
    }
}

function editPaper(dept, level, code, year, sem) {
    const paper = questionBank[dept][level][code].data[year][sem];
    openAdminPanel();
    
    // Pre-fill form
    document.getElementById('adminCourseCode').value = code;
    document.getElementById('adminCourseTitle').value = questionBank[dept][level][code].name;
    document.getElementById('adminDept').value = dept;
    document.getElementById('adminLevel').value = level;
    document.getElementById('adminYear').value = year;
    document.getElementById('adminSemester').value = sem;
    document.getElementById('adminInstructions').value = paper.instructions || "";
    
    alert("Form filled with existing data. Upload new images if you wish to change them.");
}