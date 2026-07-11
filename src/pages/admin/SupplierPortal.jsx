import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Printer, Search, ArrowLeft, Calendar, FileText, CheckCircle2, ShieldAlert, Download } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const SupplierPortal = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // State for printing
  const [printOrder, setPrintOrder] = useState(null);
  const [printType, setPrintType] = useState(''); // 'customer' or 'supplier'
  const [downloading, setDownloading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
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

  const handlePrint = (order, type) => {
    setPrintOrder(order);
    setPrintType(type);
    // Give state a moment to render the print container before calling print dialog
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleDownloadPDF = (order, type) => {
    setPrintOrder(order);
    setPrintType(type);
    setDownloading(true);
    
    setTimeout(() => {
      const element = document.getElementById('pdf-receipt-content');
      if (!element) {
        setDownloading(false);
        return;
      }
      
      const opt = {
        margin:       12,
        filename:     `${type === 'customer' ? 'Customer' : 'Supplier'}_Bill_${order.id}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      const triggerDownload = () => {
        window.html2pdf()
          .from(element)
          .set(opt)
          .save()
          .then(() => {
            setDownloading(false);
          })
          .catch((err) => {
            console.error("PDF generation error:", err);
            setDownloading(false);
          });
      };

      if (window.html2pdf) {
        triggerDownload();
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = triggerDownload;
        script.onerror = () => {
          alert("Failed to load PDF library. Please check your internet connection.");
          setDownloading(false);
        };
        document.body.appendChild(script);
      }
    }, 300);
  };

  // Filter orders based on query and status filter
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery);
      
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="flex-center" style={{ height: '70vh' }}>Loading Supplier Portal...</div>;
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={() => navigate('/admin')} className="flex-center" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', gap: '0.5rem', padding: 0, marginBottom: '1.5rem', fontWeight: '500' }}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <h2 className="heading-md">Supplier Receipt Portal</h2>
          <span className="badge">Admin Access</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignContent: 'center', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '0.5rem 1rem', flex: 1, minWidth: '250px', gap: '0.5rem' }}>
          <Search size={20} style={{ color: 'var(--text-secondary)', marginTop: '0.1rem' }} />
          <input 
            type="text" 
            placeholder="Search by Order ID, Name, or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'none', outline: 'none', width: '100%', color: 'var(--text-primary)' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          <option value="All">All Statuses</option>
          <option value="Pending Payment Verification">Pending Verification</option>
          <option value="Completed">Completed</option>
          <option value="Shipped">Shipped</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="glass-card flex-center" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>No orders found matching the filter criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredOrders.map(order => (
            <div 
              key={order.id} 
              className="glass-card" 
              style={{ 
                padding: '2rem',
                borderLeft: order.status === 'Pending Payment Verification' ? '4px solid #f1c40f' : '1px solid var(--border-color)' 
              }}
            >
              {/* Order Row Header */}
              <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order Details</span>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: '600', margin: '0.15rem 0' }}>{order.id}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Date: {formatOrderDate(order.createdAt)}
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {order.status === 'Pending Payment Verification' ? (
                    <span style={{ padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'rgba(241,196,15,0.15)', color: '#f1c40f', border: '1px solid rgba(241,196,15,0.3)' }}>
                      Pending Verification
                    </span>
                  ) : (
                    <span style={{ padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'rgba(46,204,113,0.15)', color: '#2ecc71', border: '1px solid rgba(46,204,113,0.3)' }}>
                      Approved / Paid
                    </span>
                  )}

                  {/* Print / Download Buttons */}
                  <button 
                    onClick={() => handleDownloadPDF(order, 'customer')} 
                    className="btn btn-primary" 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', gap: '0.35rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                    disabled={downloading}
                  >
                    <Download size={16} />
                    Customer Bill (PDF)
                  </button>
                  <button 
                    onClick={() => handleDownloadPDF(order, 'supplier')} 
                    className="btn btn-accent" 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', gap: '0.35rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                    disabled={downloading}
                  >
                    <Download size={16} />
                    Supplier Slip (PDF)
                  </button>
                </div>
              </div>

              {/* Order Content */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', flexWrap: 'wrap' }}>
                {/* Shipping Details */}
                <div>
                  <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Shipping Details:</h5>
                  <p style={{ fontWeight: '600', fontSize: '1rem', margin: 0 }}>{order.customerName}</p>
                  <p style={{ fontWeight: '500', fontSize: '0.9rem', margin: '0.25rem 0' }}>Phone: {order.customerPhone}</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {order.shippingAddress}
                  </p>
                </div>

                {/* Items details */}
                <div>
                  <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Ordered Items:</h5>
                  {order.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dotted var(--border-color)', fontSize: '0.95rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {item.imageUrl && (
                          <div style={{ width: '40px', height: '40px', borderRadius: '0.25rem', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <div>
                          <span style={{ fontWeight: '500' }}>{item.name}</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}> x {item.quantity}</span>
                          {(item.selectedSize || item.selectedColor) && (
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                              {item.selectedSize ? `${item.sizeLabel || 'Size'}: ${item.selectedSize}` : ''}
                              {item.selectedSize && item.selectedColor ? ' | ' : ''}
                              {item.selectedColor ? `${item.colorLabel || 'Color'}: ${item.selectedColor}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <span style={{ fontWeight: '600' }}>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="flex-between" style={{ marginTop: '1rem', fontWeight: '700', fontSize: '1.1rem' }}>
                    <span>Total Amount:</span>
                    <span style={{ color: 'var(--accent-color)' }}>₹{order.total}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* HIDDEN PRINTABLE CONTAINERS */}
      {printOrder && (
        <div className="print-overlay">
          {/* CUSTOMER RECEIPT INVOICE */}
          {printType === 'customer' && (
            <div className="print-receipt-sheet customer-sheet">
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>Nish Fashion</h1>
                  <p style={{ fontSize: '0.85rem', color: '#555', margin: '0.25rem 0 0 0' }}>Safi Store Receipt</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>CUSTOMER RECEIPT</h3>
                  <p style={{ fontSize: '0.85rem', color: '#555', margin: '0.25rem 0 0 0' }}>Invoice ID: {printOrder.id}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div>
                  <h5 style={{ fontSize: '0.85rem', color: '#666', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '700' }}>Billed To:</h5>
                  <p style={{ fontWeight: '700', fontSize: '1rem', margin: 0 }}>{printOrder.customerName}</p>
                  <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}>Phone: {printOrder.customerPhone}</p>
                  <p style={{ fontSize: '0.9rem', color: '#333', margin: 0, lineHeight: '1.4' }}>{printOrder.shippingAddress}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h5 style={{ fontSize: '0.85rem', color: '#666', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '700' }}>Invoice Details:</h5>
                  <p style={{ fontSize: '0.9rem', margin: 0 }}>Date: {formatOrderDate(printOrder.createdAt)}</p>
                  <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}>Payment: Verified UPI</p>
                  <p style={{ fontSize: '0.9rem', margin: 0 }}>Status: <strong style={{ color: '#2ecc71' }}>PAID</strong></p>
                </div>
              </div>

              <div style={{ borderBottom: '2px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '60px 3fr 1fr 1fr 1fr', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #333', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>
                  <span>Photo</span>
                  <span>Item Description</span>
                  <span style={{ textAlign: 'center' }}>Unit Price</span>
                  <span style={{ textAlign: 'center' }}>Qty</span>
                  <span style={{ textAlign: 'right' }}>Total Price</span>
                </div>
                
                {printOrder.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '60px 3fr 1fr 1fr 1fr', gap: '0.5rem', padding: '0.75rem 0', fontSize: '0.9rem', borderBottom: '1px dashed #ccc', alignItems: 'center' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '0.25rem', overflow: 'hidden', border: '1px solid #ccc', backgroundColor: '#f5f5f5' }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ fontSize: '0.6rem', color: '#666', textAlign: 'center', marginTop: '12px' }}>No Img</div>
                      )}
                    </div>
                    <div>
                      <span style={{ fontWeight: '700' }}>{item.name}</span>
                      {(item.selectedSize || item.selectedColor) && (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#555', marginTop: '0.15rem' }}>
                          {item.selectedSize ? `${item.sizeLabel || 'Size'}: ${item.selectedSize}` : ''}
                          {item.selectedSize && item.selectedColor ? ' | ' : ''}
                          {item.selectedColor ? `${item.colorLabel || 'Color'}: ${item.selectedColor}` : ''}
                        </span>
                      )}
                    </div>
                    <span style={{ textAlign: 'center' }}>₹{item.price}</span>
                    <span style={{ textAlign: 'center' }}>{item.quantity}</span>
                    <span style={{ textAlign: 'right', fontWeight: '700' }}>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '250px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', margin: '0.35rem 0' }}>
                    <span>Subtotal:</span>
                    <span>₹{printOrder.total}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', margin: '0.35rem 0' }}>
                    <span>Shipping:</span>
                    <span>Free</span>
                  </div>
                  <div style={{ height: '1px', background: '#333', margin: '0.5rem 0' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '800' }}>
                    <span>Grand Total:</span>
                    <span>₹{printOrder.total}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUPPLIER SLIP (EXCLUDES TOTALS, INCLUDES UNIT PRICE & DETAILS) */}
          {printType === 'supplier' && (
            <div className="print-receipt-sheet supplier-sheet">
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>Nish Fashion</h1>
                  <p style={{ fontSize: '0.85rem', color: '#555', margin: '0.25rem 0 0 0' }}>Supplier Shipping Manifest</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>SUPPLIER SLIP</h3>
                  <p style={{ fontSize: '0.85rem', color: '#555', margin: '0.25rem 0 0 0' }}>Order ID: {printOrder.id}</p>
                </div>
              </div>

              <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '0.5rem', backgroundColor: '#f9f9f9' }}>
                <h5 style={{ fontSize: '0.85rem', color: '#666', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '700' }}>Delivery Address & Contact:</h5>
                <p style={{ fontWeight: '700', fontSize: '1.15rem', margin: 0 }}>{printOrder.customerName}</p>
                <p style={{ fontWeight: '700', fontSize: '1rem', margin: '0.25rem 0' }}>Phone: {printOrder.customerPhone}</p>
                <p style={{ fontSize: '1rem', color: '#111', margin: 0, lineHeight: '1.5' }}>{printOrder.shippingAddress}</p>
              </div>

              <div style={{ borderBottom: '2px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '70px 4fr 1.5fr 1fr', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #333', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>
                  <span>Photo</span>
                  <span>Product Specifications</span>
                  <span style={{ textAlign: 'center' }}>Unit Price</span>
                  <span style={{ textAlign: 'center' }}>Quantity</span>
                </div>
                
                {printOrder.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '70px 4fr 1.5fr 1fr', gap: '0.5rem', padding: '0.75rem 0', fontSize: '0.95rem', borderBottom: '1px dashed #ccc', alignItems: 'center' }}>
                    <div style={{ width: '55px', height: '55px', borderRadius: '0.25rem', overflow: 'hidden', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ fontSize: '0.7rem', color: '#666', textAlign: 'center', marginTop: '15px' }}>No Img</div>
                      )}
                    </div>
                    <div>
                      <span style={{ fontWeight: '800', fontSize: '1.05rem' }}>{item.name}</span>
                      {(item.selectedSize || item.selectedColor) && (
                        <span style={{ display: 'block', fontSize: '0.8rem', color: '#333', marginTop: '0.25rem', fontWeight: '500' }}>
                          {item.selectedSize ? `${item.sizeLabel || 'Size'}: ${item.selectedSize}` : ''}
                          {item.selectedSize && item.selectedColor ? ' | ' : ''}
                          {item.selectedColor ? `${item.colorLabel || 'Color'}: ${item.selectedColor}` : ''}
                        </span>
                      )}
                    </div>
                    <span style={{ textAlign: 'center', fontWeight: '600' }}>₹{item.price}</span>
                    <span style={{ textAlign: 'center', fontWeight: '700', fontSize: '1.1rem' }}>{item.quantity}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>
                <p>Please deliver the package carefully. Pack with secure materials.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PRINT STYLES */}
      <style>{`
        .print-overlay {
          display: none;
        }
        
        @media print {
          body * {
            visibility: hidden;
            background: none !important;
          }
          .print-overlay, .print-overlay * {
            visibility: visible;
          }
          .print-overlay {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            background: white !important;
            color: black !important;
          }
          .print-receipt-sheet {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            box-sizing: border-box;
            background: white !important;
            color: black !important;
          }
          .customer-sheet {
            border: none;
          }
          .supplier-sheet {
            border: none;
          }
        }
      `}</style>
      
      {/* HIDDEN OFFSCREEN CONTAINER FOR DIRECT PDF DOWNLOAD */}
      {printOrder && (
        <div 
          id="pdf-receipt-content" 
          style={{ 
            position: 'absolute', 
            left: '-9999px', 
            top: '-9999px', 
            width: '790px', 
            backgroundColor: '#ffffff', 
            color: '#000000', 
            padding: '30px', 
            boxSizing: 'border-box',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          {printType === 'customer' ? (
            <div className="pdf-receipt-sheet customer-sheet" style={{ background: '#ffffff', color: '#000000' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000000', paddingBottom: '15px', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#000000' }}>Nish Fashion</h1>
                  <p style={{ fontSize: '12px', color: '#555555', margin: '4px 0 0 0' }}>Safi Store Receipt</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#000000' }}>CUSTOMER RECEIPT</h3>
                  <p style={{ fontSize: '12px', color: '#555555', margin: '4px 0 0 0' }}>Invoice ID: {printOrder.id}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '30px' }}>
                <div>
                  <h5 style={{ fontSize: '12px', color: '#666666', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '700' }}>Billed To:</h5>
                  <p style={{ fontWeight: '800', fontSize: '14px', margin: 0, color: '#000000' }}>{printOrder.customerName}</p>
                  <p style={{ fontSize: '13px', margin: '4px 0', color: '#000000' }}>Phone: {printOrder.customerPhone}</p>
                  <p style={{ fontSize: '13px', color: '#333333', margin: 0, lineHeight: '1.4' }}>{printOrder.shippingAddress}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h5 style={{ fontSize: '12px', color: '#666666', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '700' }}>Invoice Details:</h5>
                  <p style={{ fontSize: '13px', margin: 0, color: '#000000' }}>Date: {formatOrderDate(printOrder.createdAt)}</p>
                  <p style={{ fontSize: '13px', margin: '4px 0', color: '#000000' }}>Payment: Verified UPI</p>
                  <p style={{ fontSize: '13px', margin: 0, color: '#000000' }}>Status: <strong style={{ color: '#2ecc71' }}>PAID</strong></p>
                </div>
              </div>

              <div style={{ borderBottom: '2px solid #000000', paddingBottom: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 3fr 1fr 1fr 1.2fr', gap: '10px', paddingBottom: '8px', borderBottom: '1px solid #000000', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#000000' }}>
                  <span>Photo</span>
                  <span>Item Description</span>
                  <span style={{ textAlign: 'center' }}>Unit Price</span>
                  <span style={{ textAlign: 'center' }}>Qty</span>
                  <span style={{ textAlign: 'right' }}>Total Price</span>
                </div>
                
                {printOrder.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '80px 3fr 1fr 1fr 1.2fr', gap: '10px', padding: '10px 0', fontSize: '13px', borderBottom: '1px dashed #cccccc', alignItems: 'center', color: '#000000' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #cccccc', backgroundColor: '#f9f9f9' }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ fontSize: '8px', color: '#777777', textAlign: 'center', paddingTop: '20px' }}>No Image</div>
                      )}
                    </div>
                    <div>
                      <span style={{ fontWeight: '800', display: 'block', color: '#000000' }}>{item.name}</span>
                      {(item.selectedSize || item.selectedColor) && (
                        <span style={{ display: 'block', fontSize: '11px', color: '#555555', marginTop: '2px' }}>
                          {item.selectedSize ? `${item.sizeLabel || 'Size'}: ${item.selectedSize}` : ''}
                          {item.selectedSize && item.selectedColor ? ' | ' : ''}
                          {item.selectedColor ? `${item.colorLabel || 'Color'}: ${item.selectedColor}` : ''}
                        </span>
                      )}
                    </div>
                    <span style={{ textAlign: 'center' }}>₹{item.price}</span>
                    <span style={{ textAlign: 'center' }}>{item.quantity}</span>
                    <span style={{ textAlign: 'right', fontWeight: '800' }}>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', color: '#000000' }}>
                <div style={{ width: '250px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '5px 0' }}>
                    <span>Subtotal:</span>
                    <span>₹{printOrder.total}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '5px 0' }}>
                    <span>Shipping:</span>
                    <span>Free</span>
                  </div>
                  <div style={{ height: '1px', background: '#000000', margin: '8px 0' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800' }}>
                    <span>Grand Total:</span>
                    <span style={{ color: '#000000' }}>₹{printOrder.total}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="pdf-receipt-sheet supplier-sheet" style={{ background: '#ffffff', color: '#000000' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000000', paddingBottom: '15px', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#000000' }}>Nish Fashion</h1>
                  <p style={{ fontSize: '12px', color: '#555555', margin: '4px 0 0 0' }}>Supplier Shipping Manifest</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#000000' }}>SUPPLIER SLIP</h3>
                  <p style={{ fontSize: '12px', color: '#555555', margin: '4px 0 0 0' }}>Order ID: {printOrder.id}</p>
                </div>
              </div>

              <div style={{ marginBottom: '25px', padding: '15px', border: '1px solid #cccccc', borderRadius: '6px', backgroundColor: '#f9f9f9' }}>
                <h5 style={{ fontSize: '12px', color: '#666666', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '700' }}>Delivery Address & Contact:</h5>
                <p style={{ fontWeight: '800', fontSize: '16px', margin: 0, color: '#000000' }}>{printOrder.customerName}</p>
                <p style={{ fontWeight: '800', fontSize: '14px', margin: '4px 0', color: '#000000' }}>Phone: {printOrder.customerPhone}</p>
                <p style={{ fontSize: '14px', color: '#111111', margin: 0, lineHeight: '1.5' }}>{printOrder.shippingAddress}</p>
              </div>

              <div style={{ borderBottom: '2px solid #000000', paddingBottom: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 3.5fr 1.2fr 1fr', gap: '10px', paddingBottom: '8px', borderBottom: '1px solid #000000', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#000000' }}>
                  <span>Photo</span>
                  <span>Product Specifications</span>
                  <span style={{ textAlign: 'center' }}>Unit Price</span>
                  <span style={{ textAlign: 'center' }}>Quantity</span>
                </div>
                
                {printOrder.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '80px 3.5fr 1.2fr 1fr', gap: '10px', padding: '10px 0', fontSize: '13px', borderBottom: '1px dashed #cccccc', alignItems: 'center', color: '#000000' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #cccccc', backgroundColor: '#f9f9f9' }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ fontSize: '8px', color: '#777777', textAlign: 'center', paddingTop: '20px' }}>No Image</div>
                      )}
                    </div>
                    <div>
                      <span style={{ fontWeight: '800', display: 'block', color: '#000000' }}>{item.name}</span>
                      {(item.selectedSize || item.selectedColor) && (
                        <span style={{ display: 'block', fontSize: '11px', color: '#555555', marginTop: '2px' }}>
                          {item.selectedSize ? `${item.sizeLabel || 'Size'}: ${item.selectedSize}` : ''}
                          {item.selectedSize && item.selectedColor ? ' | ' : ''}
                          {item.selectedColor ? `${item.colorLabel || 'Color'}: ${item.selectedColor}` : ''}
                        </span>
                      )}
                    </div>
                    <span style={{ textAlign: 'center' }}>₹{item.price}</span>
                    <span style={{ textAlign: 'center' }}>{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating status alert during download */}
      {downloading && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, background: 'var(--accent-color)', color: 'black', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', boxShadow: 'var(--shadow-lg)' }}>
          Generating Receipt PDF...
        </div>
      )}
    </div>
  );
};

export default SupplierPortal;
