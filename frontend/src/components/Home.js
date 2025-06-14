import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'font-awesome/css/font-awesome.min.css';

const Home = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [materialDropdownOpen, setMaterialDropdownOpen] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const materialOptions = ['Vidrio', 'Cartón', 'Plástico', 'Orgánicos', 'Metal', 'Papel'];

  const menuRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [puntosVerdes, setPuntosVerdes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPuntos, setFilteredPuntos] = useState([]);
  const [selectedPunto, setSelectedPunto] = useState(null);

  const [barrioFilter, setBarrioFilter] = useState('');
  const [horarioFilter, setHorarioFilter] = useState('');

  const toggleProfileMenu = () => setIsProfileOpen(prev => !prev);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalOverflow; };
  }, []);

  useEffect(() => {
    const adjustMenuPosition = () => {
      if (menuRef.current) {
        const menuRect = menuRef.current.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        if (menuRect.right > windowWidth) {
          menuRef.current.style.left = 'auto';
          menuRef.current.style.right = '0';
        } else {
          menuRef.current.style.left = '0';
          menuRef.current.style.right = 'auto';
        }
      }
    };
    adjustMenuPosition();
    window.addEventListener('resize', adjustMenuPosition);
    return () => window.removeEventListener('resize', adjustMenuPosition);
  }, [isProfileOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  useEffect(() => {
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([-34.61, -58.38], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance.current);

      const createIcon = (isOrganic) => {
        const color = isOrganic ? 'blue' : 'green';
        return L.divIcon({
          className: 'custom-icon',
          html: `<i class="fa fa-recycle" style="color: ${color}; font-size: 30px;"></i>`,
          iconSize: [30, 30],
          iconAnchor: [15, 30],
          popupAnchor: [0, -30]
        });
      };

      const fetchPuntosVerdes = async () => {
        try {
          const response = await fetch('http://localhost:8000/api/puntos-verdes/');
          const data = await response.json();
          setPuntosVerdes(data);
          data.forEach(punto => {
            const isOrganic = punto.materiales.toLowerCase().includes('orgánicos');
            const icon = createIcon(isOrganic);
            const marker = L.marker([punto.latitud, punto.longitud], { icon })
              .addTo(mapInstance.current)
              .bindPopup(`
                <div class="popup-content">
                  <strong>${punto.nombre}</strong><br>
                  <strong>Dirección:</strong> ${punto.direccion}<br>
                  <strong>Materiales:</strong> ${punto.materiales}<br>
                  <strong>Horarios:</strong> ${punto.dia_hora || 'No especificado'}<br>
                  <strong>Más info:</strong> ${punto.mas_info}
                </div>
              `);
            punto.marker = marker; // Guardamos el marcador en el punto
          });
        } catch (error) {
          console.error('Error al cargar los puntos verdes:', error);
        }
      };
      fetchPuntosVerdes();

      const legend = L.control({ position: 'bottomright' });
      legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'legend');
        div.innerHTML = `
          <div style="padding: 8px; background-color: white; border-radius: 5px;">
            <h4>Referencia de colores</h4>
            <p><i class="fa fa-recycle" style="color: blue; font-size: 18px;"></i> Materiales Orgánicos</p>
            <p><i class="fa fa-recycle" style="color: green; font-size: 18px;"></i> Materiales No Orgánicos</p>
          </div>
        `;
        return div;
      };
      legend.addTo(mapInstance.current);
    }
  }, []);

  useEffect(() => {
    let filtered = puntosVerdes;

    if (searchTerm) {
      filtered = filtered.filter(punto =>
        punto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        punto.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        punto.barrio.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedMaterials.length > 0) {
      filtered = filtered.filter(p =>
        selectedMaterials.some(material =>
          p.materiales.toLowerCase().includes(material.toLowerCase())
        )
      );
    }

    if (barrioFilter) {
      filtered = filtered.filter(p => p.barrio.toLowerCase().includes(barrioFilter.toLowerCase()));
    }

    if (horarioFilter) {
      filtered = filtered.filter(p => (p.dia_hora || '').toLowerCase().includes(horarioFilter.toLowerCase()));
    }

    if (selectedPunto) {
      filtered = filtered.filter(p => p.id !== selectedPunto.id);
    }

    setFilteredPuntos(filtered);
    // Actualizamos la visibilidad de los marcadores en el mapa en función del filtrado
    puntosVerdes.forEach(punto => {
      if (selectedMaterials.length === 0 || selectedMaterials.some(material =>
        punto.materiales.toLowerCase().includes(material.toLowerCase())
      )) {
        punto.marker?.addTo(mapInstance.current);
      } else {
        punto.marker?.remove();
      }
    });

  }, [searchTerm, puntosVerdes, selectedPunto, selectedMaterials, barrioFilter, horarioFilter]);

  const handleSelectPunto = (punto) => {
    setSelectedPunto(punto);
    setSearchTerm(punto.nombre);
    setFilteredPuntos([]);
    mapInstance.current.setView([punto.latitud, punto.longitud], 16);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMaterials([]);
    setBarrioFilter('');
    setHorarioFilter('');
    setSelectedPunto(null);
    setFilteredPuntos([]);
    mapInstance.current.setView([-34.61, -58.38], 13);
  };

  const toggleMaterialDropdown = () => setMaterialDropdownOpen(!materialDropdownOpen);

  const handleMaterialChange = (material) => {
    setSelectedMaterials(prev =>
      prev.includes(material) ? prev.filter(m => m !== material) : [...prev, material]
    );
  };

  return (
    <div className="home-container">
      <header className="top-bar">
        <img src="/images/logoOzono.png" alt="Ozono" className="brand-image" />
        <div className="user-info" onClick={toggleProfileMenu}>
          <i className="fa fa-user"></i>
          <span className="user-name">Usuario</span>
          {isProfileOpen && (
            <div className="profile-menu" ref={menuRef}>
              <button onClick={handleLogout}>Cerrar sesión</button>
            </div>
          )}
        </div>
      </header>
      <div className="main-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link to="/home"><i className="fa fa-arrow-circle-up"></i></Link></li>
            <li><Link to="/consejosRRR"><i className="fa fa-lightbulb-o"></i></Link></li>
            <li><Link to="/Calendario"><i className="fa fa-calendar-alt"></i></Link></li>
          </ul>
        </aside>
        <section className="map-section">
          <div className="search-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', position: 'relative' }}>
            <input
              type="text"
              placeholder="Buscar lugar o dirección"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div style={{ position: 'relative' }}>
              <button onClick={toggleMaterialDropdown}>
                Filtrar por material <i className="fa fa-caret-down"></i>
              </button>
              {materialDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  zIndex: 1000,
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  padding: '10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                  {materialOptions.map((material) => (
                    <label key={material} style={{ display: 'block', marginBottom: '5px' }}>
                      <input
                        type="checkbox"
                        checked={selectedMaterials.includes(material)}
                        onChange={() => handleMaterialChange(material)}
                      /> {material}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <input
              type="text"
              placeholder="Filtrar por barrio"
              value={barrioFilter}
              onChange={(e) => setBarrioFilter(e.target.value)}
            />
            <input
              type="text"
              placeholder="Filtrar por horario"
              value={horarioFilter}
              onChange={(e) => setHorarioFilter(e.target.value)}
            />
            <button onClick={() => selectedPunto && mapInstance.current.setView([selectedPunto.latitud, selectedPunto.longitud], 16)}>
              <i className="fa fa-search"></i>
            </button>
            <button onClick={clearFilters} style={{ backgroundColor: '#ccc' }}>
              Limpiar filtros
            </button>

            {searchTerm && filteredPuntos.length > 0 && (
              <ul className="dropdown" style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1000,
                backgroundColor: 'white',
                border: '1px solid #ccc',
                maxHeight: '200px',
                overflowY: 'auto',
                width: '100%'
              }}>
                {filteredPuntos.map((punto) => (
                  <li
                    key={punto.id}
                    onClick={() => handleSelectPunto(punto)}
                    style={{ cursor: 'pointer', padding: '10px', borderBottom: '1px solid #eee' }}
                  >
                    <strong>{punto.nombre}</strong><br />
                    {punto.direccion}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
        </section>
      </div>
    </div>
  );
};

export default Home;



