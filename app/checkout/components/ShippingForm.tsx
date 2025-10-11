'use client';

import { useState, useEffect, useMemo, useCallback } from 'react'; // ★ useMemo ইম্পোর্ট করা হয়েছে
import AsyncSelect from 'react-select/async';
import { debounce } from 'lodash';
import styles from './ShippingForm.module.css';
import type { CSSObject } from '@emotion/react'; // ★ টাইপ-নিরাপদ স্টাইলিং এর জন্য

// --- Interfaces ---
interface ShippingFormData {
  firstName: string; lastName: string; address1: string; city: string;
  state: string; postcode: string; email: string; phone: string;
}
interface AddressOption {
  value: string; label: string; suburb: string; postcode: string; state: string;
}
// ★★★ নতুন: API থেকে আসা ডেটার জন্য Interface ★★★
interface ApiAddressItem {
  value: string;
  label: string;
  suburb: string;
  postcode: string;
  state: string;
}
interface ShippingFormProps {
  title: string;
  onAddressChange: (address: Partial<ShippingFormData>) => void;
  defaultValues?: Partial<ShippingFormData>;
}

const selectStyles = {
  // ★★★ পরিবর্তন: 'any'-এর পরিবর্তে সঠিক টাইপ ব্যবহার করা হয়েছে ★★★
  control: (provided: CSSObject) => ({
    ...provided,
    minHeight: '48px',
    border: '1px solid #ddd',
    boxShadow: 'none',
    '&:hover': { borderColor: '#aaa' },
  }),
};

export default function ShippingForm({ title, onAddressChange, defaultValues = {} }: ShippingFormProps) {
  const [formData, setFormData] = useState<ShippingFormData>({
    firstName: '', lastName: '', address1: '', city: '',
    state: '', postcode: '', email: '', phone: '',
    ...defaultValues,
  });

  // ★★★ পরিবর্তন: useCallback-এর পরিবর্তে useMemo ব্যবহার করে debounced ফাংশন তৈরি করা হয়েছে ★★★
  const debouncedOnAddressChange = useMemo(
    () => debounce((data: ShippingFormData) => onAddressChange(data), 400),
    [onAddressChange]
  );

  useEffect(() => {
    debouncedOnAddressChange(formData);
    return () => {
      debouncedOnAddressChange.cancel();
    };
  }, [formData, debouncedOnAddressChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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

  // ★ useCallback ব্যবহার করা হয়েছে কারণ এটি একটি stable ফাংশন হওয়া উচিত
  const loadAddressOptions = useCallback(async (inputValue: string): Promise<AddressOption[]> => {
    if (inputValue.trim().length < 1) return [];
    try {
      const response = await fetch(`/api/address-lookup?query=${inputValue}`);
      const data = await response.json();
      // ★★★ পরিবর্তন: 'any'-এর পরিবর্তে ApiAddressItem টাইপ ব্যবহার করা হয়েছে ★★★
      return data.map((item: ApiAddressItem) => ({ ...item, label: item.value }));
    } catch (error) {
      console.error('Address lookup failed:', error);
      return [];
    }
  }, []);

  const debouncedLoadOptions = useCallback(
    (inputValue: string, callback: (options: AddressOption[]) => void) => {
      loadAddressOptions(inputValue).then(options => callback(options));
    },
    [loadAddressOptions] // loadAddressOptions এখন একটি dependency
  );
  return (
    <div className={styles.shippingFormContainer}>
      {/* ★★★ পরিবর্তন: title prop ব্যবহার করা হয়েছে ★★★ */}
      <h2 className={styles.title}>{title}</h2>
      
      {/* --- বাকি সব ইনপুট ফিল্ড অপরিবর্তিত থাকবে --- */}
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