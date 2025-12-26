import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

const Layout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="flex flex-col w-full min-h-screen lg:ml-64">
        {/* Header */}
        <header className="bg-white sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-4 lg:py-5 shadow-sm border-b border-gray-200 flex items-center justify-between">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Menu className="h-6 w-6" />
          </button>

          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">{title}</h1>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 mobile-scroll">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
