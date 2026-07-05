import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus } from 'lucide-react';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="container flex-center animate-fade-in" style={{ minHeight: '60vh', flexDirection: 'column', gap: '2rem' }}>
        <h2 className="heading-md text-gradient">Your Cart is Empty</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Looks like you haven't added anything yet.</p>
        <Link to="/" className="btn btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 1.5rem' }}>
      <h2 className="heading-md" style={{ marginBottom: '2rem' }}>Shopping Cart</h2>
      
      <div className="grid-cols-3" style={{ alignItems: 'flex-start' }}>
        <div style={{ gridColumn: 'span 2' }}>
          {cart.map((item) => (
            <div key={item.cartItemId} className="glass-card flex-between" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
              <div className="flex-center" style={{ gap: '1.5rem' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '0.5rem', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                  {item.imageUrl && <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{item.name}</h3>
                  {(item.selectedSize || item.selectedColor) && (
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {item.selectedSize && <span>Size: <strong>{item.selectedSize}</strong></span>}
                      {item.selectedColor && <span>Color: <strong>{item.selectedColor}</strong></span>}
                    </div>
                  )}
                  <p style={{ fontWeight: '600', color: 'var(--accent-color)' }}>₹{item.price}</p>
                </div>
              </div>
              
              <div className="flex-center" style={{ gap: '1rem' }}>
                <div className="flex-center" style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '0.25rem' }}>
                  <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} style={{ padding: '0.25rem', cursor: 'pointer' }}><Minus size={16} /></button>
                  <span style={{ padding: '0 1rem', fontWeight: '500' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} style={{ padding: '0.25rem', cursor: 'pointer' }}><Plus size={16} /></button>
                </div>
                
                <button onClick={() => removeFromCart(item.cartItemId)} style={{ color: 'var(--danger)', padding: '0.5rem', cursor: 'pointer' }}>
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Order Summary</h3>
          
          <div className="flex-between" style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            <span>Subtotal</span>
            <span>₹{cartTotal}</span>
          </div>
          <div className="flex-between" style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '1rem 0' }}></div>
          <div className="flex-between" style={{ marginBottom: '2rem', fontSize: '1.25rem', fontWeight: '600' }}>
            <span>Total</span>
            <span style={{ color: 'var(--accent-color)' }}>₹{cartTotal}</span>
          </div>
          
          <button className="btn btn-accent" style={{ width: '100%' }} onClick={() => navigate('/checkout')}>
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
