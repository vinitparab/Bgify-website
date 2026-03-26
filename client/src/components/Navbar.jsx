import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  RiStoreLine,
  RiShoppingCartLine,
  RiUserLine,
  RiArrowDownSLine,
  RiHandbagLine,
  RiFileListLine,
  RiLogoutBoxLine,
} from 'react-icons/ri';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="w-full sticky top-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Brand Logo */}
        <Link to={user ? '/shop' : '/'} className="flex items-center gap-3 no-underline">
          <h3 className="text-3xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 hover:scale-105 transition-transform cursor-pointer">
            Bagify
          </h3>
          <RiHandbagLine className="text-green-500 text-2xl" />
        </Link>

        {/* Links & Account (only shown when logged in) */}
        {user && (
          <div className="flex items-center gap-6">
            {/* Shop Link */}
            <Link to="/shop" className="flex items-center gap-1 text-gray-700 hover:text-green-600 transition no-underline">
              <RiStoreLine /> Shop
            </Link>

            {/* Cart Icon */}
            <Link to="/cart" className="flex items-center gap-1 text-gray-700 hover:text-green-600 transition no-underline">
              <RiShoppingCartLine className="text-2xl" /> Cart
            </Link>

            {/* Account Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1 text-gray-700 hover:text-green-600 transition font-medium bg-transparent border-none cursor-pointer text-base"
              >
                <RiUserLine /> My Account <RiArrowDownSLine />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md border border-gray-100 overflow-hidden">
                  <Link
                    to="/orders"
                    className="block px-4 py-2 hover:bg-gray-100 text-gray-700 no-underline text-sm"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <RiFileListLine className="inline mr-2" />Orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 bg-transparent border-none cursor-pointer text-sm"
                  >
                    <RiLogoutBoxLine className="inline mr-2" />Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
