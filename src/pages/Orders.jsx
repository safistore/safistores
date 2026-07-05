import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserOrders = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Query orders matching the logged-in user's UID
        const q = query(collection(db, "orders"), where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const getSortableDate = (val) => {
          if (!val) return 0;
          if (typeof val.toDate === 'function') return val.toDate().getTime();
          return new Date(val).getTime();
        };

        const ordersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => getSortableDate(b.createdAt) - getSortableDate(a.createdAt));

        setOrders(ordersList);
      } catch (error) {
        console.error("Error fetching user orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserOrders();
  }, []);

  const formatOrderDate = (createdAt) => {
    if (!createdAt) return 'N/A';
    let date;
    if (typeof createdAt.toDate === 'function') {
      date = createdAt.toDate();
    } else {
      date = new Date(createdAt);
    }
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    let styles = {
      display: 'inline-block',
      padding: '0.35rem 0.75rem',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    };

    switch (status) {
      case 'Completed':
        styles = { ...styles, backgroundColor: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71', border: '1px solid rgba(46, 204, 113, 0.3)' };
        break;
      case 'Shipped':
        styles = { ...styles, backgroundColor: 'rgba(52, 152, 219, 0.15)', color: '#3498db', border: '1px solid rgba(52, 152, 219, 0.3)' };
        break;
      case 'Cancelled':
        styles = { ...styles, backgroundColor: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.3)' };
        break;
      default: // Pending Payment Verification
        styles = { ...styles, backgroundColor: 'rgba(241, 196, 15, 0.15)', color: '#f1c40f', border: '1px solid rgba(241, 196, 15, 0.3)' };
    }

    return (
      <span style={styles}>
        {status === 'Pending Payment Verification' ? 'Pending Verification' : status}
      </span>
    );
  };

  if (loading) {
    return <div className="flex-center" style={{ height: '70vh' }}>Loading your orders...</div>;
  }

  if (!auth.currentUser) {
    return (
      <div className="container flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Please sign in to view your order history.</p>
        <Link to="/login" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '3rem 1.5rem', maxWidth: '900px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={() => navigate(-1)} className="flex-center" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', gap: '0.5rem', padding: 0, marginBottom: '1.5rem', fontWeight: '500' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <h2 className="heading-md flex-center" style={{ justifyContent: 'flex-start', gap: '0.75rem' }}>
          <ShoppingBag size={28} style={{ color: 'var(--accent-color)' }} /> My Orders
        </h2>
      </div>

      {orders.length === 0 ? (
        <div className="glass-card flex-center" style={{ flexDirection: 'column', padding: '4rem', textAlign: 'center', gap: '1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>You haven't placed any orders yet.</p>
          <Link to="/" className="btn btn-accent">Start Shopping</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map((order) => (
            <div key={order.id} className="glass-card" style={{ padding: '1.75rem' }}>
              {/* Order Header */}
              <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order ID</p>
                  <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>{order.id}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Placed on: {formatOrderDate(order.createdAt)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Status</p>
                  <div style={{ marginTop: '0.25rem' }}>{getStatusBadge(order.status)}</div>
                </div>
              </div>

              {/* Order Items */}
              <div style={{ marginBottom: '1.25rem' }}>
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex-between" style={{ padding: '0.5rem 0', alignItems: 'flex-start', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>•</span>
                        <span style={{ fontWeight: '500' }}>{item.name}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>x{item.quantity}</span>
                      </div>
                      {(item.selectedSize || item.selectedColor) && (
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '1rem', marginTop: '0.15rem' }}>
                          {item.selectedSize && <span>Size: <strong>{item.selectedSize}</strong></span>}
                          {item.selectedColor && <span>Color: <strong>{item.selectedColor}</strong></span>}
                        </div>
                      )}
                    </div>
                    <span style={{ fontWeight: '500' }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              {/* Order Footer */}
              <div className="flex-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Deliver to:</p>
                  <p style={{ fontWeight: '500', fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                    {order.customerName} ({order.customerPhone})
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Paid</p>
                  <p style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--accent-color)', marginTop: '0.25rem' }}>
                    ₹{(order.total || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
