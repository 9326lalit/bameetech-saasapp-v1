import Sidebar from './Sidebar';

const Layout = ({ children, title }) => {
  return (
    <div className="flex bg-gray-50 min-h-screen">

      <aside className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 z-50">
        <Sidebar />
      </aside>

      <div className="ml-64 flex flex-col w-full min-h-screen">

        <header className="bg-white sticky top-0 z-40 px-8 py-5 shadow-sm border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 truncate">{title}</h1>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
