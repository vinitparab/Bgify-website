import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { RiUserAddLine, RiLoginBoxLine } from 'react-icons/ri';

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    try {
      const data = await register(regName, regEmail, regPassword);
      if (data.success) {
        toast.success(data.message || 'Registered Successfully');
        setRegName('');
        setRegEmail('');
        setRegPassword('');
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const data = await login(loginEmail, loginPassword);
      if (data.success) {
        toast.success('Welcome back!');
        navigate('/shop');
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email or Password is incorrect');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center py-16 px-10">
      <div className="bg-white/70 backdrop-blur-md shadow-2xl rounded-2xl w-full max-w-5xl flex overflow-hidden border border-gray-200">

        {/* Register Section */}
        <div className="w-1/2 p-10 bg-white/60 backdrop-blur-lg">
          <h2 className="text-3xl font-bold mb-2 text-gray-800">
            Join <span className="text-blue-600">Scatch</span>
          </h2>
          <p className="text-sm text-gray-600 mb-6">Create your account to start shopping</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <button
              type="submit"
              disabled={regLoading}
              className="w-full py-3 mt-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              <RiUserAddLine className="inline mr-2" />
              {regLoading ? 'Creating...' : 'Create My Account'}
            </button>
          </form>
        </div>

        {/* Login Section */}
        <div className="w-1/2 p-10 bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
          <p className="text-sm text-gray-200 mb-6">Login to continue your shopping experience</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-white/80 mb-1">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-white/30 rounded-md bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
                required
              />
            </div>
            <div>
              <label className="block text-white/80 mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-white/30 rounded-md bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 mt-3 bg-white text-blue-600 hover:bg-gray-100 font-semibold rounded-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <RiLoginBoxLine className="inline mr-2" />
              {loginLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
