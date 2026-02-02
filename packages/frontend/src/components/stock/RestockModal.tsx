// src/api/stock.ts
import axios from "axios";
import useSWR from "swr";

const API_BASE = "http://localhost:5000/api"; // adjust if needed

const fetcher = (url: string) => axios.get(url).then(res => res.data);

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
  const res = await axios.post(`${API_BASE}/stocks`, stock);
  return res.data;
}

export async function updateStock(id: string, stock: any) {
  const res = await axios.put(`${API_BASE}/stocks/${id}`, stock);
  return res.data;
}

export async function deleteStock(id: string) {
  const res = await axios.delete(`${API_BASE}/stocks/${id}`);
  return res.data;
}
