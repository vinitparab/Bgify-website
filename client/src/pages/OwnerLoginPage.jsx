import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function OwnerLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/owner/login', { email, password });
      if (res.data.success) {
        toast.success('Logged in successfully');
        navigate('/owners/admin');
      } else {
        toast.error(res.data.message || 'Invalid email or password');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex px-20">
      <div className="w-1/2 flex items-center justify-center h-screen">
        <div className="w-full px-32">
          <h4 className="text-2xl capitalize mb-5">Admin Access</h4>

          <form onSubmit={handleSubmit}>
            <input
              className="block bg-zinc-100 w-full px-3 py-2 border border-zinc-200 rounded-md mb-3"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="block bg-zinc-100 w-full px-3 py-2 border border-zinc-200 rounded-md mb-3"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 rounded-full py-3 mt-2 bg-blue-500 text-white hover:bg-blue-600 cursor-pointer transition-colors w-full border-none disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">Don&apos;t have an owner account?</p>
            <p className="text-xs text-gray-500 mt-2">Note: Only one owner account is allowed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
