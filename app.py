import math
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Base Mock Data
BOUNDARY = {
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[71.40, 30.13], [71.56, 30.13], [71.56, 30.25], [71.40, 30.25], [71.40, 30.13]]]
        }
    }]
}

FLOOD_ZONES = {
    "type": "FeatureCollection",
    "features": [
        { "type": "Feature", "properties": { "risk_level": "high" }, "geometry": { "type": "Polygon", "coordinates": [[[71.40, 30.13], [71.48, 30.13], [71.45, 30.21], [71.40, 30.25], [71.40, 30.13]]] } },
        { "type": "Feature", "properties": { "risk_level": "moderate" }, "geometry": { "type": "Polygon", "coordinates": [[[71.48, 30.13], [71.52, 30.13], [71.50, 30.25], [71.45, 30.21], [71.48, 30.13]]] } },
        { "type": "Feature", "properties": { "risk_level": "low" }, "geometry": { "type": "Polygon", "coordinates": [[[71.52, 30.13], [71.56, 30.13], [71.56, 30.25], [71.50, 30.25], [71.52, 30.13]]] } }
    ]
}

def calculate_density(lat, lng):
    norm_lat = (lat - 30.13) / 0.12
    return math.floor(1500 + norm_lat * 8500)

def calculate_risk(lng):
    if lng < 71.46:
        return "high"
    elif lng < 71.51:
        return "moderate"
    return "low"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/boundary")
def get_boundary():
    return jsonify(BOUNDARY)

@app.route("/api/flood-risk")
def get_flood_risk():
    return jsonify(FLOOD_ZONES)

@app.route("/api/inspect", methods=["POST"])
def inspect_point():
    data = request.json or {}
    lat = data.get("lat", 30.195)
    lng = data.get("lng", 71.485)
    
    risk = calculate_risk(lng)
    density = calculate_density(lat, lng)
    risk_score = 90 if risk == "high" else 55 if risk == "moderate" else 15
    exposure_score = math.floor((density / 10000 * 40) + (risk_score * 0.6))
    
    return jsonify({
        "lat": lat,
        "lng": lng,
        "density": density,
        "risk": risk,
        "exposure_score": exposure_score
    })

@app.route("/api/buffer", methods=["POST"])
def buffer_query():
    data = request.json or {}
    lat = data.get("lat", 30.195)
    lng = data.get("lng", 71.485)
    radius = data.get("radius", 1.5)
    
    base_density = calculate_density(lat, lng)
    area = math.pi * (radius ** 2)
    estimated_pop = math.floor(base_density * area)
    
    return jsonify({
        "lat": lat,
        "lng": lng,
        "radius_km": radius,
        "area_sqkm": round(area, 2),
        "population": estimated_pop,
        "land_use": [45, 25, 20, 10]
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)