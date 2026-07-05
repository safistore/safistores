import { useState, useEffect } from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

const QuickViewModal = ({ product, isOpen, onClose }) => {
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Reset states when a new product is selected
  useEffect(() => {
    if (product) {
      setSelectedImage(product.imageUrl || (product.imageUrls && product.imageUrls[0]) || '');
      setSelectedSize(product.sizes && product.sizes.length > 0 ? product.sizes[0] : '');
      setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0] : '');
      setQuantity(1);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert('Please select a size');
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert('Please select a color');
      return;
    }
    addToCart(product, selectedSize, selectedColor, quantity);
    onClose();
  };

  const images = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls 
    : [product.imageUrl].filter(Boolean);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
      onClick={onClose}
    >
      <div 
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          padding: '2.5rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2.5rem',
          cursor: 'default',
          animation: 'fadeIn 0.3s ease forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            color: 'var(--text-secondary)',
            padding: '0.5rem',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            zIndex: 10
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <X size={20} />
        </button>

        {/* Left Column: Image Gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Main Large Image */}
          <div 
            style={{ 
              width: '100%', 
              height: '350px', 
              borderRadius: '0.75rem', 
              overflow: 'hidden', 
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {selectedImage ? (
              <img 
                src={selectedImage} 
                alt={product.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <span style={{ color: 'var(--text-secondary)' }}>No Image</span>
            )}
          </div>

          {/* Thumbnails Gallery */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(img)}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-secondary)',
                    border: selectedImage === img 
                      ? '2px solid var(--accent-color)' 
                      : '1px solid var(--border-color)',
                    padding: 0,
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                >
                  <img src={img} alt={`${product.name} thumbnail ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Information & Options */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div>
            <h2 className="heading-md" style={{ fontSize: '1.75rem', marginBottom: '0.5rem', lineHeight: '1.2' }}>{product.name}</h2>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-color)', marginBottom: '1rem' }}>₹{product.price}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>{product.description}</p>

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Select Size
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        border: selectedSize === size 
                          ? '1px solid var(--text-primary)' 
                          : '1px solid var(--border-color)',
                        backgroundColor: selectedSize === size 
                          ? 'var(--text-primary)' 
                          : 'transparent',
                        color: selectedSize === size 
                          ? 'var(--bg-primary)' 
                          : 'var(--text-primary)',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Select Color
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        border: selectedColor === color 
                          ? '1px solid var(--text-primary)' 
                          : '1px solid var(--border-color)',
                        backgroundColor: selectedColor === color 
                          ? 'var(--text-primary)' 
                          : 'transparent',
                        color: selectedColor === color 
                          ? 'var(--bg-primary)' 
                          : 'var(--text-primary)',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add to Cart Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: 'auto' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {/* Quantity Adjuster */}
              <div 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '0.5rem', 
                  padding: '0.25rem',
                  backgroundColor: 'var(--bg-secondary)'
                }}
              >
                <button 
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                  style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                >
                  <Minus size={16} />
                </button>
                <span style={{ padding: '0 1rem', fontWeight: '600', minWidth: '40px', textAlign: 'center' }}>
                  {quantity}
                </span>
                <button 
                  type="button"
                  onClick={() => setQuantity(q => q + 1)} 
                  style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button 
                type="button"
                className="btn btn-primary"
                onClick={handleAddToCart}
                style={{ 
                  flex: 1, 
                  padding: '0.85rem',
                  borderRadius: '0.5rem',
                  gap: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                <ShoppingBag size={18} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS overlay layout adjustments for responsive design */}
      <style>{`
        @media (max-width: 768px) {
          .glass-card {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
            padding: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default QuickViewModal;
