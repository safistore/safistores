import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div 
      className="glass-card flex-center" 
      style={{ 
        flexDirection: 'column', 
        padding: '1.25rem', 
        gap: '1rem',
        cursor: 'pointer'
      }}
      onClick={handleCardClick}
    >
      <div className="product-card-img-wrapper">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} />
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
              handleCardClick();
            }}
            title="View Details"
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
