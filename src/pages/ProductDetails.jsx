import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { ArrowLeft, ShoppingCart, Check, Play, Volume2, VolumeX } from 'lucide-react';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Selection states
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  
  // Video volume toggle
  const [isMuted, setIsMuted] = useState(true);

  const galleryRef = useRef(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("Product not found");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);

  // Determine media list, handling legacy imageUrls string arrays or single imageUrl
  const getMediaList = () => {
    if (!product) return [];
    
    // Check if new media array object format exists
    if (product.media && product.media.length > 0) {
      return product.media;
    }
    
    // Fallback to legacy imageUrls
    if (product.imageUrls && product.imageUrls.length > 0) {
      return product.imageUrls.map(url => ({
        url,
        type: url.match(/\.(mp4|webm|ogg|mov)/i) ? 'video' : 'image'
      }));
    }
    
    // Fallback to single imageUrl
    if (product.imageUrl) {
      return [{
        url: product.imageUrl,
        type: product.imageUrl.match(/\.(mp4|webm|ogg|mov)/i) ? 'video' : 'image'
      }];
    }
    
    return [];
  };

  const mediaList = getMediaList();

  const handleScroll = () => {
    if (galleryRef.current) {
      const scrollPosition = galleryRef.current.scrollLeft;
      const slideWidth = galleryRef.current.clientWidth;
      if (slideWidth > 0) {
        const newIndex = Math.round(scrollPosition / slideWidth);
        setSelectedMediaIndex(newIndex);
      }
    }
  };

  const scrollToMedia = (idx) => {
    setSelectedMediaIndex(idx);
    if (galleryRef.current) {
      const slideWidth = galleryRef.current.clientWidth;
      galleryRef.current.scrollTo({
        left: idx * slideWidth,
        behavior: 'smooth'
      });
    }
  };

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert(`Please select a ${product.sizeLabel || 'Size'}`);
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert(`Please select a ${product.colorLabel || 'Color'}`);
      return;
    }

    const currentMedia = mediaList[selectedMediaIndex] || mediaList[0] || {};
    
    const cartProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      selectedSize,
      selectedColor,
      sizeLabel: product.sizeLabel || 'Size',
      colorLabel: product.colorLabel || 'Color',
      imageUrl: currentMedia.type === 'image' ? currentMedia.url : (product.imageUrl || (mediaList.find(m => m.type === 'image')?.url) || '')
    };

    addToCart(cartProduct);
    alert('Product added to cart!');
  };

  if (loading) {
    return <div className="flex-center" style={{ height: '70vh' }}>Loading product...</div>;
  }

  if (!product) {
    return (
      <div className="container flex-center" style={{ height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <h2>Product not found</h2>
        <Link to="/" className="btn btn-primary">Back to Shop</Link>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '1000px' }}>
      
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex-center" 
        style={{ 
          background: 'none', 
          border: 'none', 
          color: 'var(--text-secondary)', 
          cursor: 'pointer', 
          gap: '0.5rem', 
          padding: 0, 
          marginBottom: '2rem', 
          fontWeight: '600',
          fontSize: '0.95rem'
        }}
      >
        <ArrowLeft size={18} /> Back
      </button>

      <div className="product-details-grid">
        
        {/* LEFT COLUMN: Swipeable Media Gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          
          {/* Main Viewer Wrapper */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: '1rem', overflow: 'hidden', background: '#000', boxShadow: 'var(--shadow-md)' }}>
            
            {/* Scroll Snap Touch Swipeable Container */}
            <div 
              ref={galleryRef}
              onScroll={handleScroll}
              style={{
                display: 'flex',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                height: '100%',
                width: '100%',
                scrollBehavior: 'smooth'
              }}
              className="scroll-snap-gallery"
            >
              {mediaList.length > 0 ? (
                mediaList.map((media, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      flex: '0 0 100%', 
                      scrollSnapAlign: 'start', 
                      height: '100%', 
                      width: '100%',
                      position: 'relative'
                    }}
                  >
                    {media.type === 'video' ? (
                      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <video 
                          src={media.url}
                          autoPlay={selectedMediaIndex === idx}
                          loop 
                          muted={isMuted}
                          playsInline
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          style={{
                            position: 'absolute',
                            bottom: '12px',
                            right: '12px',
                            background: 'rgba(0,0,0,0.6)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            cursor: 'pointer',
                            zIndex: 10
                          }}
                        >
                          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                      </div>
                    ) : (
                      <img 
                        src={media.url} 
                        alt={`${product.name} visual ${idx}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    )}
                  </div>
                ))
              ) : (
                <div style={{ flex: '0 0 100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  No media available
                </div>
              )}
            </div>
            
            {/* Overlay Indicator dots for mobile */}
            {mediaList.length > 1 && (
              <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.4rem', zIndex: 10 }}>
                {mediaList.map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: selectedMediaIndex === idx ? '16px' : '6px',
                      height: '6px',
                      borderRadius: '9999px',
                      backgroundColor: selectedMediaIndex === idx ? 'var(--accent-color)' : 'rgba(255,255,255,0.5)',
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnails Navigation Row */}
          {mediaList.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', padding: '0.25rem 0' }}>
              {mediaList.map((media, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToMedia(idx)}
                  style={{
                    flex: '0 0 70px',
                    height: '70px',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    border: selectedMediaIndex === idx ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                    padding: 0,
                    cursor: 'pointer',
                    background: '#000',
                    position: 'relative'
                  }}
                >
                  {media.type === 'video' ? (
                    <>
                      <video src={media.url} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '0.25rem' }}>
                        <Play size={12} fill="white" />
                      </div>
                    </>
                  ) : (
                    <img src={media.url} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Product Specs & Purchase Control */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h1 className="heading-md" style={{ fontSize: '2rem', marginBottom: '0.5rem', lineHeight: '1.2' }}>{product.name}</h1>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-color)', marginBottom: '1.25rem' }}>₹{product.price}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{product.description}</p>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: 0 }} />

          {/* Size / Capacity Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Select {product.sizeLabel || 'Size'}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    style={{
                      padding: '0.5rem 1.25rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      border: selectedSize === size ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                      backgroundColor: selectedSize === size ? 'rgba(212,175,55,0.08)' : 'transparent',
                      color: selectedSize === size ? 'var(--accent-color)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    {selectedSize === size && <Check size={14} />}
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color / Material Selector */}
          {product.colors && product.colors.length > 0 && (
            <div>
              <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Select {product.colorLabel || 'Color'}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    style={{
                      padding: '0.5rem 1.25rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      border: selectedColor === color ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                      backgroundColor: selectedColor === color ? 'rgba(212,175,55,0.08)' : 'transparent',
                      color: selectedColor === color ? 'var(--accent-color)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    {selectedColor === color && <Check size={14} />}
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity selector */}
          <div>
            <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Quantity
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{ width: '40px', height: '40px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: '600' }}
                >
                  -
                </button>
                <span style={{ width: '40px', textAlign: 'center', fontWeight: '600' }}>{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  style={{ width: '40px', height: '40px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: '600' }}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={handleAddToCart}
            className="btn btn-accent"
            style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', fontWeight: '600', marginTop: '1rem' }}
          >
            <ShoppingCart size={20} /> Add to Cart
          </button>
        </div>

      </div>

      <style>{`
        .product-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3.5rem;
        }
        
        .scroll-snap-gallery::-webkit-scrollbar {
          display: none;
        }

        @media (max-width: 768px) {
          .product-details-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductDetails;
