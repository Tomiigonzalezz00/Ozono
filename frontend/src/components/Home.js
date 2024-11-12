import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'font-awesome/css/font-awesome.min.css';

const Home = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const menuRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [puntosVerdes, setPuntosVerdes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPuntos, setFilteredPuntos] = useState([]);
  const [selectedPunto, setSelectedPunto] = useState(null);

  const toggleProfileMenu = () => {
    setIsProfileOpen(prevState => !prevState);
  };

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
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
            const isOrganic = punto.materiales.toLowerCase().includes('organico');
            const icon = createIcon(isOrganic);

            L.marker([punto.latitud, punto.longitud], { icon })
              .addTo(mapInstance.current)
              .bindPopup(`
                <strong>${punto.nombre}</strong><br>
                Dirección: ${punto.direccion}<br>
                Materiales: ${punto.materiales}<br>
                Más info: ${punto.mas_info}
              `);
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
            <h4>Rerefencia de colores</h4>
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
    if (searchTerm) {
      const filtered = puntosVerdes.filter(punto =>
        punto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        punto.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        punto.barrio.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (selectedPunto) {
        setFilteredPuntos(filtered.filter(punto => punto.id !== selectedPunto.id));
      } else {
        setFilteredPuntos(filtered);
      }
    } else {
      setFilteredPuntos([]);
    }
  }, [searchTerm, puntosVerdes, selectedPunto]);

  const handleSelectPunto = (punto) => {
    setSelectedPunto(punto);
    setSearchTerm(punto.nombre);
    setFilteredPuntos([]);
    mapInstance.current.setView([punto.latitud, punto.longitud], 16);
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
            <li>
              <Link to="/home" style={{ color: 'inherit' }}>
                <i className="fa fa-arrow-circle-up"></i>
              </Link>
            </li>
            <li>
              <Link to="/consejosRRR" style={{ color: 'inherit' }}>
                <i className="fa fa-lightbulb-o"></i>
              </Link>
            </li>
            <li>
              <Link to="/consejos2" style={{ color: 'inherit' }}>
                <i className="fa fa-bell"></i>
              </Link>
            </li>
            <li>
              <Link to="/Calendario" style={{ color: 'inherit' }}>
                <i className="fa fa-calendar-alt"></i>
              </Link>
            </li>
            <li>
              <Link to="/consejos5" style={{ color: 'inherit' }}>
                <i className="fa fa-paper-plane"></i>
              </Link>
            </li>
            <li>
              <Link to="/consejos6" style={{ color: 'inherit' }}>
                <i className="fa fa-book"></i>
              </Link>
            </li>
            <li>
              <Link to="/consejos7" style={{ color: 'inherit' }}>
                <i className="fa fa-calendar-plus"></i>
              </Link>
            </li>
            <li>
              <Link to="/consejos8" style={{ color: 'inherit' }}>
                <i className="fa fa-clock"></i>
              </Link>
            </li>
          </ul>
        </aside>
        <section className="map-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar lugar o dirección"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {filteredPuntos.length > 0 && (
              <ul className="dropdown">
                {filteredPuntos.map((punto) => (
                  <li key={punto.id} onClick={() => handleSelectPunto(punto)}>
                    {punto.nombre} - {punto.direccion} - {punto.barrio}
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => {
              if (selectedPunto)
                mapInstance.current.setView([selectedPunto.latitud, selectedPunto.longitud], 16);
            }}>
              <i className="fa fa-search"></i>
            </button>
          </div>
          <div className="map" ref={mapRef} style={{ height: '500px', width: '100%' }}>
            {/* El mapa se inicializará aquí */}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
