const API_BASE_URL = 'http://localhost:5000/api/papers';
window.questionBank = {}; 

// ==========================================
// 1. DATA LOADING & STATE RESTORATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // A. RESTORE USER (Crucial Step)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        window.user = JSON.parse(storedUser);
        console.log("User restored from storage:", window.user);
    } else {
        // B. FALLBACK FOR TESTING (If no user is logged in)
        console.warn("No user found. Creating dummy test user.");
        window.user = { 
            name: "Test Student", 
            dept: "ITH", 
            level: "300", 
            role: "student" 
        };
    }

    // C. Update Sidebar Info (Visual Feedback)
    const profileName = document.querySelector('.profile-info h4');
    const profileRole = document.querySelector('.profile-info p');
    if (profileName) profileName.innerText = window.user.name;
    if (profileRole) profileRole.innerText = `${window.user.dept} ${window.user.level}L`;

    loadPapersFromBackend(); 
    setupSearchFeature();
});

async function loadPapersFromBackend() {
    try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) throw new Error("Server Error");
        
        const papers = await response.json();
        window.questionBank = {}; 

        // Transform Data
        papers.forEach(p => {
            if (!questionBank[p.department]) questionBank[p.department] = {};
            if (!questionBank[p.department][p.level]) questionBank[p.department][p.level] = {};
            if (!questionBank[p.department][p.level][p.courseCode]) {
                questionBank[p.department][p.level][p.courseCode] = { name: p.courseTitle, data: {} };
            }
            if (!questionBank[p.department][p.level][p.courseCode].data[p.year]) {
                questionBank[p.department][p.level][p.courseCode].data[p.year] = {};
            }
            questionBank[p.department][p.level][p.courseCode].data[p.year][p.semester] = { ...p, _id: p._id };
        });

        console.log("Data & Bank Ready. Rendering Dashboard...");
        renderDashboard(); // <--- Trigger UI Update

    } catch (error) {
        console.error("Backend Error:", error);
        // Even if backend fails, render the empty dashboard so buttons appear
        renderDashboard(); 
    }
}

// ==========================================
// 2. DASHBOARD ROUTER (The Fix)
// ==========================================
function renderDashboard() {
    // 1. SAFETY CHECK
    if (!window.user) {
        console.warn("No user logged in.");
        return;
    }

    console.log("Current User Role:", window.user.role); // Watch the console to see what the app thinks you are

    const grid = document.getElementById('questionsGrid');
    const heading = document.getElementById('courseHeading');
    
    if (!grid || !heading) return;

    grid.style.display = 'block';

    // 2. CHECK ROLE
    // This now strictly trusts the data from Login/LocalStorage
    const isAdmin = window.user.role === 'admin';

    // 3. ROUTER
    if (isAdmin) {
        // Show Admin features
        heading.innerText = "Management Console";
        renderAdminManagementHierarchy(grid); 
    } else {
        // Show Student features
        renderStudentSemesterView(grid);
    }
}
// ==========================================
// 3. STUDENT SEMESTER BUTTONS
// ==========================================
function renderStudentSemesterView(container) {
    console.log("Rendering Semester Buttons..."); // Debug log
    document.getElementById('courseHeading').innerText = `Select Semester - ${user.dept} ${user.level}L`;
    
    container.innerHTML = `
        <div class="semester-select-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%;">
            <div class="stat-card glass" onclick="renderCourseGridBySemester('First')" style="cursor: pointer; flex-direction: column; text-align: center; padding: 40px; border: 1px solid var(--glass-border);">
                <div class="icon-box blue" style="margin: 0 auto 15px auto;"><i class="fas fa-snowflake"></i></div>
                <h3>FIRST SEMESTER</h3>
                <p>Tap to view courses</p>
            </div>
            <div class="stat-card glass" onclick="renderCourseGridBySemester('Second')" style="cursor: pointer; flex-direction: column; text-align: center; padding: 40px; border: 1px solid var(--glass-border);">
                <div class="icon-box orange" style="margin: 0 auto 15px auto;"><i class="fas fa-sun"></i></div>
                <h3>SECOND SEMESTER</h3>
                <p>Tap to view courses</p>
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
    console.log(`--- DEBUGGING RENDER ---`);
    console.log(`User Context: Dept=${user.dept}, Level=${user.level}`);
    console.log(`Requested Semester: ${semester}`);

    document.getElementById('courseHeading').innerHTML = `
        <button onclick="renderDashboard()" class="btn-icon" style="margin-right:10px; background:none; border:none; color:white; cursor:pointer;">
            <i class="fas fa-arrow-left"></i>
        </button>
        ${semester.toUpperCase()} SEMESTER
    `;
    
    const container = document.getElementById('questionsGrid');
    
    // 1. Check if Dept/Level exists
    const deptData = questionBank[user.dept];
    if (!deptData) {
        console.error(`Debug: No data found for Dept '${user.dept}'`);
        container.innerHTML = `<div class="empty-state glass"><p>No data found for ${user.dept}.</p></div>`;
        return;
    }

    const levelData = deptData[user.level];
    if (!levelData) {
        console.error(`Debug: No data found for Level '${user.level}' in ${user.dept}`);
        console.log(`Available Levels:`, Object.keys(deptData));
        container.innerHTML = `<div class="empty-state glass"><p>No data found for ${user.level} Level. (Available: ${Object.keys(deptData).join(', ')})</p></div>`;
        return;
    }

    // 2. Filter Codes with Case-Insensitive Check
    const filteredCodes = Object.keys(levelData).filter(code => {
        const course = levelData[code];
        const years = course.data || {};
        
        // Check ALL years to see if ANY match the requested semester
        const hasData = Object.values(years).some(yearData => {
            // Check exact match OR case-insensitive match
            const exact = yearData[semester];
            const lower = yearData[semester.toLowerCase()];
            const upper = yearData[semester.toUpperCase()];
            
            return exact || lower || upper;
        });

        if (!hasData) console.log(`Debug: Skipping ${code} (No data for ${semester})`);
        return hasData;
    });

    if (filteredCodes.length === 0) {
        container.innerHTML = `<div class="empty-state glass" style="padding:40px; text-align:center;"><p>No courses found for ${semester} semester.</p></div>`;
        return;
    }

    // 3. Render
    container.innerHTML = filteredCodes.map(code => `
        <div class="stat-card glass" onclick="openYearPicker('${code}', '${semester}')" style="cursor:pointer;">
            <div class="icon-box blue"><i class="fas fa-book"></i></div>
            <div>
                <h3>${code}</h3>
                <p>${levelData[code].name}</p>
            </div>
        </div>
    `).join('');
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
    // 1. THE NEW ACTION BUTTON (Visible Only to Admins)
    let html = `
        <div class="admin-quick-actions" style="margin-bottom: 30px;">
            <button onclick="openAdminPanel()" class="glass" style="
                width: 100%; 
                padding: 20px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                gap: 15px; 
                border: 2px dashed rgba(59, 130, 246, 0.5); 
                cursor: pointer; 
                transition: all 0.3s ease;
                background: rgba(59, 130, 246, 0.1);">
                
                <div style="
                    background: #3b82f6; 
                    width: 40px; 
                    height: 40px; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    color: white; 
                    font-size: 1.2rem;">
                    <i class="fas fa-plus"></i>
                </div>
                <div style="text-align: left;">
                    <h3 style="margin: 0; color: #3b82f6;">Upload New Question Paper</h3>
                    <p style="margin: 0; opacity: 0.7; font-size: 0.9rem;">Add a new course, year, or semester</p>
                </div>
            </button>
        </div>
    `;

    // 2. CHECK FOR DATA
    if (Object.keys(questionBank).length === 0) {
        // If empty, show the button + empty message
        html += `<div class="empty-state glass"><p>No data loaded from cloud.</p></div>`;
        container.innerHTML = html;
        return;
    }

    // 3. RENDER THE EXISTING HIERARCHY
    html += `<h3 style="margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">Existing Papers</h3>`;
    
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


// ==========================================
// 4. LOGOUT & UTILITIES (Moved from old auth.js)
// ==========================================

function logoutUser() {
    // Check if the custom modal exists, otherwise use standard confirm
    const confirmModal = document.getElementById('confirmModal');
    
    if (confirmModal) {
        showConfirm("Are you sure you want to logout?", performLogout);
    } else {
        if(confirm("Are you sure you want to logout?")) {
            performLogout();
        }
    }
}

function performLogout() {
    // 1. Clear the saved user data
    localStorage.removeItem('user'); 
    // 2. Redirect to the new Login Page
    window.location.href = 'login.html';
}

// --- CUSTOM CONFIRM MODAL LOGIC ---
function showConfirm(message, callback) {
    const modal = document.getElementById('confirmModal');
    const questionText = document.getElementById('confirmQuestion');
    const okBtn = document.getElementById('confirmOkBtn');

    if (!modal || !questionText || !okBtn) return; // Safety check

    questionText.innerText = message;
    modal.style.display = 'flex';

    // Set up the click event for the OK button
    // We use .onclick to overwrite any previous events
    okBtn.onclick = function() {
        callback();
        closeConfirmModal();
    };
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.style.display = 'none';
}


// ==========================================
// 1. SECURITY & PERSONALIZATION "THE BOUNCER"
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // A. CHECK AUTHENTICATION
    const storedUser = localStorage.getItem('user');
    
    if (!storedUser) {
        // If no user is found, kick them back to login
        window.location.href = 'login.html'; 
        return; // Stop running the rest of the code
    }

    // B. LOAD USER DATA
    window.user = JSON.parse(storedUser);
    console.log("Authorized User:", window.user);

    // C. UPDATE UI WITH REAL NAME
    updateProfileUI();

    // D. START APP
    loadPapersFromBackend(); 
    renderDashboard(); 
    setupSearchFeature();
});

// Helper function to update sidebar/header details
function updateProfileUI() {
    // Update Name
    const profileNameEl = document.querySelector('.profile-info h4');
    if (profileNameEl) profileNameEl.innerText = `${window.user.firstName} ${window.user.lastName}`;

    // Update Role/Dept
    const profileRoleEl = document.querySelector('.profile-info p');
    if (profileRoleEl) profileRoleEl.innerText = `${window.user.dept} ${window.user.level}L • ${window.user.role.toUpperCase()}`;

    // Update Welcome Message (if you have one)
    const welcomeEl = document.getElementById('welcomeMsg');
    if (welcomeEl) welcomeEl.innerText = `Welcome back, ${window.user.firstName}`;
}


// ==========================================
// LOGOUT FUNCTIONALITY
// ==========================================
function logout() {
    if(confirm("Are you sure you want to log out?")) {
        // 1. Clear Data
        localStorage.removeItem('user');
        
        // 2. Redirect to Login
        window.location.href = 'login.html';
    }
}