import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface City {
    latitude: number;
    longitude: number;
    name: string;
    ciboTipico: string;
  }  

class GestoreLoader{
    private _loader: HTMLElement
    private _map: HTMLElement
    private _cityInfo: HTMLElement

    constructor(loader: HTMLElement, map: HTMLElement, cityInfo:HTMLElement){
        this._loader = loader
        this._map = map
        this._cityInfo = cityInfo
    }

    get loader(): HTMLElement {
        return this._loader
    } 

    get map(): HTMLElement {
        return this._map
    }

    get cityInfo() : HTMLElement {
        return this._cityInfo
    }

    mostraLoader(): void {
        this.loader.style.display = 'block'
        this.map.style.display = 'none'
        this.cityInfo.style.display = 'none'
    }

    nascondiLoader(): void {
        this.loader.style.display = 'none'
        this.map.style.display = 'block'
        this.cityInfo.style.display = 'block'
    }
}

class CalcolatoreDistanza {
    calcolaDistanza(lat1: number, lon1: number, lat2: number, lon2: number) {
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
}

class GestoreMappa {
    private _lat: number
    private _lng: number
    private _map: L.Map | null = null
    private _cityMarker: L.Marker | null = null
  
    constructor(position: GeolocationPosition) {
      this._lat = position.coords.latitude;
      this._lng = position.coords.longitude;
    }
  
    get lat(): number {
      return this._lat;
    }
  
    get lng(): number {
      return this._lng;
    }
  
    get map(): L.Map | null {
      return this._map;
    }

    get cityMarker(): L.Marker | null {
        return this._cityMarker
    }
  
    public initMap(): void {
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
  
    public updatePosition(lat: number, lng: number): void {
      this._lat = lat;
      this._lng = lng;
      this._map?.setView([lat, lng]);
      this._map?.eachLayer(layer => {
        if (layer instanceof L.Marker) {
          layer.setLatLng([lat, lng]);
        }
      });
    }

    public addCityMarker(city: City): void {
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
            this._cityMarker?.openPopup()
          })
      }

    public fitMapBounds(userLatLng: [number, number], cityLatLng: [number, number]): void {
        if (!this._map) return;
    
        const bounds = new L.LatLngBounds(L.latLng(userLatLng[0], userLatLng[1]), L.latLng(cityLatLng[0], cityLatLng[1]));
        this._map.fitBounds(bounds, { padding: [100, 100], maxZoom: 12 });
    }
  }

class GestoreCitta {
    private _citta: City[] = [];
    private _cityInfoElement: HTMLElement;

    constructor(cityInfoElement: HTMLElement) {
        this._cityInfoElement = cityInfoElement;
    }

    public setCitta(citta: City[]): void {
        this._citta = citta;
    }

    public trovaCittaPiuVicina(lat: number, lng: number, calcolatore: CalcolatoreDistanza): City & { distance: string } | null {
        let nearestCity: City | null = null;
        let minDistance = Infinity;

        for (const city of this._citta) {
            const dist = calcolatore.calcolaDistanza(lat, lng, city.latitude, city.longitude);
            if (dist < minDistance) {
                minDistance = dist;
                nearestCity = city;
            }
        }

        if (nearestCity) {
            return { ...nearestCity, distance: minDistance.toFixed(2) + " km" };
        }
        return null;
    }

    public mostraInfoCitta(city: City & { distance: string }): void {
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
    private loader: GestoreLoader;
    private calcolatoreDistanza: CalcolatoreDistanza;
    private gestoreMappa: GestoreMappa | null = null;
    private gestoreCitta: GestoreCitta;

    constructor(loader: GestoreLoader, gestoreCitta: GestoreCitta) {
        this.loader = loader;
        this.calcolatoreDistanza = new CalcolatoreDistanza();
        this.gestoreCitta = gestoreCitta;
    }

    public init(): void {
        this.loader.mostraLoader();

        fetch('citta.json')
        .then(response => {
            if (!response.ok) throw new Error('Impossibile caricare citta.json');
                return response.json();
        })
        .then((data: City[]) => {
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

    private handlePosition(position: GeolocationPosition): void {
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

    private handleError(error: GeolocationPositionError): void {
        const errorMessages: Record<number, string> = {
            1: 'Permesso negato dall\'utente',
            2: 'Posizione non disponibile',
            3: 'Timeout della richiesta'
        };
        this.showError(errorMessages[error.code] || 'Errore sconosciuto');
        this.loader.nascondiLoader();
    }

    private showError(message: string): void {
        const mapElement = document.getElementById('map');
        if (mapElement) {
            mapElement.innerHTML = `<p>Errore: ${message}</p>`;
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const loaderElement = document.getElementById('loader')!;
    const mapElement = document.getElementById('lmap')!;
    const cityInfoElement = document.getElementById('city-info')!;
  
    const loader = new GestoreLoader(loaderElement, mapElement, cityInfoElement);
    const gestoreCitta = new GestoreCitta(cityInfoElement);
    const app = new GestoreApp(loader, gestoreCitta);
  
    app.init();
  });
  