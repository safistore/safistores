import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('9345314960@axl');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (cart.length === 0) {
    return (
      <div className="container flex-center" style={{ minHeight: '60vh', flexDirection: 'column' }}>
        <h2>Your Cart is Empty</h2>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Go Home</Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      alert("Please fill in all shipping details.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create order object for database
      const orderData = {
        customerName: name,
        customerPhone: phone,
        shippingAddress: address,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          selectedSize: item.selectedSize || null,
          selectedColor: item.selectedColor || null
        })),
        total: Number(cartTotal),
        status: 'Pending Payment Verification',
        userId: auth.currentUser?.uid || 'guest',
        userEmail: auth.currentUser?.email || 'guest@example.com',
        createdAt: new Date().toISOString()
      };

      // 2. Save order to Firestore
      const docRef = await addDoc(collection(db, "orders"), orderData);
      const orderId = docRef.id;

      // 3. Format message for WhatsApp redirect
      const message = `Your order is placed. Please attach your screenshot.

*Order ID:* ${orderId}
*Customer Name:* ${name}
*Phone:* ${phone}
*Shipping Address:* ${address}

*Order Details:*
${cart.map(item => {
  const variationText = [
    item.selectedSize ? `Size: ${item.selectedSize}` : '',
    item.selectedColor ? `Color: ${item.selectedColor}` : ''
  ].filter(Boolean).join(', ');
  return `- ${item.name} ${variationText ? `(${variationText}) ` : ''}x ${item.quantity} (₹${item.price * item.quantity})`;
}).join('\n')}

*Total Amount Paid:* ₹${cartTotal}`;

      const encodedMessage = encodeURIComponent(message);
      
      // 4. Clear cart
      clearCart();
      
      // 5. Redirect to WhatsApp (using same window to bypass popup blockers)
      window.location.href = `https://wa.me/919345314960?text=${encodedMessage}`;
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to place order: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 1.5rem', maxWidth: '800px' }}>
      <h2 className="heading-md" style={{ textAlign: 'center', marginBottom: '3rem' }}>Checkout</h2>
      
      <form onSubmit={handlePlaceOrder}>
        {/* 1. Shipping Details */}
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>1. Shipping Details</h3>
          
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Recipient name" 
              value={name}
              onChange={e => setName(e.target.value)}
              required 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input 
              type="tel" 
              className="form-input" 
              placeholder="Delivery contact number" 
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Delivery Address</label>
            <textarea 
              className="form-input" 
              rows="3" 
              placeholder="Complete shipping address" 
              value={address}
              onChange={e => setAddress(e.target.value)}
              required 
            />
          </div>
        </div>

        {/* 2. Payment Details */}
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>2. Payment Details</h3>
          <p style={{ marginBottom: '1rem' }}>
            Please scan the QR code below or use the UPI ID to pay <strong>₹{cartTotal}</strong> for your order.
          </p>
          
          <div className="flex-center" style={{ flexDirection: 'column', gap: '1.5rem', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
            <div style={{ width: '200px', height: '200px', background: '#fff', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <img src="/qr-code.jpg" alt="UPI QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>UPI ID:</p>
              <div className="flex-center" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: '600', letterSpacing: '1px', margin: 0 }}>9345314960@axl</p>
                <button 
                  type="button" 
                  onClick={handleCopyUpi} 
                  style={{ 
                    padding: '0.35rem 0.75rem', 
                    fontSize: '0.8rem', 
                    backgroundColor: copied ? 'var(--success)' : 'var(--text-primary)', 
                    color: 'var(--bg-primary)', 
                    borderRadius: '9999px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Order Summary */}
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>3. Order Summary</h3>
          {cart.map(item => (
            <div key={item.cartItemId} className="flex-between" style={{ marginBottom: '0.75rem', alignItems: 'flex-start', color: 'var(--text-secondary)' }}>
              <div>
                <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{item.name}</span>
                <span style={{ fontSize: '0.85rem', display: 'block', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  {item.selectedSize ? `Size: ${item.selectedSize}` : ''}
                  {item.selectedSize && item.selectedColor ? ' | ' : ''}
                  {item.selectedColor ? `Color: ${item.selectedColor}` : ''}
                  {item.selectedSize || item.selectedColor ? ' | ' : ''}
                  Qty: {item.quantity}
                </span>
              </div>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '1rem 0' }}></div>
          <div className="flex-between" style={{ fontSize: '1.25rem', fontWeight: '600' }}>
            <span>Total</span>
            <span style={{ color: 'var(--accent-color)' }}>₹{cartTotal}</span>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', backgroundColor: '#25D366', color: 'white' }}
          disabled={loading}
        >
          {loading ? 'Processing Order...' : 'Confirm on WhatsApp'}
        </button>
      </form>
    </div>
  );
};

export default Checkout;
