import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, ProductCategory } from '../types';
import { INITIAL_PRODUCTS } from '../data/products';
import { useToast } from './ToastContext';
import {
  migrateDocument,
  removeProduct,
  saveProduct,
  SHARED_COLLECTIONS,
  subscribeProducts,
} from '../firebase/sharedStore';

interface ProductContextType {
  products: Product[];
  addProduct: (productData: Omit<Product, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) => void;
  updateProduct: (productId: string, updatedData: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  bulkUploadProducts: (newProducts: Product[], replaceAll?: boolean) => void;
  resetToDefaultCatalog: () => void;
  getProductById: (id: string) => Product | undefined;
  getProductBySlug: (slug: string) => Product | undefined;
  categories: ProductCategory[];
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const LEGACY_PRODUCT_KEYS = ['graminum_catalog_products_v4', 'graminum_catalog_products_v3'];

const readLegacyProducts = (): Product[] => {
  for (const key of LEGACY_PRODUCT_KEYS) {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) continue;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // ignore unreadable legacy data
    }
  }
  return [];
};

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  const persistProduct = async (product: Product) => {
    try {
      await saveProduct(product);
    } catch (error) {
      console.error('Failed to save product', error);
      showToast(
        error instanceof Error ? error.message : 'Could not save the product to the shared catalog.',
        'error'
      );
    }
  };

  // One shared catalog. A product added by any admin or manager appears for
  // every staff session and every customer storefront.
  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeProducts(
      (shared) => {
        if (!active) return;
        if (shared.length === 0) {
          const legacy = readLegacyProducts();
          const seed = legacy.length > 0 ? legacy : INITIAL_PRODUCTS;
          Promise.all(
            seed.map((product) => migrateDocument(SHARED_COLLECTIONS.products, product.id, product))
          ).catch((error) => console.error('Could not seed the shared catalog', error));
          return;
        }
        setProducts(shared);
      },
      (error) => {
        console.error('Shared catalog listener failed', error);
      }
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const categories: ProductCategory[] = [
    'Personal Care',
    'Herbal Oils',
    'Natural Foods',
    'Herbal Wellness',
    'Pooja Essentials',
    'Fragrances',
  ];

  const getProductById = (id: string): Product | undefined => {
    return products.find((p) => p.id === id);
  };

  const getProductBySlug = (slug: string): Product | undefined => {
    return products.find((p) => p.slug === slug || p.id === slug);
  };

  const addProduct = (productData: Omit<Product, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) => {
    const newProduct: Product = {
      ...productData,
      id: productData.id || `grm-custom-${Date.now()}`,
      createdAt: productData.createdAt || new Date().toISOString(),
      slug:
        productData.slug ||
        productData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
    };

    setProducts((prev) => [newProduct, ...prev]);
    void persistProduct(newProduct);
    showToast(`Added "${newProduct.name}" to catalog successfully!`, 'success');
  };

  const updateProduct = (productId: string, updatedData: Partial<Product>) => {
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId) {
          const next = {
            ...p,
            ...updatedData,
            slug:
              updatedData.slug ||
              (updatedData.name
                ? updatedData.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '')
                : p.slug),
          };
          void persistProduct(next);
          return next;
        }
        return p;
      });
      return updated;
    });
    showToast('Product updated successfully!', 'success');
  };

  const deleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    removeProduct(productId).catch((error) => {
      console.error('Failed to delete product', error);
      showToast('Could not remove the product from the shared catalog.', 'error');
    });
    showToast(`Deleted "${target?.name || 'Product'}" from catalog.`, 'info');
  };

  const bulkUploadProducts = (newProducts: Product[], replaceAll: boolean = false) => {
    if (replaceAll) {
      setProducts(newProducts);
    } else {
      setProducts((prev) => [...newProducts, ...prev]);
    }
    Promise.all(newProducts.map((product) => saveProduct(product)))
      .then(() =>
        showToast(
          replaceAll
            ? `Replaced catalog entries with ${newProducts.length} products!`
            : `Successfully imported ${newProducts.length} new products!`,
          'success'
        )
      )
      .catch((error) => {
        console.error('Bulk upload failed', error);
        showToast('Some products could not be saved to the shared catalog.', 'error');
      });
  };

  const resetToDefaultCatalog = () => {
    setProducts(INITIAL_PRODUCTS);
    Promise.all(INITIAL_PRODUCTS.map((product) => saveProduct(product)))
      .then(() => showToast('Catalog restored to default Graminum natural products!', 'success'))
      .catch((error) => {
        console.error('Catalog reset failed', error);
        showToast('Could not restore the shared catalog.', 'error');
      });
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        bulkUploadProducts,
        resetToDefaultCatalog,
        getProductById,
        getProductBySlug,
        categories,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
