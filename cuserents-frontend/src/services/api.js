import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Items API
export const searchItems = async (lat, lng, filters = {}) => {
  try {
    const params = {
      lat,
      lng,
      radius: filters.radius || 5,
      ...(filters.category && { category: filters.category }),
      ...(filters.min_price && { min_price: filters.min_price }),
      ...(filters.max_price && { max_price: filters.max_price }),
      ...(filters.available !== undefined && { available: filters.available }),
    };
    
    const response = await api.get('/items/items/search/', { params });
    return response.data;
  } catch (error) {
    console.error('Error searching items:', error);
    throw error;
  }
};

export const getCategories = async () => {
  try {
    const response = await api.get('/items/items/categories/');
    return response.data.categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const getNearbyItems = async (lat, lng) => {
  try {
    const response = await api.get('/items/items/nearby/', {
      params: { lat, lng }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching nearby items:', error);
    throw error;
  }
};

export const getItemDetails = async (itemId, userLat, userLng) => {
  try {
    const params = {};
    if (userLat && userLng) {
      params.user_lat = userLat;
      params.user_lng = userLng;
    }
    const response = await api.get(`/items/items/${itemId}/`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching item details:', error);
    throw error;
  }
};

export const getDirections = async (itemId, lat, lng) => {
  try {
    const response = await api.get(`/items/items/${itemId}/directions/`, {
      params: { lat, lng }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching directions:', error);
    throw error;
  }
};

export default api;