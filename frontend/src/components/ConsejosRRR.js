import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Consejos.css';
import 'font-awesome/css/font-awesome.min.css';

const Consejos = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [filterText, setFilterText] = useState(""); 
  const [selectedFilters, setSelectedFilters] = useState({
    reciclaje: false,
    reutilizacion: false,
    reduccion: false,
  });

  const [tarjetas] = useState([
    { id: 1, titulo: 'Reciclaje', categoria: 'reciclaje' },
    { id: 2, titulo: 'Reutilización', categoria: 'reutilizacion' },
    { id: 3, titulo: 'Reducción de Consumo', categoria: 'reduccion' },
    { id: 4, titulo: 'Reciclaje de plástico', categoria: 'reciclaje' },
    { id: 5, titulo: 'Reciclaje de vidrio', categoria: 'reciclaje' },
    { id: 6, titulo: 'Reutilización de ropa', categoria: 'reutilizacion' },
    { id: 7, titulo: 'Reducir el uso de papel', categoria: 'reduccion' },
    { id: 8, titulo: 'Reutilizar envases', categoria: 'reutilizacion' },
  ]);

  const menuRef = useRef(null);

  const toggleProfileMenu = () => {
    setIsProfileOpen(prevState => !prevState);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleFilterTextChange = (e) => {
    setFilterText(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, checked } = e.target;
    setSelectedFilters(prevFilters => ({
      ...prevFilters,
      [name]: checked,
    }));
  };

  const filteredTarjetas = tarjetas.filter((tarjeta) => {
    return (
      (selectedFilters.reciclaje && tarjeta.categoria === 'reciclaje') ||
      (selectedFilters.reutilizacion && tarjeta.categoria === 'reutilizacion') ||
      (selectedFilters.reduccion && tarjeta.categoria === 'reduccion') ||
      (!selectedFilters.reciclaje && !selectedFilters.reutilizacion && !selectedFilters.reduccion)
    );
  });

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
              <Link to="/consejos4" style={{ color: 'inherit' }}>
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

        <section className="content-section">
          <h1>Consejos RRR</h1>
          <div className="filter-bar">
            <input
              type="text"
              placeholder="Filtrar consejos..."
              value={filterText}
              onChange={handleFilterTextChange}
            />
            <button>Filtrar</button>
          </div>

          <div className="checkbox-filters">
            <label>
              <input
                type="checkbox"
                name="reciclaje"
                checked={selectedFilters.reciclaje}
                onChange={handleFilterChange}
              />
              Reciclaje
            </label>
            <label>
              <input
                type="checkbox"
                name="reutilizacion"
                checked={selectedFilters.reutilizacion}
                onChange={handleFilterChange}
              />
              Reutilización
            </label>
            <label>
              <input
                type="checkbox"
                name="reduccion"
                checked={selectedFilters.reduccion}
                onChange={handleFilterChange}
              />
              Reducción de Consumo
            </label>
          </div>

          <div className="tarjetas-container">
            {filteredTarjetas.slice(0, 6).length > 0 ? ( // Solo muestra hasta 6 tarjetas
              filteredTarjetas.slice(0, 6).map((tarjeta) => (
                <div key={tarjeta.id} className="tarjeta">
                  <h3>{tarjeta.titulo}</h3>
                </div>
              ))
            ) : (
              <p>No hay tarjetas que coincidan con los filtros seleccionados.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Consejos;

