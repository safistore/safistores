import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Link, useNavigate, Navigate } from 'react-router-dom';

const Login = ({ user }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/" />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Admin dashboard will redirect via App.jsx routing if needed, otherwise home.
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex-center animate-fade-in" style={{ minHeight: '60vh' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="flex-center" style={{ marginBottom: '1.5rem' }}>
          <img src="/safi.png" alt="Safi Store Logo" style={{ height: '55px', objectFit: 'contain' }} />
        </div>
        <h2 className="heading-md" style={{ textAlign: 'center', marginBottom: '2rem' }}>Sign In</h2>
        
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/signup" style={{ color: 'var(--accent-color)', fontWeight: '500' }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
