import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Context (to be created)
// import { CartProvider } from './context/CartContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import ForgotPassword from './pages/ForgotPassword';
import ProductDetails from './pages/ProductDetails';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import SupplierPortal from './pages/admin/SupplierPortal';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            let role = userDoc.data().role;
            // Force update database role to admin if it's the admin email but not set to admin
            if (currentUser.email && currentUser.email.toLowerCase() === 'safeekestore@gmail.com' && role !== 'admin') {
              await setDoc(userDocRef, { role: 'admin' }, { merge: true });
              role = 'admin';
            }
            setUserRole(role);
          } else {
            // Document doesn't exist yet, but if it's the admin email, set role to admin
            const initialRole = (currentUser.email && currentUser.email.toLowerCase() === 'safeekestore@gmail.com') ? 'admin' : 'user';
            setUserRole(initialRole);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole(currentUser.email && currentUser.email.toLowerCase() === 'safeekestore@gmail.com' ? 'admin' : 'user');
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;
  }

  // Admin Check (check both email address case-insensitively and role in DB)
  const isAdmin = user && (
    (user.email && user.email.toLowerCase() === 'safeekestore@gmail.com') ||
    userRole === 'admin'
  );

  return (
    <Router>
      <div className="app-container">
        <Navbar user={user} isAdmin={isAdmin} />
        <main style={{ minHeight: 'calc(100vh - 140px)' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login user={user} />} />
            <Route path="/signup" element={<Signup user={user} />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/orders" element={user ? <Orders /> : <Navigate to="/login" />} />
            
            {/* Protected Admin Routes */}
            <Route 
              path="/admin" 
              element={isAdmin ? <AdminDashboard /> : <Navigate to="/" />} 
            />
            <Route 
              path="/admin/products" 
              element={isAdmin ? <AdminProducts /> : <Navigate to="/" />} 
            />
            <Route 
              path="/admin/supplier" 
              element={isAdmin ? <SupplierPortal /> : <Navigate to="/" />} 
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
