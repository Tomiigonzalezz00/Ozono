import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Consejos.css';
import 'font-awesome/css/font-awesome.min.css';

const Consejos4 = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [fechasAmbientales, setFechasAmbientales] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const menuRef = useRef(null);

  const toggleProfileMenu = () => {
    setIsProfileOpen(prevState => !prevState);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
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

  useEffect(() => {
    const fetchFechasAmbientales = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/calendario-ambiental/'); // Cambia esta URL a la de tu API
        const data = await response.json();
        setFechasAmbientales(data); // Almacena el arreglo de objetos
      } catch (error) {
        console.error('Error fetching fechas ambientales:', error);
      }
    };

    fetchFechasAmbientales();
  }, []);

  const diasSemana = ["D", "L", "M", "M", "J", "V", "S"];
  const meses = [
    { nombre: "Enero", dias: 31 },
    { nombre: "Febrero", dias: 29 },
    { nombre: "Marzo", dias: 31 },
    { nombre: "Abril", dias: 30 },
    { nombre: "Mayo", dias: 31 },
    { nombre: "Junio", dias: 30 },
    { nombre: "Julio", dias: 31 },
    { nombre: "Agosto", dias: 31 },
    { nombre: "Septiembre", dias: 30 },
    { nombre: "Octubre", dias: 31 },
    { nombre: "Noviembre", dias: 30 },
    { nombre: "Diciembre", dias: 31 }
  ];

  const getStartDayOfMonth = (monthIndex) => {
    const year = new Date().getFullYear();
    const date = new Date(year, monthIndex, 1);
    return date.getDay();
  };

  const getEventByDate = (dia, mesIndex) => {
    const monthNames = [
      '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'
    ];
    const month = monthNames[mesIndex];
    const year = new Date().getFullYear();

    // Formato de la fecha esperado: 'YYYY-MM-DD'
    const formattedDate = `${year}-${month}-${String(dia).padStart(2, '0')}`;
    return fechasAmbientales.find(evento => evento.fecha === formattedDate);
  };

  const handleDayClick = (dia, mesIndex) => {
    const event = getEventByDate(dia, mesIndex);
    if (event) {
      setSelectedEvent(event);
    } else {
      setSelectedEvent(null); // Si no hay evento, limpia la selección
    }
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
              <Link to="/calendario" style={{ color: 'inherit' }}>
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
          <h1>Calendario Ambiental</h1>
          <div className="calendar">
            {meses.map((mes, index) => {
              const startDay = getStartDayOfMonth(index);
              return (
                <div className="calendar-month" key={index}>
                  <h2>{mes.nombre}</h2>
                  <div className="days-header">
                    {diasSemana.map((dia, i) => (
                      <div className="day-name" key={i}>{dia}</div>
                    ))}
                  </div>
                  <div className="days-grid">
                    {[...Array(startDay)].map((_, emptyIndex) => (
                      <div className="day empty" key={`empty-${emptyIndex}`}></div>
                    ))}
                    {[...Array(mes.dias)].map((_, dia) => {
                      const event = getEventByDate(dia + 1, index);
                      return (
                        <div
                          className={`day ${event ? 'has-event' : ''}`} // Añade una clase si hay evento
                          key={dia + 1}
                          onClick={() => handleDayClick(dia + 1, index)}
                        >
                          {dia + 1}
                          {event && (
                            <div className="circle"></div> // Solo se muestra si hay evento
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {selectedEvent && (
            <div className="event-details">
              <h3>{selectedEvent.evento}</h3>
              <p>{selectedEvent.descripcion}</p>
              <button onClick={() => setSelectedEvent(null)}>Cerrar</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Consejos4;










