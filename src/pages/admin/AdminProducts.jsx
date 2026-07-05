import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trash2, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [sizesInput, setSizesInput] = useState('');
  const [colorsInput, setColorsInput] = useState('');
  const [sizeLabel, setSizeLabel] = useState('Size');
  const [colorLabel, setColorLabel] = useState('Color');
  const [editingProductId, setEditingProductId] = useState(null);
  const [existingImageUrls, setExistingImageUrls] = useState([]);

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

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrls = [];

      if (imageFiles.length > 0) {
        const uploadPromises = Array.from(imageFiles).map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', 'safistore_preset');

          const response = await fetch('https://api.cloudinary.com/v1_1/dtqibelpn/image/upload', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `Failed to upload image ${file.name}`);
          }

          const data = await response.json();
          return data.secure_url;
        });

        imageUrls = await Promise.all(uploadPromises);
      } else if (editingProductId) {
        imageUrls = existingImageUrls;
      }

      // Parse sizes and colors
      const sizes = sizesInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      const colors = colorsInput
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);

      const productData = {
        name,
        price: Number(price),
        description,
        imageUrl: imageUrls[0] || '', // primary thumbnail for backwards compatibility
        imageUrls,
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
      setName('');
      setPrice('');
      setDescription('');
      setImageFiles([]);
      setSizesInput('');
      setColorsInput('');
      setSizeLabel('Size');
      setColorLabel('Color');
      setEditingProductId(null);
      setExistingImageUrls([]);
      
      // Reset file input value
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      // Refresh list
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
    setExistingImageUrls(product.imageUrls || (product.imageUrl ? [product.imageUrl] : []));
    setImageFiles([]); // Clear any new selections
    
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
    setExistingImageUrls([]);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const handleDelete = async (id, imageUrl) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        // Delete document from Firestore
        await deleteDoc(doc(db, "products", id));
        
        // Note: For Cloudinary frontend uploads, deletion is typically handled 
        // via a backend server or a scheduled cleanup to keep credentials secure.
        
        fetchProducts();
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2 className="heading-md">Manage Products</h2>
        <Link to="/admin" className="btn btn-secondary">Back to Dashboard</Link>
      </div>

      <div className="grid-cols-3" style={{ alignItems: 'flex-start' }}>
        {/* Add Product Form */}
        <div className="glass-card" style={{ gridColumn: 'span 1' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={handleAddProduct}>
            <div className="form-group">
              <label className="form-label">Product Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Price (₹)</label>
              <input 
                type="number" 
                className="form-input" 
                value={price} 
                onChange={e => setPrice(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea 
                className="form-input" 
                rows="3"
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                required 
              ></textarea>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="form-label">Variation 1 Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={sizeLabel} 
                  onChange={e => setSizeLabel(e.target.value)} 
                  required
                />
              </div>
              <div>
                <label className="form-label">Options (comma-separated)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. S, M, L or 40mm, 44mm"
                  value={sizesInput} 
                  onChange={e => setSizesInput(e.target.value)} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="form-label">Variation 2 Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={colorLabel} 
                  onChange={e => setColorLabel(e.target.value)} 
                  required
                />
              </div>
              <div>
                <label className="form-label">Options (comma-separated)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Red, Blue or Leather, Metal"
                  value={colorsInput} 
                  onChange={e => setColorsInput(e.target.value)} 
                />
              </div>
            </div>
            {editingProductId && existingImageUrls.length > 0 && imageFiles.length === 0 && (
              <div className="form-group">
                <label className="form-label">Current Images</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {existingImageUrls.map((url, idx) => (
                    <div key={idx} style={{ width: '50px', height: '50px', borderRadius: '0.25rem', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img src={url} alt="existing preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">
                {editingProductId ? 'Replace Images (optional)' : 'Product Images (select one or more)'}
              </label>
              <input 
                type="file" 
                accept="image/*"
                multiple
                className="form-input" 
                onChange={e => setImageFiles(e.target.files)} 
              />
              {imageFiles.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                  {Array.from(imageFiles).map((file, idx) => (
                    <div key={idx} style={{ width: '50px', height: '50px', borderRadius: '0.25rem', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-accent" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Saving...' : (editingProductId ? 'Update Product' : 'Add Product')}
            </button>
            {editingProductId && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ width: '100%', marginTop: '0.5rem', cursor: 'pointer' }}
                onClick={handleCancelEdit}
                disabled={loading}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* Product List */}
        <div className="glass-card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Current Products</h3>
          
          {fetching ? (
            <p>Loading...</p>
          ) : products.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {products.map(product => (
                <div key={product.id} className="flex-between" style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'var(--bg-primary)' }}>
                  <div className="flex-center" style={{ gap: '1rem' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '0.25rem', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                      {product.imageUrl && <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div>
                      <p style={{ fontWeight: '500' }}>{product.name}</p>
                      <p style={{ color: 'var(--accent-color)', fontSize: '0.875rem' }}>₹{product.price}</p>
                    </div>
                  </div>
                  <div className="flex-center" style={{ gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleEditClick(product)} 
                      style={{ color: 'var(--text-secondary)', padding: '0.5rem', cursor: 'pointer' }}
                      title="Edit Product"
                    >
                      <Edit size={20} />
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id, product.imageUrl)} 
                      style={{ color: 'var(--danger)', padding: '0.5rem', cursor: 'pointer' }}
                      title="Delete Product"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No products found. Add some to get started!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
