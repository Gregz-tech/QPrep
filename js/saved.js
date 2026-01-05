// ==========================================
// SAVED.JS - Bookmarks & Viewer Logic 🌟
// ==========================================
const SAVED_API_URL = 'https://qprep-backend-1.onrender.com/api/papers';

// 1. RENDER SAVED LIST
function renderSaved() {
    const grid = document.getElementById('questionsGrid');
    const heading = document.getElementById('courseHeading');
    
    if (!grid || !heading) return;

    heading.innerHTML = `
        <button onclick="renderDashboard()" class="btn-icon" style="margin-right:10px; background:none; border:none; color:white; cursor:pointer;">
            <i class="fas fa-arrow-left"></i>
        </button>
        SAVED PAPERS
    `;

    const saved = JSON.parse(localStorage.getItem('myArchive') || '[]');

    if (saved.length === 0) {
        grid.innerHTML = `
            <div class="empty-state glass" style="text-align:center; padding:40px;">
                <div class="icon-box blue" style="margin:0 auto 20px auto; opacity:0.5;"><i class="fas fa-bookmark"></i></div>
                <p>No saved papers yet.</p>
                <small style="opacity:0.6;">Open a paper and tap the "Star" icon to save it here.</small>
            </div>`;
        return;
    }

    grid.innerHTML = saved.map(item => `
        <div class="stat-card glass" onclick="fetchAndDisplayPaper('${item.code}', '${item.semester}', '${item.level}', '${item.year}')" style="cursor:pointer; position:relative;">
            <div class="icon-box blue"><i class="fas fa-file-alt"></i></div>
            <div style="flex:1;">
                <h3>${item.code}</h3>
                <p>${item.year} • ${item.semester}</p>
                <small style="opacity:0.6">${item.dept} ${item.level}</small>
            </div>
            <div onclick="event.stopPropagation(); toggleSavedItem('${item.id}')" style="position:absolute; top:15px; right:15px; color:#fbbf24; cursor:pointer;">
                <i class="fas fa-star"></i>
            </div>
        </div>
    `).join('');
}

// 2. TOGGLE LOGIC (Save/Unsave)
function toggleSavedItem(id, code, year, semester, level, dept) {
    let saved = JSON.parse(localStorage.getItem('myArchive') || '[]');
    const index = saved.findIndex(item => item.id === id);
    const btn = document.getElementById(`btn-${id}`);

    if (index === -1) {
        // ADD
        saved.push({ id, code, year, semester, level, dept });
        showToast("Added to Saved", "success");
        if(btn) { 
            btn.style.color = "#fbbf24"; 
            btn.querySelector('i').className = "fas fa-star"; 
        }
    } else {
        // REMOVE
        saved.splice(index, 1);
        showToast("Removed from Saved", "info");
        if(btn) { 
            btn.style.color = "white"; 
            btn.querySelector('i').className = "far fa-star"; 
        }
        
        // Refresh Saved Page if active
        const heading = document.getElementById('courseHeading');
        if (heading && heading.innerText.includes("SAVED PAPERS")) {
            renderSaved();
        }
    }
    localStorage.setItem('myArchive', JSON.stringify(saved));
}

// 3. UPGRADED VIEWER (Injects the Star Button)
window.fetchAndDisplayPaper = async function(code, semester, level, year) {
    if (!year) return;

    const displayArea = document.getElementById('paperDisplayArea');
    displayArea.innerHTML = `<div style="text-align:center; padding: 40px; color:white;"><i class="fas fa-spinner fa-spin"></i><br>Fetching Paper...</div>`;

    try {
        const normalize = (str) => String(str).replace(/\s+/g, '').toLowerCase();
        let courseData = null;
        let deptFound = (window.user && window.user.dept) ? window.user.dept : "";

        // Find Data Object
        if (window.questionBank) {
            outerLoop:
            for (const deptKey in window.questionBank) {
                const deptData = window.questionBank[deptKey];
                for (const lvlKey in deptData) {
                    const courses = deptData[lvlKey];
                    for (const dbCode in courses) {
                        if (normalize(dbCode) === normalize(code)) {
                            courseData = courses[dbCode];
                            deptFound = deptKey; 
                            break outerLoop;
                        }
                    }
                }
            }
        }

        if (!courseData) throw new Error("Data access error.");
        const paper = courseData.data[year][semester];

        // Fetch File if Missing
        if (!paper.fileData) {
            const response = await fetch(`${SAVED_API_URL}/${paper._id}`);
            if (!response.ok) throw new Error("Download Failed");
            const fullPaper = await response.json();
            paper.fileData = fullPaper.fileData;
            paper.type = fullPaper.type;
        }

        // Check if Saved
        const saved = JSON.parse(localStorage.getItem('myArchive') || '[]');
        const isSaved = saved.some(item => item.id === paper._id);
        const starIcon = isSaved ? "fas fa-star" : "far fa-star";
        const starColor = isSaved ? "#fbbf24" : "white";

        let htmlContent = "";
        
        if (paper.fileData) {
            const isPDF = paper.type === 'pdf' || (typeof paper.fileData === 'string' && paper.fileData.startsWith('data:application/pdf'));
            
            if (isPDF) {
                htmlContent = `<div style="width:100%; height:500px; overflow:hidden; border-radius:10px; background:white;"><embed src="${paper.fileData}" type="application/pdf" width="100%" height="100%" /></div>`;
            } else {
                htmlContent = `<img src="${paper.fileData}" style="width:100%; border-radius:10px;">`;
            }

            const ext = isPDF ? "pdf" : "png";
            
            htmlContent += `
                <div style="margin-top:20px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="toggleSavedItem('${paper._id}', '${code}', '${year}', '${semester}', '${level}', '${deptFound}')" 
                        id="btn-${paper._id}"
                        class="glass-input" style="padding:12px 20px; border-radius:10px; border:none; color:${starColor}; cursor:pointer; font-size:1.2rem;">
                        <i class="${starIcon}"></i>
                    </button>
                    
                    <a href="${paper.fileData}" download="${code}_${year}.${ext}" class="btn-primary" style="text-decoration:none; display:inline-block; padding:12px 25px;">
                        <i class="fas fa-download"></i> Download
                    </a>
                </div>
            `;
        } else {
            htmlContent = "<p style='color:red; text-align:center;'>Error: File content is empty.</p>";
        }

        displayArea.innerHTML = htmlContent;

    } catch (error) {
        console.error(error);
        displayArea.innerHTML = `<p style="color:red; text-align:center;">Failed to load. Check internet.</p>`;
    }
};

// Exports
window.renderSaved = renderSaved;
window.toggleSavedItem = toggleSavedItem;