// ==========================================
// SUPER ADMIN PORTAL 👑 (With Bulk Delete)
// ==========================================
const SA_API_BASE = 'https://qprep-backend-1.onrender.com/api/super-admin';

// Helper to get token
const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? (user.token || localStorage.getItem('token')) : '';
};

// 1. RENDER DASHBOARD
async function renderSuperAdmin() {
    if (!window.user || window.user.role !== 'super_admin') {
        showToast("Access Denied", "error");
        return;
    }

    const grid = document.getElementById('questionsGrid');
    const heading = document.getElementById('courseHeading');
    
    heading.innerHTML = `
        <button onclick="renderDashboard()" class="btn-icon" style="margin-right:10px; background:none; border:none; color:white; cursor:pointer;">
            <i class="fas fa-arrow-left"></i>
        </button>
        SYSTEM OVERVIEW
    `;

    grid.innerHTML = `<div style="text-align:center; padding:40px; color:white;"><i class="fas fa-circle-notch fa-spin"></i> Loading Data...</div>`;

    try {
        const response = await fetch(`${SA_API_BASE}/stats`);
        const stats = await response.json(); 

        grid.innerHTML = `
            <div class="sa-stats-grid">
                <div class="stat-card glass sa-stat-card">
                    <i class="fas fa-users" style="color:#60a5fa; font-size:1.5rem;"></i>
                    <div class="sa-stat-number" id="countTotal">0</div>
                    <div class="sa-stat-label">Total Users</div>
                </div>
                <div class="stat-card glass sa-stat-card">
                    <i class="fas fa-user-shield" style="color:#34d399; font-size:1.5rem;"></i>
                    <div class="sa-stat-number" id="countAdmins">0</div>
                    <div class="sa-stat-label">Admins</div>
                </div>
                <div class="stat-card glass sa-stat-card">
                    <i class="fas fa-file-alt" style="color:#fbbf24; font-size:1.5rem;"></i>
                    <div class="sa-stat-number" id="countPapers">0</div>
                    <div class="sa-stat-label">Total Papers</div>
                </div>
                 <div class="stat-card glass sa-stat-card">
                    <i class="fas fa-user-graduate" style="color:#a78bfa; font-size:1.5rem;"></i>
                    <div class="sa-stat-number" id="countStudents">0</div>
                    <div class="sa-stat-label">Students</div>
                </div>
            </div>

            <div style="display:flex; gap:15px; margin-bottom:20px;">
                <button onclick="renderUserManagement()" class="btn-primary" style="flex:1;">Manage Users</button>
                <button onclick="renderPaperManagement()" class="btn-primary" style="flex:1; background:#334155;">Manage Papers</button>
            </div>
            
            <div id="sa-content-area"></div>
        `;
        
        animateValue("countTotal", 0, stats.totalUsers, 1000);
        animateValue("countAdmins", 0, stats.totalAdmins, 1000);
        animateValue("countPapers", 0, stats.totalPapers, 1000);
        animateValue("countStudents", 0, stats.totalStudents, 1000);

        renderUserManagement(); 

    } catch (error) {
        console.error(error);
        grid.innerHTML = `<p style="color:red; text-align:center;">Server Offline.</p>`;
    }
}

// 2. USER MANAGEMENT
async function renderUserManagement() {
    const container = document.getElementById('sa-content-area');
    container.innerHTML = `<div style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> Fetching Users...</div>`;

    try {
        const token = getAuthToken();
        const res = await fetch(`${SA_API_BASE}/users`, { headers: { 'Authorization': token } });
        const users = await res.json();

        container.innerHTML = `
            <div class="glass" style="padding:20px;">
                <div class="sa-section-header">
                    <h3>User Registry (${users.length})</h3>
                    <input type="text" id="saUserSearch" placeholder="Search name..." class="glass-input" 
                           style="padding:10px; width:200px;" onkeyup="filterUsersTable()">
                </div>
                <div class="sa-table-container">
                    <table class="sa-table" id="usersTable">
                        <thead>
                            <tr>
                                <th>User Details</th>
                                <th>Role</th>
                                <th style="text-align:center;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(u => `
                                <tr>
                                    <td>
                                        <div style="font-weight:bold; color:white;">${u.username}</div>
                                        <small style="opacity:0.6">${u.department || 'N/A'} • ${u.level || 'N/A'}</small>
                                    </td>
                                    <td><span class="sa-badge ${u.role}">${u.role.toUpperCase()}</span></td>
                                    <td style="text-align:center;">
                                        ${u.role === 'super_admin' ? '<span style="opacity:0.5; font-size:0.8rem;">System Owner</span>' : `
                                            <div style="display:flex; justify-content:center; gap:8px;">
                                                ${u.role === 'student' ? 
                                                    `<button onclick="confirmAction('Promote ${u.username}?', () => updateUserRole('${u._id}', 'admin'))" class="sa-btn btn-icon" style="color:#4ade80; border:1px solid #4ade80;"><i class="fas fa-arrow-up"></i></button>` : 
                                                    `<button onclick="confirmAction('Demote ${u.username}?', () => updateUserRole('${u._id}', 'student'))" class="sa-btn btn-icon" style="color:#fbbf24; border:1px solid #fbbf24;"><i class="fas fa-arrow-down"></i></button>`
                                                }
                                                <button onclick="confirmAction('Delete ${u.username}?', () => deleteUserReal('${u._id}'))" class="sa-btn btn-icon" style="color:#ef4444; border:1px solid #ef4444;"><i class="fas fa-trash"></i></button>
                                            </div>
                                        `}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<p style="color:red; text-align:center;">Error loading users.</p>`;
    }
}

// 3. PAPER MANAGEMENT (With Bulk Delete) 🗑️📦
function renderPaperManagement() {
    const container = document.getElementById('sa-content-area');
    let allPapers = [];
    
    // Flatten Data
    if(window.questionBank) {
        Object.keys(window.questionBank).forEach(dept => {
            Object.keys(window.questionBank[dept]).forEach(level => {
                const courses = window.questionBank[dept][level];
                Object.keys(courses).forEach(code => {
                    const course = courses[code];
                    Object.keys(course.data).forEach(year => {
                         Object.keys(course.data[year]).forEach(sem => {
                             allPapers.push({
                                 id: course.data[year][sem]._id,
                                 code: code,
                                 title: course.name,
                                 dept: dept,
                                 level: level,
                                 year: year,
                                 sem: sem
                             });
                         });
                    });
                });
            });
        });
    }

    container.innerHTML = `
        <div class="glass" style="padding:20px;">
             <div class="sa-section-header" style="flex-wrap:wrap; gap:10px; align-items:center; justify-content: space-between;">
                
                <div style="display:flex; align-items:center; gap:15px;">
                    <h3>Papers (${allPapers.length})</h3>
                    <button id="bulkDeleteBtn" onclick="confirmBulkDelete()" class="btn-primary" 
                        style="display:none; width:auto; padding: 8px 15px; background: #ef4444; font-size:0.9rem; margin:0;">
                        <i class="fas fa-trash"></i> Delete Selected (<span id="selectedCount">0</span>)
                    </button>
                </div>
                
                <div style="display:flex; gap:10px;">
                    <select id="filterDept" class="glass-input" onchange="filterPapersTable()" style="padding:8px; border-radius:6px;">
                        <option value="">All Depts</option>
                        <option value="ITH">ITH</option>
                        <option value="CSC">CSC</option>
                        <option value="NUR">NUR</option>
                        <option value="MBBS">MBBS</option>
                        <option value="BCH">BCH</option>
                    </select>
                    
                    <select id="filterLevel" class="glass-input" onchange="filterPapersTable()" style="padding:8px; border-radius:6px;">
                        <option value="">All Levels</option>
                        <option value="100">100L</option>
                        <option value="200">200L</option>
                        <option value="300">300L</option>
                        <option value="400">400L</option>
                        <option value="500">500L</option>
                    </select>

                    <input type="text" id="filterSearch" onkeyup="filterPapersTable()" placeholder="Search Code..." 
                           class="glass-input" style="padding:8px; border-radius:6px; width:120px;">
                </div>
            </div>

            <div class="sa-table-container">
                <table class="sa-table">
                    <thead>
                        <tr>
                            <th style="width: 40px; text-align: center;">
                                <input type="checkbox" id="selectAllPapers" onclick="toggleAllPaperChecks()" style="cursor:pointer; width:16px; height:16px;">
                            </th>
                            <th>Code</th>
                            <th>Dept / Level</th>
                            <th>Session</th>
                            <th style="text-align:center;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allPapers.map(p => `
                            <tr class="paper-row" data-dept="${p.dept}" data-level="${p.level}" data-code="${p.code.toLowerCase()}">
                                <td style="text-align: center;">
                                    <input type="checkbox" class="paper-checkbox" value="${p.id}" onclick="updateBulkBtnState()" style="cursor:pointer; width:16px; height:16px;">
                                </td>
                                <td>${p.code}</td>
                                <td>${p.dept} - ${p.level}L</td>
                                <td>${p.year}</td>
                                <td style="text-align:center;">
                                    <div style="display:flex; justify-content:center; gap:8px;">
                                        <button onclick="openEditPanel('${p.id}')" class="sa-btn btn-icon" style="color:#60a5fa; border:1px solid #60a5fa;">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="confirmAction('Delete ${p.code}?', () => deletePaperReal('${p.id}'))" class="sa-btn btn-icon" style="color:#ef4444; border:1px solid #ef4444;">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// 4. BULK DELETE LOGIC 🏗️

// Toggle All Checkboxes
window.toggleAllPaperChecks = () => {
    const master = document.getElementById('selectAllPapers');
    // Only select VISIBLE rows (respects filters)
    const visibleRows = document.querySelectorAll('.paper-row:not([style*="display: none"])');
    
    visibleRows.forEach(row => {
        const checkbox = row.querySelector('.paper-checkbox');
        if(checkbox) checkbox.checked = master.checked;
    });
    
    updateBulkBtnState();
};

// Check state and show/hide Bulk Button
window.updateBulkBtnState = () => {
    const checkedBoxes = document.querySelectorAll('.paper-checkbox:checked');
    const btn = document.getElementById('bulkDeleteBtn');
    const countSpan = document.getElementById('selectedCount');
    
    if (checkedBoxes.length > 0) {
        btn.style.display = 'inline-flex';
        btn.style.alignItems = 'center';
        btn.style.gap = '8px';
        countSpan.innerText = checkedBoxes.length;
    } else {
        btn.style.display = 'none';
    }
};

// Confirm Bulk Delete
window.confirmBulkDelete = () => {
    const checkedBoxes = document.querySelectorAll('.paper-checkbox:checked');
    const ids = Array.from(checkedBoxes).map(cb => cb.value);
    
    confirmAction(`Are you sure you want to delete ${ids.length} papers? This cannot be undone.`, () => {
        performBulkDelete(ids);
    });
};

// Execute Bulk Delete API Call
async function performBulkDelete(ids) {
    try {
        const token = getAuthToken();
        const res = await fetch(`https://qprep-backend-1.onrender.com/api/papers/bulk-delete`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': token 
            },
            body: JSON.stringify({ ids })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Bulk delete failed");

        showToast(data.message, "success");
        
        // Refresh page to sync data
        setTimeout(() => location.reload(), 1000); 
    } catch (err) {
        showToast(err.message, "error");
    }
}

// 5. FILTER LOGIC (Updated to uncheck hidden boxes)
window.filterPapersTable = () => {
    const dept = document.getElementById('filterDept').value;
    const level = document.getElementById('filterLevel').value;
    const search = document.getElementById('filterSearch').value.toLowerCase();
    
    const rows = document.querySelectorAll('.paper-row');
    
    rows.forEach(row => {
        const rDept = row.getAttribute('data-dept');
        const rLevel = row.getAttribute('data-level').replace(/\D/g, ''); 
        const rCode = row.getAttribute('data-code');
        
        const matchDept = dept === "" || rDept === dept;
        const matchLevel = level === "" || rLevel === level;
        const matchSearch = rCode.includes(search);
        
        if (matchDept && matchLevel && matchSearch) {
            row.style.display = "";
        } else {
            row.style.display = "none";
            // Important: Uncheck hidden rows so they aren't deleted accidentally
            const cb = row.querySelector('.paper-checkbox');
            if(cb) cb.checked = false; 
        }
    });
    
    // Update button state in case we hid checked items
    updateBulkBtnState();
};

window.filterUsersTable = () => {
    const term = document.getElementById('saUserSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#usersTable tbody tr');
    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(term) ? "" : "none";
    });
};

// 6. SINGLE ACTIONS
window.updateUserRole = async (userId, newRole) => {
    try {
        const token = getAuthToken();
        const res = await fetch(`${SA_API_BASE}/users/${userId}/role`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify({ role: newRole })
        });
        
        const data = await res.json();
        if(!res.ok) throw new Error(data.error);
        showToast(data.message, "success");
        renderUserManagement();
    } catch (err) {
        showToast(err.message, "error");
    }
};

window.deleteUserReal = async (userId) => {
    try {
        const token = getAuthToken();
        const res = await fetch(`${SA_API_BASE}/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.error);
        showToast(data.message, "success");
        renderUserManagement();
    } catch (err) {
        showToast(err.message, "error");
    }
};

window.deletePaperReal = async (paperId) => {
    try {
        const token = getAuthToken();
        const res = await fetch(`https://qprep-backend-1.onrender.com/api/papers/${paperId}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        });
        if(!res.ok) throw new Error("Failed to delete paper");
        showToast("Paper deleted.", "success");
        setTimeout(() => location.reload(), 1000); 
    } catch (err) {
        showToast(err.message, "error");
    }
};

// Helpers
window.confirmAction = (msg, callback) => {
    const modal = document.getElementById('confirmModal');
    const question = document.getElementById('confirmQuestion');
    const okBtn = document.getElementById('confirmOkBtn');
    
    if (!modal || !question || !okBtn) {
        if(confirm(msg)) callback();
        return;
    }
    question.innerText = msg;
    modal.style.display = 'flex';
    okBtn.onclick = () => {
        callback();
        modal.style.display = 'none';
    };
};

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    obj.innerHTML = end; 
}

window.renderSuperAdmin = renderSuperAdmin;
window.renderUserManagement = renderUserManagement;
window.renderPaperManagement = renderPaperManagement;