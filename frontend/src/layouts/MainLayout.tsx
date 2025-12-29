import { Outlet } from 'react-router'; // Note: react-router-dom v6 exports usually work with react-router v7 too
import Navbar from '@/components/NavBar';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* The Navbar will stick to the top */}
      <Navbar />

      {/* The page content (HomePage, DetailPage, etc.) renders here */}
      <main className="grow container mx-auto px-4 py-2">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        © 2025 BigBiddie HCMUS - WNC Project
      </footer>
    </div>
  );
};

export default MainLayout;