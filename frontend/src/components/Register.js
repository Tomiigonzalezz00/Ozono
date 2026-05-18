import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css'; 

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    if (fieldErrors[id]) {
      setFieldErrors({ ...fieldErrors, [id]: '' });
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.username.trim()) {
      errors.username = 'El nombre de usuario es obligatorio.';
    }
    if (!formData.email.trim()) {
      errors.email = 'El correo electrónico es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Ingresá un correo electrónico válido.';
    }
    if (!formData.password) {
      errors.password = 'La contraseña es obligatoria.';
    } else if (formData.password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres.';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

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
        
        <form onSubmit={handleSubmit} noValidate>
          <input
            id="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            placeholder="Nombre de usuario"
            className={fieldErrors.username ? 'input-error' : ''}
          />
          {fieldErrors.username && <p className="field-error">{fieldErrors.username}</p>}

          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Correo electrónico (para recuperar contraseña)"
            className={fieldErrors.email ? 'input-error' : ''}
          />
          {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}

          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Contraseña"
            className={fieldErrors.password ? 'input-error' : ''}
          />
          {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}

          {error && <p className="field-error">{error}</p>}

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