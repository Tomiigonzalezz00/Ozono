import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home'; // Importa el nuevo componente Home
import ConsejosRRR from './components/ConsejosRRR';
import Consejos2 from './components/Consejos2';
import Consejos4 from './components/Consejos4';
import Consejos5 from './components/Consejos5';
import Consejos6 from './components/Consejos6';
import Consejos7 from './components/Consejos7';
import Consejos8 from './components/Consejos8';


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} /> {/* Agrega la ruta para Home */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/consejosRRR" element={<ConsejosRRR />} />
          <Route path="/consejos2" element={<Consejos2 />} />
          <Route path="/consejos4" element={<Consejos4 />} />
          <Route path="/consejos5" element={<Consejos5 />} />
          <Route path="/consejos6" element={<Consejos6 />} />
          <Route path="/consejos7" element={<Consejos7 />} />
          <Route path="/consejos8" element={<Consejos8 />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;