import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { RiNotification3Line, RiShoppingCartLine, RiStackLine, RiSaveLine, RiLogoutBoxLine } from 'react-icons/ri';

export default function AdminPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stockValues, setStockValues] = useState({});

  useEffect(() => {
    fetchAdmin();
  }, []);

  const fetchAdmin = async () => {
    try {
      const res = await api.get('/owner/admin');
      setProducts(res.data.products || []);
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
      // Init stock values
      const stocks = {};
      (res.data.products || []).forEach((p) => { stocks[p._id] = p.stock ?? 0; });
      setStockValues(stocks);
    } catch {
      toast.error('Access denied or failed to load');
      navigate('/owners/login');
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId) => {
    try {
      await api.post(`/products/${productId}/stock`, { stock: stockValues[productId] });
      toast.success('Stock updated');
    } catch {
      toast.error('Failed to update stock');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/owner/logout');
      toast.success('Logged out');
      navigate('/owners/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-start px-20 py-20">
      {/* Sidebar */}
      <div className="w-[25%] flex flex-col items-start">
        <div className="flex flex-col">
          <Link to="/owners/admin" className="block w-fit mb-2 text-gray-700 no-underline hover:text-blue-600">All Products</Link>
          <Link to="/owners/createproducts" className="block w-fit mb-2 text-gray-700 no-underline hover:text-blue-600">Create new product</Link>
          <button onClick={handleLogout} className="text-red-500 hover:text-red-700 font-medium mt-4 bg-transparent border-none cursor-pointer text-left">
            <RiLogoutBoxLine className="inline mr-1" />Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-[75%] flex flex-col gap-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-red-500 cursor-pointer">Delete all</span>
          {unreadCount > 0 && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <div className="relative">
                <RiNotification3Line className="text-2xl text-blue-600" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{unreadCount}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{unreadCount} New Order{unreadCount > 1 ? 's' : ''}</p>
                <p className="text-xs text-gray-600">Check notifications below</p>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <RiShoppingCartLine className="text-blue-600" /> Recent Orders
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {notifications.slice(0, 5).map((n, idx) => (
                <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">
                        <RiShoppingCartLine className="inline text-blue-600 mr-1" /> Order #{n.orderId}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Customer: <span className="font-medium">{n.customerName}</span></p>
                      <p className="text-xs text-gray-600">Email: <span className="font-medium">{n.customerEmail}</span></p>
                      <p className="text-xs text-gray-600 mt-1">Total: <span className="font-bold text-green-600">₹{n.orderTotal?.toLocaleString('en-IN')}</span></p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(n.orderDate).toLocaleString('en-IN')}</p>
                    </div>
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">New</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-4 gap-5">
          {products.length > 0 ? (
            products.map((product) => (
              <div key={product._id} className="w-60 bg-white rounded-lg shadow-md overflow-hidden">
                <div className="w-full h-52 flex items-center justify-center" style={{ backgroundColor: product.bgcolor || '#f3f4f6' }}>
                  <img className="h-48 object-contain" src={`/api/images/product/${product._id}`} alt={product.name} />
                </div>
                <div className="px-4 py-4" style={{ backgroundColor: product.panelcolor || '#fff', color: product.textcolor || '#1f2937' }}>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      {product.discount > 0 ? (
                        <div>
                          <span className="line-through text-gray-400">₹ {product.price}</span>
                          <span className="ml-2 text-green-600 font-bold">₹ {(product.price - (product.price * product.discount) / 100).toFixed(2)}</span>
                        </div>
                      ) : (
                        <h4 className="font-semibold">₹ {product.price}</h4>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-300/30">
                    <div className="flex items-center gap-2">
                      <RiStackLine className="text-sm" />
                      <span className="text-sm font-medium">
                        Stock: <span className={`font-bold ${(product.stock ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>{product.stock ?? 0}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={stockValues[product._id] ?? 0}
                        onChange={(e) => setStockValues((prev) => ({ ...prev, [product._id]: Number(e.target.value) }))}
                        className="w-20 px-2 py-1 text-xs border border-gray-300 rounded bg-white text-gray-800"
                      />
                      <button
                        onClick={() => updateStock(product._id)}
                        className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors cursor-pointer border-none"
                      >
                        <RiSaveLine className="inline" /> Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No products found. Create your first product!</p>
          )}
        </div>
      </div>
    </div>
  );
}
