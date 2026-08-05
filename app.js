let currentMode = "inspect";
let inspectMarker = null;
let bufferMarker = null, bufferCircle = null;
let comparePoints = [];
let compareMarkers = [];
let bufferChartInstance = null;

// Leaflet Map Initialization
const map = L.map('map', { zoomControl: false }).setView([30.195, 71.485], 12);
L.control.zoom({ position: 'bottomright' }).addTo(map);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19
}).addTo(map);

// Load Flask GeoJSON Endpoints
fetch('/api/flood-risk')
  .then(res => res.json())
  .then(data => {
    const floodColors = { low: "#5FA97C", moderate: "#D6A23C", high: "#C1573A" };
    L.geoJSON(data, {
      style: f => ({ color: floodColors[f.properties.risk_level], weight: 1, fillOpacity: 0.35 })
    }).addTo(map);
  });

fetch('/api/boundary')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { style: { color: "#7FC4EE", weight: 1.5, fillOpacity: 0, dashArray: "4 4" } }).addTo(map);
  });

// Mode Navigation Tabs
document.querySelectorAll('.mode-tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentMode = tab.dataset.mode;
    ['inspect', 'buffer', 'compare'].forEach(m => {
      document.getElementById('panel-' + m).style.display = (m === currentMode) ? 'block' : 'none';
    });
  };
});

// Interactive Map Clicks
map.on('click', e => {
  const { lat, lng } = e.latlng;
  if (currentMode === 'inspect') runInspect(lat, lng);
  else if (currentMode === 'buffer') runBuffer(lat, lng);
  else if (currentMode === 'compare') runCompare(lat, lng);
});

// Feature: Inspect Mode
function runInspect(lat, lng) {
  if (inspectMarker) map.removeLayer(inspectMarker);
  inspectMarker = L.circleMarker([lat, lng], { radius: 6, color: '#F0E6D2', fillColor: '#3D8FC4', fillOpacity: 1 }).addTo(map);

  fetch('/api/inspect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng })
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById('inspect-result').innerHTML = `
      <div class="report-card">
        <div class="label">Location</div>
        <div class="value" style="font-size: 15px;">${data.lat.toFixed(4)}°N, ${data.lng.toFixed(4)}°E</div>
      </div>
      <div class="report-card">
        <div class="label">Population Density</div>
        <div class="value">${data.density.toLocaleString()} / km²</div>
      </div>
      <div class="report-card">
        <div class="label">Flood Vulnerability</div>
        <div class="value"><span class="badge ${data.risk}">${data.risk.toUpperCase()}</span></div>
      </div>
      <div class="report-card">
        <div class="label">Exposure Index</div>
        <div class="value">${data.exposure_score} <span style="font-size:12px;color:var(--sand-dim);">/ 100</span></div>
        <div class="score-bar-bg"><div class="score-bar-fill" style="width:${data.exposure_score}%"></div></div>
      </div>
    `;
  });
}

// Feature: Buffer Analysis
function runBuffer(lat, lng) {
  const radius = parseFloat(document.getElementById('radiusSlider').value);
  if (bufferMarker) map.removeLayer(bufferMarker);
  if (bufferCircle) map.removeLayer(bufferCircle);

  bufferMarker = L.circleMarker([lat, lng], { radius: 5, color: '#F0E6D2', fillColor: '#3D8FC4', fillOpacity: 1 }).addTo(map);
  bufferCircle = L.circle([lat, lng], { radius: radius * 1000, color: '#7FC4EE', weight: 1.5, fillOpacity: 0.1 }).addTo(map);

  fetch('/api/buffer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng, radius })
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById('buffer-result').innerHTML = `
      <div class="report-card">
        <div class="label">Estimated Area Population</div>
        <div class="value">${data.population.toLocaleString()}</div>
        <div class="sub">Radius: ${data.radius_km} km (${data.area_sqkm} km²)</div>
      </div>
    `;

    document.getElementById('chart-card').style.display = 'block';
    renderChart(data.land_use);
  });
}

document.getElementById('radiusSlider').oninput = (e) => {
  document.getElementById('radiusLabel').textContent = e.target.value + ' km';
  if (bufferMarker) {
    const ll = bufferMarker.getLatLng();
    runBuffer(ll.lat, ll.lng);
  }
};

function renderChart(data) {
  const ctx = document.getElementById('bufferChart').getContext('2d');
  if (bufferChartInstance) bufferChartInstance.destroy();

  bufferChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Residential', 'Commercial', 'Agricultural', 'Industrial'],
      datasets: [{
        data: data,
        backgroundColor: ['#3D8FC4', '#E58A63', '#5FA97C', '#D6A23C'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'right', labels: { color: '#A8A08C', font: { size: 10 } } } }
    }
  });
}

// Feature: Compare Locations
function runCompare(lat, lng) {
  if (comparePoints.length >= 2) return;
  comparePoints.push({ lat, lng });

  const color = comparePoints.length === 1 ? '#3D8FC4' : '#C1573A';
  const marker = L.circleMarker([lat, lng], { radius: 6, color: '#F0E6D2', fillColor: color, fillOpacity: 1 }).addTo(map);
  compareMarkers.push(marker);

  if (comparePoints.length === 2) {
    document.getElementById('resetCompare').style.display = 'block';

    Promise.all([
      fetch('/api/inspect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(comparePoints[0]) }).then(r => r.json()),
      fetch('/api/inspect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(comparePoints[1]) }).then(r => r.json())
    ]).then(([pointA, pointB]) => {
      document.getElementById('compare-result').innerHTML = `
        <div class="report-card" style="border-left: 3px solid #3D8FC4;">
          <div class="label">Point A</div>
          <div class="sub">Density: ${pointA.density.toLocaleString()} / km²</div>
          <div class="sub">Risk: <span class="badge ${pointA.risk}">${pointA.risk}</span></div>
        </div>
        <div class="report-card" style="border-left: 3px solid #C1573A;">
          <div class="label">Point B</div>
          <div class="sub">Density: ${pointB.density.toLocaleString()} / km²</div>
          <div class="sub">Risk: <span class="badge ${pointB.risk}">${pointB.risk}</span></div>
        </div>
      `;
    });
  }
}

document.getElementById('resetCompare').onclick = () => {
  comparePoints = [];
  compareMarkers.forEach(m => map.removeLayer(m));
  compareMarkers = [];
  document.getElementById('compare-result').innerHTML = `<div class="report-card"><div class="sub">Select Point A and Point B on the map.</div></div>`;
  document.getElementById('resetCompare').style.display = 'none';
};