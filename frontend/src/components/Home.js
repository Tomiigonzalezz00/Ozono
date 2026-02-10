import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'font-awesome/css/font-awesome.min.css';
import { useNotification } from '../context/NotificationContext';

// --- HELPERS ---
const normalizeText = (text) => {
  return text
    ? text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
    : "";
};

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

// Función de Geocodificación
const fetchAddressFromCoords = async (lat, lng) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    const data = await response.json();
    if (data && data.address) {
      return {
        calle: data.address.road || '',
        altura: data.address.house_number || '',
        barrio: data.address.neighbourhood || data.address.suburb || '',
        comuna: data.address.city_district || '',
        direccion_completa: data.display_name
      };
    }
  } catch (error) {
    console.error("Error geocoding:", error);
  }
  return null;
};

const Home = () => {
  // --- ESTADOS ---
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [materialDropdownOpen, setMaterialDropdownOpen] = useState(false);

  // Usuario
  const [username, setUsername] = useState('Usuario');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);

  // Datos
  const [puntosVerdes, setPuntosVerdes] = useState([]);
  const [filteredPuntos, setFilteredPuntos] = useState([]);
  const [selectedPunto, setSelectedPunto] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [favorites, setFavorites] = useState(new Set());

  // --- ESTADOS DE AGREGAR PUNTO ---
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPointData, setNewPointData] = useState({
    lat: 0,
    lng: 0,
    nombre: '',
    materiales: '',
    dia_hora: '',
    calle: '',
    barrio: '',
    comuna: '',
    tipos: { organico: false, inorganico: false }
  });

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

  // Refs para Bridges
  const toggleFavoriteRef = useRef();
  const handleVoteRef = useRef();
  const showNotificationRef = useRef(); // Bridge ref for notifications

  // Hook de notificaciones
  const { showNotification } = useNotification();

  const toggleProfileMenu = () => setIsProfileOpen(prev => !prev);

  // --- HANDLERS (Definidos aquí para evitar duplicados y errores) ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login';
  };

  const handleLogin = () => {
    window.location.href = '/login';
  };

  const toggleMaterialDropdown = () => setMaterialDropdownOpen(!materialDropdownOpen);

  const handleMaterialChange = (material) => {
    setSelectedMaterials(prev => prev.includes(material) ? prev.filter(m => m !== material) : [...prev, material]);
  };

  const handleSelectPunto = (punto) => {
    setSelectedPunto(punto); setSearchTerm(punto.nombre); setFilteredPuntos([]);
    if (mapInstance.current && punto.markerRef) {
      mapInstance.current.setView([punto.latitud, punto.longitud], 16);
      punto.markerRef.openPopup();
    }
  };

  const clearFilters = () => {
    setSearchTerm(''); setBarrioFilter(''); setHorarioFilter(''); setSelectedMaterials([]); setSelectedPunto(null); setShowFavoritesOnly(false);
    if (mapInstance.current) {
      if (userLocation) mapInstance.current.setView([userLocation.lat, userLocation.lng], 14);
      else mapInstance.current.setView([-34.61, -58.38], 13);
      mapInstance.current.closePopup();
    }
  };

  // --- EFECTOS ---

  // Body overflow y menú perfil
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const adjustMenuPosition = () => {
      if (menuRef.current) {
        const menuRect = menuRef.current.getBoundingClientRect();
        if (menuRect.right > window.innerWidth) {
          menuRef.current.style.left = 'auto';
          menuRef.current.style.right = '0';
        } else {
          menuRef.current.style.left = '0';
          menuRef.current.style.right = 'auto';
        }
      }
    };

    if (isProfileOpen) {
      adjustMenuPosition();
      window.addEventListener('resize', adjustMenuPosition);
    }
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('resize', adjustMenuPosition);
    };
  }, [isProfileOpen]);

  // --- API CALLS ---

  const fetchPuntosVerdes = async () => {
    const headers = token ? { 'Authorization': `Token ${token}` } : {};
    try {
      const response = await fetch('http://localhost:8000/api/puntos-verdes/', { headers });
      if (!response.ok) throw new Error('Error');
      const data = await response.json();

      const procesados = data.map(p => ({
        ...p,
        isOrganic: (p.tipo && normalizeText(p.tipo).includes('organico')) || normalizeText(p.materiales).includes('organico')
      }));

      setPuntosVerdes(procesados);
      const barrios = [...new Set(data.map(p => p.barrio).filter(Boolean))].sort();
      setBarriosDisponibles(barrios);
    } catch (error) { console.error("Error fetching puntos:", error); }
  };

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
    } catch (error) { console.error("Error favoritos:", error); }
  };

  const toggleFavorite = async (puntoId) => {
    if (!isLoggedIn) { window.location.href = '/login'; return; }

    setFavorites(prev => {
      const newFavs = new Set(prev);
      if (newFavs.has(puntoId)) newFavs.delete(puntoId);
      else newFavs.add(puntoId);
      return newFavs;
    });

    try {
      await fetch(`http://localhost:8000/api/favorites/toggle/${puntoId}/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' }
      });
    } catch (error) { fetchFavorites(token); }
  };

  // --- FUNCIÓN: Agregar Punto ---
  const submitNewPoint = async () => {
    if (!newPointData.nombre || !newPointData.materiales) {
      showNotification("Completa nombre y materiales", "error");
      return;
    }

    let tiposSeleccionados = [];
    if (newPointData.tipos.organico) tiposSeleccionados.push("Orgánico");
    if (newPointData.tipos.inorganico) tiposSeleccionados.push("Inorgánico");
    const tipoString = tiposSeleccionados.join(", ");

    try {
      const response = await fetch('http://localhost:8000/api/puntos-verdes/', {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newPointData.nombre,
          latitud: newPointData.lat,
          longitud: newPointData.lng,
          materiales: newPointData.materiales,
          dia_hora: newPointData.dia_hora,
          calle: newPointData.calle,
          barrio: newPointData.barrio,
          comuna: newPointData.comuna,
          tipo: tipoString,
          direccion: newPointData.calle ? `${newPointData.calle}, ${newPointData.barrio}` : "Ubicación en mapa"
        })
      });

      if (response.ok) {
        showNotification("Punto agregado. La comunidad deberá validarlo.", "success");
        setShowAddModal(false);
        setNewPointData({
          lat: 0, lng: 0, nombre: '', materiales: '', dia_hora: '',
          calle: '', barrio: '', comuna: '', tipos: { organico: false, inorganico: false }
        });
        fetchPuntosVerdes();
      } else {
        const errData = await response.json();
        showNotification("Error al crear el punto: " + JSON.stringify(errData), "error");
      }
    } catch (error) { console.error(error); }
  };

  // --- FUNCIÓN: Votar Punto ---
  const handleVote = async (puntoId, voteType) => {
    if (!isLoggedIn) {
      showNotification("Inicia sesión para votar", "error");
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/api/puntos-verdes/${puntoId}/vote/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_type: voteType })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'deleted') showNotification("Punto eliminado por la comunidad.", "info");
        fetchPuntosVerdes();
      }
    } catch (error) { console.error(error); }
  };

  // --- BRIDGES ---
  useEffect(() => {
    toggleFavoriteRef.current = toggleFavorite;
    handleVoteRef.current = handleVote;
    showNotificationRef.current = showNotification; // Update ref
  }, [favorites, isLoggedIn, token, showNotification]);

  useEffect(() => {
    window.handleFavoriteClick = (id) => { if (toggleFavoriteRef.current) toggleFavoriteRef.current(id); };
    window.handleVoteClick = (id, type) => { if (handleVoteRef.current) handleVoteRef.current(id, type); };

    // Bridge for Leaflet popups to call showNotification
    window.showGlobalNotification = (msg, type) => {
      if (showNotificationRef.current) showNotificationRef.current(msg, type);
    };

    return () => {
      delete window.handleFavoriteClick;
      delete window.handleVoteClick;
      delete window.showGlobalNotification;
    };
  }, []);

  // --- INICIALIZACIÓN ---
  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('username');
    if (t) {
      setIsLoggedIn(true); setToken(t); setUsername(u); fetchFavorites(t);
    } else {
      setIsLoggedIn(false); setUsername('Invitado');
    }
    fetchPuntosVerdes();
  }, []);

  useEffect(() => { if (token) fetchPuntosVerdes(); }, [token]);

  // --- MAPA ---
  useEffect(() => {
    if (!mapInstance.current && mapRef.current) {
      mapInstance.current = L.map(mapRef.current).setView([-34.61, -58.38], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(mapInstance.current);
      markersLayer.current = L.layerGroup().addTo(mapInstance.current);

      const legend = L.control({ position: 'bottomright' });
      legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'legend');
        div.innerHTML = `
            <div style="background: white; padding: 10px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
              <h4 style="margin: 0 0 5px; font-size: 14px;">Referencia</h4>
              <div style="margin-bottom: 3px;"><i class="fa fa-recycle" style="color: blue;"></i> Orgánicos</div>
              <div style="margin-bottom: 3px;"><i class="fa fa-recycle" style="color: green;"></i> Inorgánicos</div>
              <div><i class="fa fa-recycle" style="color: #ff9800; text-shadow:0 0 2px red;"></i> Usuario</div>
            </div>
          `;
        return div;
      };
      legend.addTo(mapInstance.current);
    }

    // EVENTO CLICK DEL MAPA
    const onMapClick = async (e) => {
      if (isAddingMode && isLoggedIn) {
        const { lat, lng } = e.latlng;

        setNewPointData(prev => ({
          ...prev,
          lat: lat,
          lng: lng,
          direccion: "Buscando dirección..."
        }));

        setShowAddModal(true);
        setIsAddingMode(false);

        const addressData = await fetchAddressFromCoords(lat, lng);

        if (addressData) {
          setNewPointData(prev => ({
            ...prev,
            lat: lat,
            lng: lng,
            calle: addressData.calle + (addressData.altura ? ` ${addressData.altura}` : ''),
            barrio: addressData.barrio,
            comuna: addressData.comuna,
            direccion: addressData.calle ? `${addressData.calle}, ${addressData.barrio}` : "Ubicación seleccionada"
          }));
        }
      }
    };

    if (mapInstance.current) {
      mapInstance.current.off('click');
      mapInstance.current.on('click', onMapClick);
      if (isAddingMode) L.DomUtil.addClass(mapInstance.current._container, 'map-adding-mode');
      else L.DomUtil.removeClass(mapInstance.current._container, 'map-adding-mode');
    }

    if ("geolocation" in navigator && !userLocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        if (mapInstance.current) {
          mapInstance.current.setView([lat, lng], 14);
          L.circleMarker([lat, lng], { radius: 8, fillColor: "#3388ff", color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.8 }).addTo(mapInstance.current).bindPopup("Estás aquí");
        }
      }, (err) => console.log(err));
    }
  }, [isAddingMode, isLoggedIn, userLocation]);

  // --- RENDERIZADO DE MARCADORES ---
  useEffect(() => {
    if (!markersLayer.current) return;
    markersLayer.current.clearLayers();

    let baseList = puntosVerdes;
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

    if (showFavoritesOnly) {
      if (!isLoggedIn) filtered = [];
      else filtered = filtered.filter(p => favorites.has(p.id));
    }
    if (searchTerm) {
      const term = normalizeText(searchTerm);
      filtered = filtered.filter(p => normalizeText(p.nombre).includes(term) || normalizeText(p.direccion).includes(term));
    }
    if (barrioFilter) {
      const bf = normalizeText(barrioFilter);
      filtered = filtered.filter(p => normalizeText(p.barrio).includes(bf));
    }
    if (horarioFilter) {
      const hour = parseInt(horarioFilter);
      if (!isNaN(hour)) filtered = filtered.filter(p => isOpenAtTime(p.dia_hora, hour));
      else filtered = filtered.filter(p => normalizeText(p.dia_hora).includes(normalizeText(horarioFilter)));
    }

    if (selectedMaterials.length > 0) {
      const buscaOrg = selectedMaterials.includes('Orgánicos');
      const buscaInorg = selectedMaterials.includes('Inorgánicos');

      filtered = filtered.filter(p => {
        if (!buscaOrg && !buscaInorg) return true;
        if (buscaOrg && buscaInorg) return true;
        if (buscaOrg) return p.isOrganic;
        if (buscaInorg) return !p.isOrganic;
        return true;
      });
    }

    setFilteredPuntos(selectedPunto ? [] : filtered);

    filtered.forEach(punto => {
      let color = 'green';
      let extraClass = '';
      if (punto.is_user_generated) { color = 'orange'; extraClass = 'custom-icon-user'; }
      else if (punto.isOrganic) { color = 'blue'; }

      const icon = L.divIcon({
        className: `custom-icon ${extraClass}`,
        html: `<i class="fa fa-recycle" style="color: ${color}; font-size: 30px; text-shadow: 2px 2px 2px white;"></i>`,
        iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -30]
      });

      const marker = L.marker([punto.latitud, punto.longitud], { icon });
      const isFav = favorites.has(punto.id);

      const favBtnHtml = `
            <button onclick="window.handleFavoriteClick('${punto.id}')" 
                    style="border:none; background:none; cursor:pointer; float:right; font-size:18px;">
                <i class="fa ${isFav ? 'fa-heart' : 'fa-heart-o'}" style="color: ${isFav ? 'red' : 'gray'};"></i>
            </button>
      `;

      let voteHtml = '';
      if (punto.is_user_generated) {
        // Obtenemos los contadores (si no existen, ponemos 0)
        const validCount = punto.valid_count || 0;
        const invalidCount = punto.invalid_count || 0;
        const userVote = punto.user_vote;

        // Si está logueado, calculamos si el botón debe estar "activo" (pintado)
        const activeValid = (isLoggedIn && userVote === 'valid') ? 'active' : '';
        const activeInvalid = (isLoggedIn && userVote === 'invalid') ? 'active' : '';

        // Definimos qué hace el click: Votar (si hay login) o Alerta (si no hay login)

        const onClickValid = isLoggedIn
          ? `window.handleVoteClick('${punto.id}', 'valid')`
          : "window.showGlobalNotification('Debes iniciar sesión para votar', 'error')";

        const onClickInvalid = isLoggedIn
          ? `window.handleVoteClick('${punto.id}', 'invalid')`
          : "window.showGlobalNotification('Debes iniciar sesión para votar', 'error')";

        voteHtml = `
            <div class="vote-section">
                <small>Validación Comunitaria:</small>
                <div class="vote-buttons">
                    <button class="btn-vote valid ${activeValid}" 
                            onclick="${onClickValid}"
                            title="${isLoggedIn ? 'Confirmar punto' : 'Inicia sesión para votar'}">
                        <i class="fa fa-check"></i> (${validCount})
                    </button>
                    <button class="btn-vote invalid ${activeInvalid}" 
                            onclick="${onClickInvalid}"
                            title="${isLoggedIn ? 'Reportar punto' : 'Inicia sesión para votar'}">
                        <i class="fa fa-times"></i> (${invalidCount})
                    </button>
                </div>
            </div>
          `;
      }

      let infoExtraHtml = '';
      if (punto.calle) infoExtraHtml += `<div><b>Calle:</b> ${punto.calle} ${punto.altura || ''}</div>`;
      if (punto.barrio) infoExtraHtml += `<div><b>Barrio:</b> ${punto.barrio}</div>`;
      if (punto.tipo) infoExtraHtml += `<div><b>Tipo:</b> ${punto.tipo}</div>`;
      if (punto.mas_info) infoExtraHtml += `<div style="margin-top:5px; font-style:italic; font-size:12px; color:#555;">${punto.mas_info}</div>`;

      const popupClass = punto.isOrganic ? 'popup-content popup-organico' : 'popup-content popup-noorganico';
      const popupContent = `
            <div class="${popupClass}">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #ccc; padding-bottom:5px; margin-bottom:5px;">
                    <div>
                        <strong class="popup-title" style="margin:0;">${punto.nombre}</strong>
                        ${punto.is_user_generated ? '<small style="color:#ff9800; font-weight:bold;"> (Usuario)</small>' : ''}
                    </div>
                    ${favBtnHtml}
                </div>
                <div style="font-size: 13px; color: #444;">
                    ${infoExtraHtml} 
                    <div><b>Materiales:</b> ${punto.materiales}</div>
                    <div><i class="fa fa-clock-o"></i> <b>Horario:</b> ${punto.dia_hora || 'No especificado'}</div>
                </div>
                ${voteHtml}
            </div>
      `;

      marker.bindPopup(popupContent);
      punto.markerRef = marker;
      markersLayer.current.addLayer(marker);
    });

  }, [searchTerm, barrioFilter, horarioFilter, selectedMaterials, puntosVerdes, selectedPunto, userLocation, favorites, showFavoritesOnly, isLoggedIn]);

  return (
    <div className="home-container">
      <header className="top-bar">
        <img src="/images/logoOzono.png" alt="Ozono" className="brand-image" />
        <div className="user-info" onClick={toggleProfileMenu} ref={menuRef}>
          <i className="fa fa-user"></i><span className="user-name">{username}</span>
        </div>
        {isProfileOpen && (
          <>
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2999 }} onClick={() => setIsProfileOpen(false)} />
            <div className="profile-menu" style={{ position: 'fixed', top: '68px', right: '20px' }}>
              <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid #f0f0f0', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px', flexShrink: 0 }}>
                  {username ? username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <span style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sesión activa</span>
                  <div style={{ fontWeight: '600', fontSize: '15px', color: '#222', marginTop: '2px' }}>{username}</div>
                </div>
              </div>
              {isLoggedIn
                ? <button onClick={handleLogout} style={{ color: '#d32f2f' }}><i className="fa fa-sign-out"></i> Cerrar sesión</button>
                : <button onClick={handleLogin} style={{ color: '#2e7d32' }}><i className="fa fa-sign-in"></i> Iniciar sesión</button>
              }
            </div>
          </>
        )}
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
          <div className="search-bar" style={{ display: 'flex', flexWrap: 'nowrap', gap: '10px', alignItems: 'stretch', padding: '0', borderRadius: '8px', marginBottom: '10px', width: '100%', boxSizing: 'border-box' }}>

            <div style={{ flex: '3', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input type="text" placeholder="Buscar punto verde..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setSelectedPunto(null); }} style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              {searchTerm && filteredPuntos.length > 0 && !selectedPunto && (
                <ul className="dropdown" style={{ width: '100%', position: 'absolute', top: '100%', left: 0, zIndex: 1000 }}>
                  {filteredPuntos.slice(0, 5).map(punto => {
                    const isFav = favorites.has(punto.id);
                    return (
                      <li key={punto.id} onClick={() => handleSelectPunto(punto)} style={{ backgroundColor: 'white', padding: '5px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                        <div><strong>{punto.nombre}</strong><br /><small>{punto.barrio}</small></div>
                        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(punto.id); }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                          <i className={`fa ${isFav ? 'fa-heart' : 'fa-heart-o'}`} style={{ color: isFav ? 'red' : '#ccc', fontSize: '18px' }}></i>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="barrio-wrapper" style={{ flex: '1.5' }}>
              <input type="text" placeholder="Barrio..." value={barrioFilter} onChange={(e) => { setBarrioFilter(e.target.value); setShowBarrioDropdown(true); }} className="barrio-input" style={{ height: '38px', padding: '0 10px', boxSizing: 'border-box' }} />
              {showBarrioDropdown && barrioFilter && (
                <ul className="barrio-dropdown">
                  {barriosDisponibles.filter(b => normalizeText(b).includes(normalizeText(barrioFilter))).slice(0, 8).map(barrio => (
                    <li key={barrio} onClick={() => { setBarrioFilter(barrio); setShowBarrioDropdown(false); }}>{barrio}</li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <button onClick={toggleMaterialDropdown} style={{ padding: '8px 15px', borderRadius: '4px', backgroundColor: '#07753c4a', border: '1px solid #ccc', cursor: 'pointer', minWidth: '120px', height: '38px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>Materiales <i className="fa fa-caret-down" style={{ marginLeft: '8px' }}></i></button>
              {materialDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1001, backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '6px 0', marginTop: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', whiteSpace: 'nowrap' }}>
                  {materialOptions.map((material, index) => (
                    <label key={material} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 14px', cursor: 'pointer', fontSize: '14px', color: '#333',
                      borderBottom: index < materialOptions.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}>
                      <input type="checkbox" checked={selectedMaterials.includes(material)} onChange={() => handleMaterialChange(material)}
                        style={{ width: '16px', height: '16px', accentColor: '#2e7d32', cursor: 'pointer', margin: 0 }} />
                      {material}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div style={{ flex: '1', display: 'flex', alignItems: 'center' }}>
              <input type="text" placeholder="Hora" value={horarioFilter} onChange={(e) => setHorarioFilter(e.target.value)} style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            </div>

            <button
              onClick={() => { if (!isLoggedIn) { window.location.href = '/login'; return; } setShowFavoritesOnly(!showFavoritesOnly); }}
              title="Mis Favoritos"
              style={{
                backgroundColor: showFavoritesOnly ? '#068637ff' : '#fff', color: showFavoritesOnly ? '#333' : '#666',
                border: '1px solid #ccc', borderRadius: '4px', width: '38px', height: '38px', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: showFavoritesOnly ? 'inset 0 0 5px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              <i className={`fa ${showFavoritesOnly ? 'fa-heart' : 'fa-heart-o'}`} style={{ color: showFavoritesOnly ? 'red' : 'gray' }}></i>
            </button>

            {/* BOTÓN AGREGAR PUNTO */}
            <button
              onClick={() => {
                if (!isLoggedIn) { window.location.href = '/login'; return; }
                setIsAddingMode(!isAddingMode);
              }}
              style={{
                backgroundColor: isAddingMode ? '#ff9800' : '#2e7d32',
                color: 'white', border: 'none', borderRadius: '4px', padding: '0 15px', height: '38px', flexShrink: 0, cursor: 'pointer', fontWeight: 'bold'
              }}
              title="Agregar nuevo punto"
            >
              {isAddingMode ? 'Cancelar' : '+'}
            </button>

            <button onClick={clearFilters} title="Limpiar filtros" style={{ backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', width: '38px', height: '38px', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa fa-eraser"></i>
            </button>
          </div>

          {isAddingMode && (
            <div style={{ position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '5px 15px', borderRadius: '20px' }}>
              <i className="fa fa-info-circle"></i> Toca en el mapa para ubicar el punto
            </div>
          )}

          <div ref={mapRef} className="map" style={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: '8px' }}></div>
        </section>
      </div>

      {/* MODAL AGREGAR PUNTO */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Nuevo Punto Verde</h3>

            {/* Nombre */}
            <input type="text" placeholder="Nombre del lugar (ej: Punto Plaza X)"
              value={newPointData.nombre}
              onChange={e => setNewPointData({ ...newPointData, nombre: e.target.value })} />

            {/* Materiales */}
            <input type="text" placeholder="Materiales (ej: Vidrio, Papel)"
              value={newPointData.materiales}
              onChange={e => setNewPointData({ ...newPointData, materiales: e.target.value })} />

            {/* Checkbox Tipo */}
            <div style={{ display: 'flex', gap: '15px', margin: '10px 0', fontSize: '14px' }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" style={{ marginRight: '5px' }}
                  checked={newPointData.tipos.organico}
                  onChange={e => setNewPointData({ ...newPointData, tipos: { ...newPointData.tipos, organico: e.target.checked } })} />
                Orgánico
              </label>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" style={{ marginRight: '5px' }}
                  checked={newPointData.tipos.inorganico}
                  onChange={e => setNewPointData({ ...newPointData, tipos: { ...newPointData.tipos, inorganico: e.target.checked } })} />
                Inorgánico
              </label>
            </div>

            {/* Nuevos Campos Dirección */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" placeholder="Calle" style={{ flex: 2 }}
                value={newPointData.calle}
                onChange={e => setNewPointData({ ...newPointData, calle: e.target.value })} />
              <input type="text" placeholder="Barrio" style={{ flex: 2 }}
                value={newPointData.barrio}
                onChange={e => setNewPointData({ ...newPointData, barrio: e.target.value })} />
            </div>
            <input type="text" placeholder="Comuna (Opcional)"
              value={newPointData.comuna}
              onChange={e => setNewPointData({ ...newPointData, comuna: e.target.value })} />

            {/* Horario */}
            <input type="text" placeholder="Horario (Opcional)"
              value={newPointData.dia_hora}
              onChange={e => setNewPointData({ ...newPointData, dia_hora: e.target.value })} />

            <div className="modal-buttons">
              <button className="modal-btn cancel" onClick={() => setShowAddModal(false)}>Cancelar</button>
              <button className="modal-btn save" onClick={submitNewPoint}>Agregar Punto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;