import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import FacebookLogin from 'react-facebook-login';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false); // Estado para recordar
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login/', {
        username,
        password,
      });
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard'); // Redirige a un dashboard u otra ruta
    } catch (error) {
      console.error('There was an error!', error);
    }
  };

  const responseFacebook = (response) => {
    console.log(response);
    // Maneja la respuesta de Facebook aquí
    if (response.accessToken) {
      // Autenticación exitosa
      localStorage.setItem('fb_token', response.accessToken);
      navigate('/Home'); // Redirige al dashboard o a otra página
    } else {
      console.error('Facebook login failed:', response);
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
            placeholder="Introduce tu correo electrónico"
          />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
          />
          <div className="remember-me">
            <div className="switch" onClick={() => setRememberMe(prevState => !prevState)}>
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(prevState => !prevState)}
              />
              <span className="slider"></span>
            </div>
            <label htmlFor="rememberMe">Recordarme</label>
            <a href="/forgot-password" className="forgot-password">Olvidé mi contraseña</a>
          </div>
          <button type="submit">Ingresar</button>
        </form>
        <div className="facebook-login">
          <FacebookLogin
            appId="8360898643928334"
            autoLoad={false} // Cambia a true si quieres que el login se cargue automáticamente
            fields="name,email,picture"
            callback={responseFacebook}
            textButton="Inicia sesión con Facebook"
            icon="fa-facebook"
            cssClass="facebook-button" // Cambia esto a la clase personalizada
          />
        </div>  
      </div>
    </div>
  );
};

export default Login;