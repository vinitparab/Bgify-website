import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { RiShoppingBag3Line, RiTruckLine, RiWallet3Line, RiShieldCheckLine } from 'react-icons/ri';

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setCart(res.data.cart || []);
    } catch (err) {
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId) => {
    try {
      await api.post(`/cart/remove/${productId}`);
      setCart((prev) => prev.filter((item) => item.product?._id !== productId));
      toast.success('Item removed');
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const increaseQty = async (productId) => {
    try {
      const res = await api.post(`/cart/increase/${productId}`);
      if (res.data.success) {
        fetchCart();
      } else {
        toast.error(res.data.message || 'Failed to update');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update quantity');
    }
  };

  const decreaseQty = async (productId) => {
    try {
      await api.post(`/cart/decrease/${productId}`);
      fetchCart();
    } catch (err) {
      toast.error('Failed to update quantity');
    }
  };

  const validItems = cart.filter((item) => item.product);
  const totalItems = validItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = validItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 px-4 sm:px-6 lg:px-10 py-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* LEFT: Cart Items */}
      <div className="w-full lg:w-2/3 space-y-6">
        <div className="flex items-center justify-between border-b-2 border-gray-300 pb-4">
          <h2 className="text-3xl font-bold text-gray-800">Shopping Cart</h2>
          <span className="text-sm text-gray-600">{validItems.length} Items</span>
        </div>

        {validItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Add some products to get started!</p>
            <Link
              to="/shop"
              className="inline-block bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 transition-all transform hover:scale-105 no-underline"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          validItems.map((item) => (
            <div key={item.product._id} className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="w-full sm:w-1/3 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6 relative">
                  <img
                    className="h-48 w-full object-contain transform group-hover:scale-105 transition-transform duration-300"
                    src={`/api/images/product/${item.product._id}`}
                    alt={item.product.name}
                  />
                </div>

                {/* Info */}
                <div className="w-full sm:w-2/3 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-500">Size: XS • Color: Default</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.product._id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2 bg-transparent border-none cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl font-bold text-gray-900">
                        ₹{item.product.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    {/* Quantity Controls */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center bg-gray-100 rounded-full p-1">
                        <button
                          onClick={() => decreaseQty(item.product._id)}
                          className="w-9 h-9 rounded-full bg-white text-gray-700 font-bold flex items-center justify-center hover:bg-gray-200 transition-all shadow-sm hover:shadow cursor-pointer border-none"
                        >
                          −
                        </button>
                        <span className="text-lg font-semibold mx-4 min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => increaseQty(item.product._id)}
                          disabled={(item.product.stock ?? 0) <= item.quantity}
                          className="w-9 h-9 rounded-full bg-white text-gray-700 font-bold flex items-center justify-center hover:bg-gray-200 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Stock: <span className={`font-semibold ${(item.product.stock ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.product.stock ?? 0}
                        </span> available
                      </p>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Subtotal</p>
                      <p className="text-xl font-bold text-gray-900">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* RIGHT: Order Summary */}
      {validItems.length > 0 && (
        <div className="w-full lg:w-1/3 h-fit">
          <div className="bg-white shadow-xl rounded-2xl p-6 sticky top-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-200">
              <RiShoppingBag3Line className="text-2xl text-blue-600" />
              <h3 className="text-2xl font-bold text-gray-800">Order Summary</h3>
            </div>

            <div className="space-y-4 text-sm mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                <span className="font-semibold text-gray-900">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-2">
                  <RiTruckLine className="text-gray-400" /> Shipping
                </span>
                <span className="text-green-600 font-semibold flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  FREE
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="border-t-2 border-gray-300 pt-6 mb-6 bg-gradient-to-br from-gray-50 to-white -mx-6 px-6 py-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <RiWallet3Line className="text-blue-600" /> Total Amount
                </span>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  ₹{totalPrice.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="block w-full bg-gradient-to-r from-black to-gray-800 text-white text-center py-4 rounded-xl hover:from-gray-800 hover:to-black transition-all text-base font-semibold tracking-wide shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] no-underline"
            >
              PROCEED TO CHECKOUT
            </Link>

            {/* Security Badge */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
              <RiShieldCheckLine className="w-4 h-4 text-green-600" />
              <span>Secure Checkout • SSL Encrypted</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
