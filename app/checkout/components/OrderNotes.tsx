// app/checkout/components/OrderNotes.tsx
'use client';

import styles from './ShippingForm.module.css';

// TypeScript ইন্টারফেস
interface OrderNotesProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

export default function OrderNotes({ notes, onNotesChange }: OrderNotesProps) {
  return (
    <div className={styles.notesContainer}>
      <label htmlFor="order_notes" className={styles.label}>
        Order notes (optional)
      </label>
      <textarea
        id="order_notes"
        name="orderNotes" // name অ্যাট্রিবিউট যোগ করা ভালো অভ্যাস
        className={styles.textarea}
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Notes about your order, e.g. special notes for delivery."
        rows={4}
      />
    </div>
  );
}