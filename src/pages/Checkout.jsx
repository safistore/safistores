import { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { CheckCircle2, Copy, RefreshCw, Printer, ShieldAlert, Clock, ArrowRight } from 'lucide-react';

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Checkout Wizard Step state: 'shipping', 'payment', 'success'
  const [checkoutStep, setCheckoutStep] = useState('shipping');
  const [orderId, setOrderId] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerExpired, setTimerExpired] = useState(false);
  const timerRef = useRef(null);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('9345314960@axl');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 60-Second Real-Time Verification Handler
  useEffect(() => {
    if (checkoutStep === 'payment' && orderId) {
      // 1. Establish Firestore real-time listener
      const unsubscribe = onSnapshot(doc(db, "orders", orderId), (snapshot) => {
        const data = snapshot.data();
        if (data && (data.status === 'Completed' || data.status === 'Paid' || data.status === 'Shipped')) {
          clearInterval(timerRef.current);
          setCheckoutStep('success');
          clearCart();
        }
      });

      // 2. Start Countdown
      setTimeLeft(60);
      setTimerExpired(false);
      
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        unsubscribe();
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [checkoutStep, orderId]);

  if (cart.length === 0 && checkoutStep !== 'success') {
    return (
      <div className="container flex-center" style={{ minHeight: '60vh', flexDirection: 'column' }}>
        <h2 className="heading-md text-gradient">Your Cart is Empty</h2>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Go Home</Link>
      </div>
    );
  }

  // Handle step transitions and order creation
  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      alert("Please fill in all shipping details.");
      return;
    }

    setLoading(true);

    try {
      // Create pending order document
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
          selectedColor: item.selectedColor || null,
          sizeLabel: item.sizeLabel || null,
          colorLabel: item.colorLabel || null,
          imageUrl: item.imageUrl || null
        })),
        total: Number(cartTotal),
        status: 'Pending Payment Verification',
        userId: auth.currentUser?.uid || 'guest',
        userEmail: auth.currentUser?.email || 'guest@example.com',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      setOrderId(docRef.id);
      setCheckoutStep('payment');
    } catch (error) {
      console.error("Error initiating checkout:", error);
      alert("Failed to initiate order. Please try again: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Redirect to WhatsApp for manual verification
  const handleWhatsAppVerify = () => {
    const message = `Please verify my payment. I have sent the payment screenshot.

*Order ID:* ${orderId}
*Customer Name:* ${name}
*Phone:* ${phone}
*Shipping Address:* ${address}

*Order Details:*
${cart.map(item => {
  const variationText = [
    item.selectedSize ? `${item.sizeLabel || 'Size'}: ${item.selectedSize}` : '',
    item.selectedColor ? `${item.colorLabel || 'Color'}: ${item.selectedColor}` : ''
  ].filter(Boolean).join(', ');
  return `- ${item.name} ${variationText ? `(${variationText}) ` : ''}x ${item.quantity} (₹${item.price * item.quantity})`;
}).join('\n')}

*Total Amount Paid:* ₹${cartTotal}`;

    const encodedMessage = encodeURIComponent(message);
    clearCart();
    window.location.href = `https://wa.me/919345314960?text=${encodedMessage}`;
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 1.5rem', maxWidth: '800px' }}>
      
      {/* STEP 1: Shipping Details */}
      {checkoutStep === 'shipping' && (
        <form onSubmit={handleProceedToPayment}>
          <h2 className="heading-md" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>Checkout</h2>
          
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

          {/* Order Summary */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>2. Order Summary</h3>
            {cart.map(item => (
              <div key={item.cartItemId} className="flex-between" style={{ marginBottom: '0.75rem', alignItems: 'flex-start', color: 'var(--text-secondary)' }}>
                <div>
                  <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{item.name}</span>
                  <span style={{ fontSize: '0.85rem', display: 'block', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    {item.selectedSize ? `${item.sizeLabel || 'Size'}: ${item.selectedSize}` : ''}
                    {item.selectedSize && item.selectedColor ? ' | ' : ''}
                    {item.selectedColor ? `${item.colorLabel || 'Color'}: ${item.selectedColor}` : ''}
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
            className="btn btn-accent" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
            <ArrowRight size={18} />
          </button>
        </form>
      )}

      {/* STEP 2: UPI Payment Terminal with Countdown */}
      {checkoutStep === 'payment' && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700' }}>Payment Verification</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Complete the payment and wait. The administrator will approve your payment in real-time.
          </p>

          {/* Countdown Clock */}
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            padding: '0.75rem 2rem', 
            borderRadius: '9999px',
            backgroundColor: timerExpired ? 'rgba(239, 68, 68, 0.1)' : 'rgba(241, 196, 15, 0.1)',
            color: timerExpired ? 'var(--danger)' : 'var(--accent-color)',
            border: `1px solid ${timerExpired ? 'var(--danger)' : 'var(--accent-color)'}`,
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '2rem'
          }}>
            <Clock size={24} style={{ animation: !timerExpired ? 'spin 5s linear infinite' : 'none' }} />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          {/* QR Code and Details */}
          <div style={{ 
            backgroundColor: 'var(--bg-secondary)', 
            borderRadius: '0.75rem', 
            padding: '2rem', 
            marginBottom: '2rem',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem'
          }}>
            <div style={{ width: '200px', height: '200px', background: '#fff', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <img src="/qr-code.jpg" alt="UPI QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>

            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Amount to Pay:</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--accent-color)', margin: '0.25rem 0' }}>₹{cartTotal}</h3>
            </div>

            <div style={{ width: '100%', height: '1px', background: 'var(--border-color)' }}></div>

            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>UPI ID:</p>
              <div className="flex-center" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
                <p style={{ fontSize: '1.15rem', fontWeight: '600', letterSpacing: '0.5px', margin: 0 }}>9345314960@axl</p>
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
                    cursor: 'pointer'
                  }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Loader status */}
          {!timerExpired ? (
            <div className="flex-center" style={{ flexDirection: 'column', gap: '0.75rem' }}>
              <RefreshCw size={24} style={{ color: 'var(--accent-color)', animation: 'spin 2s linear infinite' }} />
              <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>Waiting for admin payment approval...</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Keep this page open. We will redirect you once verified.</p>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <div className="flex-center" style={{ gap: '0.5rem', color: 'var(--danger)', marginBottom: '1.5rem', justifyContent: 'center' }}>
                <ShieldAlert size={24} />
                <span style={{ fontWeight: '600' }}>Approval window timed out.</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                If you have completed the transaction, click below to verify manually by sending the receipt screenshot to our WhatsApp agent.
              </p>
              <button 
                onClick={handleWhatsAppVerify}
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem', backgroundColor: '#25D366', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                Verify on WhatsApp
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Professional printable invoice receipt */}
      {checkoutStep === 'success' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Main Success Card */}
          <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <div className="flex-center" style={{ color: 'var(--success)', marginBottom: '1rem' }}>
              <CheckCircle2 size={56} style={{ strokeWidth: '1.5px' }} />
            </div>
            <h2 className="heading-md" style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: '700' }}>Payment Verified!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Thank you! Your transaction was approved by our team. Your order details are below.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={handlePrintReceipt} className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                <Printer size={18} />
                Print Receipt
              </button>
              <Link to="/orders" className="btn btn-primary">
                View Order History
              </Link>
            </div>
          </div>

          {/* Printable Invoice Bill */}
          <div className="glass-card printable-receipt" style={{ padding: '2.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-color)' }}>Nish Fashion</h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Safi Store Receipt</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h4 style={{ fontSize: '1rem', margin: 0 }}>INVOICE BILL</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>ID: {orderId}</p>
              </div>
            </div>

            <div className="grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Billed To:</h5>
                <p style={{ fontWeight: '600', margin: 0 }}>{name}</p>
                <p style={{ fontSize: '0.875rem', margin: '0.25rem 0' }}>{phone}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{address}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Details:</h5>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <p style={{ fontSize: '0.875rem', margin: '0.25rem 0' }}>Payment: Verified UPI</p>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>Status: <strong style={{ color: 'var(--success)' }}>PAID</strong></p>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>
                <span>Item Name</span>
                <span style={{ textAlign: 'center' }}>Price</span>
                <span style={{ textAlign: 'center' }}>Qty</span>
                <span style={{ textAlign: 'right' }}>Total</span>
              </div>
              
              {cart.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', padding: '0.75rem 0', fontSize: '0.9rem', borderBottom: '1px dotted var(--border-color)', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '500' }}>{item.name}</span>
                    {(item.selectedSize || item.selectedColor) && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {item.selectedSize ? `${item.sizeLabel || 'Size'}: ${item.selectedSize}` : ''}
                        {item.selectedSize && item.selectedColor ? ' | ' : ''}
                        {item.selectedColor ? `${item.colorLabel || 'Color'}: ${item.selectedColor}` : ''}
                      </span>
                    )}
                  </div>
                  <span style={{ textAlign: 'center' }}>₹{item.price}</span>
                  <span style={{ textAlign: 'center' }}>{item.quantity}</span>
                  <span style={{ textAlign: 'right', fontWeight: '500' }}>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: '250px' }}>
                <div className="flex-between" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <span>Subtotal:</span>
                  <span>₹{cartTotal}</span>
                </div>
                <div className="flex-between" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <span>Shipping:</span>
                  <span>Free</span>
                </div>
                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>
                <div className="flex-between" style={{ fontSize: '1.15rem', fontWeight: '700' }}>
                  <span>Grand Total:</span>
                  <span style={{ color: 'var(--accent-color)' }}>₹{cartTotal}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Helper CSS styles for timer spin and receipt printing */}
      <style>{`
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-receipt, .printable-receipt * {
            visibility: visible;
          }
          .printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Checkout;
