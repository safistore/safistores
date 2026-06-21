import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, LayoutDashboard } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useCart } from '../context/CartContext';

const Navbar = ({ user, isAdmin }) => {
  const navigate = useNavigate();
  const { cart } = useCart();
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className="navbar">
      <div className="container flex-between">
        <Link to="/" className="logo flex-center" style={{ gap: '10px' }}>
          <img src="/logo.png" alt="Safi Store Logo" style={{ height: '45px', objectFit: 'contain' }} />
        </Link>
        
        <div className="nav-links flex-center" style={{ gap: '1.5rem' }}>
          <Link to="/" style={{ fontWeight: 500 }}>Home</Link>
          
          <Link to="/cart" style={{ position: 'relative' }}>
            <ShoppingCart size={24} />
            {cartItemsCount > 0 && (
              <span className="badge" style={{ position: 'absolute', top: '-10px', right: '-15px', padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}>
                {cartItemsCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex-center" style={{ gap: '1rem' }}>
              {isAdmin && (
                <Link to="/admin" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  <LayoutDashboard size={18} /> Admin
                </Link>
              )}
              <button onClick={handleLogout} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                <LogOut size={18} /> Logout
              </button>
            </div>
          ) : (
             <Link to="/login" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
              <User size={18} /> Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
