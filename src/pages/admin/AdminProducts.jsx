import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);

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
      let imageUrl = '';

      // Convert image to base64 to avoid Firebase Storage setup issues
      if (imageFile) {
        if (imageFile.size > 1048576) {
          alert("Image is too large! Please select an image smaller than 1MB.");
          setLoading(false);
          return;
        }
        
        imageUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(imageFile);
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
        });
      }

      // Add product to Firestore
      await addDoc(collection(db, "products"), {
        name,
        price: Number(price),
        description,
        imageUrl,
        createdAt: new Date().toISOString()
      });

      // Reset form
      setName('');
      setPrice('');
      setDescription('');
      setImageFile(null);
      
      // Refresh list
      fetchProducts();
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Error adding product: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, "products", id));
        fetchProducts();
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2 className="heading-md">Manage Products</h2>
        <Link to="/admin" className="btn btn-secondary">Back to Dashboard</Link>
      </div>

      <div className="grid-cols-3" style={{ alignItems: 'flex-start' }}>
        {/* Add Product Form */}
        <div className="glass-card" style={{ gridColumn: 'span 1' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Add New Product</h3>
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
            <div className="form-group">
              <label className="form-label">Product Image</label>
              <input 
                type="file" 
                accept="image/*"
                className="form-input" 
                onChange={e => setImageFile(e.target.files[0])} 
              />
            </div>
            <button type="submit" className="btn btn-accent" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Adding...' : 'Add Product'}
            </button>
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
                  <button onClick={() => handleDelete(product.id)} style={{ color: 'var(--danger)', padding: '0.5rem' }}>
                    <Trash2 size={20} />
                  </button>
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
