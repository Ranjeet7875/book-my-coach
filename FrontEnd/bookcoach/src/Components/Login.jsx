import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css'


const Login = () => {
    const [details, setDetails] = useState({ email: '', password: '' });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setDetails({ ...details, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:4000/register/login', details);
            localStorage.setItem('token', res.data.token);
            alert('Login Successful');
            console.log(res.data.token)
            navigate('/book');
        } catch (error) {
            alert(error.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="container">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input type="email" name="email" placeholder="Email" value={details.email} onChange={handleChange} required />
                <input type="password" name="password" placeholder="Password" value={details.password} onChange={handleChange} required />
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;
