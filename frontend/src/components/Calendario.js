import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Calendario.css';
import 'font-awesome/css/font-awesome.min.css';

const Calendario = () => {
  // --- ESTADOS DE UI Y SESIÓN (NUEVO) ---
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [username, setUsername] = useState('Usuario');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Estados del Calendario
  const [fechasAmbientales, setFechasAmbientales] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventData, setNewEventData] = useState({ titulo: '', descripcion: '' });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const menuRef = useRef(null);

  const toggleProfileMenu = () => setIsProfileOpen(prevState => !prevState);

  // 1. VERIFICAR SESIÓN AL CARGAR (NUEVO)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedName = localStorage.getItem('username');

    if (token) {
      setIsLoggedIn(true);
      if (storedName) setUsername(storedName);
    } else {
      setIsLoggedIn(false);
      setUsername('Invitado');
    }
  }, []);

  // 2. HANDLERS DE SESIÓN (ACTUALIZADO)
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login';
  };

  const handleLogin = () => {
    window.location.href = '/login';
  };

  // Helpers de fecha
  const formatDate = (fecha) => {
    const [year, month, day] = fecha.split('-');
    const months = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    return `${day} de ${months[parseInt(month, 10) - 1]} ${year}`;
  };

  // Ajuste de menú
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

    if (isProfileOpen) {
      adjustMenuPosition();
      window.addEventListener('resize', adjustMenuPosition);
    }
    return () => window.removeEventListener('resize', adjustMenuPosition);
  }, [isProfileOpen]);

  // Carga de datos
  useEffect(() => {
    const fetchFechasAmbientales = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/calendario-ambiental/');
        const data = await response.json();
        setFechasAmbientales(data);
      } catch (error) {
        console.error('Error fetching fechas ambientales:', error);
      }
    };

    const fetchUserEvents = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('http://localhost:8000/api/eventos-usuario/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUserEvents(data);
        }
      } catch (error) {
        console.error('Error fetching user events:', error);
      }
    };

    fetchFechasAmbientales();
    if (isLoggedIn) {
      fetchUserEvents();
    }
  }, [isLoggedIn]);

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
    const year = 2025; // Año fijo para los datos de la API
    const date = new Date(year, monthIndex, 1);
    return date.getDay();
  };

  const getEventByDate = (dia, mesIndex) => {
    const monthNames = [
      '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'
    ];
    const month = monthNames[mesIndex];
    const year = 2025;

    const formattedDate = `${year}-${month}-${String(dia).padStart(2, '0')}`;

    // Check user events first
    const userEvent = userEvents.find(evento => evento.fecha === formattedDate);
    if (userEvent) return userEvent;

    return fechasAmbientales.find(evento => evento.fecha === formattedDate);
  };

  const handleDayClick = (dia, mesIndex) => {
    const event = getEventByDate(dia, mesIndex);
    setSelectedEvent(event);
    setIsModalOpen(true);

    const monthNames = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const formattedDate = `2025-${monthNames[mesIndex]}-${String(dia).padStart(2, '0')}`;
    setNewEventData({ titulo: '', descripcion: '', fecha: formattedDate });
    setIsAddingEvent(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setIsAddingEvent(false);
  };

  const handleSaveEvent = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Debes iniciar sesión para guardar eventos.");
      return;
    }

    if (!newEventData.titulo.trim()) {
      alert("Por favor, ingresa un título para el evento.");
      return;
    }

    console.log("Enviando evento:", newEventData);

    try {
      const response = await fetch('http://localhost:8000/api/eventos-usuario/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(newEventData)
      });

      if (response.ok) {
        const savedEvent = await response.json();
        setUserEvents([...userEvents, savedEvent]);
        setIsAddingEvent(false);
        setSelectedEvent(savedEvent); // Show the new event
        // Optionally close modal or show success message
        alert("Evento guardado correctamente");
        closeModal();
      } else {
        const errorData = await response.json();
        console.error("Error del servidor:", errorData);
        alert(`Error al guardar: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Error de conexión");
    }
  };

  return (
    <div className="home-container">
      {/* HEADER ACTUALIZADO CON LÓGICA DE SESIÓN */}
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
            <li>
              <Link to="/home" style={{ color: 'inherit' }}>
                <i className="fa fa-arrow-circle-up"></i>
              </Link>
            </li>
            <li>
              <Link to="/chatbot_ozono" style={{ color: 'inherit' }}>
                <i className="fa fa-lightbulb-o"></i>
              </Link>
            </li>
            <li>
              <Link to="/Calendario" style={{ color: 'inherit' }}>
                <i className="fa fa-calendar-alt"></i>
              </Link>
            </li>
          </ul>
        </aside>

        <section className="content-section">
          <h1>
            <img src="/images/CalendarioAmbiental.jpeg" alt="Mundo Verde" className="imagen-titulo" />
            Calendario Ambiental
          </h1>

          <div className="calendar-container">
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
                            className={`day ${event ? 'has-event' : ''}`}
                            key={dia + 1}
                            onClick={() => handleDayClick(dia + 1, index)}
                          >
                            {dia + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {isModalOpen && (
            <div className="modalcal-overlay">
              <div className="modalcal-content">
                {selectedEvent ? (
                  <>
                    <h3>{selectedEvent.evento || selectedEvent.titulo}</h3>
                    <p>{formatDate(selectedEvent.fecha)}</p>
                    <p>{selectedEvent.descripcion}</p>
                    <button onClick={closeModal}>Cerrar</button>
                    {!isAddingEvent && isLoggedIn && (
                      <button onClick={() => setIsAddingEvent(true)} style={{ marginLeft: '10px', backgroundColor: '#4CAF50' }}>
                        Agregar otro evento
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <h3>{formatDate(newEventData.fecha)}</h3>
                    <p>No hay eventos para esta fecha.</p>
                    {!isAddingEvent && isLoggedIn && (
                      <button onClick={() => setIsAddingEvent(true)} style={{ backgroundColor: '#4CAF50' }}>
                        Agregar evento
                      </button>
                    )}
                    <button onClick={closeModal} style={{ marginLeft: '10px' }}>Cerrar</button>
                  </>
                )}

                {isAddingEvent && (
                  <div className="add-event-form" style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
                    <h4>Nuevo Evento</h4>
                    <input
                      type="text"
                      placeholder="Título"
                      value={newEventData.titulo}
                      onChange={(e) => setNewEventData({ ...newEventData, titulo: e.target.value })}
                      style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '5px' }}
                    />
                    <textarea
                      placeholder="Descripción"
                      value={newEventData.descripcion}
                      onChange={(e) => setNewEventData({ ...newEventData, descripcion: e.target.value })}
                      style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '5px' }}
                    />
                    <button onClick={handleSaveEvent} style={{ backgroundColor: '#008CBA' }}>Guardar</button>
                    <button onClick={() => setIsAddingEvent(false)} style={{ marginLeft: '10px', backgroundColor: '#f44336' }}>Cancelar</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Calendario;