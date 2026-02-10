import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'font-awesome/css/font-awesome.min.css';

import './ChatbotOzono.css';

const ChatbotOzono = () => {
  // --- ESTADOS DE UI Y SESIÓN ---
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [username, setUsername] = useState('Usuario');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);

  // --- ESTADOS DEL CHAT ---
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const menuRef = useRef(null);
  const chatContainerRef = useRef(null);

  const toggleProfileMenu = () => setIsProfileOpen(prev => !prev);

  // 1. INICIALIZACIÓN
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedName = localStorage.getItem('username');

    if (storedToken) {
      setIsLoggedIn(true);
      setToken(storedToken);
      if (storedName) setUsername(storedName);
      loadChatHistory(storedToken);
    } else {
      setIsLoggedIn(false);
      setUsername('Invitado');
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);


  // --- API CALLS ---
  const loadChatHistory = async (authToken) => {
    try {
      const response = await fetch('http://localhost:8000/api/chat/sessions/', {
        headers: { 'Authorization': `Token ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Error cargando historial:", error);
    }
  };

  const createNewSession = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:8000/api/chat/sessions/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: "Nueva conversación" })
      });
      if (response.ok) {
        const newSession = await response.json();
        setSessions([newSession, ...sessions]);
        setCurrentSessionId(newSession.id);
        setMessages([{ sender: 'bot', text: 'Hola, soy Ozzy. ¿En qué puedo ayudarte?' }]);
      }
    } catch (error) {
      console.error("Error creando sesión:", error);
    }
  };

  const selectSession = async (sessionId) => {
    setCurrentSessionId(sessionId);
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/chat/sessions/${sessionId}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const historyMessages = data.messages.map(m => ({
          sender: m.sender,
          text: m.text
        }));
        setMessages(historyMessages);
      }
    } catch (error) {
      console.error("Error cargando mensajes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- NUEVA FUNCIÓN: ELIMINAR SESIÓN ---
  const deleteSession = async (e, sessionId) => {
    e.stopPropagation(); // Evita abrir el chat al hacer click en borrar

    if (!window.confirm("¿Estás seguro de que deseas eliminar este chat?")) return;

    try {
      const response = await fetch(`http://localhost:8000/api/chat/sessions/${sessionId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        // Filtrar la sesión eliminada de la lista visual
        setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));

        // Si la sesión eliminada era la que estaba abierta, limpiar pantalla
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Error eliminando sesión:", error);
    }
  };

  const saveMessageToBackend = async (text, sender) => {
    if (!currentSessionId || !token) return;
    try {
      await fetch(`http://localhost:8000/api/chat/sessions/${currentSessionId}/messages/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, sender })
      });
    } catch (error) {
      console.error("Error guardando mensaje:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!currentSessionId && isLoggedIn) {
      await createNewSession();
    }

    const userText = input;
    const userMessage = { sender: 'user', text: userText };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (isLoggedIn && currentSessionId) saveMessageToBackend(userText, 'user');

    try {
      const response = await fetch('http://localhost:5678/webhook/chat-ozono', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: userText }),
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);

      const data = await response.json();
      const botText = data.respuesta || 'No entendí eso.';
      const botMessage = { sender: 'bot', text: botText };

      setMessages(prev => [...prev, botMessage]);

      if (isLoggedIn && currentSessionId) {
        saveMessageToBackend(botText, 'bot');
        // Opcional: recargar historial para actualizar títulos si cambian
        // loadChatHistory(token); 
      }

    } catch (error) {
      console.error('Error chatbot:', error);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Error de conexión con Ozzy.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login';
  };
  const handleLogin = () => window.location.href = '/login';

  return (
    <div className="home-container">
      <header className="top-bar">
        <img src="/images/logoOzono.png" alt="Ozono" className="brand-image" />
        <div className="user-info" onClick={toggleProfileMenu}>
          <i className="fa fa-user"></i><span className="user-name">{username}</span>
          {isProfileOpen && (
            <div className="profile-menu" ref={menuRef}>
              {isLoggedIn ? <button onClick={handleLogout} style={{ color: '#d32f2f' }}>Cerrar sesión</button> : <button onClick={handleLogin} style={{ color: '#006400' }}>Iniciar sesión</button>}
            </div>
          )}
        </div>
      </header>

      <div className="main-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li style={{ position: 'relative', width: '100%', height: '70px' }}>
              <Link 
                to="/home" 
                title="Mapa" 
                style={{ 
                  color: 'inherit', 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  textDecoration: 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 999
                }}
              >
                <i className="fa fa-map" style={{ pointerEvents: 'none', color: 'white', fontSize: '28px' }}></i>
              </Link>
            </li>
            <li className="active" style={{ position: 'relative', width: '100%', height: '70px' }}>
              <Link 
                to="/chatbot_ozono" 
                title="Asistente" 
                style={{ 
                  color: 'inherit', 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  textDecoration: 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 999
                }}
              >
                <i className="fa fa-lightbulb-o" style={{ pointerEvents: 'none', color: 'white', fontSize: '28px' }}></i>
              </Link>
            </li>
            <li style={{ position: 'relative', width: '100%', height: '70px' }}>
              <Link 
                to="/Calendario" 
                title="Calendario" 
                style={{ 
                  color: 'inherit', 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  textDecoration: 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 999
                }}
              >
                <i className="fa fa-calendar-alt" style={{ pointerEvents: 'none', color: 'white', fontSize: '28px' }}></i>
              </Link>
            </li>
          </ul>
        </aside>

        <section className="chatbot-layout-section">

          {/* --- BARRA LATERAL DE HISTORIAL --- */}
          {isLoggedIn && (
            <div className="chat-history-sidebar">
              <button className="new-chat-btn" onClick={createNewSession}>
                <i className="fa fa-plus"></i> Nuevo Chat
              </button>
              <div className="history-list">
                {sessions.map(session => (
                  <div
                    key={session.id}
                    className={`history-item ${currentSessionId === session.id ? 'active' : ''}`}
                    onClick={() => selectSession(session.id)}
                  >
                    {/* Contenedor del Título e Icono */}
                    <div className="history-item-content">
                      <i className="fa fa-comment-o"></i>
                      <span className="session-title">{session.title}</span>
                    </div>

                    {/* Botón de Eliminar */}
                    <button
                      className="delete-chat-btn"
                      onClick={(e) => deleteSession(e, session.id)}
                      title="Eliminar chat"
                    >
                      <i className="fa fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- ÁREA DE CHAT PRINCIPAL --- */}
          <div className="chat-main-area">
            <div className="chat-header">
              <h1><img src="/images/bot-icon.png" alt="Bot" className="chatbot-icon" /> Chatbot Ozono</h1>
            </div>

            <div className="chat-interface-container">
              <div className="chat-messages" ref={chatContainerRef}>
                {!isLoggedIn && messages.length === 0 && (
                  <div className="message bot">¡Hola! Soy Ozzy, el asistente de Ozono.¿En qué puedo ayudarte?. Reuerda que puedes iniciar sesión para guardar tu historial de chat.</div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`message ${msg.sender}`}>
                    {msg.text}
                  </div>
                ))}
                {isLoading && <div className="message bot typing-indicator">...<span className="dot">.</span><span className="dot">.</span></div>}
              </div>

              <div className="chat-input-container">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribí tu pregunta..."
                  disabled={isLoggedIn && !currentSessionId}
                />
                <button onClick={handleSend} disabled={isLoggedIn && !currentSessionId}>Enviar</button>
              </div>
              {isLoggedIn && !currentSessionId && (
                <div style={{ textAlign: 'center', padding: '10px', color: '#eee', fontSize: '0.9em' }}>
                  Selecciona un chat o crea uno nuevo para empezar.
                </div>
              )}
            </div>
          </div>

        </section>
      </div >
    </div >
  );
};

export default ChatbotOzono;