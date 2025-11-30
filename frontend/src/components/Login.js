import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Estado para mensajes de error
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpiar errores previos

    try {
      // Usamos localhost:8000 que es donde Docker expone tu backend
      const response = await axios.post('http://localhost:8000/api/login/', {
        username,
        password,
      });

      // Guardar el token
      const token = response.data.token;
      localStorage.setItem('token', token);

      // Guardar el username
      localStorage.setItem('username', username);

      // Opcional: Guardar info del usuario si la necesitas
      if (rememberMe) {
        localStorage.setItem('username', username);
      }

      console.log("Login exitoso, Token:", token);

      // Redirigir al Home (donde está el mapa)
      navigate('/home');

    } catch (err) {
      console.error('Login error:', err);
      // Mostrar mensaje amigable si falla
      if (err.response && err.response.status === 400) {
        setError('Usuario o contraseña incorrecto.');
      }
       else {
        setError('Error de conexión con el servidor. Intenta más tarde.');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="top-bar">
        <img src="/images/logoOzono.png" alt="OZONO" className="brand-image" />
      </div>
      <div className="login-form">
        <h1 className="ozono-title">
          <img src="/images/logoOzonoajustado.png" alt="OZONO" className="ozono-title-image" />
        </h1>
        <h2>LOGIN</h2>

        <form onSubmit={handleSubmit}>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Introduce tu usuario"
          />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
          />

          {/* Mensaje de error si falla el login */}
          {error && <p style={{ color: 'red', fontSize: '14px', margin: '5px 0' }}>{error}</p>}

          {/* descomentar para activar boton recordarme */}
          {/*<div className="remember-me">
            <div className="switch" onClick={() => setRememberMe(prevState => !prevState)}>
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                readOnly 
              />
              <span className="slider"></span>
            </div>
            <label htmlFor="rememberMe">Recordarme</label> */} 
            <a href="/forgot-password" className="forgot-password">Olvidé mi contraseña</a>
          </div>

          <button type="submit">Ingresar</button>
        </form>

        {/* Link para ir al registro si no tiene cuenta */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px' }}>
            ¿No tienes cuenta? <a href="/register" style={{ color: '#4CAF50', fontWeight: 'bold', textDecoration: 'none' }}>Regístrate aquí</a>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;