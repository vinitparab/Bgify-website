import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { RiReceiptLine, RiTimeLine, RiCheckboxCircleLine, RiTruckLine, RiPhoneLine, RiMailLine, RiShoppingBagLine, RiMoneyRupeeCircleLine, RiCalendarCheckLine, RiFileListLine, RiStore2Line, RiImageLine } from 'react-icons/ri';

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data.order);
      setEstimatedDeliveryDate(new Date(res.data.estimatedDeliveryDate));
    } catch {
      toast.error('Failed to load order details');
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

  if (!order) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-xl">Order not found</p>
      </div>
    );
  }

  const totalItemQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const itemsTotal = order.items.reduce((sum, item) => sum + item.finalPrice, 0);
  const originalTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalSavings = originalTotal - order.total;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8 animate-[fadeInUp_0.6s_ease-out]">
          <div className="inline-block relative animate-[scaleIn_0.5s_ease-out]">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl">
              <svg className="w-20 h-20 text-white" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M14 27l8 8 16-16" />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">Order Placed Successfully!</h1>
          <p className="text-lg text-gray-600 mb-2">Thank you for your purchase. We&apos;re preparing your order.</p>
          <p className="text-sm text-gray-500">
            Order ID: <span className="font-semibold text-gray-700">{order.orderId}</span>
          </p>
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
          {/* Invoice Header */}
          <div className="bg-gradient-to-r from-black to-gray-800 text-white px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <RiReceiptLine /> Order Invoice
                </h2>
                <p className="text-gray-300 text-sm mt-1">
                  Order Date: {new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-300">Order Status</div>
                <div className="text-lg font-semibold capitalize mt-1">
                  {order.status === 'pending' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300">
                      <RiTimeLine /> Pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-300">
                      <RiCheckboxCircleLine /> Paid
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Shipping Address */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <RiTruckLine className="text-blue-600" /> Delivery Address
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-800">{order.shippingAddress.fullname}</p>
                <p className="text-gray-600 mt-1">{order.shippingAddress.address}</p>
                <p className="text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                <p className="text-gray-600 mt-1">
                  <RiPhoneLine className="inline" /> {order.shippingAddress.contact} | <RiMailLine className="inline" /> {order.shippingAddress.email}
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <RiShoppingBagLine className="text-blue-600" /> Order Items
              </h3>
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                      {item.product ? (
                        <img src={`/api/images/product/${item.product._id || item.product}`} alt={item.productName} className="w-full h-full object-contain" />
                      ) : (
                        <RiImageLine className="text-3xl text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{item.productName}</h4>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      {item.discount > 0 ? (
                        <p className="text-sm text-gray-500">
                          <span className="line-through">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                          <span className="ml-2 text-green-600 font-semibold">₹{item.finalPrice.toLocaleString('en-IN')}</span>
                        </p>
                      ) : (
                        <p className="text-sm text-gray-700 font-semibold">₹{item.finalPrice.toLocaleString('en-IN')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 mb-4">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal ({totalItemQty} items)</span>
                  <span className="font-semibold">₹{itemsTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Shipping</span>
                  <span className="font-semibold text-green-600">FREE</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                    <span className="text-red-600 font-medium">You Saved</span>
                    <span className="text-red-600 font-bold">₹{Math.round(totalSavings).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center pt-4 mt-4 border-t-2 border-gray-300">
                <span className="text-xl font-bold text-gray-800">Total Amount</span>
                <span className="text-2xl font-bold text-gray-900">₹{order.total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <RiMoneyRupeeCircleLine className="text-blue-600" /> Payment Method
              </h3>
              <div className="flex items-center gap-2">
                <RiMoneyRupeeCircleLine className="text-2xl text-green-600" />
                <span className="text-gray-700">Cash on Delivery (COD)</span>
              </div>
            </div>

            {/* Estimated Delivery */}
            {estimatedDeliveryDate && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border-2 border-green-200">
                <div className="flex items-start gap-3">
                  <div className="bg-green-500 rounded-full p-2 mt-1">
                    <RiCalendarCheckLine className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Estimated Delivery</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {estimatedDeliveryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Your order will be delivered within 5-7 business days</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/orders" className="flex-1 bg-white border-2 border-gray-300 text-gray-700 text-center py-3 rounded-xl hover:bg-gray-50 transition-all text-base font-semibold shadow-md hover:shadow-lg no-underline">
            <RiFileListLine className="inline mr-2" />View All Orders
          </Link>
          <Link to="/shop" className="flex-1 bg-gradient-to-r from-black to-gray-800 text-white text-center py-3 rounded-xl hover:from-gray-800 hover:to-black transition-all text-base font-semibold shadow-md hover:shadow-lg no-underline">
            <RiStore2Line className="inline mr-2" />Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
