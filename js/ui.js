/**
 * UI & Dashboard Logic
 * Handles rendering the course grid and the multi-layer paper viewer
 */

function renderDashboard() {
    if (!user) return;

    const isAdmin = user.role === 'admin';
    
    // Toggle Nav Visibility
    document.getElementById('adminOnlyNav').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('mobileAdminOnlyNav').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('sidebarFooter').style.display = isAdmin ? 'none' : 'block';

    const grid = document.getElementById('questionsGrid');
    
    if (isAdmin) {
        document.getElementById('courseHeading').innerText = "Admin Management Console";
        renderAdminManagementList(grid);
    } else {
        document.getElementById('courseHeading').innerText = `${user.dept} - ${user.level}L Papers`;
        renderStudentGrid(grid);
    }
}

// Hierarchical Admin View: Dept > Year > Level > Course
function renderAdminManagementList(container) {
    let html = "";
    const bank = questionBank;

    if (Object.keys(bank).length === 0) {
        container.innerHTML = `<div class="empty-state glass"><p>No papers uploaded yet.</p></div>`;
        return;
    }

    for (const dept in bank) {
        html += `<div class="admin-dept-section">
                    <h2 class="dept-title"><i class="fas fa-university"></i> ${dept}</h2>`;
        
        for (const level in bank[dept]) {
            html += `<div class="admin-level-group">
                        <h4 class="level-label">${level} Level</h4>`;

            for (const code in bank[dept][level]) {
                const course = bank[dept][level][code];
                
                // Show each Academic Year and Semester stored under the course
                for (const year in course.data) {
                    for (const sem in course.data[year]) {
                        html += `
                            <div class="admin-management-card glass">
                                <div class="paper-details">
                                    <div class="status-dot ${course.data[year][sem].isImagePaper ? 'blue' : 'green'}"></div>
                                    <div>
                                        <strong>${code}: ${course.name}</strong>
                                        <p>${year} - ${sem} Semester</p>
                                    </div>
                                </div>
                                <div class="management-actions">
                                    <button onclick="editPaper('${dept}', '${level}', '${code}', '${year}', '${sem}')" class="btn-icon edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="deletePaper('${dept}', '${level}', '${code}', '${year}', '${sem}')" class="btn-icon delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>`;
                    }
                }
            }
            html += `</div>`;
        }
        html += `</div>`;
    }
    container.innerHTML = html;
}

function renderStudentGrid(container) {
    const courses = (questionBank[user.dept] && questionBank[user.dept][user.level]) || {};
    const keys = Object.keys(courses);

    container.innerHTML = keys.length ? keys.map(code => `
        <div class="stat-card glass" onclick="openPaper('${code}')">
            <div class="icon-box blue"><i class="fas fa-file-alt"></i></div>
            <div><h3>${code}</h3><p>${courses[code].name}</p></div>
        </div>
    `).join('') : `<p>No papers available for your level.</p>`;
}

/**
 * Step 1: Open the Session Picker
 * Displays available Years and Semesters for the selected course
 */
function openPaper(code) {
    const courseData = questionBank[user.dept][user.level][code];
    const container = document.getElementById('objContainer');
    
    // Header for the picker
    document.getElementById('viewCourseCode').innerText = code;
    document.getElementById('viewInstructions').innerText = "Select a session and semester to view the paper.";

    let html = `<div class="session-picker-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">`;
    
    // Loop through Years
    Object.keys(courseData.data).forEach(year => {
        // Loop through Semesters within that year
        Object.keys(courseData.data[year]).forEach(sem => {
            html += `
                <button class="btn-secondary glass" onclick="renderPaperContent('${code}', '${year}', '${sem}')" 
                        style="padding: 20px; text-align: left; height: auto; border: 1px solid var(--accent);">
                    <div style="color: var(--accent); font-weight: bold; font-size: 1.1rem;">${year}</div>
                    <div style="font-size: 0.9rem; opacity: 0.8;">${sem} Semester</div>
                </button>
            `;
        });
    });
    
    html += `</div>`;
    container.innerHTML = html;
    document.getElementById('paperViewer').style.display = 'block';
}

/**
 * Step 2: Render the actual Exam Content
 */
function renderPaperContent(code, year, sem) {
    const paper = questionBank[user.dept][user.level][code].data[year][sem];
    const container = document.getElementById('objContainer');
    
    document.getElementById('viewCourseCode').innerText = `${code} (${year} - ${sem})`;
    
    if (paper.isImagePaper && paper.imagePaths) {
        // Map through the array to display all images
        container.innerHTML = paper.imagePaths.map((path, index) => `
            <div class="scanned-page" style="margin-bottom: 20px; text-align: center;">
                <p style="font-size: 0.8rem; color: var(--accent); margin-bottom: 5px;">Page ${index + 1}</p>
                <img src="${path}" style="width:100%; border-radius:10px; border: 1px solid var(--glass-border);">
            </div>
        `).join('<hr style="opacity: 0.1; margin: 20px 0;">');
    } else {
        // Standard text rendering
        container.innerHTML = paper.sections.map(sec => `
            <div class="paper-section">
                <h4>${sec.title}</h4>
                ${sec.questions.map((q, i) => `<p>${i+1}. ${q.text}</p>`).join('')}
            </div>
        `).join('');
    }
}


function renderAdminManagement() {
    const container = document.getElementById('adminManagementList');
    if (!container) return;

    let html = "";

    // Loop through Departments
    for (const dept in questionBank) {
        html += `<div class="admin-dept-group">
                    <h2 class="dept-label"><i class="fas fa-university"></i> ${dept}</h2>`;

        // Loop through Levels
        for (const level in questionBank[dept]) {
            html += `<div class="admin-level-row">
                        <h4 class="level-badge">${level}L</h4>`;

            // Loop through Courses
            for (const code in questionBank[dept][level]) {
                const course = questionBank[dept][level][code];
                
                html += `<div class="admin-course-item glass">
                            <div class="course-info">
                                <strong>${code}</strong>: ${course.name}
                            </div>
                            <div class="course-actions">
                                <button onclick="editPaper('${dept}', '${level}', '${code}')" class="btn-edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deletePaper('${dept}', '${level}', '${code}')" class="btn-delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                         </div>`;
            }
            html += `</div>`;
        }
        html += `</div>`;
    }
    container.innerHTML = html || "<p class='empty-msg'>No papers found in database.</p>";
}

function deletePaper(dept, level, code) {
    if (confirm(`Are you sure you want to delete ${code}? This action cannot be undone.`)) {
        delete questionBank[dept][level][code];
        saveQuestionBank(); // Save to localStorage
        renderAdminManagement();
        showNotification(`${code} deleted successfully.`, "info");
    }
}

function editPaper(dept, level, code) {
    const course = questionBank[dept][level][code];
    openAdminPanel(); // Use your existing panel opener
    
    // Auto-fill fields for editing
    document.getElementById('adminCourseCode').value = code;
    document.getElementById('adminCourseTitle').value = course.name;
    document.getElementById('adminDept').value = dept;
    document.getElementById('adminLevel').value = level;
    
    // Note: To edit images, you may need to re-upload, 
    // or we can add a 'Maintain current images' flag.
}