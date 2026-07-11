import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import ProductCard from '../components/ProductCard';
import safiLogo from '../assets/safi.png';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const autoPlayRef = useRef(null);

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

  // Carousel AutoPlay setup
  useEffect(() => {
    if (products.length === 0 || isPaused) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % products.length);
    }, 4500);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [products, isPaused]);

  const handlePrevSlide = (e) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + products.length) % products.length);
  };

  const handleNextSlide = (e) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % products.length);
  };

  const scrollToProducts = () => {
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Render static fallback hero if no products are loaded yet
  const renderFallbackHero = () => (
    <section style={{ 
      position: 'relative', 
      padding: '6rem 0', 
      textAlign: 'center', 
      background: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: 'white',
      marginBottom: '4rem',
      borderRadius: '1rem',
      overflow: 'hidden'
    }}>
      <div className="container">
        <div className="flex-center" style={{ marginBottom: '1.5rem' }}>
          <img src={safiLogo} alt="Safi Store Logo" style={{ height: '90px', objectFit: 'contain' }} />
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
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      
      {/* Dynamic Products Carousel Hero Section */}
      {loading ? (
        <div className="flex-center" style={{ height: '400px', margin: '2rem 0' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading store showcase...</p>
        </div>
      ) : products.length > 0 ? (
        <section 
          style={{ position: 'relative', marginBottom: '4rem', overflow: 'hidden', borderRadius: '1.5rem', boxShadow: 'var(--glass-shadow)', margin: '1.5rem' }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Dynamic Blurred Color-matching Background Layer */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${products[currentSlide]?.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(30px) brightness(0.4)',
            transform: 'scale(1.1)',
            zIndex: 1,
            transition: 'background-image 0.8s ease'
          }}></div>

          <div style={{ position: 'relative', zIndex: 2, padding: '4rem 3rem', minHeight: '450px', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.4) 100%)', color: 'white' }}>
            
            {/* Nav Arrows */}
            <button onClick={handlePrevSlide} className="carousel-nav-btn" style={{ left: '1rem' }} aria-label="Previous Slide">
              <ChevronLeft size={24} />
            </button>
            <button onClick={handleNextSlide} className="carousel-nav-btn" style={{ right: '1rem' }} aria-label="Next Slide">
              <ChevronRight size={24} />
            </button>

            {/* Slide Body */}
            <div className="container" style={{ width: '100%' }}>
              <div className="carousel-slide-grid">
                
                {/* Details Column */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', animation: 'fadeInLeft 0.5s ease-out' }} key={`txt-${currentSlide}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <img src={safiLogo} alt="Safi" style={{ height: '35px', filter: 'brightness(0) invert(1)' }} />
                    <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent-color)', fontWeight: '600' }}>Featured Product</span>
                  </div>
                  
                  <h1 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1.2', marginBottom: '0.75rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    {products[currentSlide]?.name}
                  </h1>
                  
                  <h3 style={{ fontSize: '1.75rem', color: 'var(--accent-color)', fontWeight: '700', marginBottom: '1.25rem' }}>
                    ₹{products[currentSlide]?.price}
                  </h3>
                  
                  <p style={{ fontSize: '1.05rem', opacity: 0.9, lineHeight: '1.6', marginBottom: '2rem', maxWidth: '500px', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {products[currentSlide]?.description}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => navigate(`/product/${products[currentSlide].id}`)} 
                      className="btn btn-accent"
                      style={{ padding: '0.85rem 2rem', fontSize: '1rem', fontWeight: '600' }}
                    >
                      <ShoppingBag size={18} />
                      Buy Now
                    </button>
                    <button 
                      onClick={scrollToProducts} 
                      className="btn"
                      style={{ padding: '0.85rem 2rem', backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
                    >
                      Browse All
                    </button>
                  </div>
                </div>

                {/* Photo Column */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeInRight 0.5s ease-out' }} key={`img-${currentSlide}`}>
                  <div style={{ 
                    width: '320px', 
                    height: '320px', 
                    borderRadius: '1.5rem', 
                    overflow: 'hidden', 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(5px)',
                    transition: 'transform 0.3s ease'
                  }} className="carousel-img-container">
                    <img 
                      src={products[currentSlide]?.imageUrl} 
                      alt={products[currentSlide]?.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Carousel Dots indicators */}
            <div style={{ position: 'absolute', bottom: '1.25rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '0.5rem', zIndex: 10 }}>
              {products.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  style={{
                    width: currentSlide === idx ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: currentSlide === idx ? 'var(--accent-color)' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                ></button>
              ))}
            </div>

          </div>
        </section>
      ) : (
        renderFallbackHero()
      )}

      {/* Products Grid Section */}
      <section id="products-section" className="container" style={{ padding: '0 1.5rem' }}>
        <h2 className="heading-md text-gradient" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
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
              <h3 style={{ marginBottom: '1rem' }}>No products available yet.</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Check back later for new arrivals!</p>
            </div>
          </div>
        )}
      </section>

      {/* Global Quick View Modal removed */}

      {/* Styles for Carousel animation & responsiveness */}
      <style>{`
        .carousel-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: all 0.2s ease;
          opacity: 0.7;
        }
        .carousel-nav-btn:hover {
          background: rgba(0, 0, 0, 0.7);
          opacity: 1;
          transform: translateY(-50%) scale(1.05);
        }
        
        .carousel-slide-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 3rem;
          align-items: center;
          padding: 0 2rem;
        }

        .carousel-img-container:hover {
          transform: scale(1.02);
        }

        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @media (max-width: 768px) {
          .carousel-slide-grid {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 2rem;
            padding: 0;
          }
          .carousel-slide-grid > div {
            align-items: center;
          }
          .carousel-nav-btn {
            display: none; /* Hide arrows on mobile for swipe/dot convenience */
          }
          .carousel-img-container {
            width: 250px !important;
            height: 250px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
