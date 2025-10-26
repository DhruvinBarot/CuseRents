import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, User, Phone } from 'lucide-react';

const AuthModal = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login
        const result = await login(formData.username, formData.password);
        if (result.success) {
          onClose();
        } else {
          setError(result.error?.detail || 'Invalid credentials');
        }
      } else {
        // Register
        if (formData.password !== formData.password_confirm) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        
        const result = await register(formData);
        if (result.success) {
          onClose();
        } else {
          const errorMsg = result.error?.email?.[0] || 
                          result.error?.username?.[0] || 
                          result.error?.password?.[0] || 
                          'Registration failed';
          setError(errorMsg);
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <h2 className="modal-title">
          {isLogin ? 'Welcome Back!' : 'Join CuseRents'}
        </h2>
        <p className="modal-subtitle">
          {isLogin ? 'Login to continue' : 'Create your account'}
        </p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="form-row">
                <div className="input-group">
                  <User size={20} className="input-icon" />
                  <input
                    type="text"
                    name="first_name"
                    placeholder="First Name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="auth-input"
                  />
                </div>
                <div className="input-group">
                  <User size={20} className="input-icon" />
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Last Name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="input-group">
                <Mail size={20} className="input-icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="auth-input"
                />
              </div>

              <div className="input-group">
                <Phone size={20} className="input-icon" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone (optional)"
                  value={formData.phone}
                  onChange={handleChange}
                  className="auth-input"
                />
              </div>
            </>
          )}

          <div className="input-group">
            <User size={20} className="input-icon" />
            <input
              type="text"
              name="username"
              placeholder={isLogin ? "Username or Email" : "Username"}
              value={formData.username}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>

          <div className="input-group">
            <Lock size={20} className="input-icon" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>

          {!isLogin && (
            <div className="input-group">
              <Lock size={20} className="input-icon" />
              <input
                type="password"
                name="password_confirm"
                placeholder="Confirm Password"
                value={formData.password_confirm}
                onChange={handleChange}
                required
                className="auth-input"
              />
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            className="switch-button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;