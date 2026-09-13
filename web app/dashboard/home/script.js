document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch Weather (Open-Meteo)
    async function loadWeather() {
        const tempEl = document.getElementById('weather-temp');
        const locEl = document.getElementById('weather-loc');
        
        try {
            // Default to Bengaluru if geolocation fails/denied
            let lat = 12.9716;
            let lon = 77.5946;
            let locName = 'Bengaluru';

            // Try to get actual location
            if ("geolocation" in navigator) {
                try {
                    const pos = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                    });
                    lat = pos.coords.latitude;
                    lon = pos.coords.longitude;
                    locName = 'Your Location';
                } catch (err) {
                    console.log("Geolocation denied/failed, using default.");
                }
            }

            locEl.textContent = locName;

            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
            const data = await res.json();
            
            if (data && data.current_weather) {
                tempEl.textContent = Math.round(data.current_weather.temperature) + '°';
            } else {
                tempEl.textContent = '28°'; // Fallback
            }
        } catch (error) {
            console.error("Failed to fetch weather:", error);
            tempEl.textContent = '28°';
            locEl.textContent = 'Bengaluru';
        }
    }

    // 2. Fetch Recent Alerts from Backend
    async function loadAlerts() {
        const alertsContainer = document.getElementById('recent-alerts');
        try {
            const res = await fetch('/api/alerts');
            const alerts = await res.json();
            
            alertsContainer.innerHTML = ''; // Clear skeletons
            
            if (alerts.length === 0) {
                alertsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No active alerts in your area.</p>';
                return;
            }

            // Show top 2 alerts
            alerts.slice(0, 2).forEach(alert => {
                const severityClass = alert.severity.toLowerCase() === 'high' || alert.severity.toLowerCase() === 'critical' ? 'severity-high' :
                                      alert.severity.toLowerCase() === 'medium' ? 'severity-medium' : 'severity-low';
                
                const html = `
                    <div class="alert-item">
                        <div class="alert-header">
                            <span class="alert-title">${alert.title}</span>
                            <span class="severity-badge ${severityClass}">${alert.severity}</span>
                        </div>
                        <div class="alert-meta">
                            <span>📍 ${alert.location}</span>
                            <span>Community verified</span>
                        </div>
                    </div>
                `;
                alertsContainer.insertAdjacentHTML('beforeend', html);
            });
        } catch (err) {
            console.error("Failed to load alerts:", err);
            alertsContainer.innerHTML = '<p style="color: var(--error); font-size: 0.9rem;">Failed to load alerts. Check connection.</p>';
        }
    }

    // 3. Contacts Logic
    function loadContacts() {
        const contactList = document.getElementById('contact-list');
        const contacts = JSON.parse(localStorage.getItem('bap-contacts') || '[]');
        
        contactList.innerHTML = '';
        if (contacts.length === 0) {
            contactList.innerHTML = '<li class="empty-state">No emergency contacts saved yet.</li>';
            return;
        }

        contacts.forEach(c => {
            const li = document.createElement('li');
            li.style.padding = '0.5rem 0';
            li.style.borderBottom = '1px solid var(--glass-border)';
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.innerHTML = `
                <div>
                    <div style="font-weight:600;">${c.name}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">${c.phone}</div>
                </div>
                <button class="btn-sm btn-ghost chat-btn" data-phone="${c.phone}">Chat</button>
            `;
            contactList.appendChild(li);
        });

        // Attach chat button listeners
        document.querySelectorAll('.chat-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const phone = e.target.dataset.phone;
                window.location.href = '/dashboard/private-chat?phone=' + phone;
            });
        });
    }

    const addContactBtn = document.querySelector('.contacts-card .card-header button');
    if (addContactBtn) {
        addContactBtn.addEventListener('click', () => {
            const name = prompt("Enter contact name:");
            if (!name) return;
            const phone = prompt("Enter 10-digit phone number:");
            if (!phone || phone.length !== 10) {
                alert("Invalid phone number.");
                return;
            }

            const contacts = JSON.parse(localStorage.getItem('bap-contacts') || '[]');
            contacts.push({ name, phone });
            localStorage.setItem('bap-contacts', JSON.stringify(contacts));
            loadContacts();
        });
    }

    // Load everything
    loadWeather();
    loadAlerts();
    loadContacts();
});
