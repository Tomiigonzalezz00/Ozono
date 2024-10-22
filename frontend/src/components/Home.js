import React, { useState, useRef, useEffect } from 'react';
import './Home.css';
import L from 'leaflet'; // Importa Leaflet
import 'leaflet/dist/leaflet.css'; // Importa los estilos de Leaflet

const Home = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const menuRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null); // Ref para almacenar la instancia del mapa

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
    window.location.href = '/login'; // Redirige a la página de login
  };

  useEffect(() => {
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([-34.167, -58.959], 13); // Centra el mapa

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance.current);

      const greenIcon = L.icon({
        iconUrl: '/path/to/your/icon.png', // Cambia la ruta a tu icono
        iconSize: [38, 95], // Tamaño del icono
        iconAnchor: [22, 94], // Punto del icono que se alineará con el marcador
        popupAnchor: [-3, -76], // Punto del pop-up que se alineará con el icono
      });

      const fetchPuntosVerdes = async () => {
        try {
          const response = await fetch('http://localhost:8000/api/puntos-verdes/');
          const data = await response.json();

          data.forEach(punto => {
            L.marker([punto.latitud, punto.longitud], { icon: greenIcon })
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
    }
  }, []);

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
            <li><i className="fa fa-arrow-circle-up"></i></li>
            <li><i className="fa fa-paperclip"></i></li>
            <li><i className="fa fa-bell"></i></li>
            <li><i className="fa fa-calendar-alt"></i></li>
            <li><i className="fa fa-paper-plane"></i></li>
            <li><i className="fa fa-book"></i></li>
            <li><i className="fa fa-calendar-plus"></i></li>
            <li><i className="fa fa-clock"></i></li>
          </ul>
        </aside>
        <section className="map-section">
          <div className="search-bar">
            <input type="text" placeholder="Buscar lugar o dirección" />
            <button><i className="fa fa-search"></i></button>
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
