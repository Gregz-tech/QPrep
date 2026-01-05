// ==========================================
// ARCHIVE.JS - Level Browser Logic 🏛️
// ==========================================

// 1. Level Selector (100L - 500L)
function renderArchive() {
    const grid = document.getElementById('questionsGrid');
    const heading = document.getElementById('courseHeading');
    
    // Ensure user has a department
    const userDept = (window.user && window.user.dept) ? window.user.dept.toUpperCase() : "GENERAL";

    heading.innerHTML = `
        <button onclick="renderDashboard()" class="btn-icon" style="margin-right:10px; background:none; border:none; color:white; cursor:pointer;">
            <i class="fas fa-arrow-left"></i>
        </button>
        ARCHIVE - ${userDept}
    `;

    // Render Levels 100 - 500
    const levels = ["100", "200", "300", "400", "500"];
    
    grid.innerHTML = levels.map(lvl => `
        <div class="stat-card glass" onclick="renderArchiveSemester('${lvl}')" style="cursor:pointer; flex-direction:column; text-align:center; padding:30px;">
            <div class="icon-box blue" style="margin:0 auto 15px auto;"><i class="fas fa-layer-group"></i></div>
            <h3>${lvl} LEVEL</h3>
            <p>View Papers</p>
        </div>
    `).join('');
}

// 2. Semester Selector
function renderArchiveSemester(level) {
    const grid = document.getElementById('questionsGrid');
    const heading = document.getElementById('courseHeading');
    
    heading.innerHTML = `
        <button onclick="renderArchive()" class="btn-icon" style="margin-right:10px; background:none; border:none; color:white; cursor:pointer;">
            <i class="fas fa-arrow-left"></i>
        </button>
        ${level} LEVEL SEMESTERS
    `;

    grid.innerHTML = `
        <div class="stat-card glass" onclick="renderArchiveCourses('${level}', 'First')" style="cursor: pointer; flex-direction: column; text-align: center; padding: 40px;">
            <div class="icon-box blue" style="margin: 0 auto 15px auto;"><i class="fas fa-snowflake"></i></div>
            <h3>FIRST SEMESTER</h3>
        </div>
        <div class="stat-card glass" onclick="renderArchiveCourses('${level}', 'Second')" style="cursor: pointer; flex-direction: column; text-align: center; padding: 40px;">
            <div class="icon-box orange" style="margin: 0 auto 15px auto;"><i class="fas fa-sun"></i></div>
            <h3>SECOND SEMESTER</h3>
        </div>
    `;
}

// 3. Course Grid (Filtered by Dept + Level + Semester)
function renderArchiveCourses(level, semester) {
    const grid = document.getElementById('questionsGrid');
    const heading = document.getElementById('courseHeading');
    const userDept = (window.user.dept || "").toUpperCase();

    heading.innerHTML = `
        <button onclick="renderArchiveSemester('${level}')" class="btn-icon" style="margin-right:10px; background:none; border:none; color:white; cursor:pointer;">
            <i class="fas fa-arrow-left"></i>
        </button>
        ${level}L - ${semester.toUpperCase()}
    `;

    // 🛡️ Data Fetching Logic (From Global QuestionBank)
    let deptData = window.questionBank[userDept];
    
    // Fuzzy Search for Dept (handles "ITH" vs "ith")
    if (!deptData) {
        const matchingKey = Object.keys(window.questionBank).find(k => k.toUpperCase() === userDept);
        if (matchingKey) deptData = window.questionBank[matchingKey];
    }

    if (!deptData) {
        grid.innerHTML = `<div class="empty-state glass"><p>No data found for department <strong>${userDept}</strong>.</p></div>`;
        return;
    }

    // Fuzzy Search for Level (handles "200" vs "200L")
    const availableLevels = Object.keys(deptData);
    const matchedLevelKey = availableLevels.find(k => k.replace(/\D/g, '') === level);

    if (!matchedLevelKey) {
        grid.innerHTML = `<div class="empty-state glass"><p>No papers found for <strong>${level} Level</strong>.</p></div>`;
        return;
    }

    const levelData = deptData[matchedLevelKey];

    // Filter by Semester
    const filteredCodes = Object.keys(levelData).filter(code => {
        const course = levelData[code];
        const years = course.data || {};
        return Object.values(years).some(yearData => JSON.stringify(yearData).toLowerCase().includes(semester.toLowerCase()));
    });

    if (filteredCodes.length === 0) {
        grid.innerHTML = `<div class="empty-state glass"><p>No courses found for this semester.</p></div>`;
        return;
    }

    // Render Cards (Click opens the Modal from ui.js)
    grid.innerHTML = filteredCodes.map(code => `
        <div class="stat-card glass" onclick="openYearPicker('${code}', '${semester}', '${matchedLevelKey}')" style="cursor:pointer;">
            <div class="icon-box blue"><i class="fas fa-book"></i></div>
            <div>
                <h3>${code}</h3>
                <p>${levelData[code].name}</p>
            </div>
        </div>
    `).join('');
}

// Exports
window.renderArchive = renderArchive;
window.renderArchiveSemester = renderArchiveSemester;
window.renderArchiveCourses = renderArchiveCourses;


