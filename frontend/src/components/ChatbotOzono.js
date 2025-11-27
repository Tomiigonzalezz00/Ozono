import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'font-awesome/css/font-awesome.min.css';
import './ChatbotOzono.css';

const ChatbotOzono = () => {
  // Menú, logout, etc
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const menuRef = useRef(null);
  const toggleProfileMenu = () => setIsProfileOpen(prev => !prev);
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  // Chatbot states
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hola, soy Ozzy. ¿En qué puedo ayudarte?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5678/webhook/chat-ozono', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: input }),
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();

      if (!data.respuesta) {
        throw new Error('Respuesta inválida del servidor');
      }

      const botMessage = { sender: 'bot', text: data.respuesta };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error al conectar con el chatbot:', error);
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'Ozzy no puede responder en este momento. Intentá nuevamente más tarde.'
        }
      ]);
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
            <li><Link to="/home" style={{ color: 'inherit' }}><i className="fa fa-arrow-circle-up"></i></Link></li>
            <li><Link to="/chatbot_ozono" style={{ color: 'inherit' }}><i className="fa fa-lightbulb-o"></i></Link></li>
            <li><Link to="/calendario" style={{ color: 'inherit' }}><i className="fa fa-calendar-alt"></i></Link></li>
          </ul>
        </aside>

        <section className="content-section">
          <h1>
            <img src="/images/bot-icon.png" alt="Chatbot Ozono" className="chatbot-icon" />
            Chatbot Ozono
          </h1>

          <div className="chat-container" role="region" aria-live="polite" aria-label="Chatbot de Ozono">
            <div className="chat-messages">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`message ${msg.sender}`}
                  aria-live={msg.sender === 'bot' ? 'polite' : 'off'}
                >
                  {msg.text}
                </div>
              ))}

              {/* Indicador de "procesando" */}
              {isLoading && (
                <div className="message bot typing-indicator" aria-live="polite" aria-atomic="true">
                  Procesando tu pregunta
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-container">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribí tu pregunta..."
                aria-label="Campo para escribir pregunta al chatbot"
              />
              <button
                onClick={handleSend}
                aria-label="Enviar mensaje al chatbot"
              >
                Enviar
              </button>
            </div>
          </div>
        </section>
      </div >
    </div >
  );
};

export default ChatbotOzono;
