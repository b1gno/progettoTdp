function mostraLoader() {
    document.getElementById('loader').style.display = 'block';
    document.getElementById('lmap').style.display = 'none';
    document.getElementById('city-info').style.display = 'none';
}

function nascondiLoader() {
    document.getElementById('loader').style.display = 'none';
    document.getElementById('lmap').style.display = 'block';
    document.getElementById('city-info').style.display = 'block';
}

let map;
let userMarker;
let cityMarker;
let citta = [];

// Funzione per calcolare distanza in km tra due punti lat/lng
function calcolaDistanza(lat1, lon1, lat2, lon2) {
    const R = 6371; // raggio terra in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Funzione per creare la mappa
function initMap(lat, lng) {
    var tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    });

    map = L.map('map',
    {
        zoomControl: true,
        layers: [tileLayer],
        maxZoom: 18,
        minZoom: 6
    }).setView([lat, lng], 12);

    // Marker posizione utente
    userMarker = L.marker([lat, lng]).addTo(map);
    userMarker.bindPopup("La tua posizione").openPopup();
}

function addCityMarker(city) {
    if (cityMarker) {
        map.removeLayer(cityMarker);
    }

    cityMarker = L.marker([city.latitude, city.longitude]).addTo(map);

    cityMarker.bindPopup(
        `<h3>${city.name}</h3>
        <p>Cibi tipici: ${city.ciboTipico}</p>`,
        { autoPan: false }
    );
}

function fitMapBounds(userLatLng, cityLatLng) {
    const bounds = new L.LatLngBounds();
    bounds.extend(L.latLng(userLatLng[0], userLatLng[1]));
    bounds.extend(L.latLng(cityLatLng[0], cityLatLng[1]));
    
    map.fitBounds(bounds, { 
        padding: [100, 100],
        maxZoom: 12 
    });
}


function displayCityInfo(city) {
    const infoDiv = document.getElementById('city-info');
    infoDiv.innerHTML = `
        <div class="city-card">
            <h3 class="city-title">Città più vicina: ${city.name}</h3>
            <p class="city-distance">Distanza: ${city.distance}</p>
            <p class="city-food">Cibi tipici: ${city.ciboTipico}</p>
            <p class="city-link">
                Vai alla città: <a href="https://www.google.com/maps/place/${city.name}" target="_blank">${city.name}</a>
            </p>
        </div>
    `;
}

function calculateNearestCity(position) {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;

    let nearestCity = null;
    let minDistance = Infinity;

    citta.forEach(cit => {
        const dist = calcolaDistanza(userLat, userLng, cit.latitude, cit.longitude);
        if (dist < minDistance) {
            minDistance = dist;
            nearestCity = {
                ...cit,
                distance: dist.toFixed(2) + " km"
            };
        }
    });

    displayCityInfo(nearestCity);
    addCityMarker(nearestCity);
    fitMapBounds([userLat, userLng], [nearestCity.latitude, nearestCity.longitude]);
}

function gestoreErrore(error) {
    const errorMessages = {
        1: 'Permesso negato dall\'utente',
        2: 'Posizione non disponibile',
        3: 'Timeout della richiesta'
    };
    document.getElementById('map').innerHTML =
        `<p>Errore: ${errorMessages[error.code] || 'Errore sconosciuto'}</p>`;
}

function init() {
    mostraLoader();

    fetch('citta.json')
        .then(response => {
            if (!response.ok) throw new Error('Impossibile caricare citta.json');
            return response.json();
        })
        .then(data => {
            citta = data;

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    initMap(
                        position.coords.latitude,
                        position.coords.longitude
                    );
                    calculateNearestCity(position);
                    nascondiLoader();
                }, error => {
                    gestoreErrore(error);
                    nascondiLoader();
                });
            } else {
                document.getElementById('map').innerHTML =
                    "<p>La geolocalizzazione non è supportata da questo browser</p>";
                nascondiLoader();
            }
        })
        .catch(error => {
            document.getElementById('map').innerHTML = `<p>${error.message}</p>`;
            nascondiLoader();
        });
}

document.addEventListener("DOMContentLoaded", init);