document.addEventListener('DOMContentLoaded', () => {
    // Check Authentication
    const userJson = localStorage.getItem('bap-user');
    if (!userJson) {
        window.location.href = '/signin';
        return;
    }
    const user = JSON.parse(userJson);

    // Sidebar HTML Template
    const sidebarHTML = `
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header" onclick="window.location.href='/dashboard/home'">
                <div class="sidebar-logo"></div>
                <h2>BAP</h2>
            </div>
            
            <nav class="sidebar-nav">
                <a href="/dashboard/home" class="nav-item ${location.pathname.includes('/home') ? 'active' : ''}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    Home
                </a>
                <a href="/dashboard/alerts" class="nav-item ${location.pathname.includes('/alerts') ? 'active' : ''}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Alerts
                </a>
                <a href="/dashboard/map" class="nav-item ${location.pathname.includes('/map') ? 'active' : ''}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
                    Safety Map
                </a>
                <a href="/dashboard/translator" class="nav-item ${location.pathname.includes('/translator') ? 'active' : ''}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    Translator
                </a>
                <a href="/dashboard/public-chat" class="nav-item ${location.pathname.includes('/public-chat') ? 'active' : ''}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                    Public Chat
                </a>
                <a href="/dashboard/ai" class="nav-item ${location.pathname.includes('/ai') ? 'active' : ''}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a2 2 0 0 1 2 2v2.53A4 4 0 0 1 18 10v4a4 4 0 0 1-3.66 3.98l-2.34 2.34-2.34-2.34A4 4 0 0 1 6 14v-4a4 4 0 0 1 4-3.47V4a2 2 0 0 1 2-2z"/></svg>
                    Safety AI
                </a>
            </nav>

            <div class="sidebar-footer">
                <div class="user-info">
                    <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                    <div class="user-details">
                        <span class="user-name">${user.name}</span>
                        <span class="user-phone">+91 ${user.phone}</span>
                    </div>
                </div>
                <button class="logout-btn" id="logout-btn">Log Out</button>
            </div>
        </div>
    `;

    // Inject Sidebar at the beginning of the body
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);

    // Handle Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('bap-user');
        window.location.href = '/';
    });

    // Theme Toggle setup
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // Mobile Menu
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    if (mobileBtn && sidebar) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
});
