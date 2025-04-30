import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Components/Navbar';
import Signup from './Components/Signup';
import Login from './Components/Login';
import Seatbook from './Components/Seatbook';
import './App.css'


const App = () => {
  return (
    <Router>
      <Navbar /> 
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/book" element={<Seatbook />} />
      </Routes>
    </Router>
  );
};

export default App;
