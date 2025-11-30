import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Login.css'; // Usamos los estilos del Login

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
      setMessage('Si el correo existe, te hemos enviado un enlace.');
    } catch (err) {
      setError('Error al procesar la solicitud.');
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
        <h2>RECUPERAR CONTRASEÑA</h2>
        <p style={{fontSize: '14px', color: '#666', marginBottom: '20px'}}>
            Ingresa tu email y te enviaremos las instrucciones.
        </p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Tu correo electrónico"
            required
            style={{ marginBottom: '15px' }}
          />
          
          {/* Mensajes de feedback */}
          {message && <div style={{ color: '#155724', backgroundColor: '#d4edda', padding: '10px', borderRadius: '5px', fontSize: '14px', marginBottom: '10px', border: '1px solid #c3e6cb' }}>{message}</div>}
          {error && <div style={{ color: '#721c24', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '5px', fontSize: '14px', marginBottom: '10px', border: '1px solid #f5c6cb' }}>{error}</div>}
          
          <button type="submit">Enviar Enlace</button>
        </form>

        <div style={{ marginTop: '20px' }}>
            <Link to="/login" style={{ color: '#006400', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px' }}>
                <i className="fa fa-arrow-left"></i> Volver al Login
            </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;