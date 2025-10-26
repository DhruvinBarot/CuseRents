import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const register = async (userData) => {
  const response = await api.post('/users/auth/register/', userData);
  return response.data;
};

export const login = async (username, password) => {
  const response = await api.post('/users/auth/login/', { username, password });
  return response.data;
};

export const logout = async (refreshToken) => {
  const response = await api.post('/users/auth/logout/', { refresh_token: refreshToken });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/users/auth/me/');
  return response.data;
};

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

// Create Item
export const createItem = async (itemData) => {
  try {
    const response = await api.post('/items/items/', itemData);
    return response.data;
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
};

// Update Item
export const updateItem = async (itemId, itemData) => {
  try {
    const response = await api.patch(`/items/items/${itemId}/`, itemData);
    return response.data;
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
};

// Delete Item
export const deleteItem = async (itemId) => {
  try {
    const response = await api.delete(`/items/items/${itemId}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
};

// Get all items (for My Listings)
export const getMyItems = async () => {
  try {
    const response = await api.get('/items/items/');
    return response.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

// Booking API
export const createBooking = async (bookingData) => {
  try {
    const response = await api.post('/bookings/bookings/', bookingData);
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

export const getMyBookings = async () => {
  try {
    const response = await api.get('/bookings/bookings/');
    return response.data;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
};

export const acceptBooking = async (bookingId) => {
  try {
    const response = await api.post(`/bookings/bookings/${bookingId}/accept/`);
    return response.data;
  } catch (error) {
    console.error('Error accepting booking:', error);
    throw error;
  }
};

export const rejectBooking = async (bookingId) => {
  try {
    const response = await api.post(`/bookings/bookings/${bookingId}/reject/`);
    return response.data;
  } catch (error) {
    console.error('Error rejecting booking:', error);
    throw error;
  }
};

export const completeBooking = async (bookingId) => {
  try {
    const response = await api.post(`/bookings/bookings/${bookingId}/complete/`);
    return response.data;
  } catch (error) {
    console.error('Error completing booking:', error);
    throw error;
  }
};

export default api;