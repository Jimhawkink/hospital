// src/api/stock.ts
import api from "../../api/axios";
import useSWR from "swr";

const API_BASE = "";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export function useStocks() {
  const { data, error, isLoading, mutate } = useSWR(`${API_BASE}/stocks`, fetcher);
  return {
    stocks: data || [],
    isLoading,
    isError: error,
    mutate
  };
}

export async function addStock(stock: any) {
  const res = await api.post(`${API_BASE}/stocks`, stock);
  return res.data;
}

export async function updateStock(id: string, stock: any) {
  const res = await api.put(`${API_BASE}/stocks/${id}`, stock);
  return res.data;
}

export async function deleteStock(id: string) {
  const res = await api.delete(`${API_BASE}/stocks/${id}`);
  return res.data;
}
