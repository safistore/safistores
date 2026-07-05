import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import QuickViewModal from './QuickViewModal';

const ProductCard = ({ product }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div 
        className="glass-card flex-center" 
        style={{ 
          flexDirection: 'column', 
          padding: '1rem', 
          gap: '1rem',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
        }}
      >
        <div style={{ width: '100%', height: '200px', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>No Image</span>
          )}
        </div>
        
        <div style={{ width: '100%' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{product.name}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', height: '40px', overflow: 'hidden' }}>
            {product.description}
          </p>
          
          <div className="flex-between" style={{ marginTop: '1rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--accent-color)' }}>
              ₹{product.price}
            </span>
            <button 
              className="btn btn-primary" 
              style={{ padding: '0.5rem', borderRadius: '50%', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              title="Add to Cart / View Options"
            >
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>
      </div>

      <QuickViewModal 
        product={product} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default ProductCard;
