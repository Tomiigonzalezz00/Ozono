import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import 'font-awesome/css/font-awesome.min.css';

const Consejos = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
              <Link to="/consejos" style={{ color: 'inherit' }}>
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
          <h1>Agenda</h1>
          {/* Aquí puedes agregar el contenido de consejos que desees mostrar */}
        </section>
      </div>
    </div>
  );
};

export default Consejos;



