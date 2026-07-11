import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trash2, Edit, Camera, Video, Plus, X, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [sizesInput, setSizesInput] = useState('');
  const [colorsInput, setColorsInput] = useState('');
  const [sizeLabel, setSizeLabel] = useState('Size');
  const [colorLabel, setColorLabel] = useState('Color');
  
  // Media Upload State
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [existingMedia, setExistingMedia] = useState([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  const [editingProductId, setEditingProductId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setFetching(true);
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const productsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsList);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    
    // Revoke previous URLs to prevent memory leaks
    previewUrls.forEach(item => URL.revokeObjectURL(item.url));
    
    const newPreviews = files.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image'
    }));
    setPreviewUrls(newPreviews);
    setActivePreviewIndex(0);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let media = [];

      // 1. Upload new files if any
      if (imageFiles.length > 0) {
        const uploadPromises = Array.from(imageFiles).map(async (file) => {
          const isVideo = file.type.startsWith('video/');
          const uploadUrl = isVideo 
            ? 'https://api.cloudinary.com/v1_1/dtqibelpn/video/upload' 
            : 'https://api.cloudinary.com/v1_1/dtqibelpn/image/upload';

          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', 'safistore_preset');

          const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `Failed to upload ${file.name}`);
          }

          const data = await response.json();
          return { url: data.secure_url, type: isVideo ? 'video' : 'image' };
        });

        media = await Promise.all(uploadPromises);
      } else if (editingProductId) {
        media = existingMedia;
      }

      // 2. Parse sizes and colors options
      const sizes = sizesInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      const colors = colorsInput
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);

      // Backwards compatibility fallbacks
      const imageUrls = media.map(m => m.url);
      const imageUrl = imageUrls[0] || '';

      const productData = {
        name,
        price: Number(price),
        description,
        imageUrl,
        imageUrls,
        media, // structured media array [{url, type}]
        sizes,
        colors,
        sizeLabel,
        colorLabel
      };

      if (editingProductId) {
        await updateDoc(doc(db, "products", editingProductId), productData);
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: new Date().toISOString()
        });
      }

      // Reset form
      handleCancelEdit();
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error saving product: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product) => {
    setEditingProductId(product.id);
    setName(product.name);
    setPrice(product.price);
    setDescription(product.description || '');
    setSizesInput(product.sizes ? product.sizes.join(', ') : '');
    setColorsInput(product.colors ? product.colors.join(', ') : '');
    setSizeLabel(product.sizeLabel || 'Size');
    setColorLabel(product.colorLabel || 'Color');
    
    // Set existing media
    const pMedia = product.media || (product.imageUrls || []).map(url => ({
      url,
      type: url.match(/\.(mp4|webm|ogg|mov)/i) ? 'video' : 'image'
    }));
    setExistingMedia(pMedia);
    setPreviewUrls([]);
    setImageFiles([]);
    setActivePreviewIndex(0);

    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setName('');
    setPrice('');
    setDescription('');
    setSizesInput('');
    setColorsInput('');
    setSizeLabel('Size');
    setColorLabel('Color');
    setImageFiles([]);
    
    // Revoke object URLs to prevent leaks
    previewUrls.forEach(item => URL.revokeObjectURL(item.url));
    setPreviewUrls([]);
    setExistingMedia([]);
    setActivePreviewIndex(0);
    
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, "products", id));
        fetchProducts();
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  const activeMedia = previewUrls.length > 0 ? previewUrls : existingMedia;

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '1100px' }}>
      
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '2.5rem' }}>
        <h2 className="heading-md">Manage Catalog</h2>
        <Link to="/admin" className="btn btn-secondary">Back to Dashboard</Link>
      </div>

      <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '3rem', alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN: Instagram-Style Posting Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-card instagram-post" style={{ padding: 0, overflow: 'hidden', borderRadius: '1rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
            
            {/* Mock Instagram Header */}
            <div className="flex-between" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex-center" style={{ gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  S
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: '700', fontSize: '0.85rem' }}>safi_stores</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {editingProductId ? 'Editing Product' : 'New Post'}
                  </p>
                </div>
              </div>
              <MoreHorizontal size={18} style={{ color: 'var(--text-secondary)' }} />
            </div>

            <form onSubmit={handleAddProduct}>
              
              {/* Media Square Dropzone Preview */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                
                {activeMedia.length > 0 ? (
                  <>
                    {activeMedia[activePreviewIndex]?.type === 'video' ? (
                      <video 
                        src={activeMedia[activePreviewIndex].url} 
                        muted 
                        controls 
                        autoPlay 
                        loop 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <img 
                        src={activeMedia[activePreviewIndex].url} 
                        alt="Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    )}

                    {/* Nav indicators inside media screen */}
                    {activeMedia.length > 1 && (
                      <>
                        <button 
                          type="button" 
                          onClick={(e) => { e.preventDefault(); setActivePreviewIndex(prev => (prev - 1 + activeMedia.length) % activeMedia.length); }}
                          className="post-media-btn" 
                          style={{ left: '8px' }}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button 
                          type="button" 
                          onClick={(e) => { e.preventDefault(); setActivePreviewIndex(prev => (prev + 1) % activeMedia.length); }}
                          className="post-media-btn" 
                          style={{ right: '8px' }}
                        >
                          <ChevronRight size={16} />
                        </button>
                        {/* Dot indicator */}
                        <div style={{ position: 'absolute', bottom: '10px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '4px' }}>
                          {activeMedia.map((_, idx) => (
                            <div key={idx} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: activePreviewIndex === idx ? 'var(--accent-color)' : 'rgba(255,255,255,0.6)' }}></div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '0.75rem' }}>
                      <Camera size={36} />
                      <Video size={36} />
                    </div>
                    <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>Choose Photos & Videos</p>
                    <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Supports JPG, PNG, MP4, WebM</p>
                  </div>
                )}

                {/* Hidden Input Overlay */}
                <input 
                  type="file" 
                  accept="image/*,video/*"
                  multiple
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer', zIndex: 5 }}
                  onChange={handleFileChange}
                />
              </div>

              {/* Instagram Details & Form Inputs */}
              <div style={{ padding: '1rem' }}>
                
                {/* Caption / Description Input */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <textarea 
                    className="form-input" 
                    rows="3" 
                    placeholder="Write a caption (product description)..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                    style={{ border: 'none', borderBottom: '1px solid var(--border-color)', borderRadius: 0, paddingLeft: 0, resize: 'none' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Product Name" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Price (₹)" 
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    required
                  />
                </div>

                {/* Variations */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input type="text" className="form-input" placeholder="Variation 1 (e.g. Size)" value={sizeLabel} onChange={e => setSizeLabel(e.target.value)} required />
                  <input type="text" className="form-input" placeholder="Options (S, M, L)" value={sizesInput} onChange={e => setSizesInput(e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <input type="text" className="form-input" placeholder="Variation 2 (e.g. Color)" value={colorLabel} onChange={e => setColorLabel(e.target.value)} required />
                  <input type="text" className="form-input" placeholder="Options (Red, Blue)" value={colorsInput} onChange={e => setColorsInput(e.target.value)} />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-accent" 
                  style={{ width: '100%', padding: '0.75rem', fontWeight: 'bold' }} 
                  disabled={loading}
                >
                  {loading ? 'Publishing...' : (editingProductId ? 'Update Share' : 'Share Post')}
                </button>

                {editingProductId && (
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }} 
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    Discard Changes
                  </button>
                )}

              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Grid list of Current Catalog */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Current Storefront Catalog</h3>
          
          {fetching ? (
            <p>Loading items...</p>
          ) : products.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {products.map(product => {
                const productMedia = product.media && product.media.length > 0 
                  ? product.media[0] 
                  : { url: product.imageUrl, type: product.imageUrl?.match(/\.(mp4|webm|ogg|mov)/i) ? 'video' : 'image' };
                  
                return (
                  <div key={product.id} className="flex-between" style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'var(--bg-primary)', gap: '1rem' }}>
                    <div className="flex-center" style={{ gap: '1rem' }}>
                      <div style={{ width: '55px', height: '55px', borderRadius: '0.5rem', overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', position: 'relative' }}>
                        {productMedia.url && (
                          productMedia.type === 'video' ? (
                            <>
                              <video src={productMedia.url} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: '2px' }}>
                                <Video size={10} color="white" />
                              </div>
                            </>
                          ) : (
                            <img src={productMedia.url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )
                        )}
                      </div>
                      <div>
                        <p style={{ fontWeight: '600', margin: 0 }}>{product.name}</p>
                        <p style={{ color: 'var(--accent-color)', fontSize: '0.85rem', fontWeight: '500', marginTop: '0.15rem' }}>₹{product.price}</p>
                      </div>
                    </div>
                    <div className="flex-center" style={{ gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleEditClick(product)} 
                        style={{ color: 'var(--text-secondary)', padding: '0.5rem', cursor: 'pointer', background: 'none', border: 'none' }}
                        title="Edit Post"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)} 
                        style={{ color: 'var(--danger)', padding: '0.5rem', cursor: 'pointer', background: 'none', border: 'none' }}
                        title="Delete Post"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No items in catalog. Upload one using the post creator on the left!</p>
          )}
        </div>

      </div>

      <style>{`
        .post-media-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.5);
          border: none;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
        }
        
        @media (max-width: 768px) {
          .admin-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminProducts;
