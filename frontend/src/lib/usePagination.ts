import { useState, useEffect } from 'react';
import api from '../lib/axios'; // Use our configured axios instance
import { useSearchParams } from 'react-router';

interface PaginationParams {
  url: string;
  page: number;
  limit: number;
  filters?: Record<string, any>; 
}

export function useServerPagination<T>(params: PaginationParams) {
    const [data, setData] = useState<T[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalPages = Math.ceil(totalItems / params.limit);

    useEffect(() => {
        const fetchData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('page', params.page.toString());
            queryParams.append('limit', params.limit.toString());
            
            if (params.filters) {
            Object.entries(params.filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value.toString());
                }
            });
            }
            console.log("Fetching with params:", queryParams.toString());
            const response = await api.get(`${params.url}?${queryParams.toString()}`);
           
            setData(response.data.data);
            setTotalItems(response.data.meta?.total || response.data.total || 0);
            
        } catch (err: any) {
            console.error("Pagination Fetch Error:", err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
        };

        fetchData();
    }, [params.url, params.page, params.limit, JSON.stringify(params.filters)]); 

    return {
        data,
        totalItems,
        totalPages,
        loading,
        error
    };
}