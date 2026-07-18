import { useEffect, useCallback, useRef } from 'react';
import { useCartStore } from '../store/useCartStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useActivityStore } from '../store/useActivityStore';

/**
 * A hook that listens for rapid barcode scanner input.
 * USB Barcode scanners act like a keyboard that types very fast and hits 'Enter'.
 */
export function useBarcodeScanner(products: { barcode?: string; name: string; price: number; id: string; sku: string; image_url?: string; category?: string }[]) {
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const productsRef = useRef(products);
  const addItem = useCartStore((state) => state.addItem);
  const { enqueue } = useNotificationStore();
  const { logActivity } = useActivityStore();

  useEffect(() => {
    productsRef.current = products;
  });

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const currentTime = Date.now();
      
      // If time between keystrokes is too long (>50ms), it's probably standard typing, clear buffer
      if (currentTime - lastKeyTimeRef.current > 50) {
        bufferRef.current = '';
      }
      
      lastKeyTimeRef.current = currentTime;

      // When scanner hits Enter
      if (e.key === 'Enter' && bufferRef.current.length > 2) {
        const scannedSku = bufferRef.current.trim();
        
        // Find product
        const product = productsRef.current.find(p => p.sku?.toLowerCase() === scannedSku.toLowerCase());
        
        if (product) {
          addItem({
            id: product.id,
            sku: product.sku,
            name: product.name,
            price: product.price,
            img: product.image_url || '',
            category: product.category || 'General'
          });
          enqueue(`Added ${product.name} (Scanned)`, 'success');
          logActivity('PRODUCT_ADDED', `Barcode scanned: ${product.sku}`);
        } else {
          enqueue(`No product found for Barcode: ${scannedSku}`, 'error');
        }
        
        // Reset buffer
        bufferRef.current = '';
        e.preventDefault();
      } else if (e.key.length === 1) { // Normal character
        bufferRef.current += e.key;
      }
    },
    [addItem, enqueue, logActivity]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
