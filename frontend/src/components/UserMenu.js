import React, { useState, useEffect, useRef } from 'react';
import 'font-awesome/css/font-awesome.min.css';
import './UserMenu.css';

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('Invitado');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const triggerRef = useRef(null);

 
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


  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      const storedName = localStorage.getItem('username');
      if (token) {
        setIsLoggedIn(true);
        if (storedName) setUsername(storedName);
      } else {
        setIsLoggedIn(false);
        setUsername('Invitado');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleMenu = () => setIsOpen(prev => !prev);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login';
  };

  const handleLogin = () => {
    window.location.href = '/login';
  };

  return (
    <>
      <div className="user-info" onClick={toggleMenu} ref={triggerRef}>
        <i className="fa fa-user"></i>
        <span className="user-name">{username}</span>
      </div>

      {isOpen && (
        <>
          <div className="user-menu-overlay" onClick={() => setIsOpen(false)} />
          <div className="user-menu-popup">
            <div className="user-menu-header">
              <div className="user-menu-avatar">
                {username ? username.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-menu-info">
                <span className="user-menu-label">Sesión activa</span>
                <div className="user-menu-username">{username}</div>
              </div>
            </div>
            {isLoggedIn ? (
              <button onClick={handleLogout} style={{ color: '#d32f2f' }}>
                <i className="fa fa-sign-out"></i> Cerrar sesión
              </button>
            ) : (
              <button onClick={handleLogin} style={{ color: '#2e7d32' }}>
                <i className="fa fa-sign-in"></i> Iniciar sesión
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default UserMenu;
