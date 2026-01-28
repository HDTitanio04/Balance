import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/admin/login`, {
        username,
        password
      });

      if (response.data.success) {
        login(response.data.token);
        navigate('/admin');
      }
    } catch (err) {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20 flex items-center justify-center" data-testid="admin-login-page">
      <div className="w-full max-w-md px-4">
        <div className="bg-[#121212] border border-white/5 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#C08040]/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-[#C08040]" />
            </div>
            <h1 className="font-['Playfair_Display'] text-2xl font-bold text-white">
              Panel de Administración
            </h1>
            <p className="text-zinc-500 text-sm mt-2">
              Accede con tus credenciales de administrador
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Introduce tu usuario"
                className="w-full px-4 py-3 bg-[#171717] border border-white/10 focus:border-[#C08040] text-white"
                data-testid="login-username"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduce tu contraseña"
                  className="w-full px-4 py-3 bg-[#171717] border border-white/10 focus:border-[#C08040] text-white pr-12"
                  data-testid="login-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C08040] text-black py-3 font-semibold hover:bg-[#D4A060] transition-colors disabled:opacity-50"
              data-testid="login-submit"
            >
              {loading ? 'Accediendo...' : 'Acceder'}
            </button>
          </form>

          <p className="text-center text-zinc-600 text-xs mt-6">
            Usuario: Admin | Contraseña: Admin
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
