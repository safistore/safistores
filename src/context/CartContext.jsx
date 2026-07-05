import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('safiCart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('safiCart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, selectedSize = null, selectedColor = null, quantityToAdd = 1) => {
    const cartItemId = `${product.id}-${selectedSize || ''}-${selectedColor || ''}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + quantityToAdd } : item
        );
      }
      return [...prev, { 
        ...product, 
        cartItemId, 
        selectedSize, 
        selectedColor, 
        quantity: quantityToAdd 
      }];
    });
  };

  const removeFromCart = (cartItemId) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId, quantity) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};
