import React, { useState } from 'react';
import { updateItem } from '../services/api';
import { X, Save } from 'lucide-react';

const EditItemModal = ({ item, onClose, onSuccess, categories }) => {
  const [formData, setFormData] = useState({
    title: item.title || '',
    description: item.description || '',
    category: item.category || '',
    price_per_hour: item.price_per_hour || '',
    price_per_day: item.price_per_day || '',
    deposit: item.deposit || '',
    address_text: item.address_text || '',
    lat: item.lat || '',
    lng: item.lng || '',
    photo_url: item.photo_url || '',
    carbon_offset_kg: item.carbon_offset_kg || 5,
    is_available: item.is_available !== undefined ? item.is_available : true
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Prepare data
      const itemData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price_per_hour: parseFloat(formData.price_per_hour),
        price_per_day: formData.price_per_day ? parseFloat(formData.price_per_day) : null,
        deposit: parseFloat(formData.deposit) || 0,
        address_text: formData.address_text,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        photo_url: formData.photo_url,
        carbon_offset_kg: parseInt(formData.carbon_offset_kg),
        is_available: formData.is_available
      };

      // Update item
      await updateItem(item.id, itemData);
      
      // Close modal and refresh
      onSuccess();
      onClose();

    } catch (err) {
      console.error('Error updating item:', err);
      setError(err.response?.data?.detail || 'Failed to update item. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <h2 className="modal-title">Edit Item</h2>
        <p className="modal-subtitle">Update your item details</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label>Item Name</label>
            <input 
              type="text" 
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select 
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="form-input"
              required
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input" 
              rows="3"
              required
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price/Hour ($)</label>
              <input 
                type="number" 
                name="price_per_hour"
                value={formData.price_per_hour}
                onChange={handleChange}
                step="0.01"
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Price/Day ($)</label>
              <input 
                type="number" 
                name="price_per_day"
                value={formData.price_per_day}
                onChange={handleChange}
                step="0.01"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Deposit ($)</label>
              <input 
                type="number" 
                name="deposit"
                value={formData.deposit}
                onChange={handleChange}
                step="0.01"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>CO₂ Offset (kg)</label>
              <input 
                type="number" 
                name="carbon_offset_kg"
                value={formData.carbon_offset_kg}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Location</label>
            <input 
              type="text" 
              name="address_text"
              value={formData.address_text}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <input 
                type="checkbox" 
                name="is_available"
                checked={formData.is_available}
                onChange={handleChange}
                style={{width: 'auto'}}
              />
              <span>Item is available for rent</span>
            </label>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-save"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="spinner-small"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal;