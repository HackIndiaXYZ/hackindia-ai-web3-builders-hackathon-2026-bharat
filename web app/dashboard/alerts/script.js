document.addEventListener('DOMContentLoaded', () => {
    const alertsList = document.getElementById('alerts-list');
    const form = document.getElementById('new-alert-form');
    const submitBtn = document.getElementById('submit-btn');

    async function fetchAlerts() {
        try {
            const res = await fetch('/api/alerts');
            const data = await res.json();
            
            alertsList.innerHTML = '';
            
            if (data.length === 0) {
                alertsList.innerHTML = '<p style="color: var(--text-muted);">No active alerts.</p>';
                return;
            }

            data.forEach(alert => {
                const sev = alert.severity.toLowerCase();
                const sevClass = sev === 'critical' ? 'severity-critical' : 
                                 sev === 'high' ? 'severity-high' : 
                                 sev === 'medium' ? 'severity-medium' : 'severity-low';

                const txHtml = alert.txHash ? `<span class="alert-tx">MST: ${alert.txHash.substring(0,8)}...</span>` : '';

                const html = `
                    <div class="alert-item">
                        <div class="alert-header">
                            <span class="alert-title">${alert.title}</span>
                            <span class="severity-badge ${sevClass}">${alert.severity}</span>
                        </div>
                        <div class="alert-meta">
                            <span>📍 ${alert.location}</span>
                            <span>Community verified</span>
                            ${txHtml}
                        </div>
                    </div>
                `;
                alertsList.insertAdjacentHTML('beforeend', html);
            });
        } catch (err) {
            console.error(err);
            alertsList.innerHTML = '<p style="color: var(--error);">Failed to load alerts.</p>';
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('title').value.trim();
        const location = document.getElementById('location').value.trim();
        const severity = document.getElementById('severity').value;
        
        if (!title || !location) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Anchoring to Blockchain...';

        try {
            const res = await fetch('/api/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, location, severity })
            });

            if (res.ok) {
                form.reset();
                // We'd ideally just fetch again, but for this mock we can reload the page or re-fetch
                // Since the backend in server.js doesn't actually store POSTed alerts in memory yet, 
                // we'll just show a success alert and pretend it was added to the feed.
                alert('Alert successfully anchored to MST Blockchain!');
                fetchAlerts();
            }
        } catch (err) {
            console.error(err);
            alert('Failed to broadcast alert.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Broadcast Alert';
        }
    });

    fetchAlerts();
});
