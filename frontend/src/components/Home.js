import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'font-awesome/css/font-awesome.min.css';

// --- HELPER: Normalización ---
const normalizeText = (text) => {
  return text
    ? text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
    : "";
};

// --- HELPER: Distancia ---
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
const deg2rad = (deg) => deg * (Math.PI / 180);

// --- HELPER: Hora Específica ---
const isOpenAtTime = (scheduleString, hourToCheck) => {
  if (!scheduleString) return false;
  const str = normalizeText(scheduleString);
  const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(?:a|al|-|h|hs)\s*(\d{1,2})/;
  const match = str.match(timeRegex);
  if (match) {
    const start = parseInt(match[1]);
    const end = parseInt(match[3]);
    return hourToCheck >= start && hourToCheck < end;
  }
  return false;
};

const Home = () => {
  // Estados de UI y Usuario
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [materialDropdownOpen, setMaterialDropdownOpen] = useState(false);
  const [username, setUsername] = useState('Usuario');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);

  // Estados de Datos
  const [puntosVerdes, setPuntosVerdes] = useState([]);
  const [filteredPuntos, setFilteredPuntos] = useState([]);
  const [selectedPunto, setSelectedPunto] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [favorites, setFavorites] = useState(new Set());

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [barrioFilter, setBarrioFilter] = useState('');
  const [horarioFilter, setHorarioFilter] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showBarrioDropdown, setShowBarrioDropdown] = useState(false);

  const [barriosDisponibles, setBarriosDisponibles] = useState([]);
  const materialOptions = ['Orgánicos', 'Inorgánicos'];

  // Refs
  const menuRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayer = useRef(null);

  const toggleFavoriteRef = useRef();

  const toggleProfileMenu = () => setIsProfileOpen(prev => !prev);
  const toggleMaterialDropdown = () => setMaterialDropdownOpen(!materialDropdownOpen);

  // --- API: Cargar Favoritos ---
  const fetchFavorites = async (authToken) => {
    try {
      const response = await fetch('http://localhost:8000/api/favorites/', {
        headers: { 'Authorization': `Token ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        const favIds = new Set(data.map(item => item.punto_verde));
        setFavorites(favIds);
      }
    } catch (error) {
      console.error("Error favoritos:", error);
    }
  };

  // --- API: Toggle Favorito (CORREGIDO: Redirección en lugar de Alert) ---
  const toggleFavorite = async (puntoId) => {
    // CORRECCIÓN AQUÍ: Si no está logueado, redirige a login inmediatamente
    if (!isLoggedIn) {
      window.location.href = '/login';
      return;
    }

    setFavorites(prev => {
      const newFavs = new Set(prev);
      if (newFavs.has(puntoId)) newFavs.delete(puntoId);
      else newFavs.add(puntoId);
      return newFavs;
    });

    try {
      const response = await fetch(`http://localhost:8000/api/favorites/toggle/${puntoId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error("Error server");
    } catch (error) {
      console.error(error);
      fetchFavorites(token);
    }
  };

  // Bridge para HTML global del mapa
  useEffect(() => {
    toggleFavoriteRef.current = toggleFavorite;
  }, [favorites, isLoggedIn, token]);

  useEffect(() => {
    window.handleFavoriteClick = (id) => {
      if (toggleFavoriteRef.current) {
        toggleFavoriteRef.current(id);
      }
    };
    return () => { delete window.handleFavoriteClick; };
  }, []);


  // 1. INICIO
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedName = localStorage.getItem('username');

    if (storedToken) {
      setIsLoggedIn(true);
      setToken(storedToken);
      if (storedName) setUsername(storedName);
      fetchFavorites(storedToken);
    } else {
      setIsLoggedIn(false);
      setUsername('Invitado');
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalOverflow; };
  }, []);

  // 2. MAPA
  useEffect(() => {
    if (!mapInstance.current && mapRef.current) {
      mapInstance.current = L.map(mapRef.current).setView([-34.61, -58.38], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapInstance.current);
      markersLayer.current = L.layerGroup().addTo(mapInstance.current);

      const legend = L.control({ position: 'bottomright' });
      legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'legend');
        div.innerHTML = `
            <div style="background: white; padding: 10px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
              <h4 style="margin: 0 0 5px; font-size: 14px;">Referencia</h4>
              <div style="margin-bottom: 3px;"><i class="fa fa-recycle" style="color: blue; font-size: 16px;"></i> Orgánicos</div>
              <div><i class="fa fa-recycle" style="color: green; font-size: 16px;"></i> Inorgánicos</div>
            </div>
          `;
        return div;
      };
      legend.addTo(mapInstance.current);
    }

    const fetchPuntos = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/puntos-verdes/');
        if (!response.ok) throw new Error('Error');
        const data = await response.json();

        const procesados = data.map(p => ({
          ...p,
          isOrganic: normalizeText(p.materiales).includes('organico')
        }));

        setPuntosVerdes(procesados);
        const barrios = [...new Set(data.map(p => p.barrio).filter(Boolean))].sort();
        setBarriosDisponibles(barrios);
      } catch (error) { console.error(error); }
    };

    if (puntosVerdes.length === 0) fetchPuntos();

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        if (mapInstance.current) {
          mapInstance.current.setView([lat, lng], 14);
          L.circleMarker([lat, lng], { radius: 8, fillColor: "#3388ff", color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.8 })
            .addTo(mapInstance.current).bindPopup("Estás aquí");
        }
      }, (err) => console.log(err));
    }
    return () => { };
  }, []);

  // 3. FILTRADO Y RENDERIZADO
  useEffect(() => {
    if (!markersLayer.current) return;
    markersLayer.current.clearLayers();

    let baseList = puntosVerdes;

    // Proximidad
    const isManualSearch = searchTerm || barrioFilter || horarioFilter || selectedMaterials.length > 0 || showFavoritesOnly;

    if (userLocation && !isManualSearch && !selectedPunto) {
      const conDistancia = puntosVerdes.map(p => ({
        ...p,
        distanciaKm: getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, p.latitud, p.longitud)
      }));
      let cercanos = conDistancia.filter(p => p.distanciaKm <= 1);
      if (cercanos.length === 0) cercanos = conDistancia.filter(p => p.distanciaKm <= 10);
      if (cercanos.length > 0) baseList = cercanos;
    }

    let filtered = baseList;

    // --- FILTRO FAVORITOS ---
    if (showFavoritesOnly) {
      if (!isLoggedIn) {
        // Si no está logueado, lista vacía (aunque el botón ya redirige, esto es protección extra)
        filtered = [];
      } else {
        filtered = filtered.filter(p => favorites.has(p.id));
      }
    }

    // Filtros normales
    if (searchTerm) {
      const term = normalizeText(searchTerm);
      filtered = filtered.filter(p => normalizeText(p.nombre).includes(term) || normalizeText(p.direccion).includes(term));
    }
    if (barrioFilter) {
      const barrioF = normalizeText(barrioFilter);
      filtered = filtered.filter(p => normalizeText(p.barrio).includes(barrioF));
    }
    if (horarioFilter) {
      const hour = parseInt(horarioFilter);
      if (!isNaN(hour)) filtered = filtered.filter(p => isOpenAtTime(p.dia_hora, hour));
      else {
        const hF = normalizeText(horarioFilter);
        filtered = filtered.filter(p => normalizeText(p.dia_hora).includes(hF));
      }
    }
    if (selectedMaterials.length > 0) {
      const org = selectedMaterials.includes('Orgánicos');
      const inorg = selectedMaterials.includes('Inorgánicos');
      filtered = filtered.filter(p => {
        if (org && inorg) return true;
        if (org) return p.isOrganic;
        if (inorg) return !p.isOrganic;
        return true;
      });
    }

    setFilteredPuntos(selectedPunto ? [] : filtered);

    // Renderizado
    const createIcon = (isOrganic) => {
      const color = isOrganic ? 'blue' : 'green';
      return L.divIcon({
        className: 'custom-icon',
        html: `<i class="fa fa-recycle" style="color: ${color}; font-size: 30px; text-shadow: 0 0 3px white;"></i>`,
        iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -30]
      });
    };

    filtered.forEach(punto => {
      const icon = createIcon(punto.isOrganic);
      const marker = L.marker([punto.latitud, punto.longitud], { icon });

      const isFav = favorites.has(punto.id);
      const favBtnHtml = `
            <button onclick="window.handleFavoriteClick('${punto.id}')" 
                    style="border:none; background:none; cursor:pointer; float:right; font-size:18px;">
                <i class="fa ${isFav ? 'fa-heart' : 'fa-heart-o'}" style="color: ${isFav ? 'red' : 'gray'};"></i>
            </button>
        `;

      const popupClass = punto.isOrganic ? 'popup-content popup-organico' : 'popup-content popup-noorganico';
      const popupContent = `
            <div class="${popupClass}">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #ccc; padding-bottom:5px; margin-bottom:5px;">
                    <strong class="popup-title" style="margin:0;">${punto.nombre}</strong>
                    ${favBtnHtml}
                </div>
                <div style="font-size: 13px; color: #444;">
                    <div><b>Dirección:</b> ${punto.direccion}</div>
                    <div><b>Barrio:</b> ${punto.barrio || 'N/A'}</div>
                    <div><b>Materiales:</b> ${punto.materiales}</div>
                    <div><i class="fa fa-clock-o"></i> <b>Horario:</b> ${punto.dia_hora || 'No especificado'}</div>
                </div>
            </div>
        `;

      marker.bindPopup(popupContent);
      punto.markerRef = marker;
      markersLayer.current.addLayer(marker);
    });

  }, [searchTerm, barrioFilter, horarioFilter, selectedMaterials, puntosVerdes, selectedPunto, userLocation, favorites, showFavoritesOnly]);


  // Handlers UI
  const handleSelectPunto = (punto) => {
    setSelectedPunto(punto); setSearchTerm(punto.nombre); setFilteredPuntos([]);
    if (mapInstance.current && punto.markerRef) {
      mapInstance.current.setView([punto.latitud, punto.longitud], 16);
      punto.markerRef.openPopup();
    }
  };

  const clearFilters = () => {
    setSearchTerm(''); setBarrioFilter(''); setHorarioFilter(''); setSelectedMaterials([]); setSelectedPunto(null);
    setShowFavoritesOnly(false);
    if (mapInstance.current) {
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

            <div style={{ flex: '2', minWidth: '200px', position: 'relative' }}>
              <input type="text" placeholder="Buscar punto verde..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setSelectedPunto(null); }} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              {searchTerm && filteredPuntos.length > 0 && !selectedPunto && (
                <ul className="dropdown" style={{ width: '100%', position: 'absolute', top: '100%', left: 0, zIndex: 1000 }}>
                  {filteredPuntos.slice(0, 5).map(punto => {
                    const isFav = favorites.has(punto.id);
                    return (
                      <li key={punto.id} onClick={() => handleSelectPunto(punto)} style={{ backgroundColor: 'white', padding: '5px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                        <div><strong>{punto.nombre}</strong><br /><small>{punto.barrio}</small></div>
                        {/* CORRECCIÓN AQUI: Botón en la lista redirige a login si no hay sesión */}
                        <button onClick={(e) => {
                          e.stopPropagation();
                          if (!isLoggedIn) { window.location.href = '/login'; return; }
                          toggleFavorite(punto.id);
                        }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                          <i className={`fa ${isFav ? 'fa-heart' : 'fa-heart-o'}`} style={{ color: isFav ? 'red' : '#ccc', fontSize: '18px' }}></i>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="barrio-wrapper">
              <input
                type="text"
                placeholder="Escribe un barrio..."
                value={barrioFilter}
                onChange={(e) => {
                  setBarrioFilter(e.target.value);
                  setSelectedPunto(null);
                  setShowBarrioDropdown(true);
                }}
                className="barrio-input"
              />

              {showBarrioDropdown && barrioFilter && (
                <ul className="barrio-dropdown">
                  {barriosDisponibles
                    .filter((b) =>
                      normalizeText(b).includes(normalizeText(barrioFilter))
                    )
                    .slice(0, 8)
                    .map((barrio) => (
                      <li
                        key={barrio}
                        onClick={() => {
                          setBarrioFilter(barrio);
                          setShowBarrioDropdown(false);
                        }}
                      >
                        {barrio}
                      </li>
                    ))}
                </ul>
              )}
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
              <input type="text" placeholder="Hora (ej: 15)" value={horarioFilter} onChange={(e) => setHorarioFilter(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>

            {/* BOTÓN DE SOLO FAVORITOS */}
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  window.location.href = '/login';
                  return;
                }
                setShowFavoritesOnly(!showFavoritesOnly);
              }}
              title="Mis Favoritos"
              style={{
                backgroundColor: showFavoritesOnly ? '#068637ff' : '#fff',
                color: showFavoritesOnly ? '#333' : '#666',
                border: '1px solid #ccc', borderRadius: '4px', width: '40px', height: '35px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: showFavoritesOnly ? 'inset 0 0 5px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              <i className={`fa ${showFavoritesOnly ? 'fa-heart' : 'fa-heart-o'}`} style={{ color: showFavoritesOnly ? 'red' : 'gray' }}></i>
            </button>

            <button onClick={clearFilters} title="Limpiar filtros" style={{ backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', width: '40px', height: '35px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa fa-eraser"></i>
            </button>
          </div>

          <div ref={mapRef} className="map" style={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: '8px' }}></div>
        </section>
      </div >
    </div >
  );
};

export default Home;