import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'font-awesome/css/font-awesome.min.css';

// --- HELPER 1: Normalización de texto ---
const normalizeText = (text) => {
  return text
    ? text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
    : "";
};

// --- HELPER 2: Calcular distancia (Haversine) ---
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

const deg2rad = (deg) => deg * (Math.PI / 180);

// --- HELPER 3: Analizar si está abierto a una HORA específica ---
const isOpenAtTime = (scheduleString, hourToCheck) => {
    if (!scheduleString) return false;
    const str = normalizeText(scheduleString);
    
    // Busca rango horario (ej: "10 a 18", "09 - 17", "10hs a 19hs")
    const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(?:a|al|-|h|hs)\s*(\d{1,2})/;
    const match = str.match(timeRegex);
    
    if (match) {
        const start = parseInt(match[1]);
        const end = parseInt(match[3]);
        // Verificamos si la hora ingresada está en el rango (start <= hora < end)
        return hourToCheck >= start && hourToCheck < end;
    }
    return false;
};

const Home = () => {
  // Estados de UI
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [materialDropdownOpen, setMaterialDropdownOpen] = useState(false);

  // Estado de Usuario
  const [username, setUsername] = useState('Usuario');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Estados de Datos
  const [puntosVerdes, setPuntosVerdes] = useState([]);
  const [filteredPuntos, setFilteredPuntos] = useState([]); 
  const [selectedPunto, setSelectedPunto] = useState(null);
  const [userLocation, setUserLocation] = useState(null); 
  
  // Estados de Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [barrioFilter, setBarrioFilter] = useState('');
  const [horarioFilter, setHorarioFilter] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  
  const [barriosDisponibles, setBarriosDisponibles] = useState([]);
  const materialOptions = ['Orgánicos', 'Inorgánicos'];

  // Referencias
  const menuRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayer = useRef(null);

  const toggleProfileMenu = () => setIsProfileOpen(prev => !prev);
  const toggleMaterialDropdown = () => setMaterialDropdownOpen(!materialDropdownOpen);

  // 1. LEER USUARIO
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedName = localStorage.getItem('username');
    if (token) { setIsLoggedIn(true); if (storedName) setUsername(storedName); }
    else { setIsLoggedIn(false); setUsername('Invitado'); }
    
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalOverflow; };
  }, []);

  // 2. MAPA E INICIALIZACIÓN
  useEffect(() => {
    if (!mapInstance.current && mapRef.current) {
      mapInstance.current = L.map(mapRef.current).setView([-34.61, -58.38], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance.current);
      markersLayer.current = L.layerGroup().addTo(mapInstance.current);
      
      const legend = L.control({ position: 'bottomright' });
      legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'legend');
        div.innerHTML = `
            <div style="background: white; padding: 10px; border-radius: 5px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
              <h4 style="margin: 0 0 5px; font-size: 14px;">Referencia</h4>
              <div style="margin-bottom: 3px;"><i class="fa fa-recycle" style="color: blue; font-size: 16px;"></i> Orgánicos</div>
              <div><i class="fa fa-recycle" style="color: green; font-size: 16px;"></i> Inorgánicos</div>
            </div>
          `;
        return div;
      };
      legend.addTo(mapInstance.current);
    }

    const createIcon = (isOrganic) => {
        const color = isOrganic ? 'blue' : 'green';
        return L.divIcon({
          className: 'custom-icon',
          html: `<i class="fa fa-recycle" style="color: ${color}; font-size: 32px; text-shadow: 0 2px 5px rgba(0,0,0,0.3); filter: drop-shadow(0px 0px 2px white);"></i>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        });
    };

    const fetchPuntosVerdes = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/puntos-verdes/');
        if (!response.ok) throw new Error('Error');
        const data = await response.json();
        
        const puntosProcesados = data.map(punto => {
            const mat = normalizeText(punto.materiales);
            const isOrganic = mat.includes('organico');
            const icon = createIcon(isOrganic);
            const marker = L.marker([punto.latitud, punto.longitud], { icon });
            const popupContent = `
                <div class="${isOrganic ? 'popup-content popup-organico' : 'popup-content popup-noorganico'}">
                    <strong class="popup-title">${punto.nombre}</strong><br>
                    <div style="margin-top: 5px; font-size: 13px; color: #444;">
                        <div><b>Dirección:</b> ${punto.direccion}</div>
                        <div><b>Barrio:</b> ${punto.barrio || 'N/A'}</div>
                        <div><b>Materiales:</b> ${punto.materiales}</div>
                        <div><i class="fa fa-clock-o"></i> <b>Horario:</b> ${punto.dia_hora || 'No especificado'}</div>
                    </div>
                </div>
            `;
            marker.bindPopup(popupContent);
            return { ...punto, marker, isOrganic };
        });

        setPuntosVerdes(puntosProcesados);
        const barrios = [...new Set(data.map(p => p.barrio).filter(Boolean))].sort();
        setBarriosDisponibles(barrios);
      } catch (error) { console.error(error); }
    };

    if (puntosVerdes.length === 0) fetchPuntosVerdes();

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setUserLocation({ lat, lng });
            if(mapInstance.current) {
                mapInstance.current.setView([lat, lng], 14);
                L.circleMarker([lat, lng], { radius: 8, fillColor: "#3388ff", color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.8 })
                 .addTo(mapInstance.current).bindPopup("Estás aquí");
            }
        }, (err) => console.log(err));
    }
    return () => {};
  }, []);

  // 3. LOGICA DE FILTRADO
  useEffect(() => {
    if (!markersLayer.current) return;
    markersLayer.current.clearLayers();

    let baseList = puntosVerdes;

    // Proximidad (solo si no hay filtros manuales)
    const isManualSearch = searchTerm || barrioFilter || horarioFilter || selectedMaterials.length > 0;

    if (userLocation && !isManualSearch && !selectedPunto) {
        const puntosConDistancia = puntosVerdes.map(p => ({
            ...p,
            distanciaKm: getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, p.latitud, p.longitud)
        }));
        let cercanos = puntosConDistancia.filter(p => p.distanciaKm <= 1);
        if (cercanos.length === 0) cercanos = puntosConDistancia.filter(p => p.distanciaKm <= 10);
        if (cercanos.length > 0) baseList = cercanos;
    }

    let filtered = baseList;

    // A. Búsqueda
    if (searchTerm) {
      const term = normalizeText(searchTerm);
      filtered = filtered.filter(p => 
        normalizeText(p.nombre).includes(term) || 
        normalizeText(p.direccion).includes(term)
      );
    }

    // B. Barrio
    if (barrioFilter) {
        const barrioF = normalizeText(barrioFilter);
        filtered = filtered.filter(p => normalizeText(p.barrio).includes(barrioF));
    }

    // C. Horario (INTELIGENTE)
    if (horarioFilter) {
        const hour = parseInt(horarioFilter);
        
        if (!isNaN(hour)) {
            // Si es número, usa la lógica de rango
            filtered = filtered.filter(p => isOpenAtTime(p.dia_hora, hour));
        } else {
            // Si es texto, búsqueda normal
            const horarioF = normalizeText(horarioFilter);
            filtered = filtered.filter(p => normalizeText(p.dia_hora).includes(horarioF));
        }
    }

    // D. Materiales
    if (selectedMaterials.length > 0) {
        const buscaOrganico = selectedMaterials.includes('Orgánicos');
        const buscaInorganico = selectedMaterials.includes('Inorgánicos');
        filtered = filtered.filter(punto => {
            if (buscaOrganico && buscaInorganico) return true;
            if (buscaOrganico) return punto.isOrganic;
            if (buscaInorganico) return !punto.isOrganic;
            return true;
        });
    }

    setFilteredPuntos(selectedPunto ? [] : filtered);

    filtered.forEach(punto => {
        if (punto.marker) markersLayer.current.addLayer(punto.marker);
    });

  }, [searchTerm, barrioFilter, horarioFilter, selectedMaterials, puntosVerdes, selectedPunto, userLocation]);


  // Handlers
  const handleSelectPunto = (punto) => {
    setSelectedPunto(punto); setSearchTerm(punto.nombre); setFilteredPuntos([]);
    if (mapInstance.current) { mapInstance.current.setView([punto.latitud, punto.longitud], 16); punto.marker.openPopup(); }
  };

  const clearFilters = () => {
    setSearchTerm(''); setBarrioFilter(''); setHorarioFilter(''); setSelectedMaterials([]); setSelectedPunto(null);
    if(mapInstance.current) {
        if (userLocation) mapInstance.current.setView([userLocation.lat, userLocation.lng], 14);
        else mapInstance.current.setView([-34.61, -58.38], 13);
        mapInstance.current.closePopup();
    }
  };

  const handleMaterialChange = (material) => {
    setSelectedMaterials(prev => prev.includes(material) ? prev.filter(m => m !== material) : [...prev, material]);
  };
  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('username'); window.location.href = '/login'; };
  const handleLogin = () => { window.location.href = '/login'; };

  return (
    <div className="home-container">
      <header className="top-bar">
        <img src="/images/logoOzono.png" alt="Ozono" className="brand-image" />
        <div className="user-info" onClick={toggleProfileMenu}>
          <i className="fa fa-user"></i><span className="user-name">{username}</span>
          {isProfileOpen && (
            <div className="profile-menu" ref={menuRef}>
              {isLoggedIn ? <button onClick={handleLogout} style={{ color: '#d32f2f' }}>Cerrar sesión</button> : <button onClick={handleLogin} style={{ color: '#006400' }}>Iniciar sesión</button>}
            </div>
          )}
        </div>
      </header>
      <div className="main-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link to="/home" title="Mapa"><i className="fa fa-arrow-circle-up"></i></Link></li>
            <li><Link to="/chatbot_ozono" title="Asistente"><i className="fa fa-lightbulb-o"></i></Link></li>
            <li><Link to="/Calendario" title="Calendario"><i className="fa fa-calendar-alt"></i></Link></li>
          </ul>
        </aside>
        <section className="map-section">
          <div className="search-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', padding: '10px', backgroundColor: 'none', borderRadius: '8px', marginBottom: '10px' }}>

            <div style={{ flex: '2', minWidth: '250px', position: 'relative' }}>
              <input type="text" placeholder="Buscar punto verde..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setSelectedPunto(null); }} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              {searchTerm && filteredPuntos.length > 0 && !selectedPunto && (
                <ul className="dropdown" style={{ width: '100%', position: 'absolute', top: '100%', left: 0, zIndex: 1000 }}>
                  {filteredPuntos.slice(0, 5).map(punto => (
                    <li key={punto.id} onClick={() => handleSelectPunto(punto)} style={{ backgroundColor: 'white', padding: '5px', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                      <strong>{punto.nombre}</strong><br /><small>{punto.barrio}</small>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ flex: '1', minWidth: '150px' }}>
              <input type="text" placeholder="Escribe un barrio..." value={barrioFilter} onChange={(e) => setBarrioFilter(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>

            <div style={{ position: 'relative' }}>
              <button onClick={toggleMaterialDropdown} style={{ padding: '8px 15px', borderRadius: '4px', backgroundColor: '#07753c4a', border: '1px solid #ccc', cursor: 'pointer', minWidth: '120px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>Materiales <i className="fa fa-caret-down"></i></button>
              {materialDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1001, backgroundColor: 'green', border: '1px solid #07753c4a', borderRadius: '4px', padding: '10px', width: '150px', marginTop: '5px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                  {materialOptions.map((material) => (
                    <label key={material} style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}><input type="checkbox" checked={selectedMaterials.includes(material)} onChange={() => handleMaterialChange(material)} style={{ marginRight: '8px' }} /> {material}</label>
                  ))}
                </div>
              )}
            </div>

            <div style={{ flex: '1', minWidth: '150px' }}>
              <input type="text" placeholder="Filtrar por horario (ej: 15)" value={horarioFilter} onChange={(e) => setHorarioFilter(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>

            <button onClick={clearFilters} title="Limpiar filtros" style={{ backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', width: '40px', height: '35px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa fa-eraser"></i>
            </button>
          </div>

          <div ref={mapRef} className="map" style={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: '8px' }}></div>
        </section>
      </div>
    </div>
  );
};

export default Home;