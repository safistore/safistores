import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const productsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsList);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const scrollToProducts = () => {
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section style={{ 
        position: 'relative', 
        padding: '6rem 0', 
        textAlign: 'center', 
        background: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        marginBottom: '4rem'
      }}>
        <div className="container">
          <div className="flex-center" style={{ marginBottom: '1.5rem' }}>
            <img src="/safi.png" alt="Safi Store Logo" style={{ height: '90px', objectFit: 'contain' }} />
          </div>
          <h1 className="heading-lg" style={{ marginBottom: '1rem', fontFamily: 'serif' }}>
            Nish Fashion
          </h1>
          <p className="heading-md" style={{ color: 'var(--accent-color)', marginBottom: '2rem' }}>
            Safi Store
          </p>
          <p style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 2rem auto', opacity: 0.9 }}>
            Discover our premium collection of fashion and accessories. Unveil the new you.
          </p>
          <button 
            className="btn btn-accent" 
            style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}
            onClick={scrollToProducts}
          >
            Shop Now
          </button>
        </div>
      </section>

      {/* Products Section */}
      <section id="products-section" className="container" style={{ marginBottom: '4rem' }}>
        <h2 className="heading-md text-gradient" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          Trending Products
        </h2>
        
        {loading ? (
          <div className="flex-center" style={{ height: '200px' }}>
            <p>Loading products...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid-cols-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex-center glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
            <div>
              <h3 style={{ marginBottom: '1.5rem' }}>No products available yet.</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Check back later for new arrivals!</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
