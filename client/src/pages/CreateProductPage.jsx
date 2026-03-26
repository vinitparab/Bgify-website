import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { RiLogoutBoxLine } from 'react-icons/ri';

export default function CreateProductPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    price: '',
    discount: '',
    stock: '',
    bgcolor: '',
    panelcolor: '',
    textcolor: '',
  });
  const [image, setImage] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      toast.error('Product image is required');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', image);
      Object.keys(form).forEach((key) => formData.append(key, form[key]));

      const res = await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        toast.success('Product Created Successfully');
        navigate('/owners/admin');
      } else {
        toast.error(res.data.message || 'Failed to create product');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container px-10 py-20 flex flex-grow">
        {/* Sidebar */}
        <div className="w-[25%] flex flex-col items-start">
          <div className="flex flex-col">
            <Link to="/owners/admin" className="block w-fit mb-2 text-gray-700 no-underline hover:text-blue-600">All Products</Link>
            <Link to="/owners/orders" className="block w-fit mb-2 text-gray-700 no-underline hover:text-blue-600">Orders</Link>
            <Link to="/owners/createproducts" className="block w-fit mb-2 text-blue-600 font-semibold no-underline">Create new product</Link>
            <button onClick={handleLogout} className="text-red-500 hover:text-red-700 font-medium mt-4 bg-transparent border-none cursor-pointer text-left">
              <RiLogoutBoxLine className="inline mr-1" />Logout
            </button>
          </div>
        </div>

        {/* Form */}
        <main className="w-3/4 bg-white p-8 shadow ml-4 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Create New Product</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Product Details</h3>
              <div className="mb-4">
                <label className="block mb-2 font-medium">Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                  className="py-2 px-4 rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input name="name" type="text" placeholder="Product Name" value={form.name} onChange={handleChange} className="border p-2 rounded w-full" required />
                <input name="price" type="text" placeholder="Product Price" value={form.price} onChange={handleChange} className="border p-2 rounded w-full" required />
                <input name="discount" type="text" placeholder="Discount (%)" value={form.discount} onChange={handleChange} className="border p-2 rounded w-full" />
                <input name="stock" type="number" placeholder="Stock Quantity" min="0" value={form.stock} onChange={handleChange} className="border p-2 rounded w-full" required />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Panel Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <input name="bgcolor" type="text" placeholder="Background Color" value={form.bgcolor} onChange={handleChange} className="border p-2 rounded w-full" />
                <input name="panelcolor" type="text" placeholder="Panel Color" value={form.panelcolor} onChange={handleChange} className="border p-2 rounded w-full" />
                <input name="textcolor" type="text" placeholder="Text Color" value={form.textcolor} onChange={handleChange} className="border p-2 rounded w-full" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded mt-3 bg-blue-500 text-white cursor-pointer border-none hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create New Product'}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
