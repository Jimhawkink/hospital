// src/api/stock.ts
import useSWR from "swr";
import { AxiosResponse } from "axios";
import api from "./axiosInstance";

// Define enhanced stock interfaces
export interface Package {
  id: string;
  name: string;
  sellingPrice: number;
  unitsPerPack: number;
  availableForPurchase: boolean;
}

export interface Stock {
  id: string;
  name: string;
  sku?: string;
  category: string;
  quantity: number;
  availableUnits: number;
  status: 'available' | 'out-of-stock' | 'low-stock';
  expiryDate?: string;
  packages?: Package[];
  batchNo?: string;
  sellingPrice?: number;
}

// Enhanced fetcher with debug logging
const fetcher = async (url: string): Promise<Stock[]> => {
  try {
    console.log('🔍 Fetching from URL:', url);
    console.log('🔍 API base URL:', api.defaults.baseURL);
    
    const response: AxiosResponse<Stock[]> = await api.get(url);
    console.log('✅ API Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });
    throw error;
  }
};

// Custom hook with enhanced error handling
export function useStocks() {
  const { data, error, mutate } = useSWR<Stock[]>("/stock", fetcher, {
    // Add some configuration options
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    onError: (error) => {
      console.error('🚨 SWR Error:', error);
    },
    onSuccess: (data) => {
      console.log('✅ SWR Success:', data);
    }
  });

  return {
    stocks: data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
    // Add error details for debugging
    errorDetails: error
  };
}

// CRUD helpers with enhanced error handling
export async function addStock(stock: Omit<Stock, 'id'>): Promise<Stock> {
  try {
    console.log('➕ Adding stock:', stock);
    const res = await api.post<Stock>("/stock", stock);
    console.log('✅ Stock added:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Error adding stock:', error.response?.data || error.message);
    throw error;
  }
}

export async function updateStock(id: string, stock: Partial<Stock>): Promise<Stock> {
  try {
    console.log('📝 Updating stock:', { id, stock });
    const res = await api.put<Stock>(`/stock/${id}`, stock);
    console.log('✅ Stock updated:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Error updating stock:', error.response?.data || error.message);
    throw error;
  }
}

export async function deleteStock(id: string): Promise<void> {
  try {
    console.log('🗑️ Deleting stock:', id);
    const res = await api.delete(`/stock/${id}`);
    console.log('✅ Stock deleted');
    return res.data;
  } catch (error: any) {
    console.error('❌ Error deleting stock:', error.response?.data || error.message);
    throw error;
  }
}