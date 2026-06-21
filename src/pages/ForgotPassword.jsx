import { useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [recoveredPassword, setRecoveredPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRecoverPassword = async (e) => {
    e.preventDefault();
    setRecoveredPassword('');
    setError('');
    setLoading(true);

    try {
      // Query the users collection for matching email
      const q = query(collection(db, "users"), where("email", "==", email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('No account found with this email address.');
        setLoading(false);
        return;
      }

      // Check the first matching user document
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Verify the name (case-insensitive) to prevent random email lookups
      if (userData.name && userData.name.trim().toLowerCase() === fullName.trim().toLowerCase()) {
        if (userData.password) {
          setRecoveredPassword(userData.password);
        } else {
          setError('This account does not have a recovery password stored. Please contact the administrator to reset it.');
        }
      } else {
        setError('Verification failed. The full name you entered does not match our records for this email.');
      }
    } catch (err) {
      console.error("Error recovering password:", err);
      setError(err.message || 'An error occurred while recovering the password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex-center animate-fade-in" style={{ minHeight: '60vh' }}>
      <div className="glass-card" style={{ maxWidth: '450px', width: '100%' }}>
        <div className="flex-center" style={{ marginBottom: '1.5rem' }}>
          <img src="/safi.png" alt="Safi Store Logo" style={{ height: '55px', objectFit: 'contain' }} />
        </div>
        <h2 className="heading-md" style={{ textAlign: 'center', marginBottom: '1rem' }}>Recover Password</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Enter your email and registered Full Name to recover your password directly from the database.
        </p>

        {error && <div style={{ color: 'var(--danger)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.875rem', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid rgba(231, 76, 60, 0.3)', background: 'rgba(231, 76, 60, 0.05)' }}>{error}</div>}
        
        {recoveredPassword && (
          <div style={{ 
            color: 'var(--text-primary)', 
            marginBottom: '1.5rem', 
            textAlign: 'center', 
            fontSize: '1rem', 
            padding: '1rem', 
            borderRadius: '0.5rem', 
            border: '1px solid rgba(46, 204, 113, 0.3)', 
            background: 'rgba(46, 204, 113, 0.1)',
            fontWeight: '500'
          }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Password recovered successfully:</p>
            <span style={{ fontSize: '1.4rem', color: 'var(--success)', fontWeight: '700', letterSpacing: '0.5px' }}>{recoveredPassword}</span>
          </div>
        )}

        <form onSubmit={handleRecoverPassword}>
          <div className="form-group">
            <label className="form-label">Registered Email</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Registered Full Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter your registered name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={loading}>
            {loading ? 'Verifying...' : 'Recover Password'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Back to <Link to="/login" style={{ color: 'var(--accent-color)', fontWeight: '500' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
