import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import './Login.css';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Obtenemos el token y el uid de la URL
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      await axios.post('http://localhost:8000/api/password_reset/confirm/', {
        uid,
        token,
        new_password: newPassword
      });
      setMessage('¡Contraseña actualizada! Redirigiendo al login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError('El enlace es inválido o ha expirado.');
    }
  };

  return (
    <div className="register-container">
      <div className="top-bar">
        <img src="/images/logoOzono.png" alt="OZONO" className="brand-image" />
      </div>
      <div className="register-form">
        <h2>NUEVA CONTRASEÑA</h2>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nueva contraseña"
            required
          />
           <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirmar contraseña"
            required
          />
          
          {message && <p style={{ color: 'green', fontSize: '14px' }}>{message}</p>}
          {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
          
          <button type="submit">Cambiar Contraseña</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;