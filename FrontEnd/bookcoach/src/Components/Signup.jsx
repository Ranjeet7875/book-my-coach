import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


const Signup = () => {
    const [details, setDetails] = useState({ name: '', email: '', password: '' });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setDetails({ ...details, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:4000/register/signup', details);
            alert('Signup Successful');
            navigate('/login');
        } catch (error) {
            alert(error.response?.data?.message || 'Signup failed');
        }
    };

    return (
        <div className="container">
            <h2>Signup</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="name" placeholder="Name" value={details.name} onChange={handleChange} required />
                <input type="email" name="email" placeholder="Email" value={details.email} onChange={handleChange} required />
                <input type="password" name="password" placeholder="Password" value={details.password} onChange={handleChange} required />
                <button type="submit">Signup</button>
            </form>
        </div>
    );
};

export default Signup;
