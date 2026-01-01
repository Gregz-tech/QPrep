// ==========================================
// CONFIGURATION
// ==========================================
const BASE_URL = 'https://qprep-backend-1.onrender.com/api/papers';
window.questionBank = {}; 

// ==========================================
// 1. INITIALIZATION & ROUTER 🚦
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const isLoginPage = window.location.pathname.includes('login.html');
    const storedUser = localStorage.getItem('user');

    if (isLoginPage) {
        if (storedUser) window.location.href = 'index.html';
        return; 
    }

    if (!storedUser) {
        window.location.href = 'login.html';
        return;
    }

    window.user = JSON.parse(storedUser);
    // Normalize Dept to ensure matches (e.g., "ith" -> "ITH")
    if (window.user.dept) window.user.dept = window.user.dept.trim().toUpperCase();

    updateProfileUI();
    
    const adminBtn = document.querySelector('.fab'); 
    if (adminBtn) adminBtn.style.display = (window.user.role === 'student') ? 'none' : 'flex';

    // Start App
    loadPapersFromBackend();
    setupSearchFeature();
});

// ==========================================
// 2. DATA LOADING (Robust & Persistent) ⚙️
// ==========================================
async function loadPapersFromBackend() {
    try {
        const grid = document.getElementById('questionsGrid');
        // Only show spinner if this is the FIRST load
        if(grid && Object.keys(window.questionBank).length === 0) {
            grid.innerHTML = `<div style="text-align:center; padding:40px; color:white; opacity:0.7;"><i class="fas fa-circle-notch fa-spin"></i><br>Loading Library...</div>`;
        }

        const response = await fetch(BASE_URL);
        if (!response.ok) throw new Error("Server Error");
        
        const papers = await response.json();
        
        // ⚠️ CRITICAL CHANGE: Don't wipe the bank immediately. Build a new one first.
        const newBank = {}; 

        papers.forEach(p => {
            const dept = (p.department || "General").trim().toUpperCase(); 
            const level = p.level || "100";
            const code = p.courseCode || "UNKNOWN";
            const year = p.year || "General"; 
            const semester = p.semester || "First";
            const title = p.courseTitle || p.title || "No Title";

            if (!newBank[dept]) newBank[dept] = {};
            if (!newBank[dept][level]) newBank[dept][level] = {};
            
            if (!newBank[dept][level][code]) {
                newBank[dept][level][code] = { name: title, data: {} };
            }
            if (!newBank[dept][level][code].data[year]) {
                newBank[dept][level][code].data[year] = {};
            }
            
            newBank[dept][level][code].data[year][semester] = { 
                ...p, 
                _id: p._id,
                fileData: p.fileData, 
                type: p.type,
                sections: p.sections 
            };
        });

        // Swap the new bank in
        window.questionBank = newBank;
        console.log("✅ Library Updated:", Object.keys(window.questionBank));
        
        renderDashboard(); 

    } catch (error) {
        console.error("Backend Error:", error);
        showToast("Connection unstable. Showing cached data.", "error");
    }
}

// ==========================================
// 3. DASHBOARD RENDERING 🎨
// ==========================================
function renderDashboard() {
    if (!window.user) return;
    const grid = document.getElementById('questionsGrid');
    const heading = document.getElementById('courseHeading');
    if (!grid || !heading) return;

    grid.style.display = 'block';

    if ((window.user.role || "").toLowerCase() === 'admin') {
        heading.innerText = "Management Console";
        if (typeof renderAdminManagementHierarchy === 'function') {
            renderAdminManagementHierarchy(grid);
        } else {
             grid.innerHTML = "<p>Admin Panel Ready.</p>";
        }
    } else {
        renderStudentSemesterView(grid);
    }
}

function renderStudentSemesterView(container) {
    document.getElementById('courseHeading').innerText = `Select Semester - ${window.user.dept} ${window.user.level}L`;
    container.innerHTML = `
        <div class="semester-select-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%;">
            <div class="stat-card glass" onclick="renderCourseGridBySemester('First')" style="cursor: pointer; flex-direction: column; text-align: center; padding: 40px; border: 1px solid var(--glass-border);">
                <div class="icon-box blue" style="margin: 0 auto 15px auto;"><i class="fas fa-snowflake"></i></div>
                <h3>FIRST SEMESTER</h3>
                <p>Tap to view</p>
            </div>
            <div class="stat-card glass" onclick="renderCourseGridBySemester('Second')" style="cursor: pointer; flex-direction: column; text-align: center; padding: 40px; border: 1px solid var(--glass-border);">
                <div class="icon-box orange" style="margin: 0 auto 15px auto;"><i class="fas fa-sun"></i></div>
                <h3>SECOND SEMESTER</h3>
                <p>Tap to view</p>
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
    const userDept = (window.user.dept || "").toUpperCase(); 
    
    // 🛡️ Fallback: If user dept empty, show everything (Debug mode)
    let deptData = window.questionBank[userDept];

    if (!deptData) {
        // Try searching for the dept with different casing
        const matchingKey = Object.keys(window.questionBank).find(k => k.toUpperCase() === userDept);
        if (matchingKey) deptData = window.questionBank[matchingKey];
    }

    if (!deptData) {
        container.innerHTML = `<div class="empty-state glass"><p>No papers found for <strong>${userDept}</strong>.</p></div>`;
        return;
    }

    const availableLevels = Object.keys(deptData);
    const userLevelClean = window.user.level.replace(/\D/g, ''); 
    const matchedLevelKey = availableLevels.find(k => k.replace(/\D/g, '') === userLevelClean);

    if (!matchedLevelKey) {
        container.innerHTML = `<div class="empty-state glass"><p>No papers for <strong>${window.user.level}</strong>.</p></div>`;
        return;
    }

    const levelData = deptData[matchedLevelKey];

    const filteredCodes = Object.keys(levelData).filter(code => {
        const course = levelData[code];
        const years = course.data || {};
        return Object.values(years).some(yearData => JSON.stringify(yearData).toLowerCase().includes(semester.toLowerCase()));
    });

    if (filteredCodes.length === 0) {
        container.innerHTML = `<div class="empty-state glass"><p>No courses for ${semester} semester.</p></div>`;
        return;
    }

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
// 4. YEAR SELECTOR (NO RELOAD LOOP!) 🛑
// ==========================================
function openYearPicker(code, semester, level) {
    console.log(`Opening Picker for: ${code}`);

    // 1. GLOBAL SEARCH ALGORITHM
    // Instead of relying on user.dept, we scan the ENTIRE bank to find this course.
    const normalize = (str) => String(str).replace(/\s+/g, '').toLowerCase();
    const searchCode = normalize(code);
    let courseData = null;

    // Scan every department and every level
    outerLoop:
    for (const deptKey in window.questionBank) {
        const deptData = window.questionBank[deptKey];
        for (const lvlKey in deptData) {
            const courses = deptData[lvlKey];
            for (const dbCode in courses) {
                if (normalize(dbCode) === searchCode) {
                    courseData = courses[dbCode];
                    console.log(`✅ Found ${code} in ${deptKey} - ${lvlKey}`);
                    break outerLoop;
                }
            }
        }
    }

    if (!courseData) { 
        alert("System Error: Course data not found in memory. Please refresh manually."); 
        return; 
    }

    // 2. RENDER MODAL
    const container = document.getElementById('objContainer');
    document.getElementById('viewCourseCode').innerText = `${code} (${semester})`;
    document.getElementById('viewInstructions').innerText = "Select an Academic Session to view the paper.";
    
    // Sort years
    const availableYears = Object.keys(courseData.data)
        .filter(y => courseData.data[y][semester]) 
        .sort().reverse();

    if (availableYears.length === 0) {
        container.innerHTML = `<p style="padding:20px; text-align:center;">No papers for this semester.</p>`;
    } else {
        let html = `
            <div style="padding: 20px;">
                <label style="display:block; margin-bottom:10px; color:#ccc;">Select Academic Session:</label>
                <select id="yearSelector" class="glass-input" style="width:100%; padding:15px; border-radius:10px; font-size:1rem;" 
                    onchange="fetchAndDisplayPaper('${code}', '${semester}', '${level}', this.value)">
                    <option value="">-- Tap to Select Year --</option>
                    ${availableYears.map(year => `<option value="${year}">${year}</option>`).join('')}
                </select>
                <div id="paperDisplayArea" style="margin-top: 30px;"></div>
            </div>
        `;
        container.innerHTML = html;
    }

    const viewer = document.getElementById('paperViewer');
    if (viewer) viewer.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// ==========================================
// 5. FILE VIEWER (Robust) 📄
// ==========================================
async function fetchAndDisplayPaper(code, semester, level, year) {
    if (!year) return;

    const displayArea = document.getElementById('paperDisplayArea');
    displayArea.innerHTML = `<div style="text-align:center; padding: 40px; color:white;"><i class="fas fa-spinner fa-spin"></i><br>Fetching Paper...</div>`;

    try {
        const normalize = (str) => String(str).replace(/\s+/g, '').toLowerCase();
        let courseData = null;
        
        // Re-Search Global Bank
        outerLoop:
        for (const deptKey in window.questionBank) {
            const deptData = window.questionBank[deptKey];
            for (const lvlKey in deptData) {
                const courses = deptData[lvlKey];
                for (const dbCode in courses) {
                    if (normalize(dbCode) === normalize(code)) {
                        courseData = courses[dbCode];
                        break outerLoop;
                    }
                }
            }
        }

        if (!courseData) throw new Error("Data access error.");
        const paper = courseData.data[year][semester];

        if (!paper.fileData) {
            const response = await fetch(`${BASE_URL}/${paper._id}`);
            if (!response.ok) throw new Error("Download Failed");
            const fullPaper = await response.json();
            paper.fileData = fullPaper.fileData;
            paper.type = fullPaper.type;
            paper.sections = fullPaper.sections;
        }

        let htmlContent = "";
        
        if (paper.fileData) {
            const isPDF = paper.type === 'pdf' || (typeof paper.fileData === 'string' && paper.fileData.startsWith('data:application/pdf'));
            
            if (isPDF) {
                htmlContent = `
                    <div style="width:100%; height:500px; overflow:hidden; border-radius:10px; background:white;">
                        <embed src="${paper.fileData}" type="application/pdf" width="100%" height="100%" />
                    </div>
                `;
            } else {
                htmlContent = `<img src="${paper.fileData}" style="width:100%; border-radius:10px;">`;
            }

            const ext = isPDF ? "pdf" : "png";
            htmlContent += `
                <div style="margin-top:20px; text-align:center;">
                    <a href="${paper.fileData}" download="${code}_${year}.${ext}" class="btn-primary" style="text-decoration:none; display:inline-block; padding:12px 25px;">
                        <i class="fas fa-download"></i> Download ${ext.toUpperCase()}
                    </a>
                </div>
            `;
        } else {
            htmlContent = "<p style='color:red; text-align:center;'>Error: File content is empty.</p>";
        }

        if (paper.sections && paper.sections.length > 0) {
            htmlContent += paper.sections.map((sec, i) => `
                <div style="margin-top:20px; padding:20px; background:rgba(0,0,0,0.3); border-radius:10px;">
                    <h4 style="color:var(--accent); margin-bottom:10px;">${sec.title}</h4>
                    ${sec.questions.map((q, j) => `<p style="margin-bottom:8px;"><strong>${j+1}.</strong> ${q.text}</p>`).join('')}
                </div>`).join('');
        }

        displayArea.innerHTML = htmlContent;

    } catch (error) {
        console.error(error);
        displayArea.innerHTML = `<p style="color:red; text-align:center;">Failed to load. Check internet.</p>`;
    }
}

// ==========================================
// 6. UTILITIES
// ==========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return; 

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let iconName = 'info-circle';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'exclamation-triangle';

    toast.innerHTML = `<i class="fas fa-${iconName}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.4s ease forwards';
        setTimeout(() => { if(toast.parentElement) toast.remove(); }, 400);
    }, 3500);
}

function updateProfileUI() {
    if (!window.user) return;
    const username = window.user.username ? window.user.username.charAt(0).toUpperCase() + window.user.username.slice(1) : "Student";
    const details = `${window.user.dept} • ${window.user.level}`;
    const deskName = document.getElementById('profileName');
    const deskInfo = document.getElementById('profileInfo');
    if (deskName) deskName.innerText = username;
    if (deskInfo) deskInfo.innerText = details;
    const mobileName = document.getElementById('mobileRealName');
    const mobileInfo = document.getElementById('mobileRealInfo');
    if (mobileName) mobileName.innerText = username;
    if (mobileInfo) mobileInfo.innerText = details;
}

window.closeViewer = () => { document.getElementById('paperViewer').style.display = 'none'; document.body.style.overflow = 'auto'; };
window.logoutUser = function() { if(confirm("Logout?")) { localStorage.removeItem('user'); window.location.href = 'login.html'; } };
window.setupSearchFeature = function() {
    document.getElementById('courseSearch')?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.stat-card').forEach(card => {
            card.style.display = card.innerText.toLowerCase().includes(term) ? "flex" : "none";
        });
    });
};
window.toggleHierarchy = function(id) {
    const el = document.getElementById(id);
    if(el) el.style.display = (el.style.display === "none" || el.style.display === "") ? "block" : "none";
};

// Exports
window.renderDashboard = renderDashboard;
window.renderCourseGridBySemester = renderCourseGridBySemester;
window.openYearPicker = openYearPicker;
window.fetchAndDisplayPaper = fetchAndDisplayPaper;
window.updateProfileUI = updateProfileUI;
window.showToast = showToast;