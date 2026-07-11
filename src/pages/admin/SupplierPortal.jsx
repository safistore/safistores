import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Search, ArrowLeft, Calendar, FileText, CheckCircle2, ShieldAlert, Download, Printer, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SupplierPortal = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // State for Invoice Preview Modal
  const [previewOrder, setPreviewOrder] = useState(null);
  const [previewType, setPreviewType] = useState(''); // 'customer' or 'supplier'
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

  const downloadPDFFromPreview = () => {
    const element = document.getElementById('preview-sheet-to-pdf');
    if (!element) return;
    
    setDownloading(true);
    
    const opt = {
      margin:       12,
      filename:     `${previewType === 'customer' ? 'Customer' : 'Supplier'}_Bill_${previewOrder.id}.pdf`,
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

                  {/* Preview / Print Options */}
                  <button 
                    onClick={() => { setPreviewOrder(order); setPreviewType('customer'); }} 
                    className="btn btn-primary" 
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', gap: '0.35rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', fontWeight: '600' }}
                  >
                    <FileText size={16} />
                    Customer Bill
                  </button>
                  <button 
                    onClick={() => { setPreviewOrder(order); setPreviewType('supplier'); }} 
                    className="btn btn-accent" 
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', gap: '0.35rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', fontWeight: '600' }}
                  >
                    <FileText size={16} />
                    Supplier Slip
                  </button>
                </div>
              </div>

              {/* Order Content Preview on Dashboard */}
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

                {/* Items summary details */}
                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem' }}>
                  <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Items Purchased:</h5>
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex-between" style={{ padding: '0.4rem 0', borderBottom: '1px dashed var(--border-color)', fontSize: '0.9rem' }}>
                      <div className="flex-center" style={{ gap: '0.5rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                          {item.imageUrl && <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div>
                          <span>{item.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>x{item.quantity}</span>
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

      {/* BILL PREVIEW AND PDF DOWNLOADER MODAL */}
      {previewOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '2rem 1rem',
          overflowY: 'auto'
        }}>
          {/* Toolbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            maxWidth: '800px',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            padding: '1rem 1.5rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>
              {previewType === 'customer' ? 'Customer Invoice Preview' : 'Supplier Slip Preview'}
            </span>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button 
                onClick={downloadPDFFromPreview}
                className="btn btn-accent"
                style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontWeight: '600' }}
                disabled={downloading}
              >
                <Download size={16} />
                {downloading ? 'Downloading...' : 'Download PDF'}
              </button>
              <button 
                onClick={() => {
                  const printContent = document.getElementById('preview-sheet-to-pdf').innerHTML;
                  const originalContent = document.body.innerHTML;
                  document.body.innerHTML = printContent;
                  window.print();
                  window.location.reload(); // Reload to restore React state cleanly
                }}
                className="btn btn-secondary"
                style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontWeight: '600' }}
              >
                <Printer size={16} />
                Print
              </button>
              <button 
                onClick={() => { setPreviewOrder(null); setPreviewType(''); }}
                className="btn"
                style={{ padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Paper Sheet Preview Area */}
          <div 
            id="preview-sheet-to-pdf"
            className="printable-receipt"
            style={{
              width: '100%',
              maxWidth: '800px',
              backgroundColor: '#ffffff',
              color: '#000000',
              padding: '40px',
              borderRadius: '0.5rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              boxSizing: 'border-box',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            {previewType === 'customer' ? (
              <div style={{ background: '#ffffff', color: '#000000' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #333333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: '#000000' }}>Nish Fashion</h1>
                    <p style={{ fontSize: '0.85rem', color: '#555555', margin: '0.25rem 0 0 0' }}>Safi Store Receipt</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#000000' }}>CUSTOMER RECEIPT</h3>
                    <p style={{ fontSize: '0.85rem', color: '#555555', margin: '0.25rem 0 0 0' }}>Invoice ID: {previewOrder.id}</p>
                  </div>
                </div>

                {/* Billed To / Invoice Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  <div>
                    <h5 style={{ fontSize: '0.85rem', color: '#666666', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '700' }}>Billed To:</h5>
                    <p style={{ fontWeight: '800', fontSize: '1rem', margin: 0, color: '#000000' }}>{previewOrder.customerName}</p>
                    <p style={{ fontSize: '0.9rem', margin: '0.25rem 0', color: '#000000' }}>Phone: {previewOrder.customerPhone}</p>
                    <p style={{ fontSize: '0.9rem', color: '#333333', margin: 0, lineHeight: '1.4' }}>{previewOrder.shippingAddress}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h5 style={{ fontSize: '0.85rem', color: '#666666', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '700' }}>Invoice Details:</h5>
                    <p style={{ fontSize: '0.9rem', margin: 0, color: '#000000' }}>Date: {formatOrderDate(previewOrder.createdAt)}</p>
                    <p style={{ fontSize: '0.9rem', margin: '0.25rem 0', color: '#000000' }}>Payment: Verified UPI</p>
                    <p style={{ fontSize: '0.9rem', margin: 0, color: '#000000' }}>Status: <strong style={{ color: '#2ecc71' }}>PAID</strong></p>
                  </div>
                </div>

                {/* Items Table */}
                <div style={{ borderBottom: '2px solid #333333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '70px 3fr 1.2fr 1fr 1.2fr', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #333333', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#000000' }}>
                    <span>Photo</span>
                    <span>Item Description</span>
                    <span style={{ textAlign: 'center' }}>Unit Price</span>
                    <span style={{ textAlign: 'center' }}>Qty</span>
                    <span style={{ textAlign: 'right' }}>Total Price</span>
                  </div>
                  
                  {previewOrder.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '70px 3fr 1.2fr 1fr 1.2fr', gap: '0.5rem', padding: '0.75rem 0', fontSize: '0.9rem', borderBottom: '1px dashed #cccccc', alignItems: 'center', color: '#000000' }}>
                      <div style={{ width: '55px', height: '55px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #cccccc', backgroundColor: '#f9f9f9' }}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ fontSize: '0.6rem', color: '#777777', textAlign: 'center', paddingTop: '15px' }}>No Img</div>
                        )}
                      </div>
                      <div>
                        <span style={{ fontWeight: '800', color: '#000000' }}>{item.name}</span>
                        {(item.selectedSize || item.selectedColor) && (
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#555555', marginTop: '2px' }}>
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

                {/* Summary */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', color: '#000000' }}>
                  <div style={{ width: '250px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', margin: '0.35rem 0' }}>
                      <span>Subtotal:</span>
                      <span>₹{previewOrder.total}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', margin: '0.35rem 0' }}>
                      <span>Shipping:</span>
                      <span>Free</span>
                    </div>
                    <div style={{ height: '1px', background: '#333333', margin: '0.5rem 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: '800' }}>
                      <span>Grand Total:</span>
                      <span>₹{previewOrder.total}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#ffffff', color: '#000000' }}>
                {/* Supplier Slip Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #333333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: '#000000' }}>Nish Fashion</h1>
                    <p style={{ fontSize: '12px', color: '#555555', margin: '4px 0 0 0' }}>Supplier Shipping Manifest</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#000000' }}>SUPPLIER SLIP</h3>
                    <p style={{ fontSize: '12px', color: '#555555', margin: '4px 0 0 0' }}>Order ID: {previewOrder.id}</p>
                  </div>
                </div>

                {/* Delivery details */}
                <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #cccccc', borderRadius: '0.5rem', backgroundColor: '#f9f9f9' }}>
                  <h5 style={{ fontSize: '12px', color: '#666666', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '700' }}>Delivery Address & Contact:</h5>
                  <p style={{ fontWeight: '800', fontSize: '1.15rem', margin: 0, color: '#000000' }}>{previewOrder.customerName}</p>
                  <p style={{ fontWeight: '800', fontSize: '1rem', margin: '0.25rem 0', color: '#000000' }}>Phone: {previewOrder.customerPhone}</p>
                  <p style={{ fontSize: '1rem', color: '#111111', margin: 0, lineHeight: '1.5' }}>{previewOrder.shippingAddress}</p>
                </div>

                {/* Supplier Items table */}
                <div style={{ borderBottom: '2px solid #333333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 3.5fr 1.2fr 1fr', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #333333', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#000000' }}>
                    <span>Photo</span>
                    <span>Product Specifications</span>
                    <span style={{ textAlign: 'center' }}>Unit Price</span>
                    <span style={{ textAlign: 'center' }}>Quantity</span>
                  </div>
                  
                  {previewOrder.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '80px 3.5fr 1.2fr 1fr', gap: '0.5rem', padding: '0.75rem 0', fontSize: '0.95rem', borderBottom: '1px dashed #cccccc', alignItems: 'center', color: '#000000' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #cccccc', backgroundColor: '#f9f9f9' }}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ fontSize: '0.6rem', color: '#777777', textAlign: 'center', paddingTop: '15px' }}>No Img</div>
                        )}
                      </div>
                      <div>
                        <span style={{ fontWeight: '800', color: '#000000' }}>{item.name}</span>
                        {(item.selectedSize || item.selectedColor) && (
                          <span style={{ display: 'block', fontSize: '0.8rem', color: '#333333', marginTop: '4px', fontWeight: '500' }}>
                            {item.selectedSize ? `${item.sizeLabel || 'Size'}: ${item.selectedSize}` : ''}
                            {item.selectedSize && item.selectedColor ? ' | ' : ''}
                            {item.selectedColor ? `${item.colorLabel || 'Color'}: ${item.selectedColor}` : ''}
                          </span>
                        )}
                      </div>
                      <span style={{ textAlign: 'center' }}>₹{item.price}</span>
                      <span style={{ textAlign: 'center', fontWeight: '700' }}>{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.85rem', color: '#666666' }}>
                  <p>Please deliver the package carefully. Pack with secure materials.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating status alert during download */}
      {downloading && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 3000, background: 'var(--accent-color)', color: 'black', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', boxShadow: 'var(--shadow-lg)' }}>
          Generating Receipt PDF...
        </div>
      )}
    </div>
  );
};

export default SupplierPortal;
