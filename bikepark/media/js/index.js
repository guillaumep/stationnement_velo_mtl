var osm_attrib = 'Map data &copy; <a href="http://openstreetmap.org/">OpenStreetMap</a> contributors',
    cycle_attrib = 'OpenCycleMap',
    mtl_attrib = 'Ville de Montréal, Stationnement Montréal';
var osmLayer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {opacity: 0.7,
                            attribution: [osm_attrib, mtl_attrib].join(', ')});
var openCycleMapLayer = L.tileLayer('http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png', {opacity: 0.7,
                            attribution: [osm_attrib, cycle_attrib, mtl_attrib].join(', ')});

var map = L.map('map', {
    center: new L.LatLng(45.51947, -73.56017),
    zoom: 15,
    layers: [openCycleMapLayer]
});

//OverPassAPI overlay
var opl = new L.OverPassLayer({
    query: "http://overpass-api.de/api/interpreter?data=[out:json];node(BBOX)[amenity=bicycle_parking];out;",
    callback: function(data) {
        for(i=0;i<data.elements.length;i++) {
            e = data.elements[i];

            if (e.id in this.instance._ids) return;
            this.instance._ids[e.id] = true;
            var pos = new L.LatLng(e.lat, e.lon);
            var popup = this.instance._poiInfo(e.tags,e.id);
            var icon = L.icon({
                iconUrl: '/media/images/icon_bike_blue.png',
                iconRetinaUrl: '/media/images/icon_bike_blue@2x.png',
                iconSize:     [20, 26], // size of the icon
                popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
            });
            marker = L.marker(pos, {icon: icon}).bindPopup(popup);

            this.instance.addLayer(marker);
        }
    },
});

map.addLayer(opl);

// Heatmap layer

var heatmapLayer = L.TileLayer.heatMap({
    radius: {value: 20},
    opacity: 0.8,
    gradient: {
    0.45: "rgb(0,0,255)",
    0.55: "rgb(0,255,255)",
    0.65: "rgb(0,255,0)",
    0.95: "yellow",
    1.0: "rgb(255,0,0)"
    }
});

$.getJSON("/requests", function(data) {
    if (data) {
        heatmapLayer.setData(data);
        heatmapLayer.redraw();
    }
});
//var data = [{lat: 45.764, lon:-73.8974, value: 1},{lat: 45.867, lon:-73.8576, value: 1}, {lat: 45.8437, lon:-73.976, value: 1}];




//GeoJSON layers

parco_point_to_layer = function (feature, latlng) {
    var icon = L.icon({
        iconUrl: '/media/images/icon_bike_parco.png',
        iconRetinaUrl: '/media/images/icon_bike_parco@2x.png',
        iconSize:     [20, 26], // size of the icon
        popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
   });
    return L.marker(latlng, {icon: icon});
}
sm_layer = L.geoJson(parcometres, {pointToLayer: parco_point_to_layer}).addTo(map);

support_point_to_layer = function (feature, latlng) {
    var icon = L.icon({
        iconUrl: '/media/images/icon_bike_green.png',
        iconRetinaUrl: '/media/images/icon_bike_green@2x.png',
        iconSize:     [20, 26], // size of the icon
        popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
    });
    return L.marker(latlng, {icon: icon});
}
vdm_layer = L.geoJson(support_velo_sigs, {pointToLayer: support_point_to_layer}).addTo(map);


var baseLayers = {
    "OpenCycleMap": openCycleMapLayer,
    "OpenStreetMap": osmLayer
};

var overlays = {
    "Données d'OpenStreetMap": opl,
    "Données de la Ville de Montréal": vdm_layer,
    "Données de Stationnement Montréal": sm_layer,
    "Demandes de stationnements": heatmapLayer
};

var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with
    // a class "info"
    this.update();
    return this._div;
};
// method that we will use to update the control based on feature
// properties passed
info.update = function (props) {
    this._div.innerHTML = '<h4>Stationnement pour vélos à Montréal</h4>'
        +'Cliquez sur la carte pour suggérer un nouvel espace de stationnement';
};

info.addTo(map);
L.control.layers(baseLayers, overlays).addTo(map);

L.control.locate({
    follow: true,
    stopFollowingOnDrag: true
}).addTo(map);

function submitValue(data, popup) {
    $.post("/submit", data, function(data) {
        popup.closePopup();
    });
}


map.on("click", function(e) {
    var lat = e.latlng.lat;
    var lng = e.latlng.lng;
    var popup = map.openPopup($("#form").html(), e.latlng);
    $("#submit-button").on("click", function(e) {
        var data = $(this).parent().serializeArray();
        data[2] = {name: "lat", value: lat.toString()};
        data[3] = {name: "lng", value: lng.toString()};
        submitValue(data, popup);
        $.getJSON("/requests", function(data) {
           heatmapLayer.setData(data);
           heatmapLayer.redraw();
        })

        return false;
    });
});
