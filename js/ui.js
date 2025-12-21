/**
 * QPrep UI Module
 * Handles all dashboard rendering, navigation flows, and modal controls.
 */

// Initialize Dashboard on Load
function renderDashboard() {
    if (!user) return;

    const isAdmin = user.role === 'admin';
    const grid = document.getElementById('questionsGrid');
    
    // Safety check for main container
    if (!grid) return;
    grid.style.display = 'block';

    // Toggle Admin/Student Navigation Elements
    document.getElementById('adminOnlyNav').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('mobileAdminOnlyNav').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('sidebarFooter').style.display = isAdmin ? 'none' : 'block';

    if (isAdmin) {
        document.getElementById('courseHeading').innerText = "Management Console";
        renderAdminManagementHierarchy(grid);
    } else {
        renderStudentSemesterView(grid);
    }
}

// ==========================================
// STUDENT VIEW LOGIC
// ==========================================

/** Step 1: Show Semester Selection */
function renderStudentSemesterView(container) {
    document.getElementById('courseHeading').innerText = `Select Semester - ${user.level}L`;
    
    container.innerHTML = `
        <div class="semester-select-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%;">
            <div class="stat-card glass" onclick="renderCourseGridBySemester('First')" style="cursor: pointer; flex-direction: column; text-align: center; padding: 40px;">
                <div class="icon-box blue" style="margin-bottom: 15px;"><i class="fas fa-snowflake"></i></div>
                <h3>FIRST SEMESTER</h3>
                <p>View all ${user.dept} courses for 1st Semester</p>
            </div>
            <div class="stat-card glass" onclick="renderCourseGridBySemester('Second')" style="cursor: pointer; flex-direction: column; text-align: center; padding: 40px;">
                <div class="icon-box orange" style="margin-bottom: 15px;"><i class="fas fa-sun"></i></div>
                <h3>SECOND SEMESTER</h3>
                <p>View all ${user.dept} courses for 2nd Semester</p>
            </div>
        </div>
    `;
}

/** Step 2: Show Courses filtered by the chosen Semester */
function renderCourseGridBySemester(semester) {
    document.getElementById('courseHeading').innerHTML = `
        <button onclick="renderDashboard()" class="btn-icon" style="margin-right:10px; background:none; border:none; color:white; cursor:pointer;">
            <i class="fas fa-arrow-left"></i>
        </button>
        ${semester.toUpperCase()} SEMESTER COURSES
    `;
    
    const container = document.getElementById('questionsGrid');
    const deptData = questionBank[user.dept]?.[user.level] || {};
    
    const filteredCourses = Object.keys(deptData).filter(code => {
        const course = deptData[code];
        return Object.values(course.data || {}).some(yearData => yearData[semester]);
    });

    if (filteredCourses.length === 0) {
        container.innerHTML = `<div class="empty-state glass" style="padding:40px; text-align:center;">
            <p>No courses found for ${semester} Semester in ${user.level}L.</p>
        </div>`;
        return;
    }

    container.innerHTML = filteredCourses.map(code => `
        <div class="stat-card glass" onclick="openYearPicker('${code}', '${semester}')" style="cursor:pointer;">
            <div class="icon-box blue"><i class="fas fa-book"></i></div>
            <div>
                <h3>${code}</h3>
                <p>${deptData[code].name}</p>
            </div>
        </div>
    `).join('');
}

/** Step 3: Open Modal with Year Selection Dropdown */
function openYearPicker(code, semester) {
    const courseData = questionBank[user.dept][user.level][code];
    const container = document.getElementById('objContainer');
    
    let html = `
        <div style="padding: 20px;">
            <h3 class="accent-text" style="margin-bottom: 10px; color: #3b82f6;">${code}: ${courseData.name}</h3>
            <p style="margin-bottom: 20px; opacity: 0.8;">${semester} Semester</p>
            
            <div class="input-group">
                <label style="display:block; margin-bottom:10px;">Select Academic Session</label>
                <select id="sessionPickerDropdown" class="glass-input" style="width:100%; padding:12px; background:rgba(255,255,255,0.05); color:white; border:1px solid rgba(255,255,255,0.2); border-radius:10px;" 
                    onchange="loadPaperFromDropdown('${code}', '${semester}', this.value)">
                    <option value="">-- Choose Academic Year --</option>
    `;
    
    Object.keys(courseData.data).forEach(year => {
        if (courseData.data[year][semester]) {
            html += `<option value="${year}">${year}</option>`;
        }
    });
    
    html += `
                </select>
            </div>
            <div id="paperContentArea" style="margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
                <p style="text-align: center; opacity: 0.5;">Select a year from the dropdown above to view paper.</p>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    document.getElementById('viewCourseCode').innerText = "Session Filter";
    document.getElementById('viewInstructions').innerText = "";
    document.getElementById('paperViewer').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

/** Step 4: Display Content based on Dropdown selection */
function loadPaperFromDropdown(code, semester, year) {
    if (!year) return;
    
    const paper = questionBank[user.dept][user.level][code].data[year][semester];
    const displayArea = document.getElementById('paperContentArea');
    
    document.getElementById('viewCourseCode').innerText = `${code} (${year})`;

    if (paper.isImagePaper && paper.imagePaths) {
        displayArea.innerHTML = paper.imagePaths.map((path, index) => `
            <div class="scanned-page" style="margin-bottom: 20px; text-align: center;">
                <p style="font-size: 0.7rem; color: #3b82f6; margin-bottom: 5px;">PAGE ${index + 1}</p>
                <img src="${path}" style="width:100%; border-radius:10px; border: 1px solid rgba(255,255,255,0.1);">
            </div>
        `).join('<hr style="opacity: 0.1; margin: 20px 0;">');
    } else if (paper.sections) {
        displayArea.innerHTML = paper.sections.map(sec => `
            <div class="paper-section" style="margin-bottom:30px;">
                <h4 style="color:#3b82f6; border-bottom:1px solid rgba(59,130,246,0.3); padding-bottom:5px;">${sec.title}</h4>
                ${sec.questions.map((q, i) => `<p style="margin:10px 0;"><strong>${i+1}.</strong> ${q.text}</p>`).join('')}
            </div>
        `).join('');
    }
}

// ==========================================
// ADMIN VIEW LOGIC (HIERARCHICAL)
// ==========================================

function renderAdminManagementHierarchy(container) {
    let html = "";
    
    if (Object.keys(questionBank).length === 0) {
        container.innerHTML = `<div class="empty-state glass"><p>No data found.</p></div>`;
        return;
    }

    for (const dept in questionBank) {
        const safeDeptId = dept.replace(/\s+/g, '-');
        html += `
        <div class="hierarchy-section dept-box glass" style="margin-bottom: 15px;">
            <div class="hierarchy-header" onclick="toggleHierarchy('dept-${safeDeptId}')" style="cursor:pointer; padding: 15px; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="color: #3b82f6; margin: 0;"><i class="fas fa-university"></i> ${dept}</h3>
                <i class="fas fa-chevron-down" style="transition:0.3s;"></i>
            </div>
            <div id="dept-${safeDeptId}" class="hierarchy-content" style="display:none; padding: 10px;">
                ${renderLevelHierarchy(dept)}
            </div>
        </div>`;
    }
    container.innerHTML = html;
}

function renderLevelHierarchy(dept) {
    let html = "";
    const levels = questionBank[dept];
    for (const level in levels) {
        const safeLvlId = `${dept}-${level}`.replace(/\s+/g, '-');
        html += `
        <div class="level-box" style="margin: 5px 0; border-left: 2px solid #3b82f6; padding-left: 15px;">
            <div class="hierarchy-header" onclick="toggleHierarchy('level-${safeLvlId}')" style="cursor:pointer; padding: 10px; display: flex; justify-content: space-between;">
                <span><i class="fas fa-layer-group"></i> ${level} Level</span>
                <i class="fas fa-caret-down"></i>
            </div>
            <div id="level-${safeLvlId}" style="display:none; padding: 10px;">
                <div class="semester-tabs" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <button class="btn-secondary" style="padding:8px; font-size:0.8rem;" onclick="toggleHierarchy('sem-${safeLvlId}-First')">1st Semester</button>
                    <button class="btn-secondary" style="padding:8px; font-size:0.8rem;" onclick="toggleHierarchy('sem-${safeLvlId}-Second')">2nd Semester</button>
                </div>
                <div id="sem-${safeLvlId}-First" style="display:none; margin-top:10px;">
                    ${renderAdminCourseItems(dept, level, 'First')}
                </div>
                <div id="sem-${safeLvlId}-Second" style="display:none; margin-top:10px;">
                    ${renderAdminCourseItems(dept, level, 'Second')}
                </div>
            </div>
        </div>`;
    }
    return html;
}

function renderAdminCourseItems(dept, level, semester) {
    const courses = questionBank[dept][level];
    let html = "";
    let paperFound = false;

    for (const code in courses) {
        const course = courses[code];
        for (const year in course.data) {
            if (course.data[year][semester]) {
                paperFound = true;
                html += `
                <div class="admin-management-card glass" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; margin-bottom: 8px; background: rgba(255,255,255,0.02);">
                    <div>
                        <strong style="font-size: 0.85rem;">${code}: ${course.name}</strong>
                        <p style="font-size: 0.7rem; opacity: 0.6; margin: 0;">${year} Session</p>
                    </div>
                    <div class="management-actions" style="display: flex; gap: 8px;">
                        <button onclick="editPaper('${dept}', '${level}', '${code}', '${year}', '${semester}')" class="btn-icon" style="color:#10b981;"><i class="fas fa-edit"></i></button>
                        <button onclick="deletePaper('${dept}', '${level}', '${code}', '${year}', '${semester}')" class="btn-icon" style="color:#ef4444;"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`;
            }
        }
    }
    return paperFound ? html : `<p style="font-size: 0.75rem; opacity: 0.5; padding: 10px;">No papers found.</p>`;
}

// ==========================================
// UTILS & CONTROLS
// ==========================================

window.toggleHierarchy = function(id) {
    const element = document.getElementById(id);
    if (!element) return;
    
    const isHidden = element.style.display === "none" || element.style.display === "";
    element.style.display = isHidden ? "block" : "none";
    
    // Rotate Icon logic
    const header = element.previousElementSibling;
    const icon = header.querySelector('.fa-chevron-down') || header.querySelector('.fa-caret-down');
    if (icon) icon.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
};

function closeViewer() {
    document.getElementById('paperViewer').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Attach functions to window for onclick access
window.renderDashboard = renderDashboard;
window.renderCourseGridBySemester = renderCourseGridBySemester;
window.openYearPicker = openYearPicker;
window.loadPaperFromDropdown = loadPaperFromDropdown;
window.closeViewer = closeViewer;

console.log("UI.js Integrated Successfully.");


// Function to filter courses based on search term
function filterCourses(event) {
    const searchTerm = event.target.value.toLowerCase(); //
    const courses = document.querySelectorAll('.stat-card'); //

    courses.forEach(course => {
        const text = course.textContent.toLowerCase();
        // Toggle visibility based on whether text includes the search term
        course.style.display = text.includes(searchTerm) ? 'flex' : 'none';
    });
}

/**
 * Global Search Functionality
 * Filters the currently visible course cards based on the search input
 */
function setupSearchFeature() {
    const searchInput = document.getElementById('courseSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase(); //
        const cards = document.querySelectorAll('.questions-grid .stat-card'); //

        cards.forEach(card => {
            const courseText = card.innerText.toLowerCase(); //
            
            // Check if the card content includes the search term
            if (courseText.includes(term)) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        });
    });
}

function renderCourseGridBySemester(semester) {
    // Reset search input when switching semesters
    const searchInput = document.getElementById('courseSearch');
    if (searchInput) searchInput.value = "";

    document.getElementById('courseHeading').innerHTML = `
        <button onclick="renderDashboard()" class="btn-icon" style="margin-right:10px; background:none; border:none; color:white; cursor:pointer;">
            <i class="fas fa-arrow-left"></i>
        </button>
        ${semester.toUpperCase()} SEMESTER COURSES
    `;
    
    const container = document.getElementById('questionsGrid');
    const deptData = questionBank[user.dept]?.[user.level] || {};
    
    // Filter the data to find courses belonging to this semester
    const filteredCodes = Object.keys(deptData).filter(code => {
        const course = deptData[code];
        return Object.values(course.data || {}).some(yearData => yearData[semester]);
    });

    if (filteredCodes.length === 0) {
        container.innerHTML = `<div class="empty-state glass"><p>No courses found.</p></div>`;
        return;
    }

    container.innerHTML = filteredCodes.map(code => `
        <div class="stat-card glass" onclick="openYearPicker('${code}', '${semester}')" style="cursor:pointer;">
            <div class="icon-box blue"><i class="fas fa-book"></i></div>
            <div>
                <h3>${code}</h3>
                <p>${deptData[code].name}</p>
            </div>
        </div>
    `).join('');
}

function showNotification(message, type = 'success') {
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `glass notification-toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    
    const color = type === 'success' ? '#10b981' : 
                  type === 'error' ? '#ef4444' : '#3b82f6';

    // Center positioning logic
    toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 30px 40px;
        z-index: 12000;
        border: 1px solid ${color}44;
        border-top: 5px solid ${color};
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        min-width: 320px;
        text-align: center;
        box-shadow: 0 20px 50px rgba(0,0,0,0.6);
        background: rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(15px);
        border-radius: 20px;
        animation: centerPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;
    
    toast.innerHTML = `
        <i class="fas ${icon}" style="font-size: 3rem; color: ${color};"></i>
        <span style="font-weight: 600; font-size: 1.1rem; color: white;">${message}</span>
    `;

    document.body.appendChild(toast);

    // Auto-remove after display
    setTimeout(() => {
        toast.style.animation = 'centerFadeOut 0.4s ease-in forwards';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function deletePaper(dept, level, code, year, sem) {
    // Use the custom showConfirm we built earlier
    showConfirm(`Delete ${code} (${year})?`, () => {
        delete questionBank[dept][level][code].data[year][sem];
        // ... cleanup logic ...
        saveQuestionBank();
        
        showNotification(`${code} deleted.`, "info"); //
        renderDashboard();
    });
}