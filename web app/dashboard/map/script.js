document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Map centered on Bhubaneswar (matches Android app)
    const map = L.map('map').setView([10.2709, 85.8336], 13); // fallback coords

    // Attempt to pan to actual Bhubaneswar coords
    map.setView([20.2961, 85.8245], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // 2. Mock Data (Matches Android app's constants)
    const markers = [
        { id: 1, type: 'shelter', lat: 20.2800, lng: 85.8200, title: 'Unit 6 Community Centre', desc: 'Active Relief Camp' },
        { id: 2, type: 'shelter', lat: 20.2750, lng: 85.8150, title: 'Capital Hospital', desc: 'Medical Emergency Services' },
        { id: 3, type: 'safe', lat: 20.2900, lng: 85.8300, title: 'Community Verified Safe Zone', desc: 'Reported safe by 5 people' },
        { id: 4, type: 'danger', lat: 20.3000, lng: 85.8250, title: 'Flooded Road', desc: 'Avoid route. Waterlogging.' }
    ];

    const leafletMarkers = [];

    // Helper to create custom HTML markers
    function createIcon(type) {
        return L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="marker-pin ${type}"></div>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });
    }

    // Render markers
    function renderMarkers(filterType = 'all') {
        // Clear existing
        leafletMarkers.forEach(m => map.removeLayer(m));
        leafletMarkers.length = 0;

        markers.forEach(m => {
            if (filterType !== 'all' && m.type !== filterType && m.type !== 'shelter') return;

            const marker = L.marker([m.lat, m.lng], { icon: createIcon(m.type) })
                .bindPopup(`<b>${m.title}</b><br>${m.desc}`);
            
            marker.addTo(map);
            leafletMarkers.push(marker);
        });
    }

    renderMarkers();

    // 3. Filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderMarkers(e.target.dataset.filter);
        });
    });

    // 4. Locate Me
    document.getElementById('locate-btn').addEventListener('click', () => {
        if ("geolocation" in navigator) {
            map.locate({setView: true, maxZoom: 15});
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    });

    map.on('locationfound', (e) => {
        L.marker(e.latlng).addTo(map)
            .bindPopup("You are here").openPopup();
    });
});
