import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom'; // Importamos Link
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); 
  // const [rememberMe, setRememberMe] = useState(false); // Ya no se usa
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 

    try {
      const response = await axios.post('http://localhost:8000/api/login/', {
        username,
        password,
      });

      const token = response.data.token;
      
      // Guardamos siempre en localStorage (Sesión persistente)
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      
      // Limpieza preventiva de sessionStorage
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('username');

      console.log("Login exitoso");
      navigate('/home');

    } catch (err) {
      console.error('Login error:', err);
      if (err.response) {
        if (err.response.status === 400) {
           setError('Usuario o contraseña incorrectos.');
        } else {
           setError('Error en el servidor. Intenta más tarde.');
        }
      } else {
         setError('Error de conexión con el servidor.');
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

          {error && <p style={{ color: 'red', fontSize: '14px', margin: '5px 0' }}>{error}</p>}

          <div className="remember-me">
            {/* --- BOTÓN RECÚERDAME (Deshabilitado temporalmente) ---
            <div className="switch" onClick={() => setRememberMe(prevState => !prevState)}>
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                readOnly 
              />
              <span className="slider"></span>
            </div>
            <label htmlFor="rememberMe">Recordarme</label> 
            */}
            
            <Link to="/forgot-password" className="forgot-password">Olvidé mi contraseña</Link>
          </div>
          
          <button type="submit">Ingresar</button>
        </form>
        
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px' }}>
                ¿No tienes cuenta? <Link to="/register" style={{ color: '#4CAF50', fontWeight: 'bold', textDecoration: 'none' }}>Regístrate aquí</Link>
            </p>
        </div>

      </div>
    </div>
  );
};

export default Login;