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
  const [selectedEvents, setSelectedEvents] = useState([]); // Changed to array
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

  const getEventsByDate = (dia, mesIndex) => {
    const monthNames = [
      '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'
    ];
    const month = monthNames[mesIndex];
    const year = 2025;

    const formattedDate = `${year}-${month}-${String(dia).padStart(2, '0')}`;

    const events = [];

    // Add user events
    const matchingUserEvents = userEvents.filter(evento => evento.fecha === formattedDate);
    events.push(...matchingUserEvents);

    // Add environmental events
    const matchingEnvEvents = fechasAmbientales.filter(evento => evento.fecha === formattedDate);
    events.push(...matchingEnvEvents);

    return events;
  };

  const handleDayClick = (dia, mesIndex) => {
    const events = getEventsByDate(dia, mesIndex);
    setSelectedEvents(events);
    setIsModalOpen(true);

    const monthNames = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const formattedDate = `2025-${monthNames[mesIndex]}-${String(dia).padStart(2, '0')}`;
    setNewEventData({ titulo: '', descripcion: '', fecha: formattedDate });
    setIsAddingEvent(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvents([]);
    setIsAddingEvent(false);
  };

  const handleDeleteEvent = async (eventToDelete) => {
    if (!eventToDelete) return;

    // Confirmación
    if (!window.confirm("¿Estás seguro de que quieres eliminar este evento?")) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8000/api/eventos-usuario/${eventToDelete.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        // Actualizar estado eliminando el evento
        const updatedUserEvents = userEvents.filter(e => e.id !== eventToDelete.id);
        setUserEvents(updatedUserEvents);

        // Actualizar la lista de eventos seleccionados en el modal
        setSelectedEvents(selectedEvents.filter(e => e.id !== eventToDelete.id));

        alert("Evento eliminado correctamente");
      } else {
        alert("Error al eliminar el evento");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Error de conexión");
    }
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

        // Add to currently selected events so it shows up immediately
        setSelectedEvents([...selectedEvents, savedEvent]);

        alert("Evento guardado correctamente");
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
                        const events = getEventsByDate(dia + 1, index);
                        const hasEvent = events.length > 0;
                        return (
                          <div
                            className={`day ${hasEvent ? 'has-event' : ''}`}
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
                {selectedEvents.length > 0 ? (
                  <>
                    <h3>Eventos del {formatDate(selectedEvents[0].fecha)}</h3>
                    <div className="events-list" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' }}>
                      {selectedEvents.map((event, idx) => (
                        <div key={idx} className="event-item" style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                          <h4 style={{ margin: '5px 0', color: '#2e7d32', fontSize: '1.1rem' }}>{event.evento || event.titulo}</h4>
                          <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#555' }}>{event.descripcion}</p>

                          {/* Delete button only for user events */}
                          {userEvents.some(e => e.id === event.id) && (
                            <button
                              onClick={() => handleDeleteEvent(event)}
                              style={{ background: '#d32f2f', padding: '5px 10px', fontSize: '0.8rem' }}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

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