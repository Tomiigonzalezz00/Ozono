import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Login.css';
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await axios.post('http://localhost:8000/api/password_reset/', { email });
      setMessage('Si el correo está registrado, recibirás un enlace en breve.');
    } catch (err) {
      setError('Hubo un error al procesar la solicitud.');
    }
  };

  return (
    <div className="register-container">
      <div className="top-bar">
        <img src="/images/logoOzono.png" alt="OZONO" className="brand-image" />
      </div>
      <div className="register-form">
        <h1 className="ozono-title">
            <img src="/images/logoOzonoajustado.png" alt="OZONO" className="ozono-title-image" />
        </h1>
        <h2>RECUPERAR CONTRASEÑA</h2>
        <p style={{fontSize: '14px', marginBottom: '20px'}}>Ingresa tu email y te enviaremos un enlace.</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Tu correo electrónico"
            required
          />
          
          {message && <p style={{ color: 'green', fontSize: '14px', marginBottom: '10px' }}>{message}</p>}
          {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>{error}</p>}
          
          <button type="submit">Enviar Enlace</button>
        </form>

        <div style={{ marginTop: '20px' }}>
            <Link to="/login" style={{ color: '#006400', fontSize: '14px', textDecoration: 'none', fontWeight: 'bold' }}>Volver al Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;