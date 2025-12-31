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
    
    // SAFETY VALVE: Don't run this check if we are already on the login page!
    const isLoginPage = window.location.pathname.includes('login.html');

    if (!storedUser && !isLoginPage) {
        console.warn("No user found. Redirecting to login.");
        window.location.href = 'login.html'; 
        return;
    }
    
    // Stop the script here if we are on login.html (no need to load papers)
    if (isLoginPage) return; 

    // ... The rest of your code (B, C, D) continues below ...
    
    // B. LOAD USER DATA
    window.user = JSON.parse(storedUser);
    console.log("Authorized User:", window.user);

    // C. UPDATE UI WITH REAL NAME (Now calls the fixed function below)
    if (typeof updateProfileUI === 'function') updateProfileUI();

    // D. START APP
    if (typeof loadPapersFromBackend === 'function') loadPapersFromBackend(); 
    if (typeof setupSearchFeature === 'function') setupSearchFeature();
});

// ==========================================
// 2. DATA LOADING
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
    
    const userDept = window.user.dept; 
    const deptData = questionBank[userDept];

    if (!deptData) {
        container.innerHTML = `<div class="empty-state glass">
            <i class="fas fa-folder-open" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
            <p>No papers found for <strong>${userDept}</strong> Department.</p>
        </div>`;
        return;
    }

    // ROBUST LEVEL CHECK (Matches "300" to "300" or "300L")
    const availableLevels = Object.keys(deptData);
    const userLevelClean = window.user.level.replace(/\D/g, ''); 
    const matchedLevelKey = availableLevels.find(k => k.replace(/\D/g, '') === userLevelClean);

    if (!matchedLevelKey) {
        container.innerHTML = `<div class="empty-state glass">
            <p>No papers found for <strong>${window.user.level} Level</strong>.</p>
            <p style="font-size: 0.8rem; opacity: 0.7;">(Available: ${availableLevels.join(', ')})</p>
        </div>`;
        return;
    }

    const levelData = deptData[matchedLevelKey];

    // FILTER BY SEMESTER
    const filteredCodes = Object.keys(levelData).filter(code => {
        const course = levelData[code];
        const years = course.data || {};
        
        return Object.values(years).some(yearData => {
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

    // RENDER
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


async function loadPaperFromDropdown(code, semester, year, level) {
    console.log("1. Starting Load...", {code, semester, year}); // DEBUG

    if(!year) return;
    
    const activeLevel = level || user.level;
    
    // Safety Check: Does the user have a department?
    if (!user.dept) {
        alert("Session Corrupted. Please Logout and Login again.");
        return;
    }

    // Safety Check: Does the data exist?
    if (!questionBank[user.dept] || !questionBank[user.dept][activeLevel] || !questionBank[user.dept][activeLevel][code]) {
        console.error("Data missing in QuestionBank", questionBank);
        document.getElementById('paperContentArea').innerHTML = "<p>Error: Course data not found locally.</p>";
        return;
    }

    const paper = questionBank[user.dept][activeLevel][code].data[year][semester];
    const displayArea = document.getElementById('paperContentArea');
    
    console.log("2. Found Local Paper Object:", paper); // DEBUG

    // SHOW LOADING
    displayArea.innerHTML = `
        <div style="text-align:center; padding: 40px; color:white;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--accent);"></i>
            <p style="margin-top:10px;">Fetching from Cloud...</p>
        </div>
    `;

    try {
        // LAZY LOAD
        if (!paper.fileData) {
            console.log("3. File missing. Fetching ID:", paper._id); // DEBUG
            
            if (!paper._id) throw new Error("Paper ID is missing. Cannot fetch.");

            // FETCH
            const response = await fetch(`${BASE_URL}/${paper._id}`);
            console.log("4. Server Response Status:", response.status); // DEBUG

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Server Error: ${response.status} - ${errText}`);
            }
            
            const fullPaper = await response.json();
            console.log("5. Downloaded Full Paper:", fullPaper); // DEBUG
            
            // UPDATE CACHE
            paper.fileData = fullPaper.fileData;
            paper.type = fullPaper.type;
            paper.sections = fullPaper.sections;
        } else {
            console.log("3. File already cached. Loading instantly."); // DEBUG
        }

        // RENDER CONTENT
        let htmlContent = "";

        if (paper.fileData) {
            if (paper.type === 'pdf' || (typeof paper.fileData === 'string' && paper.fileData.startsWith('data:application/pdf'))) {
                htmlContent = `<iframe src="${paper.fileData}" width="100%" height="600px" style="border:none; border-radius:10px; background:white;"></iframe>`;
            } else {
                htmlContent = `<img src="${paper.fileData}" style="width:100%; border-radius:10px;">`;
            }
        } else {
            htmlContent = "<p style='color:red;'>Error: File data is empty.</p>";
        }

        // Render Sections
        if (paper.sections && paper.sections.length > 0) {
            htmlContent += paper.sections.map(sec => `
                <div style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.2);">
                    <h4>${sec.title}</h4>
                    ${sec.questions.map((q, i) => `<p>${i+1}. ${q.text}</p>`).join('')}
                </div>
            `).join('');
        }

        displayArea.innerHTML = htmlContent;

    } catch (error) {
        console.error("CRITICAL ERROR:", error); // DEBUG
        displayArea.innerHTML = `
            <div style="text-align:center; color:red; padding:20px;">
                <i class="fas fa-bug"></i><br>
                <b>Error:</b> ${error.message}
            </div>
        `;
    }
}
// ==========================================
// 6. ADMIN HIERARCHY
// ==========================================
function renderAdminManagementHierarchy(container) {
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

    if (Object.keys(questionBank).length === 0) {
        html += `<div class="empty-state glass"><p>No data loaded from cloud.</p></div>`;
        container.innerHTML = html;
        return;
    }

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

// ==========================================
// ✅ UPDATED PERSONALIZATION ENGINE (Desktop & Mobile)
// ==========================================
function updateProfileUI() {
    console.log("updateProfileUI running..."); // Debug check

    const user = JSON.parse(localStorage.getItem('user'));

    if (user) {
        // Helper to capitalize: "greg" -> "Greg"
        const username = user.username 
            ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
            : "Student";
            
        const details = `${user.dept} • ${user.level}`;

        console.log("User found:", username); // Debug check

        // --- 1. UPDATE DESKTOP SIDEBAR ---
        const deskName = document.getElementById('profileName');
        const deskInfo = document.getElementById('profileInfo');

        if (deskName) deskName.innerText = username;
        if (deskInfo) deskInfo.innerText = details;

        // --- 2. UPDATE MOBILE SIDEBAR (New IDs!) ---
        const mobileName = document.getElementById('mobileRealName');
        const mobileInfo = document.getElementById('mobileRealInfo');

        if (mobileName) {
            mobileName.innerText = username;
            console.log("Mobile Name Updated");
        } else {
            console.warn("Could not find element #mobileRealName");
        }

        if (mobileInfo) mobileInfo.innerText = details;
        
        // --- 3. SHOW ADMIN BUTTONS (If Admin) ---
        if (user.role === 'admin') {
            const adminNav = document.getElementById('adminOnlyNav');
            const mobileAdmin = document.getElementById('mobileAdminOnlyNav');
            
            if (adminNav) adminNav.style.display = 'block';
            if (mobileAdmin) mobileAdmin.style.display = 'block';
        }
    }
}
window.updateProfileUI = updateProfileUI;

function showNotification(message, type = 'success') {
    showToast(message, type);
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

// ==========================================
// 8. ARCHIVE SYSTEM (The "Semester-First" Flow) 🏛️
// ==========================================
window.viewArchiveLevel = function(level) {
    // 1. AGGRESSIVE MOBILE CLOSER
    // This forces the sidebar and the blurry overlay to close instantly
    const mobileSidebar = document.getElementById('mobileSidebar');
    const overlay = document.getElementById('mobileOverlay');
    
    if (mobileSidebar) {
        mobileSidebar.classList.remove('active');
    }
    
    if (overlay) {
        overlay.classList.remove('active');
        // FORCE HIDE: Instantly remove it from the screen so it can't blur the content
        overlay.style.display = 'none';
        
        // Reset it after 50ms so it works next time you open the menu
        setTimeout(() => {
            overlay.style.display = ''; 
        }, 50);
    }

    // 2. Setup UI
    const grid = document.getElementById('questionsGrid');
    const heading = document.getElementById('courseHeading');
    
    // 3. Update Heading
    heading.innerHTML = `
        <button onclick="renderDashboard()" class="btn-icon" style="margin-right:10px; background:none; border:none; color:white; cursor:pointer;">
            <i class="fas fa-arrow-left"></i>
        </button>
        ARCHIVE: ${level} LEVEL
    `;

    // 4. Render Two Big Buttons (Semester Selection)
    grid.innerHTML = `
        <div class="semester-select-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%;">
            <div class="stat-card glass" onclick="renderArchiveSemesterGrid('${level}', 'First')" style="cursor: pointer; flex-direction: column; text-align: center; padding: 40px; border: 1px solid var(--glass-border);">
                <div class="icon-box blue" style="margin: 0 auto 15px auto; background: rgba(59, 130, 246, 0.2); color: #60a5fa;"><i class="fas fa-snowflake"></i></div>
                <h3>FIRST SEMESTER</h3>
                <p>View ${level}L Papers</p>
            </div>
            
            <div class="stat-card glass" onclick="renderArchiveSemesterGrid('${level}', 'Second')" style="cursor: pointer; flex-direction: column; text-align: center; padding: 40px; border: 1px solid var(--glass-border);">
                <div class="icon-box orange" style="margin: 0 auto 15px auto; background: rgba(245, 158, 11, 0.2); color: #fbbf24;"><i class="fas fa-sun"></i></div>
                <h3>SECOND SEMESTER</h3>
                <p>View ${level}L Papers</p>
            </div>
        </div>
    `;
};

// STEP B: COURSE LIST - Filtered by Level & Semester
window.renderArchiveSemesterGrid = function(level, semester) {
    const grid = document.getElementById('questionsGrid');
    const heading = document.getElementById('courseHeading');
    const dept = window.user.dept;

    // 1. Update Heading (Back button goes to Level View)
    heading.innerHTML = `
        <button onclick="viewArchiveLevel('${level}')" class="btn-icon" style="margin-right:10px; background:none; border:none; color:white; cursor:pointer;">
            <i class="fas fa-arrow-left"></i>
        </button>
        ${level}L • ${semester.toUpperCase()} SEMESTER
    `;

    // 2. Data Lookup (CRITICAL FIX: Uses 'level' arg, NOT user.level)
    if (!window.questionBank[dept] || !window.questionBank[dept][level]) {
        grid.innerHTML = `<div class="empty-state glass"><p>No archive data found for ${dept} ${level}L.</p></div>`;
        return;
    }

    const levelData = window.questionBank[dept][level];
    
    // 3. Filter Courses (Must have data for this specific semester)
    const courses = Object.keys(levelData).filter(code => {
        const years = levelData[code].data;
        // Check if ANY year has data for this semester
        return Object.values(years).some(yearData => yearData[semester]);
    });

    if (courses.length === 0) {
        grid.innerHTML = `<div class="empty-state glass"><p>No courses found for ${semester} Semester.</p></div>`;
        return;
    }

    // 4. Render Course Cards (Gold Style)
    grid.innerHTML = courses.map(code => `
        <div class="stat-card glass" onclick="openArchivePaperModal('${code}', '${level}', '${semester}')" style="cursor:pointer; border-left: 4px solid #ffd700;">
            <div class="icon-box" style="background: rgba(255, 215, 0, 0.2); color: #ffd700;"><i class="fas fa-history"></i></div>
            <div>
                <h3>${code}</h3>
                <p>${levelData[code].name}</p>
            </div>
        </div>
    `).join('');
};

// STEP C: VIEWER - Pick a Year
window.openArchivePaperModal = function(code, level, semester) {
    const courseData = window.questionBank[window.user.dept][level][code];
    const container = document.getElementById('objContainer');
    
    let html = `
        <div style="padding: 20px;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                <span style="background:#ffd700; color:black; padding:2px 8px; border-radius:4px; font-size:0.7rem; font-weight:bold;">ARCHIVE</span>
                <h3 class="accent-text" style="color: #fff; margin:0;">${code}</h3>
            </div>
            <p style="margin-bottom: 20px; opacity: 0.8;">${semester} Semester • Select Session</p>
            
            <select id="archivePicker" class="glass-input" style="width:100%; padding:12px; border-radius:10px;" 
                onchange="loadPaperFromDropdown('${code}', '${semester}', this.value, '${level}')">
                <option value="">-- Choose Academic Year --</option>
    `;

    // Sort years descending
    const years = Object.keys(courseData.data).sort().reverse();

    years.forEach(year => {
        // Only show years that actually have this semester!
        if (courseData.data[year][semester]) {
            html += `<option value="${year}">${year}</option>`;
        }
    });

    html += `</select><div id="paperContentArea" style="margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;"></div></div>`;

    container.innerHTML = html;
    document.getElementById('viewCourseCode').innerText = "Archive Reader";
    document.getElementById('paperViewer').style.display = 'block';
    document.body.style.overflow = 'hidden';
};

// B. ARCHIVE VIEWER: Shows All Semesters
window.openArchiveYearPicker = function(code, level) {
    const courseData = window.questionBank[window.user.dept][level][code];
    const container = document.getElementById('objContainer');
    
    let html = `
        <div style="padding: 20px;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                <span style="background:#ffd700; color:black; padding:2px 8px; border-radius:4px; font-size:0.7rem; font-weight:bold;">ARCHIVE</span>
                <h3 class="accent-text" style="color: #fff; margin:0;">${code}</h3>
            </div>
            <p style="margin-bottom: 20px; opacity: 0.8;">${courseData.name}</p>
            
            <select id="archivePicker" class="glass-input" style="width:100%; padding:12px; border-radius:10px;" 
                onchange="loadArchivePaper('${code}', '${level}', this.value)">
                <option value="">-- Select a Past Session --</option>
    `;

    // Sort years descending (Newest first)
    const years = Object.keys(courseData.data).sort().reverse();

    years.forEach(year => {
        // Add First Semester Option
        if (courseData.data[year]['First']) {
            html += `<option value="${year}|First">📂 ${year} - First Semester</option>`;
        }
        // Add Second Semester Option
        if (courseData.data[year]['Second']) {
            html += `<option value="${year}|Second">📂 ${year} - Second Semester</option>`;
        }
    });

    html += `</select><div id="paperContentArea" style="margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;"></div></div>`;

    container.innerHTML = html;
    document.getElementById('viewCourseCode').innerText = "Archive Repository";
    document.getElementById('paperViewer').style.display = 'block';
    document.body.style.overflow = 'hidden';
};

// C. LOADER: Bridges the gap to the existing viewer
window.loadArchivePaper = function(code, level, value) {
    if (!value) return;
    
    // Split the value "2023|First" into two parts
    const [year, semester] = value.split('|');
    
    // Reuse your existing powerful loader!
    loadPaperFromDropdown(code, semester, year, level);
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

// ==========================================
// 9. MOBILE SPECIFIC FIXES 📱
// ==========================================

// ==========================================
// 9. UNIVERSAL ARCHIVE TOGGLE (Fixes Mobile & Desktop) 🔧
// ==========================================

// We assign the SAME logic to both function names.
// This ensures it works regardless of what your HTML 'onclick' says.
window.toggleArchiveMenu = toggleSmartArchive;
window.toggleMobileArchive = toggleSmartArchive;

function toggleSmartArchive() {
    // 1. Try to find the Desktop Dropdown
    const desktopMenu = document.querySelector('.sidebar #archiveLevels');
    
    // 2. Try to find the Mobile Dropdown (Check both possible IDs to be safe)
    const mobileMenu = document.getElementById('mobileArchiveLevels') || 
                       document.querySelector('#mobileSidebar .archive-dropdown #archiveLevels');

    // 3. LOGIC: If Mobile Sidebar is active, toggle Mobile Menu. Otherwise, toggle Desktop.
    const mobileSidebar = document.getElementById('mobileSidebar');
    const isMobileOpen = mobileSidebar && mobileSidebar.classList.contains('active'); // Or check display style

    // Simple Check: If we can see the mobile sidebar, we toggle the mobile menu
    if (window.innerWidth <= 768 || (mobileSidebar && getComputedStyle(mobileSidebar).left === "0px")) {
        if (mobileMenu) {
            toggleElement(mobileMenu);
        } else {
            console.warn("Mobile Archive Menu not found in HTML");
        }
    } else {
        // We are on Desktop
        if (desktopMenu) {
            toggleElement(desktopMenu);
        }
    }
}

// Helper to switch Open/Close
function toggleElement(el) {
    if (el.style.display === "none" || el.style.display === "") {
        el.style.display = "block";
    } else {
        el.style.display = "none";
    }
}

