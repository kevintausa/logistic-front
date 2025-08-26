const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const PRODUCT_API_URL = `${API_URL}/products`;

export const fetchProducts = async ({ limit = 10, offset = 1, query = {} }) => {
  try {
    const url = new URL(PRODUCT_API_URL);
    url.searchParams.append('limit', limit);
    url.searchParams.append('offset', offset);
    if (Object.keys(query).length > 0) {
        url.searchParams.append('query', JSON.stringify(query));
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error('Error al obtener los productos');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const createProduct = async (productData) => {
  try {
    const response = await fetch(PRODUCT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    if (!response.ok) throw new Error('Error al crear el producto');
    return await response.json();
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const response = await fetch(`${PRODUCT_API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    if (!response.ok) throw new Error('Error al actualizar el producto');
    return await response.json();
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await fetch(`${PRODUCT_API_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar el producto');
    return await response.json();
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

export const exportProducts = async (query = {}) => {
  try {
    const url = new URL(`${PRODUCT_API_URL}/export`);
    if (Object.keys(query).length > 0) {
        url.searchParams.append('query', JSON.stringify(query));
    }
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Error al exportar los productos');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error exporting products:', error);
    throw error;
  }
};
