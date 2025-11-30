import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import './Login.css'; // Usamos los estilos del Login

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
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
      setMessage('¡Contraseña actualizada con éxito!');
      // Esperar 2 segundos y redirigir
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError('El enlace es inválido o ha expirado.');
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
        <h2>NUEVA CONTRASEÑA</h2>
        <p style={{fontSize: '14px', color: '#666', marginBottom: '20px'}}>
            Ingresa tu nueva contraseña a continuación.
        </p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nueva contraseña"
            required
            style={{ marginBottom: '10px' }}
          />
           <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirmar contraseña"
            required
            style={{ marginBottom: '15px' }}
          />
          
          {message && <div style={{ color: '#155724', backgroundColor: '#d4edda', padding: '10px', borderRadius: '5px', fontSize: '14px', marginBottom: '10px' }}>{message}</div>}
          {error && <div style={{ color: '#721c24', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '5px', fontSize: '14px', marginBottom: '10px' }}>{error}</div>}
          
          <button type="submit">Cambiar Contraseña</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;