// app/checkout/components/ShippingForm.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import AsyncSelect from 'react-select/async';
import { debounce } from 'lodash';
import styles from './ShippingForm.module.css';

// --- TypeScript Interfaces (No changes) ---
interface ShippingFormData {
  firstName: string; lastName: string; address1: string; city: string;
  state: string; postcode: string; email: string; phone: string;
}
interface AddressOption {
  value: string; label: string; suburb: string; postcode: string; state: string;
}
interface ShippingFormProps {
  onAddressChange: (address: Partial<ShippingFormData>) => void;
}

// react-select-এর জন্য কাস্টম স্টাইল
const selectStyles = {
  control: (provided: any) => ({
    ...provided, minHeight: '48px', border: '1px solid #ddd',
    boxShadow: 'none', '&:hover': { borderColor: '#aaa' },
  }),
};

export default function ShippingForm({ onAddressChange }: ShippingFormProps) {
  const [formData, setFormData] = useState<ShippingFormData>({
    firstName: '', lastName: '', address1: '', city: '',
    state: '', postcode: '', email: '', phone: '',
  });

  const debouncedOnAddressChange = useCallback(
    debounce((data: ShippingFormData) => onAddressChange(data), 400),
    [onAddressChange]
  );

  useEffect(() => {
    debouncedOnAddressChange(formData);
    return () => debouncedOnAddressChange.cancel();
  }, [formData, debouncedOnAddressChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ★★★ সমাধান ১: এখন একটি ফাংশনই suburb, postcode, state আপডেট করবে ★★★
  const handleSelectChange = (selectedOption: AddressOption | null) => {
    if (selectedOption) {
      setFormData(prev => ({
        ...prev,
        city: selectedOption.suburb,
        postcode: selectedOption.postcode,
        state: selectedOption.state,
      }));
    }
  };

  const loadAddressOptions = async (inputValue: string): Promise<AddressOption[]> => {
    if (inputValue.trim().length < 1) return [];
    try {
      const response = await fetch(`/api/address-lookup?query=${inputValue}`);
      const data = await response.json();
      return data.map((item: any) => ({ ...item, label: item.value }));
    } catch (error) {
      console.error('Address lookup failed:', error);
      return [];
    }
  };

  const debouncedLoadOptions = debounce(
    (inputValue: string, callback: (options: AddressOption[]) => void) => {
      loadAddressOptions(inputValue).then(options => callback(options));
    }, 300
  );

  return (
    <div className={styles.shippingFormContainer}>
      <h2 className={styles.title}>Billing Details</h2>
      
      <div className={styles.formGrid}>
        <div className={styles.countryRegion}>
          <label>Country / Region *</label>
          <input type="text" value="Australia" readOnly className={styles.inputField} />
        </div>
        <div className={styles.fullWidth}>
          <label>Email address *</label>
          <input name="email" type="email" value={formData.email} onChange={handleInputChange} className={styles.inputField} required />
        </div>
      </div>
      
      <div className={styles.formGrid}>
        <div>
          <label>First name *</label>
          <input name="firstName" value={formData.firstName} onChange={handleInputChange} className={styles.inputField} required />
        </div>
        <div>
          <label>Last name *</label>
          <input name="lastName" value={formData.lastName} onChange={handleInputChange} className={styles.inputField} required />
        </div>
        <div className={styles.fullWidth}>
          <label>Street address *</label>
          <input name="address1" placeholder="House number and street name" value={formData.address1} onChange={handleInputChange} className={styles.inputField} required />
        </div>

        {/* ★★★ সমাধান ২: একটিমাত্র AsyncSelect যা Suburb এবং Postcode উভয় দিয়েই সার্চ করবে ★★★ */}
        <div className={styles.fullWidth}>
          <label>Suburb / Postcode *</label>
          <AsyncSelect
            key={formData.city + formData.postcode}
            cacheOptions defaultOptions
            placeholder="Start typing your Suburb or Postcode..."
            loadOptions={debouncedLoadOptions}
            onChange={handleSelectChange}
            styles={selectStyles}
            value={formData.city ? { label: `${formData.city}, ${formData.state} ${formData.postcode}`, value: formData.city, suburb: formData.city, postcode: formData.postcode, state: formData.state } : null}
            loadingMessage={() => 'Searching...'}
            noOptionsMessage={({ inputValue }) => inputValue.length < 2 ? 'Keep typing to see suggestions' : 'No results found'}
          />
        </div>

        {/* নিচের ফিল্ডগুলো এখন সাজেশন থেকে পূরণ হবে এবং ব্যবহারকারী চাইলে এডিটও করতে পারবে */}
        <div>
          <label>State *</label>
          <input name="state" value={formData.state} onChange={handleInputChange} className={styles.inputField} required />
        </div>
        <div>
          <label>Postcode *</label>
          <input name="postcode" value={formData.postcode} onChange={handleInputChange} className={styles.inputField} required />
        </div>

        <div className={styles.fullWidth}>
          <label>Phone *</label>
          <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className={styles.inputField} required />
        </div>
      </div>
    </div>
  );
}