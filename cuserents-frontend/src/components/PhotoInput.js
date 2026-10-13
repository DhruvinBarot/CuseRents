import React, { useState } from 'react';
import { uploadItemPhoto } from '../services/api';

// Uploads the chosen image right away and reports the hosted URL via onChange
const PhotoInput = ({ value, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      onChange(await uploadItemPhoto(file));
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="form-group">
      <label htmlFor="item-photo">Photo (optional)</label>
      {value && <img src={value} alt="Item preview" className="photo-preview" />}
      <input id="item-photo" type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="form-input" />
      {uploading && <p className="photo-hint">Uploading...</p>}
      {error && <p className="error-message" role="alert">{error}</p>}
    </div>
  );
};

export default PhotoInput;
