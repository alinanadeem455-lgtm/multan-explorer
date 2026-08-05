# multan-explorer
# Multan Spatial Explorer — Land Use & Flood Risk Platform

![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0.0-000000?style=for-the-badge&logo=flask&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-4.4.0-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

A lightweight web application for interactive spatial analysis, urban density tracking, and flood vulnerability assessment in **Multan, Pakistan**. Built with Flask and Leaflet, this tool enables real-time geographic queries, dynamic buffer analysis, and side-by-side location comparisons.

---

## Key Features

- 📍 **Point Inspection Mode**: Click anywhere inside the boundary to inspect real-time population density, localized flood vulnerability badges, and calculated exposure scores.
- ⭕ **Dynamic Buffer Analysis**: Interactively slide radius controls (0.5 km – 5.0 km) around any point to compute cumulative population estimates and view land-use composition charts (Chart.js).
- ⚖️ **Location Comparison Mode**: Select two points on the map to compare demographic and flood risk metrics side-by-side.
- 🗺️ **GIS Cartography**: Features high-contrast dark tile layers with custom GeoJSON overlays representing city boundaries and categorized risk zones.

---

## Project Structure

```text
multan-explorer/
├── app.py              # Flask server & REST API endpoints
├── requirements.txt    # Python package dependencies
├── templates/
│   └── index.html      # Main dashboard structure & layout
└── static/
    ├── css/
    │   └── style.css   # Dark-mode GIS dashboard styles
    └── js/
        └── app.js      # Map handlers, API integration & Chart.js logic
