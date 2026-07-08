import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, ShoppingBag, TrendingUp, Trash2 } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [productsCount, setProductsCount] = useState(0);
  const [usersCount, setUsersCount] = useState('—');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchCounts();

    // Set up real-time listener for orders
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersList);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchCounts = async () => {
    // 1. Fetch Products Count
    try {
      const productsSnapshot = await getDocs(collection(db, "products"));
      setProductsCount(productsSnapshot.size);
    } catch (error) {
      console.error("Error fetching products count:", error);
    }

    // 2. Fetch Users Count
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      setUsersCount(usersSnapshot.size);
    } catch (error) {
      if (error.code === 'permission-denied') {
        console.warn("Users count restricted by Firebase security rules.");
        setUsersCount('Restricted');
      } else {
        console.error("Error fetching users count:", error);
        setUsersCount('Error');
      }
    }
  };

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

  const formatShippingAddress = (address) => {
    if (!address) return 'No Address';
    if (typeof address === 'string') return address;
    if (typeof address === 'object') {
      const parts = [
        address.fullName || address.customerName,
        address.street,
        address.city,
        address.state,
        address.zipCode || address.pincode,
        address.phone
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : JSON.stringify(address);
    }
    return String(address);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update status: " + error.message);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteDoc(doc(db, "orders", orderId));
        setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      } catch (error) {
        console.error("Error deleting order:", error);
        alert("Failed to delete order: " + error.message);
      }
    }
  };

  // Calculate metrics
  const totalSales = orders
    .filter(order => order.status === 'Completed' || order.status === 'Shipped')
    .reduce((sum, order) => sum + (order.total || 0), 0);

  const pendingOrdersCount = orders.filter(order => order.status === 'Pending Payment Verification').length;

  if (loading) {
    return <div className="flex-center" style={{ height: '70vh' }}>Loading Dashboard...</div>;
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2 className="heading-md">Admin Dashboard</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/admin/supplier" className="btn btn-secondary">Supplier Portal</Link>
          <Link to="/admin/products" className="btn btn-accent">Manage Products</Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '3rem' }}>
        {/* Total Sales */}
        <div className="glass-card flex-center" style={{ flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '50%', color: 'var(--accent-color)' }}>
            <TrendingUp size={24} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Sales (Verified)</p>
            <h3 style={{ fontSize: '1.5rem' }}>₹{totalSales.toLocaleString('en-IN')}</h3>
          </div>
        </div>
        
        {/* Orders */}
        <div className="glass-card flex-center" style={{ flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '50%', color: 'var(--accent-color)' }}>
            <ShoppingBag size={24} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Orders ({pendingOrdersCount} Pending)</p>
            <h3 style={{ fontSize: '1.5rem' }}>{orders.length}</h3>
          </div>
        </div>

        {/* Products */}
        <div className="glass-card flex-center" style={{ flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '50%', color: 'var(--accent-color)' }}>
            <Package size={24} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Active Products</p>
            <h3 style={{ fontSize: '1.5rem' }}>{productsCount}</h3>
          </div>
        </div>

        {/* Customers */}
        <div className="glass-card flex-center" style={{ flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '50%', color: 'var(--accent-color)' }}>
            <Users size={24} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Registered Customers</p>
            <h3 style={{ fontSize: '1.5rem' }}>{usersCount}</h3>
          </div>
        </div>
      </div>

      {/* Orders Management */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '1.5rem' }}>Order Management</h3>
        
        {orders.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No orders found in the database.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem 0.5rem' }}>Order ID / Date</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Customer Info</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Items Ordered</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Total Amount</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr 
                    key={order.id} 
                    style={{ 
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: order.status === 'Pending Payment Verification' ? 'rgba(241, 196, 15, 0.04)' : 'transparent',
                      borderLeft: order.status === 'Pending Payment Verification' ? '4px solid #f1c40f' : 'none'
                    }}
                  >
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{order.id}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        {formatOrderDate(order.createdAt)}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ fontWeight: '500' }}>{order.customerName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.customerPhone}</div>
                      <div 
                        style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} 
                        title={formatShippingAddress(order.shippingAddress)}
                      >
                        {formatShippingAddress(order.shippingAddress)}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      {order.items?.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          • {item.name} <span style={{ fontWeight: '600' }}>x{item.quantity}</span>
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: '600', color: 'var(--accent-color)' }}>
                      ₹{(order.total || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <select 
                          value={order.status} 
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          style={{ 
                            padding: '0.35rem 0.5rem', 
                            borderRadius: '0.25rem', 
                            border: '1px solid var(--border-color)', 
                            backgroundColor: 'var(--bg-secondary)', 
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="Pending Payment Verification">Pending Verification</option>
                          <option value="Completed">Completed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        {order.status === 'Pending Payment Verification' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'Completed')}
                            style={{
                              padding: '0.35rem 0.75rem',
                              backgroundColor: 'var(--success)',
                              color: 'white',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              animation: 'pulseApprove 1.5s infinite alternate'
                            }}
                            title="Quick Approve Payment"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDeleteOrder(order.id)} 
                        style={{ color: 'var(--danger)', cursor: 'pointer', padding: '0.5rem' }}
                        title="Delete Order"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`
        @keyframes pulseApprove {
          from { opacity: 0.85; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1.03); }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
