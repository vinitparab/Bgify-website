import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { RiLogoutBoxLine, RiShoppingCartLine } from 'react-icons/ri';

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/owner/orders');
      if (res.data.success) {
        setOrders(res.data.orders);
      } else {
        toast.error(res.data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      toast.error('Failed to load orders. Make sure you are logged in as admin.');
      navigate('/owners/login');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, userId, newStatus) => {
    try {
      const res = await api.post('/owner/orders/update-status', {
        orderId,
        userId,
        status: newStatus
      });
      if (res.data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        // Update local state to reflect change instantly
        setOrders(prev => prev.map(o => 
          o.orderId === orderId ? { ...o, status: newStatus } : o
        ));
      } else {
        toast.error('Failed to update status');
      }
    } catch {
      toast.error('Failed to update status');
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

  // Filter orders
  const filteredOrders = filter === 'All' 
    ? orders 
    : orders.filter(o => o.status === filter.toLowerCase());

  return (
    <div className="w-full min-h-screen flex items-start px-20 py-20 bg-gray-50">
      {/* Sidebar */}
      <div className="w-[25%] flex flex-col items-start">
        <div className="flex flex-col">
          <Link to="/owners/admin" className="block w-fit mb-2 text-gray-700 no-underline hover:text-blue-600">All Products</Link>
          <Link to="/owners/orders" className="block w-fit mb-2 text-blue-600 font-semibold no-underline">Orders</Link>
          <Link to="/owners/createproducts" className="block w-fit mb-2 text-gray-700 no-underline hover:text-blue-600">Create new product</Link>
          <button onClick={handleLogout} className="text-red-500 hover:text-red-700 font-medium mt-4 bg-transparent border-none cursor-pointer text-left">
            <RiLogoutBoxLine className="inline mr-1" />Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-[75%] flex flex-col gap-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <RiShoppingCartLine /> Order Management
          </h2>
          
          {/* Filters */}
          <div className="flex gap-2 text-sm">
            {['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered'].map(status => (
              <button 
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                  filter === status 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
            No orders found matching the filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.orderId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-shadow hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between border-b pb-4 mb-4 gap-4">
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">ORDER ID</span>
                    <span className="font-mono font-medium text-gray-800">#{order.orderId}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">DATE</span>
                    <span className="font-medium text-gray-800">{new Date(order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">TOTAL</span>
                    <span className="font-bold text-green-600">₹{order.total?.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">PAYMENT</span>
                    <span className="font-medium text-gray-800 uppercase text-sm border px-2 py-0.5 rounded bg-gray-50">{order.paymentMethod}</span>
                  </div>
                  <div className="flex items-center gap-2 border-l pl-4">
                    <span className="text-sm font-semibold text-gray-700">Status:</span>
                    <select
                      value={order.status || 'pending'}
                      onChange={(e) => handleStatusChange(order.orderId, order.userId, e.target.value)}
                      className={`text-sm font-semibold rounded-md border-0 py-1.5 px-3 focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Customer Info */}
                  <div className="w-full md:w-1/3 bg-gray-50 rounded-lg p-4 text-sm">
                    <h4 className="font-semibold text-gray-800 mb-2 border-b pb-2">Customer Details</h4>
                    <p className="mb-1"><span className="text-gray-500">Name:</span> {order.customerName}</p>
                    <p className="mb-1"><span className="text-gray-500">Email:</span> {order.customerEmail}</p>
                    <p className="mb-1"><span className="text-gray-500">Contact:</span> {order.shippingAddress?.contact}</p>
                    <div className="mt-2 text-gray-600">
                      <span className="text-gray-500 block">Address:</span>
                      {order.shippingAddress?.address}<br/>
                      {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="w-full md:w-2/3">
                    <h4 className="font-semibold text-gray-800 mb-2 text-sm border-b pb-2">Order Items</h4>
                    <div className="space-y-3 mt-3">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 border flex items-center justify-center shrink-0" style={{ backgroundColor: item.product?.bgcolor || '#f3f4f6' }}>
                               {item.product && <img src={`/api/images/product/${item.product._id}`} alt={item.product.name} className="h-8 object-contain" />}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-800">{item.product ? item.product.name : 'Unknown Product'}</p>
                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-gray-800">
                            ₹{item.product ? (item.product.price - (item.product.price * item.product.discount / 100)) * item.quantity : 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
