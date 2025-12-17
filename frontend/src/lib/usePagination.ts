import {useState, useMemo, useEffect} from 'react';
import axios from 'axios';
const API_KEY = ''
export function usePagination(lists:any[],itemsPerPage:number) {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(lists.length / itemsPerPage);
    const maxPage = useMemo(() => {
        return Math.ceil(lists.length / itemsPerPage);
    }, [lists]);
    const currentData = useMemo(() => {
        const begin = (currentPage - 1) * itemsPerPage;
        const end = begin + itemsPerPage;
        return lists.slice(begin, end);
    }, [currentPage, lists]);
    const next = () => {
        setCurrentPage((currentPage) => Math.min(currentPage + 1, maxPage));
        console.log("Page:", currentPage);
        
    }
    const prev = () => {
        setCurrentPage((currentPage) => Math.max(currentPage - 1, 1));
        console.log("Page:", currentPage);
    }
    const jumpToPage = (page:number) => {
        setCurrentPage(() => Math.max(1, Math.min(page, maxPage)));
    }
    return {
        totalPages,
        currentData,
        currentPage,
        maxPage,
        next,
        prev,
        jumpToPage
    }
}

export function usePaginationServerSide(itemsPerPage:number, url:string) {
    const [currentData, setCurrentData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    
    // Loading & Error states are crucial for server-side logic
    const [loading, setLoading] = useState(false);
    const [err, setError] = useState(null);
    useEffect(() => {
        const fetchTotalItems = async () => {
        try {
            const response = await axios.get(`${url}/events?select=event_id.count()`, {
                headers: {
                    'apikey': API_KEY,
                }
            });
            setTotalItems(response.data[0].count);
        } catch (error:any) {
            setError(error.message || 'Something went wrong');
        }
        };

        fetchTotalItems();
    })
    useEffect(() => {
        const fetchData = async () => {
        setLoading(true);
        setError(null);
        const offset = (currentPage - 1) * itemsPerPage;
        try {
            const response = await axios.get(`${url}/events?select=*,speakers(*),event_categories(*)&limit=${itemsPerPage}&offset=${offset}`, {
                headers: {
                    'apikey': API_KEY,
                }
            });
            setCurrentData(response.data);
        } catch (error:any) {
            setError(error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
        };

        fetchData();
    }, [url, currentPage, itemsPerPage]); 

    // Change logic to
    const totalPages = Math.ceil(totalItems / itemsPerPage);


    const next = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    const prev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const jumpToPage = (page:number) => {
        const pageNumber = Math.max(1, page);
        setCurrentPage(() => Math.min(pageNumber, totalPages));
    };

    return {
        currentData,
        currentPage,
        totalPages,
        loading,
        err,
        totalItems,
        next,
        prev,
        jumpToPage
    };
};