import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { RiTruckLine, RiMoneyRupeeCircleLine, RiSecurePaymentLine, RiShoppingBagLine, RiWallet3Line, RiCheckboxCircleLine, RiArrowLeftLine, RiBankCardLine } from 'react-icons/ri';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  const [form, setForm] = useState({
    fullname: '',
    email: '',
    contact: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'cod',
  });

  useEffect(() => {
    fetchCheckoutData();
  }, []);

  const fetchCheckoutData = async () => {
    try {
      const res = await api.get('/cart');
      if (!res.data.cart || res.data.cart.length === 0) {
        toast.error('Your cart is empty');
        navigate('/cart');
        return;
      }
      setCart(res.data.cart.filter((item) => item.product));
      // Pre-fill user info
      if (res.data.user) {
        setForm((prev) => ({
          ...prev,
          fullname: res.data.user.fullname || '',
          email: res.data.user.email || '',
          contact: res.data.user.contact || '',
        }));
      }
    } catch {
      toast.error('Failed to load checkout');
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-sdk')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-sdk';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPlacing(true);

    try {
      if (form.paymentMethod === 'cod') {
        // Existing COD flow
        const res = await api.post('/orders/checkout', form);
        if (res.data.success) {
          navigate(`/order-success/${res.data.orderId}`);
        } else {
          toast.error(res.data.message || 'Failed to place order');
        }
      } else {
        // Online Payment via Razorpay
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          toast.error('Failed to load payment gateway. Check your internet connection.');
          setPlacing(false);
          return;
        }

        // Step 1: Create Razorpay order on backend
        const orderRes = await api.post('/orders/create-razorpay-order');
        if (!orderRes.data.success) {
          toast.error(orderRes.data.message || 'Failed to initiate payment');
          setPlacing(false);
          return;
        }

        const { razorpayOrderId, amount, currency, keyId } = orderRes.data;

        // Step 2: Open Razorpay popup
        const options = {
          key: keyId,
          amount,
          currency,
          name: 'Bgify Store',
          description: 'Order Payment',
          order_id: razorpayOrderId,
          prefill: {
            name: form.fullname,
            email: form.email,
            contact: form.contact,
          },
          theme: { color: '#3B82F6' },
          handler: async (response) => {
            // Step 3: Verify payment on backend
            try {
              const verifyRes = await api.post('/orders/verify-payment', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                shippingDetails: form,
              });
              if (verifyRes.data.success) {
                navigate(`/order-success/${verifyRes.data.orderId}`);
              } else {
                toast.error(verifyRes.data.message || 'Payment verification failed');
              }
            } catch (err) {
              toast.error(err.response?.data?.message || 'Payment verification failed');
            }
          },
          modal: {
            ondismiss: () => {
              toast.error('Payment cancelled');
              setPlacing(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          toast.error(`Payment failed: ${response.error.description}`);
          setPlacing(false);
        });
        rzp.open();
        // Note: setPlacing(false) is not called here because it runs after payment popup interaction
        return;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  // Calculate totals
  const subtotal = cart.reduce((acc, item) => {
    const itemPrice =
      item.product.discount > 0
        ? item.product.price - (item.product.price * item.product.discount) / 100
        : item.product.price;
    return acc + Math.round(itemPrice * item.quantity);
  }, 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Shipping & Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <RiTruckLine className="text-blue-600" />
                Shipping Address
              </h2>

              <form onSubmit={handleSubmit} id="checkoutForm" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                    <input type="text" name="fullname" value={form.fullname} onChange={handleChange} required className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number <span className="text-red-500">*</span></label>
                  <input type="tel" name="contact" value={form.contact} onChange={handleChange} required pattern="[0-9]{10}" placeholder="10 digit mobile number" className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address <span className="text-red-500">*</span></label>
                  <textarea name="address" value={form.address} onChange={handleChange} required rows="3" placeholder="House/Flat No., Building Name, Street" className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
                    <input type="text" name="city" value={form.city} onChange={handleChange} required className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">State <span className="text-red-500">*</span></label>
                    <input type="text" name="state" value={form.state} onChange={handleChange} required className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">PIN Code <span className="text-red-500">*</span></label>
                    <input type="text" name="pincode" value={form.pincode} onChange={handleChange} required pattern="[0-9]{6}" placeholder="6 digits" className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors" />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <RiMoneyRupeeCircleLine className="text-green-600" />
                    Payment Method
                  </h3>
                  <div className="space-y-3">
                    {/* COD Option */}
                    <label className={`flex items-center p-5 border-2 rounded-lg cursor-pointer transition-colors shadow-sm ${
                      form.paymentMethod === 'cod'
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                      <input type="radio" name="paymentMethod" value="cod" checked={form.paymentMethod === 'cod'} onChange={handleChange} className="mr-3 w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <div className="font-bold text-gray-800 text-lg mb-1">Cash on Delivery (COD)</div>
                        <div className="text-sm text-gray-600">Pay when you receive your order</div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                            <RiSecurePaymentLine className="inline mr-1" />Secure &amp; Easy
                          </span>
                        </div>
                      </div>
                      <RiMoneyRupeeCircleLine className="text-3xl text-green-600" />
                    </label>

                    {/* Online Payment Option */}
                    <label className={`flex items-center p-5 border-2 rounded-lg cursor-pointer transition-colors shadow-sm ${
                      form.paymentMethod === 'online'
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                      <input type="radio" name="paymentMethod" value="online" checked={form.paymentMethod === 'online'} onChange={handleChange} className="mr-3 w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <div className="font-bold text-gray-800 text-lg mb-1">Pay Online</div>
                        <div className="text-sm text-gray-600">UPI · Credit/Debit Card · Net Banking</div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                            <RiSecurePaymentLine className="inline mr-1" />Powered by Razorpay
                          </span>
                        </div>
                      </div>
                      <RiBankCardLine className="text-3xl text-blue-600" />
                    </label>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 sticky top-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <RiShoppingBagLine className="text-blue-600" />
                Order Summary
              </h2>

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {cart.map((item) => {
                  const itemPrice =
                    item.product.discount > 0
                      ? item.product.price - (item.product.price * item.product.discount) / 100
                      : item.product.price;
                  return (
                    <div key={item.product._id} className="flex items-center gap-3 pb-3 border-b border-gray-100">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        <img src={`/api/images/product/${item.product._id}`} alt={item.product.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 text-sm truncate">{item.product.name}</div>
                        <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                        <div className="text-sm font-bold text-gray-900">₹{Math.round(itemPrice * item.quantity).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                  <span className="font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <RiTruckLine className="text-gray-400" /> Shipping
                  </span>
                  <span className="text-green-600 font-semibold">FREE</span>
                </div>
              </div>

              {/* Total */}
              <div className="border-t-2 border-gray-300 pt-6 mb-6 bg-gradient-to-br from-gray-50 to-white -mx-6 px-6 py-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <RiWallet3Line className="text-blue-600" /> Total Amount
                  </span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                type="submit"
                form="checkoutForm"
                disabled={placing}
                className="w-full bg-gradient-to-r from-black to-gray-800 text-white text-center py-4 rounded-xl hover:from-gray-800 hover:to-black transition-all text-base font-semibold tracking-wide shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-none disabled:opacity-50"
              >
                <RiCheckboxCircleLine className="inline mr-2" />{placing ? 'Placing Order...' : 'Place Order'}
              </button>

              <button
                onClick={() => navigate('/cart')}
                className="block w-full text-center text-gray-600 hover:text-gray-800 mt-3 text-sm font-medium bg-transparent border-none cursor-pointer"
              >
                <RiArrowLeftLine className="inline mr-1" />Back to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
