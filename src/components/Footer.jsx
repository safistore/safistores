import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{ background: 'var(--bg-secondary)', padding: '3rem 0', borderTop: 'var(--glass-border)', marginTop: '4rem' }}>
      <div className="container grid-cols-4">
        <div>
          <img src="/safi.png" alt="Safi Store Logo" style={{ height: '35px', marginBottom: '1rem', objectFit: 'contain' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Nish Fashion - Your premium online retail destination. Faith. Simplicity. Quality.
          </p>
        </div>
        
        <div>
          <h4 style={{ marginBottom: '1rem' }}>Shop</h4>
          <ul style={{ listStyle: 'none', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><Link to="/">Men</Link></li>
            <li><Link to="/">Women</Link></li>
            <li><Link to="/">Kids</Link></li>
            <li><Link to="/">New Arrivals</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={{ marginBottom: '1rem' }}>Help</h4>
          <ul style={{ listStyle: 'none', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><Link to="/">Track Order</Link></li>
            <li><Link to="/">Returns & Exchanges</Link></li>
            <li><Link to="/">Shipping Info</Link></li>
            <li><Link to="/">Customer Service</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={{ marginBottom: '1rem' }}>Contact Us</h4>
          <ul style={{ listStyle: 'none', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Email: support@safistore.com</li>
            <li>Phone: +91 9345314960</li>
          </ul>
        </div>
      </div>
      
      <div className="container" style={{ textAlign: 'center', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        <p>&copy; {new Date().getFullYear()} Safi Store (Nish Fashion). All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
