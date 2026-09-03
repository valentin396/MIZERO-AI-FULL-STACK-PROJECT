import { useEffect, useState } from 'react';
import api from './api';

export function useDistricts() {
  const [districts, setDistricts] = useState([]);
  useEffect(() => {
    api.get('/rwanda/districts').then((res) => setDistricts(res.data));
  }, []);
  return districts;
}

export function useCategories() {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    api.get('/rwanda/categories').then((res) => setCategories(res.data));
  }, []);
  return categories;
}
