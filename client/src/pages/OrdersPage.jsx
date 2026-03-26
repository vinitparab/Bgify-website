import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { RiShoppingBag3Line, RiStoreLine, RiCalendarLine, RiMapPinLine, RiPhoneLine, RiMailLine, RiMoneyRupeeCircleLine, RiShoppingBagLine } from 'react-icons/ri';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data.orders || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
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
    <div className="w-full min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <RiShoppingBag3Line className="text-blue-600" /> My Orders
          </h1>
          <Link to="/shop" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 no-underline">
            <RiStoreLine />Continue Shopping
          </Link>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-6">
            {[...orders].reverse().map((order, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-gray-200">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-800">Order #{order.orderId}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'paid' ? 'bg-green-100 text-green-700' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status === 'paid' ? 'Paid' : order.status === 'pending' ? 'Pending' : order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      <RiCalendarLine className="inline mr-1" />
                      {new Date(order.orderDate).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right mt-2 sm:mt-0">
                    <div className="text-2xl font-bold text-gray-900">₹{order.total.toLocaleString('en-IN')}</div>
                    <div className="text-sm text-gray-500">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-4 mb-6">
                  {order.items.map((orderItem, itemIdx) => (
                    <div key={itemIdx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                        {orderItem.product ? (
                          <img src={`/api/images/product/${orderItem.product._id || orderItem.product}`} alt={orderItem.productName} className="w-full h-full object-contain" />
                        ) : (
                          <RiShoppingBagLine className="text-3xl text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{orderItem.productName}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>Qty: {orderItem.quantity}</span>
                          {orderItem.discount > 0 ? (
                            <>
                              <span className="line-through text-gray-400">₹{(orderItem.price * orderItem.quantity).toLocaleString('en-IN')}</span>
                              <span className="text-green-600 font-semibold">₹{orderItem.finalPrice.toLocaleString('en-IN')}</span>
                            </>
                          ) : (
                            <span>₹{orderItem.finalPrice.toLocaleString('en-IN')}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">₹{orderItem.finalPrice.toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping Address */}
                {order.shippingAddress && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <RiMapPinLine className="text-blue-600" /> Shipping Address
                    </h4>
                    <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold text-gray-800">{order.shippingAddress.fullname}</p>
                      <p>{order.shippingAddress.address}</p>
                      <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                      <p className="mt-2">
                        <RiPhoneLine className="inline mr-1" />{order.shippingAddress.contact}
                        <span className="mx-2">•</span>
                        <RiMailLine className="inline mr-1" />{order.shippingAddress.email}
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment Info */}
                <div className="pt-4 border-t border-gray-200 mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-2">
                      <RiMoneyRupeeCircleLine className="text-green-600" />
                      <span>Payment: <span className="font-semibold text-gray-800">Cash on Delivery</span></span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-16 text-center">
            <RiShoppingBag3Line className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No Orders Yet</h3>
            <p className="text-gray-500 mb-6">You haven&apos;t placed any orders yet. Start shopping to see your orders here!</p>
            <Link to="/shop" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg no-underline">
              <RiStoreLine className="inline mr-2" />Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
