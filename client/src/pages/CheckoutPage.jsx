import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { RiTruckLine, RiMoneyRupeeCircleLine, RiSecurePaymentLine, RiShoppingBagLine, RiWallet3Line, RiCheckboxCircleLine, RiArrowLeftLine, RiBankCardLine, RiAddLine, RiMapPinLine, RiEditLine, RiDeleteBinLine, RiCheckLine, RiCloseLine } from 'react-icons/ri';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const [addressForm, setAddressForm] = useState({
    fullname: '',
    contact: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [form, setForm] = useState({
    paymentMethod: 'online',
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

      // Load saved addresses
      if (res.data.user) {
        const savedAddresses = res.data.user.addresses || [];
        setAddresses(savedAddresses);

        // Auto-select default address
        const defaultAddr = savedAddresses.find((a) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id);
        } else if (savedAddresses.length > 0) {
          setSelectedAddressId(savedAddresses[0]._id);
        }

        // If no addresses, show the form
        if (savedAddresses.length === 0) {
          setShowAddressForm(true);
          setAddressForm((prev) => ({
            ...prev,
            fullname: res.data.user.fullname || '',
            contact: res.data.user.contact || '',
          }));
        }
      }
    } catch {
      toast.error('Failed to load checkout');
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressFormChange = (e) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetAddressForm = () => {
    setAddressForm({ fullname: '', contact: '', address: '', city: '', state: '', pincode: '' });
    setShowAddressForm(false);
    setEditingAddressId(null);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        const res = await api.put(`/addresses/${editingAddressId}`, addressForm);
        if (res.data.success) {
          setAddresses(res.data.addresses);
          toast.success('Address updated');
        }
      } else {
        const res = await api.post('/addresses', addressForm);
        if (res.data.success) {
          setAddresses(res.data.addresses);
          // Select the newly added address
          const newAddr = res.data.addresses[res.data.addresses.length - 1];
          setSelectedAddressId(newAddr._id);
          toast.success('Address saved');
        }
      }
      resetAddressForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    }
  };

  const handleEditAddress = (addr) => {
    setAddressForm({
      fullname: addr.fullname || '',
      contact: addr.contact || '',
      address: addr.address || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
    });
    setEditingAddressId(addr._id);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id) => {
    try {
      const res = await api.delete(`/addresses/${id}`);
      if (res.data.success) {
        setAddresses(res.data.addresses);
        if (selectedAddressId === id) {
          setSelectedAddressId(res.data.addresses.length > 0 ? res.data.addresses[0]._id : null);
        }
        toast.success('Address deleted');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete address');
    }
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

    // Get the selected address
    const selectedAddress = addresses.find((a) => a._id === selectedAddressId);
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    setPlacing(true);

    try {
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
          console.error('Razorpay order error:', orderRes.data);
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
            name: selectedAddress.fullname,
            email: '',
            contact: selectedAddress.contact,
          },
          theme: { color: '#3B82F6' },
          handler: async (response) => {
            // Step 3: Verify payment on backend
            try {
              const verifyRes = await api.post('/orders/verify-payment', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                shippingDetails: {
                  fullname: selectedAddress.fullname,
                  email: selectedAddress.fullname, // kept for compatibility
                  contact: selectedAddress.contact,
                  address: selectedAddress.address,
                  city: selectedAddress.city,
                  state: selectedAddress.state,
                  pincode: selectedAddress.pincode,
                },
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
        return;
    } catch (err) {
      console.error('Checkout error:', err.response?.data || err);
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
          {/* Left: Address Selection & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Saved Addresses */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <RiMapPinLine className="text-blue-600" />
                  Select Delivery Address
                </h2>
                {addresses.length > 0 && !showAddressForm && (
                  <button
                    onClick={() => {
                      setAddressForm({ fullname: '', contact: '', address: '', city: '', state: '', pincode: '' });
                      setEditingAddressId(null);
                      setShowAddressForm(true);
                    }}
                    className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors cursor-pointer border-none"
                  >
                    <RiAddLine className="text-lg" /> Add New Address
                  </button>
                )}
              </div>

              {/* Address Cards */}
              {addresses.length > 0 && !showAddressForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      onClick={() => setSelectedAddressId(addr._id)}
                      className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        selectedAddressId === addr._id
                          ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Selection indicator */}
                      <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center ${
                        selectedAddressId === addr._id
                          ? 'bg-blue-600 text-white'
                          : 'border-2 border-gray-300'
                      }`}>
                        {selectedAddressId === addr._id && <RiCheckLine className="text-sm" />}
                      </div>

                      {/* Default badge */}
                      {addr.isDefault && (
                        <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full mb-2">
                          Default
                        </span>
                      )}

                      <p className="font-bold text-gray-800 text-base pr-8">{addr.fullname}</p>
                      <p className="text-sm text-gray-600 mt-1">{addr.address}</p>
                      <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                      <p className="text-sm text-gray-500 mt-1">📞 {addr.contact}</p>

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditAddress(addr); }}
                          className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors cursor-pointer border-none"
                        >
                          <RiEditLine /> Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr._id); }}
                          className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-red-600 bg-gray-100 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors cursor-pointer border-none"
                        >
                          <RiDeleteBinLine /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add/Edit Address Form */}
              {showAddressForm && (
                <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 bg-blue-50/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">
                      {editingAddressId ? 'Edit Address' : 'Add New Address'}
                    </h3>
                    {addresses.length > 0 && (
                      <button
                        onClick={resetAddressForm}
                        className="text-gray-500 hover:text-gray-700 cursor-pointer bg-transparent border-none"
                      >
                        <RiCloseLine className="text-2xl" />
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveAddress} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                        <input type="text" name="fullname" value={addressForm.fullname} onChange={handleAddressFormChange} required className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors bg-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number <span className="text-red-500">*</span></label>
                        <input type="tel" name="contact" value={addressForm.contact} onChange={handleAddressFormChange} required pattern="[0-9]{10}" placeholder="10 digit mobile number" className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors bg-white" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Address <span className="text-red-500">*</span></label>
                      <textarea name="address" value={addressForm.address} onChange={handleAddressFormChange} required rows="3" placeholder="House/Flat No., Building Name, Street" className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors bg-white" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
                        <input type="text" name="city" value={addressForm.city} onChange={handleAddressFormChange} required className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors bg-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">State <span className="text-red-500">*</span></label>
                        <input type="text" name="state" value={addressForm.state} onChange={handleAddressFormChange} required className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors bg-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">PIN Code <span className="text-red-500">*</span></label>
                        <input type="text" name="pincode" value={addressForm.pincode} onChange={handleAddressFormChange} required pattern="[0-9]{6}" placeholder="6 digits" className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors bg-white" />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer border-none shadow-md"
                      >
                        {editingAddressId ? 'Update Address' : 'Save Address'}
                      </button>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={resetAddressForm}
                          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors cursor-pointer border-none"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {/* No addresses prompt */}
              {addresses.length === 0 && !showAddressForm && (
                <div className="text-center py-8">
                  <RiMapPinLine className="text-5xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No saved addresses yet</p>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer border-none"
                  >
                    <RiAddLine className="inline mr-1" /> Add Address
                  </button>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <RiMoneyRupeeCircleLine className="text-green-600" />
                Payment Method
              </h2>
              <div className="space-y-3">
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

              {/* Delivering to summary */}
              {selectedAddressId && addresses.length > 0 && (
                <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs font-semibold text-green-700 mb-1">📦 Delivering to:</p>
                  {(() => {
                    const addr = addresses.find((a) => a._id === selectedAddressId);
                    return addr ? (
                      <p className="text-xs text-green-800">{addr.fullname}, {addr.address}, {addr.city} - {addr.pincode}</p>
                    ) : null;
                  })()}
                </div>
              )}

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
                onClick={handleSubmit}
                disabled={placing || !selectedAddressId}
                className="w-full bg-gradient-to-r from-black to-gray-800 text-white text-center py-4 rounded-xl hover:from-gray-800 hover:to-black transition-all text-base font-semibold tracking-wide shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <RiCheckboxCircleLine className="inline mr-2" />{placing ? 'Placing Order...' : 'Place Order'}
              </button>

              {!selectedAddressId && addresses.length > 0 && (
                <p className="text-center text-red-500 text-xs mt-2">Please select a delivery address</p>
              )}

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
