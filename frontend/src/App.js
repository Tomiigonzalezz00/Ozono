import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Importación de componentes
// (Ajusta las rutas './components/...' si tus archivos están en otra carpeta)
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import ChatbotOzono from './components/ChatbotOzono';
import Calendario from './components/Calendario';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/chatbot_ozono" element={<ChatbotOzono />} />
          <Route path="/Calendario" element={<Calendario />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;