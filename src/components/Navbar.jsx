import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, LayoutDashboard, ShoppingBag, Home } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useCart } from '../context/CartContext';
import safiLogo from '../assets/safi.png';

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
    <>
      <nav className="navbar">
        <div className="container flex-between">
          <Link to="/" className="logo flex-center" style={{ gap: '12px', textDecoration: 'none' }}>
            <img src={safiLogo} alt="Safi Store Logo" style={{ height: '45px', objectFit: 'contain' }} />
            <span style={{ 
              fontFamily: "'Reem Kufi', sans-serif", 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              Safi Stores
            </span>
          </Link>
          
          <div className="nav-links flex-center desktop-nav" style={{ gap: '1.5rem' }}>
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
                <Link to="/orders" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ShoppingBag size={18} /> My Orders
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <LayoutDashboard size={18} /> Admin
                  </Link>
                )}
                <button onClick={handleLogout} className="btn btn-primary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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

      {/* Mobile Bottom Navigation Bar */}
      <div className="mobile-bottom-nav">
        <Link to="/" className="mobile-nav-item">
          <Home size={22} />
          <span>Home</span>
        </Link>
        
        <Link to="/cart" className="mobile-nav-item" style={{ position: 'relative' }}>
          <ShoppingCart size={22} />
          {cartItemsCount > 0 && (
            <span className="badge" style={{ position: 'absolute', top: '-6px', right: '15px', padding: '0.1rem 0.3rem', fontSize: '0.6rem' }}>
              {cartItemsCount}
            </span>
          )}
          <span>Cart</span>
        </Link>

        {user ? (
          <>
            <Link to="/orders" className="mobile-nav-item">
              <ShoppingBag size={22} />
              <span>Orders</span>
            </Link>
            {isAdmin ? (
              <Link to="/admin" className="mobile-nav-item">
                <LayoutDashboard size={22} />
                <span>Admin</span>
              </Link>
            ) : (
              <button onClick={handleLogout} className="mobile-nav-item" style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, font: 'inherit', cursor: 'pointer' }}>
                <LogOut size={22} />
                <span>Logout</span>
              </button>
            )}
          </>
        ) : (
          <Link to="/login" className="mobile-nav-item">
            <User size={22} />
            <span>Sign In</span>
          </Link>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-bottom-nav {
            display: flex !important;
          }
          body {
            padding-bottom: 70px !important;
          }
        }

        .mobile-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: var(--card-bg);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border-top: 1px solid var(--border-color);
          z-index: 1000;
          justify-content: space-around;
          align-items: center;
          padding: 0.25rem 0;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
        }

        .mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.75rem;
          font-weight: 500;
          gap: 0.15rem;
          transition: color 0.2s;
        }

        .mobile-nav-item:hover, .mobile-nav-item:focus {
          color: var(--accent-color);
        }
      `}</style>
    </>
  );
};

export default Navbar;
