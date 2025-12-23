/**
 * QPrep UI Module - Unified & Optimized
 * Handles notifications, Archive navigation, Admin management, 
 * Student flows, and multi-format paper viewing.
 */

// ==========================================
// 1. CORE DASHBOARD ROUTER
// ==========================================

function renderDashboard() {
    if (!user) return;

    const isAdmin = user.role === 'admin';
    const grid = document.getElementById('questionsGrid');
    
    if (!grid) return;
    grid.style.display = 'block';

    // Toggle Navigation Elements
    document.getElementById('adminOnlyNav').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('mobileAdminOnlyNav').style.display = isAdmin ? 'block' : 'none';
    const sidebarFooter = document.getElementById('sidebarFooter');
    if (sidebarFooter) sidebarFooter.style.display = isAdmin ? 'none' : 'block';

    if (isAdmin) {
        document.getElementById('courseHeading').innerText = "Management Console";
        renderAdminManagementHierarchy(grid);
    } else {
        renderStudentSemesterView(grid);
    }
}

// ==========================================
// 2. STUDENT VIEW LOGIC (Current Level)
// ==========================================

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

function renderCourseGridBySemester(semester) {
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
    
    const filteredCodes = Object.keys(deptData).filter(code => {
        const course = deptData[code];
        return Object.values(course.data || {}).some(yearData => yearData[semester]);
    });

    if (filteredCodes.length === 0) {
        container.innerHTML = `<div class="empty-state glass" style="padding:40px; text-align:center;"><p>No courses found for this semester.</p></div>`;
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

// ==========================================
// 3. MY ARCHIVE LOGIC (Browse Other Levels)
// ==========================================

window.toggleArchiveMenu = function() {
    const menu = document.getElementById('archiveLevels');
    const icon = document.getElementById('archiveIcon');
    const isHidden = menu.style.display === "none" || menu.style.display === "";
    
    menu.style.display = isHidden ? "block" : "none";
    if (icon) icon.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
};

function viewArchiveLevel(archiveLevel) {
    const grid = document.getElementById('questionsGrid');
    if (!grid) return;

    // Reset UI State (Mobile & Desktop)
    const mobileSidebar = document.querySelector('.sidebar-mobile');
    const overlay = document.querySelector('.mobile-overlay');
    if (mobileSidebar) mobileSidebar.classList.remove('active');
    if (overlay) overlay.style.display = 'none';
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    document.getElementById('courseHeading').innerHTML = `
        <button onclick="renderDashboard()" class="btn-icon" style="margin-right:10px; background:none; border:none; color:white; cursor:pointer;">
            <i class="fas fa-arrow-left"></i>
        </button>
        Archive: ${archiveLevel}L (${user.dept})
    `;

    grid.innerHTML = `
        <div class="semester-select-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; width: 100%;">
            <div class="stat-card glass" onclick="renderArchiveCourses('First', '${archiveLevel}')" style="cursor: pointer; padding: 40px; flex-direction: column; text-align: center;">
                <div class="icon-box blue" style="margin-bottom: 15px;"><i class="fas fa-snowflake"></i></div>
                <h3>FIRST SEMESTER</h3>
                <p>Viewing Archive: ${archiveLevel}L</p>
            </div>
            <div class="stat-card glass" onclick="renderArchiveCourses('Second', '${archiveLevel}')" style="cursor: pointer; padding: 40px; flex-direction: column; text-align: center;">
                <div class="icon-box orange" style="margin-bottom: 15px;"><i class="fas fa-sun"></i></div>
                <h3>SECOND SEMESTER</h3>
                <p>Viewing Archive: ${archiveLevel}L</p>
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderArchiveCourses(semester, level) {
    const container = document.getElementById('questionsGrid');
    const deptData = questionBank[user.dept]?.[level] || {};
    
    const filtered = Object.keys(deptData).filter(code => {
        const course = deptData[code];
        return Object.values(course.data || {}).some(yearData => yearData[semester]);
    });

    document.getElementById('courseHeading').innerHTML = `
        <button onclick="viewArchiveLevel('${level}')" class="btn-icon" style="margin-right:10px; background:none; border:none; color:white; cursor:pointer;">
            <i class="fas fa-arrow-left"></i>
        </button>
        Archive: ${level}L - ${semester} Sem
    `;

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state glass" style="padding:40px; text-align:center; width:100%;"><p>No archived papers found for ${level}L.</p></div>`;
        return;
    }

    container.innerHTML = filtered.map(code => `
        <div class="stat-card glass" onclick="openYearPickerArchive('${code}', '${semester}', '${level}')" style="cursor:pointer;">
            <div class="icon-box blue"><i class="fas fa-book"></i></div>
            <div><h3>${code}</h3><p>${deptData[code].name}</p></div>
        </div>
    `).join('');
}

function openYearPickerArchive(code, semester, archiveLevel) {
    const originalLevel = user.level;
    user.level = archiveLevel; 
    openYearPicker(code, semester);
    user.level = originalLevel; 
}

// ==========================================
// 4. PAPER VIEWER & MULTI-FORMAT HANDLER
// ==========================================

function openYearPicker(code, semester) {
    const courseData = questionBank[user.dept][user.level][code];
    const container = document.getElementById('objContainer');
    
    let html = `
        <div style="padding: 20px;">
            <h3 class="accent-text" style="margin-bottom: 10px; color: #3b82f6;">${code}: ${courseData.name}</h3>
            <p style="margin-bottom: 20px; opacity: 0.8;">${semester} Semester</p>
            <div class="input-group">
                <select id="sessionPickerDropdown" class="glass-input" style="width:100%; padding:12px; background:rgba(0,0,0,0.3); color:white; border:1px solid rgba(255,255,255,0.2); border-radius:10px;" 
                    onchange="loadPaperFromDropdown('${code}', '${semester}', this.value)">
                    <option value="">-- Choose Academic Year --</option>
    `;
    
    Object.keys(courseData.data).forEach(year => {
        if (courseData.data[year][semester]) {
            html += `<option value="${year}">${year}</option>`;
        }
    });
    
    html += `</select></div><div id="paperContentArea" style="margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;"></div></div>`;
    
    container.innerHTML = html;
    document.getElementById('viewCourseCode').innerText = "Session Filter";
    document.getElementById('paperViewer').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function loadPaperFromDropdown(code, semester, year) {
    if(!year) return;
    const paper = questionBank[user.dept][user.level][code].data[year][semester];
    const displayArea = document.getElementById('paperContentArea');
    let htmlContent = "";

    // 1. PDF/Word Documents
    if (paper.isDocument && paper.documents) {
        paper.documents.forEach(doc => {
            if (doc.type === "application/pdf") {
                htmlContent += `
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: var(--accent); margin-bottom: 10px;">${doc.name}</h4>
                        <iframe src="${doc.data}" width="100%" height="500px" style="border-radius: 10px; border:none;"></iframe>
                        <a href="${doc.data}" download="${doc.name}" class="btn-primary" style="display: block; margin-top: 10px; text-align: center; text-decoration:none;"><i class="fas fa-download"></i> Save Offline</a>
                    </div>`;
            } else {
                htmlContent += `
                    <div class="glass" style="padding: 20px; text-align: center; margin-bottom: 20px;">
                        <i class="fas fa-file-word" style="font-size: 2.5rem; color: #3b82f6;"></i>
                        <h4 style="margin: 10px 0;">${doc.name}</h4>
                        <a href="${doc.data}" download="${doc.name}" class="btn-primary" style="display: inline-block; padding: 10px 20px; text-decoration:none;"><i class="fas fa-download"></i> Download DOCX</a>
                    </div>`;
            }
        });
    }

    // 2. Scanned Images
    if (paper.isImagePaper && paper.imagePaths) {
        htmlContent += paper.imagePaths.map(path => `<img src="${path}" style="width:100%; border-radius:10px; margin-bottom:15px; border: 1px solid var(--glass-border);">`).join('');
    }

    // 3. Typed Questions
    if (paper.sections && paper.sections.length > 0) {
        htmlContent += paper.sections.map(sec => `
            <div style="margin-bottom: 20px;">
                <h4 style="color: var(--accent); border-bottom: 1px solid var(--glass-border);">${sec.title}</h4>
                ${sec.questions.map((q, i) => `<p style="margin: 10px 0;"><strong>${i+1}.</strong> ${q.text}</p>`).join('')}
            </div>`).join('');
    }

    displayArea.innerHTML = htmlContent || "<p style='text-align:center; opacity:0.5;'>No content available.</p>";
}

// ==========================================
// 5. ADMIN MANAGEMENT & NOTIFICATIONS
// ==========================================

function showNotification(message, type = 'success') {
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `glass notification-toast ${type}`;
    const color = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';

    toast.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        padding: 30px; z-index: 12000; border: 1px solid ${color}44; border-top: 5px solid ${color};
        display: flex; flex-direction: column; align-items: center; gap: 15px; min-width: 320px;
        text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.6); background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(15px); border-radius: 20px; animation: centerPop 0.4s ease-out;
    `;
    
    toast.innerHTML = `<i class="fas ${type==='success'?'fa-check-circle':'fa-info-circle'}" style="font-size: 3rem; color: ${color};"></i>
                       <span style="font-weight: 600; color: white;">${message}</span>`;

    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

function renderAdminManagementHierarchy(container) {
    let html = "";
    if (Object.keys(questionBank).length === 0) {
        container.innerHTML = `<div class="empty-state glass"><p>No data found.</p></div>`;
        return;
    }
    for (const dept in questionBank) {
        const safeId = dept.replace(/\s+/g, '-');
        html += `
        <div class="hierarchy-section glass" style="margin-bottom: 15px;">
            <div class="hierarchy-header" onclick="toggleHierarchy('dept-${safeId}')" style="cursor:pointer; padding: 15px; display: flex; justify-content: space-between;">
                <h3 style="color: #3b82f6; margin: 0;"><i class="fas fa-university"></i> ${dept}</h3>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div id="dept-${safeId}" style="display:none; padding: 10px;">${renderLevelHierarchy(dept)}</div>
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
        <div style="margin: 5px 0; border-left: 2px solid #3b82f6; padding-left: 15px;">
            <div onclick="toggleHierarchy('level-${safeLvlId}')" style="cursor:pointer; padding: 10px; display: flex; justify-content: space-between;">
                <span>${level} Level</span><i class="fas fa-caret-down"></i>
            </div>
            <div id="level-${safeLvlId}" style="display:none; padding: 10px;">
                <button class="btn-secondary" onclick="toggleHierarchy('sem-${safeLvlId}-1')">1st Sem</button>
                <button class="btn-secondary" onclick="toggleHierarchy('sem-${safeLvlId}-2')">2nd Sem</button>
                <div id="sem-${safeLvlId}-1" style="display:none; margin-top:10px;">${renderAdminCourseItems(dept, level, 'First')}</div>
                <div id="sem-${safeLvlId}-2" style="display:none; margin-top:10px;">${renderAdminCourseItems(dept, level, 'Second')}</div>
            </div>
        </div>`;
    }
    return html;
}

function renderAdminCourseItems(dept, level, semester) {
    const courses = questionBank[dept][level];
    let html = "";
    
    // Header for the list (Desktop only)
    html += `
        <div class="admin-list-header glass" style="display: flex; justify-content: space-between; padding: 10px 20px; margin-bottom: 10px; font-weight: bold; font-size: 0.8rem; opacity: 0.7;">
            <span>COURSE CODE & YEAR</span>
            <span>ACTIONS</span>
        </div>
    `;

    for (const code in courses) {
        for (const year in courses[code].data) {
            if (courses[code].data[year][semester]) {
                html += `
                <div class="admin-management-card glass" style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; margin-bottom: 10px;">
                    <div>
                        <span style="font-weight: 600;">${code}</span>
                        <span style="margin-left: 10px; opacity: 0.6;">${year}</span>
                    </div>
                    <div style="; display: flex; gap: 15px;">
                        <button onclick="editPaper('${dept}','${level}','${code}','${year}','${semester}')" class="btn-icon edit" title="Edit Paper">
                            <i class="fas fa-edit"></i>                        </button>
                        <button onclick="deletePaper('${dept}','${level}','${code}','${year}','${semester}')" class="btn-icon delete" title="Delete Paper">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>`;
            }
        }
    }
    return html;
}

/**
 * Deletes a paper from the database with confirmation
 */
function deletePaper(dept, level, code, year, sem) {
    // Check if showConfirm exists (from your auth/utils), otherwise use standard confirm
    const confirmMsg = `Are you sure you want to delete ${code} (${year}) for ${sem} semester?`;
    
    if (window.showConfirm) {
        window.showConfirm(confirmMsg, () => executeDeletion(dept, level, code, year, sem));
    } else if (confirm(confirmMsg)) {
        executeDeletion(dept, level, code, year, sem);
    }
}

function executeDeletion(dept, level, code, year, sem) {
    try {
        // Navigate the nested object to delete the specific year/semester
        if (questionBank[dept]?.[level]?.[code]?.data?.[year]) {
            delete questionBank[dept][level][code].data[year][sem];

            // Cleanup: If year is now empty, delete the year
            if (Object.keys(questionBank[dept][level][code].data[year]).length === 0) {
                delete questionBank[dept][level][code].data[year];
            }
            
            // Save updated bank to localStorage
            localStorage.setItem('qprep_bank', JSON.stringify(questionBank));
            
            showNotification(`${code} paper deleted successfully`, "success");
            renderDashboard(); // Refresh the list
        }
    } catch (error) {
        showNotification("Error deleting paper", "error");
        console.error(error);
    }
}

// Make it globally accessible
window.deletePaper = deletePaper;


// ==========================================
// 6. INITIALIZATION & UTILS
// ==========================================

window.toggleHierarchy = function(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const isHidden = el.style.display === "none" || el.style.display === "";
    el.style.display = isHidden ? "block" : "none";
};

document.addEventListener('DOMContentLoaded', () => {
    renderDashboard();
    // Search listener
    document.getElementById('courseSearch')?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.questions-grid .stat-card').forEach(card => {
            card.style.display = card.innerText.toLowerCase().includes(term) ? "flex" : "none";
        });
    });
});

window.closeViewer = () => {
    document.getElementById('paperViewer').style.display = 'none';
    document.body.style.overflow = 'auto';
};

function editPaper(dept, level, code, year, semester) {
    showNotification("Edit feature coming soon! Currently, please delete and re-upload.", "info");
}
window.editPaper = editPaper;