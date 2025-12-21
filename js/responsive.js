// Mobile Responsive Functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeMobileFeatures();
    
    // Update mobile UI when user logs in
    if (user) {
        updateMobileUserInfo();
    }
});

function initializeMobileFeatures() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const mobileSidebarClose = document.getElementById('mobileSidebarClose');
    
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', openMobileSidebar);
    }
    
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMobileSidebar);
    }
    
    if (mobileSidebarClose) {
        mobileSidebarClose.addEventListener('click', closeMobileSidebar);
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        if (mobileSidebar && mobileSidebar.classList.contains('active') &&
            !mobileSidebar.contains(event.target) &&
            !hamburgerBtn.contains(event.target)) {
            closeMobileSidebar();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
}

function openMobileSidebar() {
    const mobileSidebar = document.getElementById('mobileSidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');
    
    if (mobileSidebar && mobileOverlay) {
        mobileSidebar.classList.add('active');
        mobileOverlay.style.display = 'block';
        setTimeout(() => {
            mobileOverlay.style.opacity = '1';
        }, 10);
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
}

function closeMobileSidebar() {
    const mobileSidebar = document.getElementById('mobileSidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');
    
    if (mobileSidebar && mobileOverlay) {
        mobileSidebar.classList.remove('active');
        mobileOverlay.style.opacity = '0';
        setTimeout(() => {
            mobileOverlay.style.display = 'none';
        }, 300);
        document.body.style.overflow = ''; // Re-enable scrolling
    }
}

function handleResize() {
    const width = window.innerWidth;
    const mobileHeader = document.querySelector('.mobile-header');
    const desktopSidebar = document.querySelector('.sidebar');
    
    // Show/hide mobile header based on screen width
    if (width <= 768) {
        if (mobileHeader) mobileHeader.style.display = 'flex';
        if (desktopSidebar) desktopSidebar.style.display = 'none';
    } else {
        if (mobileHeader) mobileHeader.style.display = 'none';
        if (desktopSidebar) desktopSidebar.style.display = 'flex';
        closeMobileSidebar(); // Close mobile sidebar on desktop
    }
    
    // Adjust questions grid columns
    const questionsGrid = document.getElementById('questionsGrid');
    if (questionsGrid) {
        if (width < 480) {
            questionsGrid.style.gridTemplateColumns = '1fr';
        } else if (width < 768) {
            questionsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else if (width < 1024) {
            questionsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else if (width < 1400) {
            questionsGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        } else {
            questionsGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        }
    }
}

function updateMobileUserInfo() {
    if (!user) return;
    
    const mobileUserName = document.getElementById('mobileUserName');
    const mobileUserInfo = document.getElementById('mobileUserInfo');
    const mobileAdminOnlyNav = document.getElementById('mobileAdminOnlyNav');
    const mobileSidebarFooter = document.getElementById('mobileSidebarFooter');
    const mobileNextLevelLabel = document.getElementById('mobileNextLevelLabel');
    
    if (mobileUserName) {
        mobileUserName.textContent = user.name || 'Student';
    }
    
    if (mobileUserInfo) {
        mobileUserInfo.textContent = `${user.dept || 'ITH'} • ${user.level || '100'}L`;
    }
    
    if (mobileAdminOnlyNav) {
        mobileAdminOnlyNav.style.display = user.role === 'admin' ? 'block' : 'none';
    }
    
    if (mobileSidebarFooter) {
        mobileSidebarFooter.style.display = user.role === 'admin' ? 'none' : 'block';
    }
    
    if (mobileNextLevelLabel && user.role !== 'admin') {
        const nextLevel = parseInt(user.level || 100) + 100;
        mobileNextLevelLabel.textContent = nextLevel + "L";
    }
}

// Override existing functions to update mobile UI
const originalRenderDashboard = renderDashboard;
renderDashboard = function() {
    originalRenderDashboard();
    updateMobileUserInfo();
    
    // Update mobile sidebar with user info
    const mobileHeader = document.querySelector('.mobile-header');
    if (mobileHeader && user) {
        const userInfo = `${user.dept || 'ITH'} • ${user.level || '100'}L`;
        // You could add a badge to the mobile header if needed
    }
};

// Enhance logout to handle mobile
// const originalLogoutUser = logoutUser;
// logoutUser = function() {
//     if (confirm("Are you sure you want to logout?")) {
//         originalLogoutUser();
//         closeMobileSidebar();
//     }
// };

// Enhance promote to update mobile UI
const originalPromoteUserLevel = promoteUserLevel;
promoteUserLevel = function() {
    originalPromoteUserLevel();
    updateMobileUserInfo();
};

// Update the auth modal for mobile
const originalHandleAuth = handleAuth;
handleAuth = function(e) {
    originalHandleAuth(e);
    if (user) {
        closeMobileSidebar(); // Close mobile sidebar if open
    }
};

// Make sure modals are responsive
function makeModalsResponsive() {
    const modals = document.querySelectorAll('.viewer-overlay, .modal-overlay');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                if (modal.id === 'adminPanel') closeAdminPanel();
                if (modal.id === 'paperViewer') closeViewer();
            }
        });
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    makeModalsResponsive();
    handleResize();
    
    // Add touch support for mobile
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
        
        // Make buttons more touch-friendly
        const buttons = document.querySelectorAll('button, .nav-item, .stat-card');
        buttons.forEach(btn => {
            btn.style.cursor = 'pointer';
            btn.addEventListener('touchstart', function() {
                this.style.opacity = '0.8';
            });
            btn.addEventListener('touchend', function() {
                this.style.opacity = '1';
            });
        });
    }
});