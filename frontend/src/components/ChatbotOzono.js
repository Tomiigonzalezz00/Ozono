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
  const [sessions, setSessions] = useState([]); // Lista de historiales
  const [currentSessionId, setCurrentSessionId] = useState(null); // Chat activo
  const [messages, setMessages] = useState([]); // Mensajes del chat activo
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const menuRef = useRef(null);
  const messagesEndRef = useRef(null);

  const toggleProfileMenu = () => setIsProfileOpen(prev => !prev);

  // 1. INICIALIZACIÓN (Login y Carga de Historial)
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedName = localStorage.getItem('username');
    
    if (storedToken) {
        setIsLoggedIn(true);
        setToken(storedToken);
        if (storedName) setUsername(storedName);
        loadChatHistory(storedToken); // Cargar lista de chats
    } else {
        setIsLoggedIn(false);
        setUsername('Invitado');
    }
  }, []);

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);


  // --- API CALLS ---

  // Cargar lista de sesiones
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

  // Crear nueva sesión
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
        setSessions([newSession, ...sessions]); // Agregar al principio
        setCurrentSessionId(newSession.id);
        setMessages([{ sender: 'bot', text: 'Hola, soy Ozzy. ¿En qué puedo ayudarte?' }]);
      }
    } catch (error) {
      console.error("Error creando sesión:", error);
    }
  };

  // Cargar mensajes de una sesión específica
  const selectSession = async (sessionId) => {
    setCurrentSessionId(sessionId);
    setIsLoading(true);
    try {
        const response = await fetch(`http://localhost:8000/api/chat/sessions/${sessionId}/`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            // Mapeamos los mensajes del backend al formato del frontend
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

  // Guardar mensaje en Backend
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

  // Enviar Mensaje
  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Si no hay sesión activa y el usuario está logueado, creamos una antes de enviar
    if (!currentSessionId && isLoggedIn) {
        await createNewSession();
        // (En una implementación ideal, esperaríamos a tener el ID, aquí asumimos que el usuario crea sesión primero o el sistema lo maneja)
    }

    const userText = input;
    const userMessage = { sender: 'user', text: userText };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // 1. Guardar mensaje del usuario en DB
    if (isLoggedIn && currentSessionId) saveMessageToBackend(userText, 'user');

    try {
      // 2. Llamar a n8n (IA)
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
      
      // 3. Guardar respuesta del bot en DB
      if (isLoggedIn && currentSessionId) {
          saveMessageToBackend(botText, 'bot');
          // Recargar lista de sesiones para actualizar el título si cambió
          loadChatHistory(token); 
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
              {isLoggedIn ? <button onClick={handleLogout} style={{color:'#d32f2f'}}>Cerrar sesión</button> : <button onClick={handleLogin} style={{color:'#006400'}}>Iniciar sesión</button>}
            </div>
          )}
        </div>
      </header>

      <div className="main-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link to="/home" title="Mapa"><i className="fa fa-arrow-circle-up"></i></Link></li>
            <li><Link to="/chatbot_ozono" title="Asistente"><i className="fa fa-lightbulb-o"></i></Link></li>
            <li><Link to="/Calendario" title="Calendario"><i className="fa fa-calendar-alt"></i></Link></li>
          </ul>
        </aside>

        <section className="content-section" style={{ display: 'flex', flexDirection: 'row', height: 'calc(100vh - 60px)', overflow: 'hidden', padding: 0 }}>
          
          {/* --- BARRA LATERAL DE HISTORIAL (NUEVO) --- */}
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
                            <i className="fa fa-comment-o"></i>
                            <span>{session.title}</span>
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

              <div className="chat-container" style={{ height: '100%', border: 'none', boxShadow: 'none' }}>
                <div className="chat-messages">
                  {!isLoggedIn && messages.length === 1 && (
                      <div className="message bot">Inicia sesión para guardar tu historial de chat.</div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={`message ${msg.sender}`}>
                      {msg.text}
                    </div>
                  ))}
                  {isLoading && <div className="message bot typing-indicator">...</div>}
                  <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-container">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribí tu pregunta..."
                    disabled={isLoggedIn && !currentSessionId} // Obliga a crear chat si está logueado
                  />
                  <button onClick={handleSend} disabled={isLoggedIn && !currentSessionId}>Enviar</button>
                </div>
                {isLoggedIn && !currentSessionId && (
                    <div style={{textAlign:'center', padding:'10px', color:'#666'}}>
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