import React, { createContext, useState, useContext, useCallback } from 'react';
import './Notification.css';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState(null); // { message, type: 'success'|'error'|'info' }
    const [confirmation, setConfirmation] = useState(null); // { message, onConfirm }

    const showNotification = useCallback((message, type = 'info') => {
        setNotification({ message, type });
        // Auto-ocultar después de 3 segundos si es éxito o info
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                setNotification(null);
            }, 3000);
        }
    }, []);

    const showConfirm = useCallback((message, onConfirm) => {
        setConfirmation({ message, onConfirm });
    }, []);

    const closeNotification = () => setNotification(null);
    const closeConfirmation = () => setConfirmation(null);

    return (
        <NotificationContext.Provider value={{ showNotification, showConfirm }}>
            {children}

            {/* Modal de Notificación Global */}
            {notification && (
                <div className="custom-popup-overlay">
                    <div className={`custom-popup-content ${notification.type}`}>
                        <div className="popup-icon">
                            {notification.type === 'success' && <i className="fa fa-check-circle"></i>}
                            {notification.type === 'error' && <i className="fa fa-exclamation-circle"></i>}
                            {notification.type === 'info' && <i className="fa fa-info-circle"></i>}
                        </div>
                        <p>{notification.message}</p>
                        <button onClick={closeNotification}>Aceptar</button>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación Global */}
            {confirmation && (
                <div className="custom-popup-overlay">
                    <div className="custom-popup-content confirmation">
                        <div className="popup-icon">
                            <i className="fa fa-question-circle"></i>
                        </div>
                        <p>{confirmation.message}</p>
                        <div className="popup-actions">
                            <button className="cancel-btn" onClick={closeConfirmation}>Cancelar</button>
                            <button className="confirm-btn" onClick={() => { confirmation.onConfirm(); closeConfirmation(); }}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </NotificationContext.Provider>
    );
};
