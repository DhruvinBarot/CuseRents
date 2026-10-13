import React, { useState } from 'react';
import { createReview } from '../services/api';

const ReviewForm = ({ bookingId, label, onDone }) => {
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) {
    return <button className="btn-accept" onClick={() => setOpen(true)}>⭐ {label}</button>;
  }

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createReview(bookingId, stars, text);
      alert('Thanks for your review! +50 points');
      onDone();
    } catch (err) {
      const data = err.response?.data;
      alert(data?.non_field_errors?.[0] || 'Could not submit review');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="review-form">
      <label>
        Rating
        <select value={stars} onChange={(e) => setStars(Number(e.target.value))} className="form-input">
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
        </select>
      </label>
      <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} rows="2"
        placeholder="How did it go?" className="form-input" aria-label="Review text" />
      <button type="submit" className="btn-accept" disabled={submitting}>Submit Review</button>
    </form>
  );
};

export default ReviewForm;
