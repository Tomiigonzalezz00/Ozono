import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css'; 

const Register = () => {
  // 1. Agregamos 'email' al estado inicial
  const [formData, setFormData] = useState({
    username: '',
    email: '', 
    password: ''
  });
  
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Enviamos username, email y password al backend
      const response = await axios.post('http://localhost:8000/api/register/', formData);

      // Auto-login: El backend nos devuelve el token directamente
      const { token, username } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);

      console.log("Registro exitoso con email:", formData.email);
      navigate('/home');

    } catch (err) {
      console.error('Register error:', err);
      if (err.response && err.response.data) {
        // Mostramos errores específicos (ej: "El email ya está en uso")
        const msg = Object.values(err.response.data).flat().join(' ');
        setError(msg || 'Error al registrarse.');
      } else {
        setError('Error de conexión con el servidor.');
      }
    }
  };

  return (
    <div className="login-container">
      {/* Barra superior igual al Login */}
      <div className="top-bar">
        <img src="/images/logoOzono.png" alt="OZONO" className="brand-image" />
      </div>

      {/* Contenedor del formulario (Fondo blanco centrado) */}
      <div className="login-form">
        <h1 className="ozono-title">
            <img src="/images/logoOzonoajustado.png" alt="OZONO" className="ozono-title-image" />
        </h1>
        <h2>CREAR CUENTA</h2>
        
        <form onSubmit={handleSubmit}>
          <input
            id="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            placeholder="Nombre de usuario"
            required
          />

          {/* --- NUEVO CAMPO DE EMAIL --- */}
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Correo electrónico (para recuperar contraseña)"
            required
          />
          {/* --------------------------- */}

          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Contraseña"
            required
          />

          {error && <p style={{ color: 'red', fontSize: '14px', margin: '5px 0' }}>{error}</p>}
          
          <button type="submit">Registrarse</button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px' }}>
                ¿Ya tienes cuenta? <Link to="/login" style={{ color: '#006400', fontWeight: 'bold', textDecoration: 'none' }}>Inicia sesión aquí</Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Register;