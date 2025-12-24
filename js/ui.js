const API_BASE_URL = 'http://localhost:5000/api/papers';
window.questionBank = {}; 

// ==========================================
// 1. DATA LOADING
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadPapersFromBackend(); 
    setupSearchFeature();
});

async function loadPapersFromBackend() {
    try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) throw new Error("Failed to connect to server");
        
        const papers = await response.json();
        window.questionBank = {}; // Reset

        // Transform Flat Array -> Nested Object
        papers.forEach(p => {
            if (!questionBank[p.department]) questionBank[p.department] = {};
            if (!questionBank[p.department][p.level]) questionBank[p.department][p.level] = {};
            
            // Course
            if (!questionBank[p.department][p.level][p.courseCode]) {
                questionBank[p.department][p.level][p.courseCode] = {
                    name: p.courseTitle,
                    data: {}
                };
            }
            // Year
            if (!questionBank[p.department][p.level][p.courseCode].data[p.year]) {
                questionBank[p.department][p.level][p.courseCode].data[p.year] = {};
            }
            // Paper (Save _id for delete)
            questionBank[p.department][p.level][p.courseCode].data[p.year][p.semester] = {
                ...p,
                _id: p._id 
            };
        });

        console.log("Data loaded:", questionBank);
        renderDashboard(); 

    } catch (error) {
        console.error("Backend Error:", error);
        renderDashboard();
    }
}

// ==========================================
// 2. DASHBOARD ROUTER
// ==========================================
function renderDashboard() {
    if (!window.user) return; 

    const isAdmin = window.user.role === 'admin';
    const grid = document.getElementById('questionsGrid');
    if (!grid) return;
    grid.style.display = 'block';

    const adminNav = document.getElementById('adminOnlyNav');
    const mobileAdminNav = document.getElementById('mobileAdminOnlyNav');
    const sidebarFooter = document.getElementById('sidebarFooter');

    if (adminNav) adminNav.style.display = isAdmin ? 'block' : 'none';
    if (mobileAdminNav) mobileAdminNav.style.display = isAdmin ? 'block' : 'none';
    if (sidebarFooter) sidebarFooter.style.display = isAdmin ? 'none' : 'block';

    if (isAdmin) {
        const heading = document.getElementById('courseHeading');
        if(heading) heading.innerText = "Management Console";
        renderAdminManagementHierarchy(grid);
    } else {
        renderStudentSemesterView(grid);
    }
}

// ==========================================
// 3. STUDENT VIEW
// ==========================================
function renderStudentSemesterView(container) {
    document.getElementById('courseHeading').innerText = `Select Semester - ${user.level}L`;
    container.innerHTML = `
        <div class="semester-select-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%;">
            <div class="stat-card glass" onclick="renderCourseGridBySemester('First')" style="cursor: pointer; flex-direction: column; text-align: center; padding: 40px;">
                <div class="icon-box blue" style="margin-bottom: 15px;"><i class="fas fa-snowflake"></i></div>
                <h3>FIRST SEMESTER</h3>
            </div>
            <div class="stat-card glass" onclick="renderCourseGridBySemester('Second')" style="cursor: pointer; flex-direction: column; text-align: center; padding: 40px;">
                <div class="icon-box orange" style="margin-bottom: 15px;"><i class="fas fa-sun"></i></div>
                <h3>SECOND SEMESTER</h3>
            </div>
        </div>
    `;
}

// Unified function for Student and Archive views
function displayCourses(semester, level, isArchive = false) {
    const container = document.getElementById('questionsGrid');
    const deptData = questionBank[user.dept]?.[level] || {};
    
    const filteredCodes = Object.keys(deptData).filter(code => {
        return Object.values(deptData[code].data || {}).some(yearData => yearData[semester]);
    });

    const backAction = isArchive ? `viewArchiveLevel('${level}')` : `renderDashboard()`;
    const titleText = isArchive ? `${level}L Archive - ${semester}` : `${semester.toUpperCase()} SEMESTER`;

    document.getElementById('courseHeading').innerHTML = `
        <button onclick="${backAction}" class="btn-icon" style="margin-right:10px; background:none; border:none; color:white; cursor:pointer;">
            <i class="fas fa-arrow-left"></i>
        </button>
        ${titleText}
    `;

    if (filteredCodes.length === 0) {
        container.innerHTML = `<div class="empty-state glass" style="padding:40px; text-align:center;"><p>No courses found.</p></div>`;
        return;
    }

    container.innerHTML = filteredCodes.map(code => `
        <div class="stat-card glass" onclick="openYearPicker('${code}', '${semester}', '${level}')" style="cursor:pointer;">
            <div class="icon-box blue"><i class="fas fa-book"></i></div>
            <div>
                <h3>${code}</h3>
                <p>${deptData[code].name}</p>
            </div>
        </div>
    `).join('');
}

function renderCourseGridBySemester(semester) {
    displayCourses(semester, user.level, false);
}

// ==========================================
// 4. ARCHIVE
// ==========================================
window.toggleArchiveMenu = function() {
    const desktopMenu = document.querySelector('.sidebar #archiveLevels');
    const mobileMenu = document.querySelector('.sidebar-mobile #archiveLevels');
    
    [desktopMenu, mobileMenu].forEach(menu => {
        if(menu) menu.style.display = (menu.style.display === "none" || menu.style.display === "") ? "block" : "none";
    });
};

function viewArchiveLevel(archiveLevel) {
    const grid = document.getElementById('questionsGrid');
    if (!grid) return;

    // Mobile Fix
    const mobileSidebar = document.querySelector('.sidebar-mobile');
    const overlay = document.querySelector('.mobile-overlay');
    if (mobileSidebar) mobileSidebar.classList.remove('active');
    if (overlay) { overlay.style.display = 'none'; overlay.classList.remove('active'); }
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    document.getElementById('courseHeading').innerHTML = `
        <button onclick="renderDashboard()" class="btn-icon" style="margin-right:10px; background:none; border:none; color:white; cursor:pointer;">
            <i class="fas fa-arrow-left"></i>
        </button>
        Archive: ${archiveLevel}L
    `;

    grid.innerHTML = `
        <div class="semester-select-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; width: 100%;">
            <div class="stat-card glass" onclick="renderArchiveCourses('First', '${archiveLevel}')" style="cursor: pointer; padding: 40px; flex-direction: column; text-align: center;">
                <div class="icon-box blue" style="margin-bottom: 15px;"><i class="fas fa-snowflake"></i></div>
                <h3>FIRST SEMESTER</h3>
            </div>
            <div class="stat-card glass" onclick="renderArchiveCourses('Second', '${archiveLevel}')" style="cursor: pointer; padding: 40px; flex-direction: column; text-align: center;">
                <div class="icon-box orange" style="margin-bottom: 15px;"><i class="fas fa-sun"></i></div>
                <h3>SECOND SEMESTER</h3>
            </div>
        </div>
    `;
}

function renderArchiveCourses(semester, archiveLevel) {
    displayCourses(semester, archiveLevel, true);
}

// ==========================================
// 5. ADMIN MANAGEMENT & DELETE
// ==========================================
function renderAdminManagementHierarchy(container) {
    let html = "";
    if (Object.keys(questionBank).length === 0) {
        container.innerHTML = `<div class="empty-state glass"><p>No data loaded from cloud.</p></div>`;
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
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <button class="btn-secondary" style="font-size:0.8rem;" onclick="toggleHierarchy('sem-${safeLvlId}-1')">1st Sem</button>
                    <button class="btn-secondary" style="font-size:0.8rem;" onclick="toggleHierarchy('sem-${safeLvlId}-2')">2nd Sem</button>
                </div>
                <div id="sem-${safeLvlId}-1" style="display:none;">${renderAdminCourseItems(dept, level, 'First')}</div>
                <div id="sem-${safeLvlId}-2" style="display:none;">${renderAdminCourseItems(dept, level, 'Second')}</div>
            </div>
        </div>`;
    }
    return html;
}

function renderAdminCourseItems(dept, level, semester) {
    const courses = questionBank[dept][level];
    let html = "";
    
    for (const code in courses) {
        for (const year in courses[code].data) {
            if (courses[code].data[year][semester]) {
                const paper = courses[code].data[year][semester];
                const paperId = paper._id || "unknown"; 

                html += `
                <div class="admin-management-card glass" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; margin-bottom: 8px;">
                    <div>
                        <div style="font-weight: 600; color: white;">${code}</div>
                        <div style="font-size: 0.8rem; opacity: 0.6;">${year} Session</div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="editPaper('${dept}','${level}','${code}','${year}','${semester}')" class="btn-icon" style="color:#10b981;" title="Edit"><i class="fas fa-edit"></i></button>
                        <button onclick="deletePaper('${paperId}', '${code}')" class="btn-icon" style="color:#ef4444;" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`;
            }
        }
    }
    return html;
}

async function deletePaper(paperId, code) {
    if(!confirm(`Delete ${code}? This cannot be undone.`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/${paperId}`, { method: 'DELETE' });
        if (response.ok) {
            showNotification(`${code} deleted.`, "success");
            loadPapersFromBackend();
        } else {
            throw new Error("Server failed to delete");
        }
    } catch (error) {
        showNotification("Deletion Failed.", "error");
    }
}

// ==========================================
// 6. UTILS (Viewer, Notification, Search)
// ==========================================

function openYearPicker(code, semester, overrideLevel) {
    const activeLevel = overrideLevel || user.level;
    const courseData = questionBank[user.dept][activeLevel][code];
    const container = document.getElementById('objContainer');
    
    let html = `
        <div style="padding: 20px;">
            <h3 class="accent-text" style="margin-bottom: 10px; color: #3b82f6;">${code}: ${courseData.name}</h3>
            <p style="margin-bottom: 20px; opacity: 0.8;">${semester} Semester</p>
            <select id="sessionPickerDropdown" class="glass-input" style="width:100%; padding:12px; border-radius:10px;" 
                onchange="loadPaperFromDropdown('${code}', '${semester}', this.value, '${activeLevel}')">
                <option value="">-- Choose Academic Year --</option>
    `;
    
    Object.keys(courseData.data).forEach(year => {
        if (courseData.data[year][semester]) html += `<option value="${year}">${year}</option>`;
    });
    
    html += `</select><div id="paperContentArea" style="margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;"></div></div>`;
    
    container.innerHTML = html;
    document.getElementById('viewCourseCode').innerText = "Session Filter";
    document.getElementById('paperViewer').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function loadPaperFromDropdown(code, semester, year, level) {
    if(!year) return;
    const activeLevel = level || user.level;
    const paper = questionBank[user.dept][activeLevel][code].data[year][semester];
    const displayArea = document.getElementById('paperContentArea');
    let htmlContent = "";

    if (paper.documents && paper.documents.length > 0) {
        paper.documents.forEach(doc => {
            if (doc.type === "application/pdf") {
                htmlContent += `<div style="margin-bottom: 20px;"><h4>${doc.name}</h4><iframe src="${doc.data}" width="100%" height="500px" style="border-radius:10px; background:white;"></iframe></div>`;
            }
        });
    }

    if (paper.imagePaths && paper.imagePaths.length > 0) {
        htmlContent += paper.imagePaths.map(path => `<img src="${path}" style="width:100%; border-radius:10px; margin-bottom:15px;">`).join('');
    }

    if (paper.sections && paper.sections.length > 0) {
        htmlContent += paper.sections.map(sec => `
            <div style="margin-bottom: 20px;"><h4 style="color:var(--accent);">${sec.title}</h4>
            ${sec.questions.map((q, i) => `<p><strong>${i+1}.</strong> ${q.text}</p>`).join('')}</div>
        `).join('');
    }

    displayArea.innerHTML = htmlContent || "<p>No content available.</p>";
}

function showNotification(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `glass notification-toast ${type}`;
    toast.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 30px; z-index: 12000; border-top: 5px solid ${type==='success'?'#10b981':'#ef4444'}; background: rgba(15, 23, 42, 0.95); color: white; border-radius: 20px;`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

window.toggleHierarchy = function(id) {
    const el = document.getElementById(id);
    if(el) el.style.display = (el.style.display === "none" || el.style.display === "") ? "block" : "none";
};

window.closeViewer = () => {
    document.getElementById('paperViewer').style.display = 'none';
    document.body.style.overflow = 'auto';
};

function setupSearchFeature() {
    document.getElementById('courseSearch')?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.questions-grid .stat-card').forEach(card => {
            card.style.display = card.innerText.toLowerCase().includes(term) ? "flex" : "none";
        });
    });
}