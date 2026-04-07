import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'font-awesome/css/font-awesome.min.css';

import './ChatbotOzono.css';
import UserMenu from './UserMenu';
import { useNotification } from '../context/NotificationContext';

const ChatbotOzono = () => {
  const { showConfirm, showNotification } = useNotification();

  // --- ESTADOS DE UI Y SESIÓN ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);

  // --- ESTADOS DEL CHAT ---
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // NUEVO: Estado para la ubicación
  const [userLocation, setUserLocation] = useState({ lat: null, lng: null });

  const chatContainerRef = useRef(null);

  // 1. INICIALIZACIÓN
  useEffect(() => {
    const storedToken = localStorage.getItem('token');

    if (storedToken) {
      setIsLoggedIn(true);
      setToken(storedToken);
      loadChatHistory(storedToken);
    } else {
      setIsLoggedIn(false);
    }

    // NUEVO: Pedir ubicación al cargar el componente
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Error GPS:", error.message);
        },
        { enableHighAccuracy: true, timeout: 5000 } // Fuerzo a que busque rápido y preciso
      );
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

  // --- CREAR NUEVA SESIÓN (Corregido) ---
  const createNewSession = async () => {
    if (!token) return null;
    try {
      const response = await fetch('http://localhost:8000/api/chat/sessions/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: "Nueva conversación" })
      });

      const data = await response.json();

      if (response.ok) {
        setSessions(prev => [data, ...prev]);
        setCurrentSessionId(data.id);
        setMessages([{ sender: 'bot', text: 'Hola, soy Ozzy. ¿En qué puedo ayudarte?' }]);
        return data.id; // Retornamos el ID para usarlo de inmediato
      } else {
        console.error("Error del backend al crear sesión:", data);
        showNotification("El servidor rechazó crear el chat: " + JSON.stringify(data), 'error');
        return null;
      }
    } catch (error) {
      console.error("Error de conexión creando sesión:", error);
      showNotification("Error de red al intentar crear el chat.", 'error');
      return null;
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

  // --- ELIMINAR SESIÓN ---
  const deleteSession = (e, sessionId) => {
    e.stopPropagation(); // Evita abrir el chat al hacer click en borrar

    showConfirm("¿Estás seguro de que deseas eliminar este chat?", async () => {
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
    });
  };

  // --- ENVIAR MENSAJE A GEMINI (Corregido) ---
  const handleSend = async () => {
    if (!input.trim()) return;

    let sessionIdToUse = currentSessionId;

    // Si estás logueado y no seleccionaste chat, creamos uno nuevo ANTES de hablar con Gemini
    if (!sessionIdToUse && isLoggedIn) {
      sessionIdToUse = await createNewSession();
      if (!sessionIdToUse) return; // Si falló la creación, abortamos el envío
    }

    const userText = input;
    const userMessage = { sender: 'user', text: userText };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Token ${token}`;

      // Llamada directa al NUEVO endpoint de Gemini en Django
      const response = await fetch('http://localhost:8000/api/chat/gemini/', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          message: userText,
          session_id: sessionIdToUse,
          // NUEVO: Enviamos las variables exactas que espera el backend
          lat: userLocation.lat,
          lng: userLocation.lng
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const botMessage = { sender: 'bot', text: data.response };
        setMessages(prev => [...prev, botMessage]);

        if (isLoggedIn) {
          loadChatHistory(token);
          if (!currentSessionId && data.session_id) {
            setCurrentSessionId(data.session_id);
          }
        }
      } else {
        throw new Error(data.error || `Error ${response.status}`);
      }

    } catch (error) {
      console.error('Error chatbot Gemini:', error);
      const errorMsg = "Lo siento, tuve un problema de conexión o el servidor no respondió correctamente. Por favor, intenta de nuevo.";
      setMessages(prev => [...prev, { sender: 'bot', text: errorMsg }]);
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

  // --- FUNCIÓN PARA DETECTAR LINKS, YOUTUBE Y FORMATO ---
  const formatMessage = (text) => {
    if (!text) return null;

    // Separamos el texto buscando cualquier URL que empiece con http o https
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        // Limpiamos la URL por si Gemini le puso un punto final a la oración
        const cleanUrl = part.replace(/[.,;:]$/, '');

        // Detectamos si es un link de YouTube
        const ytMatch = cleanUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);

        if (ytMatch && ytMatch[1]) {
          const videoId = ytMatch[1]; // El código alfanumérico del video
          return (
            <div key={index} style={{ margin: '15px 0' }}>
              <a href={cleanUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', maxWidth: '300px' }}>
                {/* Cargamos la miniatura oficial de alta calidad desde los servidores de YouTube */}
                <img
                  src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                  alt="Miniatura de YouTube"
                  style={{ width: '100%', borderRadius: '12px', border: '2px solid #4CAF50', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
                />
                <span style={{ display: 'block', marginTop: '5px', fontSize: '0.85em', color: '#4CAF50', textDecoration: 'underline' }}>
                  <i className="fa fa-youtube-play"></i> Ver video de reciclaje
                </span>
              </a>
            </div>
          );
        } else {
          // Si es una página web normal, la hacemos clickeable
          return (
            <a key={index} href={cleanUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4CAF50', textDecoration: 'underline', wordBreak: 'break-all' }}>
              {cleanUrl}
            </a>
          );
        }
      }

      // Procesamos las negritas (**) y los saltos de línea para el texto normal
      return (
        <span key={index} style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
          {part.split('**').map((chunk, i) => i % 2 === 1 ? <strong key={i}>{chunk}</strong> : chunk)}
        </span>
      );
    });
  };

  return (
    <div className="home-container">
      <header className="top-bar">
        <img src="/images/logoOzono.png" alt="Ozono" className="brand-image" />
        <UserMenu />
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
                  <div className="message bot">¡Hola! Soy Ozzy, el asistente de Ozono. ¿En qué puedo ayudarte? Recuerda que debes iniciar sesión para usar el asistente y guardar tu historial.</div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`message ${msg.sender}`}>
                    {/* MAGIA DE FORMATO: Respetar saltos de línea, links y miniaturas de YouTube */}
                    {formatMessage(msg.text)}
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
                  disabled={isLoggedIn && !currentSessionId && sessions.length === 0 && !input}
                />
                <button onClick={handleSend} disabled={isLoggedIn && !currentSessionId && sessions.length === 0 && !input}>Enviar</button>
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