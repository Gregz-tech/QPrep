// ==========================================
// CONFIGURATION
// ==========================================
// const API_BASE_URL = 'http://localhost:5000/api/papers';
const BASE_URL = 'https://qprep-backend-1.onrender.com/api/papers';
window.questionBank = {}; 

// ==========================================
// 1. INITIALIZATION & SECURITY "THE BOUNCER"
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // A. CHECK AUTHENTICATION
    const storedUser = localStorage.getItem('user');
    
    if (!storedUser) {
        console.warn("No user found. Redirecting to login.");
        window.location.href = 'login.html'; 
        return;
    }

    // B. LOAD USER DATA
    window.user = JSON.parse(storedUser);
    console.log("Authorized User:", window.user);

    // C. UPDATE UI WITH REAL NAME
    updateProfileUI();

    // D. START APP
    loadPapersFromBackend(); 
    setupSearchFeature();
});

// ==========================================
// 2. DATA LOADING (The Fix is Here!)
// ==========================================
async function loadPapersFromBackend() {
    try {
        const response = await fetch(BASE_URL);
        if (!response.ok) throw new Error("Server Error");
        
        const papers = await response.json();
        window.questionBank = {}; 

        // Transform Data
        papers.forEach(p => {
            // Ensure fields exist to prevent crashes
            const dept = p.department || "General";
            const level = p.level || "100";
            const code = p.courseCode || "UNKNOWN";
            const year = p.year || "Unknown Year";
            const semester = p.semester || "First";
            const title = p.courseTitle || p.title || "No Title";

            if (!questionBank[dept]) questionBank[dept] = {};
            if (!questionBank[dept][level]) questionBank[dept][level] = {};
            if (!questionBank[dept][level][code]) {
                questionBank[dept][level][code] = { name: title, data: {} };
            }
            if (!questionBank[dept][level][code].data[year]) {
                questionBank[dept][level][code].data[year] = {};
            }
            
            // SAVE THE PAPER DATA
            questionBank[dept][level][code].data[year][semester] = { 
                ...p, 
                _id: p._id,
                // Ensure we handle the new Cloud Format
                fileData: p.fileData, 
                type: p.type 
            };
        });

        console.log("Data & Bank Ready. Rendering Dashboard...");
        renderDashboard(); 

    } catch (error) {
        console.error("Backend Error:", error);
        renderDashboard(); // Render anyway so UI doesn't freeze
    }
}

// ==========================================
// 3. DASHBOARD ROUTER
// ==========================================
function renderDashboard() {
    if (!window.user) return;

    const grid = document.getElementById('questionsGrid');
    const heading = document.getElementById('courseHeading');
    
    if (!grid || !heading) return;

    grid.style.display = 'block';

    // CHECK ROLE
    // Normalize role string (lowercase/uppercase safety)
    const isAdmin = (window.user.role || "").toLowerCase() === 'admin';

    if (isAdmin) {
        heading.innerText = "Management Console";
        renderAdminManagementHierarchy(grid); 
    } else {
        renderStudentSemesterView(grid);
    }
}

// ==========================================
// 4. STUDENT VIEWS
// ==========================================
function renderStudentSemesterView(container) {
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

function renderCourseGridBySemester(semester) {
    document.getElementById('courseHeading').innerHTML = `
        <button onclick="renderDashboard()" class="btn-icon" style="margin-right:10px; background:none; border:none; color:white; cursor:pointer;">
            <i class="fas fa-arrow-left"></i>
        </button>
        ${semester.toUpperCase()} SEMESTER
    `;
    
    const container = document.getElementById('questionsGrid');
    
    // --- DEBUGGING: Let's see what the app sees ---
    console.log("Logged in User:", window.user.dept, window.user.level);
    console.log("Available Depts in Bank:", Object.keys(window.questionBank));
    // ---------------------------------------------

    // 1. ROBUST DEPT CHECK
    const userDept = window.user.dept; 
    const deptData = questionBank[userDept];

    if (!deptData) {
        container.innerHTML = `<div class="empty-state glass">
            <i class="fas fa-folder-open" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
            <p>No papers found for <strong>${userDept}</strong> Department.</p>
        </div>`;
        return;
    }

    // 2. ROBUST LEVEL CHECK (Handles "300" vs "300L")
    // We try to find the key that starts with the user's level number
    const availableLevels = Object.keys(deptData);
    const userLevelClean = window.user.level.replace(/\D/g, ''); // Turns "300L" into "300"
    
    // Find a match in the database (e.g., matches "300" to "300" or "300L")
    const matchedLevelKey = availableLevels.find(k => k.replace(/\D/g, '') === userLevelClean);

    if (!matchedLevelKey) {
        container.innerHTML = `<div class="empty-state glass">
            <p>No papers found for <strong>${window.user.level} Level</strong>.</p>
            <p style="font-size: 0.8rem; opacity: 0.7;">(Available: ${availableLevels.join(', ')})</p>
        </div>`;
        return;
    }

    const levelData = deptData[matchedLevelKey];

    // 3. FILTER BY SEMESTER
    const filteredCodes = Object.keys(levelData).filter(code => {
        const course = levelData[code];
        const years = course.data || {};
        
        return Object.values(years).some(yearData => {
            // Check strictly or loosely (e.g. "First" matches "First Semester")
            const val = JSON.stringify(yearData).toLowerCase(); 
            return val.includes(semester.toLowerCase());
        });
    });

    if (filteredCodes.length === 0) {
        container.innerHTML = `<div class="empty-state glass" style="padding:40px; text-align:center;">
            <p>No courses found for ${semester} semester.</p>
        </div>`;
        return;
    }

    // 4. RENDER
    container.innerHTML = filteredCodes.map(code => `
        <div class="stat-card glass" onclick="openYearPicker('${code}', '${semester}', '${matchedLevelKey}')" style="cursor:pointer;">
            <div class="icon-box blue"><i class="fas fa-book"></i></div>
            <div>
                <h3>${code}</h3>
                <p>${levelData[code].name}</p>
            </div>
        </div>
    `).join('');
}

// ==========================================
// 5. VIEWER & MODALS (Updated for Cloud Data)
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
    
    // Sort years descending
    const years = Object.keys(courseData.data).sort().reverse();
    
    years.forEach(year => {
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
    
    // --- NEW VIEWER LOGIC FOR CLOUD DATA ---
    let htmlContent = "";

    if (paper.fileData) {
        // Handle Cloud File (Single Base64 String)
        if (paper.type === 'pdf' || paper.fileData.startsWith('data:application/pdf')) {
            htmlContent = `<iframe src="${paper.fileData}" width="100%" height="600px" style="border:none; border-radius:10px; background:white;"></iframe>`;
        } else {
            htmlContent = `<img src="${paper.fileData}" style="width:100%; border-radius:10px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">`;
        }
    } else {
        // Fallback for any old data format
        htmlContent = "<p>Error: File data is missing or corrupted.</p>";
    }

    // If Sections exist (Text based questions)
    if (paper.sections && paper.sections.length > 0) {
        htmlContent += paper.sections.map(sec => `
            <div style="margin-top: 30px; padding: 20px; background: rgba(0,0,0,0.2); border-radius: 10px;">
                <h4 style="color:var(--accent); margin-bottom: 10px;">${sec.title}</h4>
                ${sec.questions.map((q, i) => `<p style="margin-bottom: 8px;"><strong>${i+1}.</strong> ${q.text}</p>`).join('')}
            </div>
        `).join('');
    }

    displayArea.innerHTML = htmlContent;
}

window.closeViewer = () => {
    document.getElementById('paperViewer').style.display = 'none';
    document.body.style.overflow = 'auto';
};

// ==========================================
// 6. ADMIN HIERARCHY (For Management)
// ==========================================
function renderAdminManagementHierarchy(container) {
    // 1. ADD BUTTON
    let html = `
        <div class="admin-quick-actions" style="margin-bottom: 30px;">
            <button onclick="openAdminPanel()" class="glass" style="width: 100%; padding: 20px; display: flex; align-items: center; justify-content: center; gap: 15px; border: 2px dashed rgba(59, 130, 246, 0.5); cursor: pointer; background: rgba(59, 130, 246, 0.1);">
                <div style="background: #3b82f6; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem;">
                    <i class="fas fa-plus"></i>
                </div>
                <div style="text-align: left;">
                    <h3 style="margin: 0; color: #3b82f6;">Upload New Question Paper</h3>
                    <p style="margin: 0; opacity: 0.7; font-size: 0.9rem;">Add a new course, year, or semester</p>
                </div>
            </button>
        </div>
    `;

    // 2. CHECK EMPTY
    if (Object.keys(questionBank).length === 0) {
        html += `<div class="empty-state glass"><p>No data loaded from cloud.</p></div>`;
        container.innerHTML = html;
        return;
    }

    // 3. TREE VIEW
    html += `<h3 style="margin-bottom: 15px;">Existing Papers</h3>`;
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
                <div id="sem-${safeLvlId}-1">${renderAdminCourseItems(dept, level, 'First')}</div>
                <div id="sem-${safeLvlId}-2">${renderAdminCourseItems(dept, level, 'Second')}</div>
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
            // Check if this year has the requested semester
            if (courses[code].data[year][semester]) {
                const paper = courses[code].data[year][semester];
                const paperId = paper._id || "unknown"; 

                html += `
                <div class="admin-management-card glass" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; margin-bottom: 8px;">
                    <div>
                        <div style="font-weight: 600; color: white;">${code} (${semester})</div>
                        <div style="font-size: 0.8rem; opacity: 0.6;">${year} Session</div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="deletePaper('${paperId}', '${code}')" class="btn-icon" style="color:#ef4444;" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`;
            }
        }
    }
    return html;
}

// ==========================================
// 7. UTILS & HELPER FUNCTIONS
// ==========================================

async function deletePaper(paperId, code) {
    if(!confirm(`Delete ${code}? This cannot be undone.`)) return;
    try {
        const response = await fetch(`${BASE_URL}/${paperId}`, { method: 'DELETE' });
        if (response.ok) {
            showNotification(`${code} deleted.`, "success");
            loadPapersFromBackend(); // Refresh list
        } else {
            throw new Error("Delete failed");
        }
    } catch (error) {
        showNotification("Error deleting paper.", "error");
    }
}

window.toggleHierarchy = function(id) {
    const el = document.getElementById(id);
    if(el) el.style.display = (el.style.display === "none" || el.style.display === "") ? "block" : "none";
};

// Update Sidebar UI
function updateProfileUI() {
    const profileNameEl = document.querySelector('.profile-info h4');
    if (profileNameEl && window.user) profileNameEl.innerText = `${window.user.firstName || window.user.name}`;
    
    const profileRoleEl = document.querySelector('.profile-info p');
    if (profileRoleEl && window.user) profileRoleEl.innerText = `${window.user.dept} ${window.user.level}L • ${window.user.role.toUpperCase()}`;
}

function showNotification(message, type = 'success') {
    showToast(message);
}

// Search
function setupSearchFeature() {
    document.getElementById('courseSearch')?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.stat-card').forEach(card => {
            card.style.display = card.innerText.toLowerCase().includes(term) ? "flex" : "none";
        });
    });
}

// 1. Trigger the Modal (Attached to your Logout button)
window.logoutUser = function() {
    const modal = document.getElementById('confirmModal');
    
    // Show your custom modal
    modal.style.display = 'flex'; 

    // 2. Define what happens when they click "Ok"
    const okBtn = document.getElementById('confirmOkBtn');
    
    // We use .onclick here to ensure we don't stack multiple event listeners
    okBtn.onclick = function() {
        // Perform the actual logout
        localStorage.removeItem('user'); 
        window.location.href = 'login.html';
    };
};

// 3. Helper to Close the Modal (Attached to "Cancel")
window.closeConfirmModal = function() {
    const modal = document.getElementById('confirmModal');
    modal.style.display = 'none';
};
// Archive Toggle
window.toggleArchiveMenu = function() {
    const desktopMenu = document.querySelector('.sidebar #archiveLevels');
    if(desktopMenu) desktopMenu.style.display = (desktopMenu.style.display === "none" || desktopMenu.style.display === "") ? "block" : "none";
};

window.viewArchiveLevel = function(level) {
    showToast(`Archive for ${level}L coming soon!`, "error");
};

// --- TOAST NOTIFICATION ENGINE ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');

    // 1. Create the Element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // 2. Choose Icon
    let iconName = 'info-circle';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'exclamation-triangle';

    // 3. Set Content
    toast.innerHTML = `
        <i class="fas fa-${iconName}"></i>
        <span>${message}</span>
    `;

    // 4. Add to Screen
    container.appendChild(toast);

    // 5. Remove after 3.5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.4s ease forwards';
        // Wait for animation to finish before deleting
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 400);
    }, 3500);
}

// Make it global so you can call it from anywhere
window.showToast = showToast;