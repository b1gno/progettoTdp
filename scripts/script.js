class GestoreLoader {
    constructor(loader, map, cityInfo) {
        this._loader = loader
        this._map = map
        this._cityInfo = cityInfo
    }

    get loader() {
        return this._loader
    }

    get map() {
        return this._map
    }

    get cityInfo() {
        return this._cityInfo
    }

    mostraLoader() {
        this.loader.style.display = 'block'
        this.map.style.display = 'none'
        this.cityInfo.style.display = 'none'
    }

    nascondiLoader() {
        this.loader.style.display = 'none'
        this.map.style.display = 'block'
        this.cityInfo.style.display = 'block'
    }
}

class CalcolatoreDistanza {
    calcolaDistanza(lat1, lon1, lat2, lon2) {
        const R = 6371; // raggio terra in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}

class GestoreMappa {
    constructor(position) {
        this._lat = position.coords.latitude;
        this._lng = position.coords.longitude;
        this._map = null;
        this._cityMarker = null;
    }

    get lat() {
        return this._lat;
    }

    get lng() {
        return this._lng;
    }

    get map() {
        return this._map;
    }

    get cityMarker() {
        return this._cityMarker;
    }

    initMap() {
        if (this._map) return;

        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        });

        this._map = L.map('map', {
            zoomControl: true,
            layers: [tileLayer],
            maxZoom: 18,
            minZoom: 6
        }).setView([this._lat, this._lng], 12);

        L.marker([this._lat, this._lng])
            .bindPopup("La tua posizione")
            .addTo(this._map);
    }

    updatePosition(lat, lng) {
        this._lat = lat;
        this._lng = lng;
        if (this._map) {
            this._map.setView([lat, lng]);
            this._map.eachLayer(layer => {
                if (layer instanceof L.Marker) {
                    layer.setLatLng([lat, lng]);
                }
            });
        }
    }

    addCityMarker(city) {
        if (!this._map) {
            console.error('Mappa non inizializzata');
            return;
        }

        this._cityMarker = L.marker([city.latitude, city.longitude])
            .bindPopup(
                `<h3>${city.name}</h3>
                <p>Cibi tipici: ${city.ciboTipico}</p>`,
                { autoPan: false }
            )
            .addTo(this._map);

        this._cityMarker.on('mouseover', () => {
            if (this._cityMarker) this._cityMarker.openPopup()
        })
    }

    fitMapBounds(userLatLng, cityLatLng) {
        if (!this._map) return;

        const bounds = new L.LatLngBounds(L.latLng(userLatLng[0], userLatLng[1]), L.latLng(cityLatLng[0], cityLatLng[1]));
        this._map.fitBounds(bounds, { padding: [100, 100], maxZoom: 12 });
    }
}

class GestoreCitta {
    constructor(cityInfoElement) {
        this._citta = [];
        this._cityInfoElement = cityInfoElement;
    }

    setCitta(citta) {
        this._citta = citta;
    }

    trovaCittaPiuVicina(lat, lng, calcolatore) {
        let nearestCity = null;
        let minDistance = Infinity;

        for (const city of this._citta) {
            const dist = calcolatore.calcolaDistanza(lat, lng, city.latitude, city.longitude);
            if (dist < minDistance) {
                minDistance = dist;
                nearestCity = city;
            }
        }

        if (nearestCity) {
            return Object.assign({}, nearestCity, { distance: minDistance.toFixed(2) + " km" });
        }
        return null;
    }

    mostraInfoCitta(city) {
        this._cityInfoElement.innerHTML = `
        <div class="city-card">
            <h3 class="city-title">Città più vicina: ${city.name}</h3>
            <p class="city-distance">Distanza: ${city.distance}</p>
            <p class="city-food">Cibi tipici: ${city.ciboTipico}</p>
            <p class="city-link">
            Vai alla città: <a href="https://www.google.com/maps/place/${encodeURIComponent(city.name)}" target="_blank">${city.name}</a>
            </p>
        </div>
        `;
    }
}

class GestoreApp {
    constructor(loader, gestoreCitta) {
        this.loader = loader;
        this.calcolatoreDistanza = new CalcolatoreDistanza();
        this.gestoreCitta = gestoreCitta;
        this.gestoreMappa = null;
    }

    init() {
        this.loader.mostraLoader();

        fetch('../citta.json')
            .then(response => {
                if (!response.ok) throw new Error('Impossibile caricare citta.json');
                return response.json();
            })
            .then(data => {
                this.gestoreCitta.setCitta(data);

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        position => this.handlePosition(position),
                        error => this.handleError(error)
                    );
                } else {
                    this.showError("La geolocalizzazione non è supportata da questo browser");
                    this.loader.nascondiLoader();
                }
            })
            .catch(error => {
                this.showError(error.message);
                this.loader.nascondiLoader();
            });
    }

    handlePosition(position) {
        this.gestoreMappa = new GestoreMappa(position);
        this.gestoreMappa.initMap();

        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        const nearestCity = this.gestoreCitta.trovaCittaPiuVicina(userLat, userLng, this.calcolatoreDistanza);
        if (nearestCity && this.gestoreMappa) {
            this.gestoreCitta.mostraInfoCitta(nearestCity);
            this.gestoreMappa.addCityMarker(nearestCity);
            this.gestoreMappa.fitMapBounds([userLat, userLng], [nearestCity.latitude, nearestCity.longitude]);
        }

        this.loader.nascondiLoader();
    }

    handleError(error) {
        const errorMessages = {
            1: 'Permesso negato dall\'utente',
            2: 'Posizione non disponibile',
            3: 'Timeout della richiesta'
        };
        this.showError(errorMessages[error.code] || 'Errore sconosciuto');
        this.loader.nascondiLoader();
    }

    showError(message) {
        const mapElement = document.getElementById('map');
        if (mapElement) {
            mapElement.innerHTML = `<p>Errore: ${message}</p>`;
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const loaderElement = document.getElementById('loader');
    const mapElement = document.getElementById('lmap');
    const cityInfoElement = document.getElementById('city-info');

    const loader = new GestoreLoader(loaderElement, mapElement, cityInfoElement);
    const gestoreCitta = new GestoreCitta(cityInfoElement);
    const app = new GestoreApp(loader, gestoreCitta);

    app.init();
});
