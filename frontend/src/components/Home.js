import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'font-awesome/css/font-awesome.min.css';

// --- HELPER: Normalización de texto ---
const normalizeText = (text) => {
  return text
    ? text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
    : "";
};

const Home = () => {
  // Estados de UI
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [materialDropdownOpen, setMaterialDropdownOpen] = useState(false);

  // Estado de Usuario y Sesión
  const [username, setUsername] = useState('Usuario');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Nuevo estado para controlar la sesión

  // Estados de Datos
  const [puntosVerdes, setPuntosVerdes] = useState([]);
  const [filteredPuntos, setFilteredPuntos] = useState([]);
  const [selectedPunto, setSelectedPunto] = useState(null);

  // Estados de Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [barrioFilter, setBarrioFilter] = useState('');
  const [horarioFilter, setHorarioFilter] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState([]);

  const materialOptions = ['Orgánicos', 'Inorgánicos'];

  // Referencias
  const menuRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayer = useRef(null);

  const toggleProfileMenu = () => setIsProfileOpen(prev => !prev);
  const toggleMaterialDropdown = () => setMaterialDropdownOpen(!materialDropdownOpen);

  // 1. LEER USUARIO Y ESTADO DE SESIÓN
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedName = localStorage.getItem('username');

    // Lógica para determinar si está logueado
    if (token) {
      setIsLoggedIn(true);
      if (storedName) setUsername(storedName);
    } else {
      setIsLoggedIn(false);
      setUsername('Invitado'); // Cambiamos el nombre si no hay sesión
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalOverflow; };
  }, []);

  // 2. LOGICA DEL MAPA
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
            <div style="background: white; padding: 10px; border-radius: 5px; box-shadow: 0 0 15px rgba(0,0,0,0.2);">
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
        html: `<i class="fa fa-recycle" style="color: ${color}; font-size: 30px; text-shadow: 2px 2px 2px white;"></i>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
      });
    };

    const fetchPuntosVerdes = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/puntos-verdes/');
        if (!response.ok) throw new Error('Error en la red');
        const data = await response.json();

        const puntosProcesados = data.map(punto => {
          const mat = normalizeText(punto.materiales);
          const isOrganic = mat.includes('organico');
          const icon = createIcon(isOrganic);
          const marker = L.marker([punto.latitud, punto.longitud], { icon });

          const popupClass = isOrganic ? 'popup-content popup-organico' : 'popup-content popup-noorganico';
          const popupContent = `
                <div class="${popupClass}">
                    <strong class="popup-title">${punto.nombre}</strong><br>
                    <div style="margin-top: 5px; font-size: 12px;">
                        <b>Dirección:</b> ${punto.direccion}<br>
                        <b>Barrio:</b> ${punto.barrio}<br>
                        <b>Materiales:</b> ${punto.materiales}<br>
                        <b>Horario:</b> ${punto.dia_hora || 'No especificado'}
                    </div>
                </div>
            `;
          marker.bindPopup(popupContent);

          return { ...punto, marker, isOrganic };
        });

        setPuntosVerdes(puntosProcesados);
      } catch (error) {
        console.error('Error cargando puntos:', error);
      }
    };

    if (puntosVerdes.length === 0) {
      fetchPuntosVerdes();
    }

    return () => {
      // Limpieza opcional
    };
  }, []);

  // 3. LOGICA DE FILTRADO
  useEffect(() => {
    if (!markersLayer.current) return;

    markersLayer.current.clearLayers();

    let filtered = puntosVerdes;

    // A. Búsqueda General
    if (searchTerm) {
      const term = normalizeText(searchTerm);
      filtered = filtered.filter(p =>
        normalizeText(p.nombre).includes(term) ||
        normalizeText(p.direccion).includes(term)
      );
    }

    // B. Filtro por Barrio (TEXTO - Coincidencia parcial)
    if (barrioFilter) {
      const barrioF = normalizeText(barrioFilter);
      filtered = filtered.filter(p => normalizeText(p.barrio).includes(barrioF));
    }

    // C. Filtro por Horario
    if (horarioFilter) {
      const horarioF = normalizeText(horarioFilter);
      filtered = filtered.filter(p => normalizeText(p.dia_hora).includes(horarioF));
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
      if (punto.marker) {
        markersLayer.current.addLayer(punto.marker);
      }
    });

  }, [searchTerm, barrioFilter, horarioFilter, selectedMaterials, puntosVerdes, selectedPunto]);


  // --- HANDLERS ---
  const handleSelectPunto = (punto) => {
    setSelectedPunto(punto);
    setSearchTerm(punto.nombre);
    setFilteredPuntos([]);
    if (mapInstance.current) {
      mapInstance.current.setView([punto.latitud, punto.longitud], 16);
      punto.marker.openPopup();
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setBarrioFilter('');
    setHorarioFilter('');
    setSelectedMaterials([]);
    setSelectedPunto(null);

    if (mapInstance.current) {
      mapInstance.current.setView([-34.61, -58.38], 13);
      mapInstance.current.closePopup();
    }
  };

  const handleMaterialChange = (material) => {
    setSelectedMaterials(prev =>
      prev.includes(material) ? prev.filter(m => m !== material) : [...prev, material]
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login';
  };

  // Nueva función para ir al login si es invitado
  const handleLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div className="home-container">
      <header className="top-bar">
        <img src="/images/logoOzono.png" alt="Ozono" className="brand-image" />
        <div className="user-info" onClick={toggleProfileMenu}>
          <i className="fa fa-user"></i>
          <span className="user-name">{username}</span>
          {isProfileOpen && (
            <div className="profile-menu" ref={menuRef}>
              {isLoggedIn ? (
                <button onClick={handleLogout} style={{ color: '#d32f2f' }}>Cerrar sesión</button>
              ) : (
                <button onClick={handleLogin} style={{ color: '#006400' }}>Iniciar sesión</button>
              )}
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
          {/* BARRA DE HERRAMIENTAS */}
          <div className="search-bar" style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px',
            alignItems: 'center',
            padding: '10px',
            backgroundColor: 'none',
            borderRadius: '8px',
            marginBottom: '10px'
          }}>

            {/* 1. BUSCADOR PRINCIPAL */}
            <div style={{ flex: '2', minWidth: '250px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Buscar punto verde..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedPunto(null);
                }}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />

              {/* Dropdown de autocompletado */}
              {searchTerm && filteredPuntos.length > 0 && !selectedPunto && (
                <ul className="dropdown" style={{ width: '100%', position: 'absolute', top: '100%', left: 0, zIndex: 1000 }}>
                  {filteredPuntos.slice(0, 5).map(punto => (
                    <li key={punto.id} onClick={() => handleSelectPunto(punto)} style={{ backgroundColor: 'white', padding: '5px', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                      <strong>{punto.nombre}</strong><br />
                      <small>{punto.barrio}</small>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 2. FILTRO BARRIO */}
            <div style={{ flex: '1', minWidth: '150px' }}>
              <input
                type="text"
                placeholder="Escribe un barrio..."
                value={barrioFilter}
                onChange={(e) => setBarrioFilter(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>

            {/* 3. BOTÓN MATERIALES */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={toggleMaterialDropdown}
                style={{
                  padding: '8px 15px',
                  borderRadius: '4px',
                  backgroundColor: '#07753c4a',
                  border: '1px solid #ccc',
                  cursor: 'pointer',
                  minWidth: '120px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                Materiales <i className="fa fa-caret-down"></i>
              </button>

              {materialDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  zIndex: 1001,
                  backgroundColor: 'green',
                  border: '1px solid #07753c4a',
                  borderRadius: '4px',
                  padding: '10px',
                  width: '150px',
                  marginTop: '5px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                  {materialOptions.map((material) => (
                    <label key={material} style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedMaterials.includes(material)}
                        onChange={() => handleMaterialChange(material)}
                        style={{ marginRight: '8px' }}
                      /> {material}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 4. FILTRO HORARIO */}
            <div style={{ flex: '1', minWidth: '150px' }}>
              <input
                type="text"
                placeholder="Filtrar por horario"
                value={horarioFilter}
                onChange={(e) => setHorarioFilter(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>

            {/* 5. BOTÓN LIMPIAR */}
            <button
              onClick={clearFilters}
              title="Limpiar filtros"
              style={{
                backgroundColor: '#d32f2f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                width: '40px',
                height: '35px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
              <i className="fa fa-eraser"></i>
            </button>

          </div>

          {/* MAPA */}
          <div ref={mapRef} className="map" style={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: '8px' }}></div>
        </section>
      </div>
    </div>
  );
};

export default Home;