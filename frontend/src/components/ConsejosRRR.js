import React, { useState, useEffect, useRef } from 'react';
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
  const [tarjetas, setTarjetas] = useState([]); // Estado para las tarjetas
  const menuRef = useRef(null);

  // Función para obtener consejos desde la base de datos
  const fetchConsejos = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/consejos-rrr/'); // Cambia esta URL si es necesario
      if (!response.ok) {
        throw new Error('Error en la carga de datos');
      }
      const data = await response.json();
      setTarjetas(data);
    } catch (error) {
      console.error('Error fetching consejos:', error);
    }
  };

  useEffect(() => {
    fetchConsejos(); // Llama a la función al montar el componente
  }, []);

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

  const handleClearFilters = () => {
    setFilterText(""); // Limpia el texto del filtro
    setSelectedFilters({
      reciclaje: false,
      reutilizacion: false,
      reduccion: false,
    }); // Restablece los checkboxes
  };

  const filteredTarjetas = tarjetas.filter((tarjeta) => {
    const matchesText = tarjeta.titulo.toLowerCase().includes(filterText.toLowerCase());
    const matchesCategory =
      (selectedFilters.reciclaje && tarjeta.categoria === 'reciclaje') ||
      (selectedFilters.reutilizacion && tarjeta.categoria === 'reutilizacion') ||
      (selectedFilters.reduccion && tarjeta.categoria === 'reducción') ||
      (!selectedFilters.reciclaje && !selectedFilters.reutilizacion && !selectedFilters.reduccion);

    return matchesText && matchesCategory; // Coincidencia de ambos filtros
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
            <button onClick={handleClearFilters}>Limpiar filtros</button> {/* Botón para limpiar */}
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
            {filteredTarjetas.length > 0 ? ( // Muestra tarjetas filtradas
              filteredTarjetas.slice(0, 6).map((tarjeta) => (
                <div key={tarjeta.id} className="tarjeta">
                  <div className="square"></div> {/* Cuadrado verde */}
                  <h3 className="tarjeta-titulo" style={{ textAlign: 'center' }}>{tarjeta.titulo}</h3>
                  <p className="tarjeta-categoria" style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
                    {tarjeta.categoria}
                  </p>
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




