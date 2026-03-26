import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  RiFolderLine,
  RiSparklingLine,
  RiStoreLine,
  RiPriceTag3Line,
  RiPriceTagLine,
  RiCheckLine,
  RiCloseLine,
  RiShoppingCartLine,
  RiCloseCircleLine,
} from 'react-icons/ri';

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(10000);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'new', 'discounted'
  const [addingToCart, setAddingToCart] = useState({}); // track loading per product

  useEffect(() => {
    fetchProducts();
  }, [activeFilter, minPrice, maxPrice]);

  const fetchProducts = async () => {
    try {
      const params = {};
      if (activeFilter === 'discounted') params.discount = 'true';
      if (activeFilter === 'new') params.new = 'true';
      if (minPrice !== priceMin) params.minPrice = minPrice;
      if (maxPrice !== priceMax) params.maxPrice = maxPrice;

      const res = await api.get('/products', { params });
      setProducts(res.data.products);
      setPriceMin(res.data.priceMin);
      setPriceMax(res.data.priceMax);
      // Only update slider values on initial load
      if (loading) {
        setMinPrice(res.data.priceMin);
        setMaxPrice(res.data.priceMax);
      }
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId) => {
    setAddingToCart((prev) => ({ ...prev, [productId]: true }));
    try {
      const res = await api.post(`/cart/add/${productId}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Added to cart');
      } else {
        toast.error(res.data.message || 'Failed to add to cart');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setTimeout(() => {
        setAddingToCart((prev) => ({ ...prev, [productId]: false }));
      }, 500);
    }
  };

  const handlePriceFilter = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const clearFilters = () => {
    setMinPrice(priceMin);
    setMaxPrice(priceMax);
    setActiveFilter('all');
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex px-20 py-20 gap-10 bg-gray-50">
      {/* Sidebar */}
      <div className="w-[22%] flex flex-col sticky top-20 h-fit p-6 bg-white rounded-xl shadow-lg border border-gray-100">
        {/* Collections Section */}
        <div className="mb-8">
          <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
            <RiFolderLine className="text-blue-600" />
            Collections
          </h4>
          <div className="space-y-2">
            <button
              onClick={() => setActiveFilter('new')}
              className={`block w-full text-left px-4 py-2.5 rounded-lg transition-all cursor-pointer border-none bg-transparent ${
                activeFilter === 'new'
                  ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <RiSparklingLine className="inline mr-2" />New Collection
            </button>
            <button
              onClick={() => setActiveFilter('all')}
              className={`block w-full text-left px-4 py-2.5 rounded-lg transition-all cursor-pointer border-none bg-transparent ${
                activeFilter === 'all'
                  ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <RiStoreLine className="inline mr-2" />All Products
            </button>
            <button
              onClick={() => setActiveFilter('discounted')}
              className={`block w-full text-left px-4 py-2.5 rounded-lg transition-all cursor-pointer border-none bg-transparent ${
                activeFilter === 'discounted'
                  ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <RiPriceTag3Line className="inline mr-2" />Discounted Products
            </button>
          </div>
        </div>

        {/* Price Filter Section */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
            <RiPriceTagLine className="text-blue-600" />
            Filter By Price
          </h4>
          <form onSubmit={handlePriceFilter} className="space-y-4">
            <div className="flex justify-between items-center mb-3 px-2">
              <div className="text-center">
                <span className="text-xs text-gray-500 block mb-1">Min</span>
                <span className="text-base font-bold text-gray-800">₹ {Math.round(minPrice)}</span>
              </div>
              <div className="text-gray-400">-</div>
              <div className="text-center">
                <span className="text-xs text-gray-500 block mb-1">Max</span>
                <span className="text-base font-bold text-gray-800">₹ {Math.round(maxPrice)}</span>
              </div>
            </div>

            <div className="relative py-6">
              <div className="h-2 bg-gray-200 rounded-full relative">
                <div
                  className="absolute h-2 bg-blue-600 rounded-full"
                  style={{
                    left: `${((minPrice - priceMin) / (priceMax - priceMin)) * 100}%`,
                    width: `${((maxPrice - minPrice) / (priceMax - priceMin)) * 100}%`,
                  }}
                ></div>
              </div>
              <input
                type="range"
                min={priceMin}
                max={priceMax}
                value={minPrice}
                step="100"
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (val <= maxPrice) setMinPrice(val);
                }}
                className="absolute top-6 w-full h-2 bg-transparent appearance-none cursor-pointer z-10"
              />
              <input
                type="range"
                min={priceMin}
                max={priceMax}
                value={maxPrice}
                step="100"
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (val >= minPrice) setMaxPrice(val);
                }}
                className="absolute top-6 w-full h-2 bg-transparent appearance-none cursor-pointer z-20"
              />
            </div>

            <div className="flex gap-2 mt-6">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer border-none"
              >
                <RiCheckLine className="inline mr-1" />Apply
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg text-sm font-semibold text-center transition-all cursor-pointer border-none"
              >
                <RiCloseLine className="inline mr-1" />Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Product Grid */}
      <div className="w-[78%] flex flex-col gap-5">
        <h2 className="text-2xl font-bold mb-5">Our Products</h2>

        {products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <RiStoreLine className="text-6xl mx-auto mb-4 text-gray-300" />
            <p className="text-xl">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition duration-300 group"
              >
                {/* Product Image */}
                <div
                  className="relative w-full h-56 flex items-center justify-center"
                  style={{ backgroundColor: product.bgcolor || '#f3f4f6' }}
                >
                  <img
                    className="h-48 object-contain transition-transform duration-300 group-hover:scale-110"
                    src={`/api/images/product/${product._id}`}
                    alt={product.name}
                  />
                  {product.discount > 0 && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-md shadow">
                      {product.discount}% OFF
                    </span>
                  )}
                </div>

                {/* Product Info */}
                <div
                  className="px-5 py-4 flex flex-col gap-2"
                  style={{
                    backgroundColor: product.panelcolor || '#ffffff',
                    color: product.textcolor || '#1f2937',
                  }}
                >
                  <h3 className="text-lg font-semibold">{product.name}</h3>

                  {product.discount > 0 ? (
                    <h4>
                      <span className="line-through text-gray-400">₹ {product.price}</span>
                      <span className="ml-2 text-green-600 font-bold">
                        ₹ {(product.price - (product.price * product.discount) / 100).toFixed(2)}
                      </span>
                    </h4>
                  ) : (
                    <h4 className="font-semibold">₹ {product.price}</h4>
                  )}

                  {/* Add to Cart Button */}
                  {(product.stock ?? 0) > 0 ? (
                    <button
                      onClick={() => addToCart(product._id)}
                      disabled={addingToCart[product._id]}
                      className="mt-3 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
                    >
                      <RiShoppingCartLine />
                      <span>{addingToCart[product._id] ? 'Added!' : 'Add to Cart'}</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="mt-3 inline-flex items-center justify-center gap-2 bg-gray-400 text-white py-2 px-4 rounded-md text-sm font-medium shadow-md cursor-not-allowed border-none"
                    >
                      <RiCloseCircleLine /> Out of Stock
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
