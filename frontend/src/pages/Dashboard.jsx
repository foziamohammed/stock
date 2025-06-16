import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiPieChart, FiCreditCard, FiUser, FiSettings, FiShield, FiHelpCircle } from 'react-icons/fi';
import { BsMoonStars } from 'react-icons/bs';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function Dashboard({ darkMode, setDarkMode }) {
  const [summary, setSummary] = useState({ totalBooks: 0, lowStock: 0, totalOrders: 0 });
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ label: '', data: [], backgroundColor: [] }] });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        const API_URL = import.meta.env.VITE_API_URL;
        if (!API_URL) throw new Error('API_URL is not defined');

        // Fetch summary data
        const summaryResponse = await fetch(`${API_URL}/api/dashboard-summary`, {
          cache: 'no-store',
        });
        if (!summaryResponse.ok) {
          const errorText = await summaryResponse.text();
          throw new Error(`Failed to fetch summary: ${summaryResponse.status} - ${errorText}`);
        }
        const summaryData = await summaryResponse.json();
        if (!summaryData.totalBooks == null || !summaryData.lowStock == null || !summaryData.totalOrders == null) {
          throw new Error('Invalid summary data format');
        }
        setSummary(summaryData);

        // Fetch chart data
        const chartResponse = await fetch(`${API_URL}/api/chart-data`, {
          cache: 'no-store',
        });
        if (!chartResponse.ok) throw new Error(`Failed to fetch chart data: ${chartResponse.status}`);
        const chartRawData = await chartResponse.json();
        console.log('Received chart data:', chartRawData); // Debug raw data
        // Enforce limit to top 10 + Others
        const limitedLabels = chartRawData.labels.slice(0, 11); // Limit to 10 + Others
        const limitedData = chartRawData.datasets?.[0]?.data.slice(0, 11) || [];
        const processedChartData = {
          labels: limitedLabels,
          datasets: [
            {
              label: 'Number of Books per Category',
              data: limitedData,
              backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
                '#FF6347', '#4682B4', '#FFD700', '#20B2AA', '#8A2BE2',
              ].slice(0, limitedLabels.length),
            },
          ],
        };
        console.log('Processed chart data:', processedChartData); // Debug processed data
        setChartData(processedChartData);

        // Fetch activities
        const activitiesResponse = await fetch(`${API_URL}/api/activities`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (!activitiesResponse.ok) throw new Error(`Failed to fetch activities: ${activitiesResponse.status}`);
        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData.map(activity => ({
          ...activity,
          createdAt: activity.created_at || activity.createdAt || new Date().toISOString(),
        })));

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
    const intervalId = setInterval(fetchAllData, 60000); // Refresh every 60 seconds
    return () => clearInterval(intervalId);
  }, []);

  // Helper function to calculate time difference with UTC to EAT adjustment
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const activityDate = new Date(dateString);
    const eatOffset = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
    const adjustedActivityDate = new Date(activityDate.getTime() + eatOffset);
    console.log('Now:', now, 'Adjusted Activity Date:', adjustedActivityDate);
    const diffInMs = now - adjustedActivityDate;
    const diffInMinutes = Math.floor(diffInMs / 1000 / 60);
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // Map activity types to icons and colors
  const activityStyles = {
    book_added: { icon: <FiPieChart className="text-pink-600 dark:text-pink-300" />, bg: 'bg-pink-100 dark:bg-pink-900' },
    book_updated: { icon: <FiPieChart className="text-blue-600 dark:text-blue-300" />, bg: 'bg-blue-100 dark:bg-blue-900' },
    book_deleted: { icon: <FiPieChart className="text-red-600 dark:text-red-300" />, bg: 'bg-red-100 dark:bg-red-900' },
    order_received: { icon: <FiCreditCard className="text-green-600 dark:text-green-300" />, bg: 'bg-green-100 dark:bg-green-900' },
    order_deleted: { icon: <FiCreditCard className="text-red-600 dark:text-red-300" />, bg: 'bg-red-100 dark:bg-red-900' },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-[#0e1525] text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 p-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md shadow-md border border-white/20 dark:border-gray-700 rounded-tr-3xl rounded-br-3xl">
        <div className="mb-10">
          <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">📚Perfect Books</div>
        </div>
        <nav className="space-y-5 text-gray-700 dark:text-gray-300 text-[15px] font-medium">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 ${isActive ? 'text-pink-600 dark:text-pink-400 font-semibold' : 'hover:text-pink-500 dark:hover:text-pink-300'}`
            }
          >
            <FiHome /> Dashboard
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `flex items-center gap-3 ${isActive ? 'text-pink-600 dark:text-pink-400 font-semibold' : 'hover:text-pink-500 dark:hover:text-pink-300'}`
            }
          >
            <FiPieChart /> Products
          </NavLink>
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `flex items-center gap-3 ${isActive ? 'text-pink-600 dark:text-pink-400 font-semibold' : 'hover:text-pink-500 dark:hover:text-pink-300'}`
            }
          >
            <FiCreditCard /> Orders
          </NavLink>
          <NavLink
            to="/account"
            className={({ isActive }) =>
              `flex items-center gap-3 ${isActive ? 'text-pink-600 dark:text-pink-400 font-semibold' : 'hover:text-pink-500 dark:hover:text-pink-300'}`
            }
          >
            <FiUser /> Account
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 ${isActive ? 'text-pink-600 dark:text-pink-400 font-semibold' : 'hover:text-pink-500 dark:hover:text-pink-300'}`
            }
          >
            <FiSettings /> Settings
          </NavLink>

          <hr className="my-4 border-gray-300 dark:border-gray-600" />

          <NavLink
            to="/security"
            className={({ isActive }) =>
              `flex items-center gap-3 ${isActive ? 'text-pink-600 dark:text-pink-400 font-semibold' : 'hover:text-pink-500 dark:hover:text-pink-300'}`
            }
          >
            <FiShield /> Security
          </NavLink>
          <NavLink
            to="/help"
            className={({ isActive }) =>
              `flex items-center gap-3 ${isActive ? 'text-pink-600 dark:text-pink-400 font-semibold' : 'hover:text-pink-500 dark:hover:text-pink-300'}`
            }
          >
            <FiHelpCircle /> Help Center
          </NavLink>
        </nav>
        <div
          onClick={() => setDarkMode(!darkMode)}
          className={`flex items-center gap-3 py-4 cursor-pointer ${darkMode ? 'text-pink-600 dark:text-pink-400 font-semibold' : 'hover:text-pink-500 dark:hover:text-pink-300'}`}
        >
          <BsMoonStars /> {darkMode ? 'Light Mode' : 'Dark Mode'}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md shadow-top">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Total Books</p>
                <h2 className="text-3xl font-bold mt-2">{summary.totalBooks}</h2>
              </div>
              <div className="bg-pink-100 dark:bg-pink-900 p-3 rounded-full">
                <FiPieChart className="text-pink-600 dark:text-pink-300 w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Low Stock Items</p>
                <h2 className="text-3xl font-bold mt-2">{summary.lowStock}</h2>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                <FiHelpCircle className="text-yellow-600 dark:text-yellow-300 w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Total Orders</p>
                <h2 className="text-3xl font-bold mt-2">{summary.totalOrders}</h2>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                <FiCreditCard className="text-green-600 dark:text-green-300 w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Books by Category (Bar Chart) */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Books by Category (Quantity)</h3>
            {chartData && (
              <Bar
                key={Date.now()} // Forces re-render on data update
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        color: darkMode ? '#E5E7EB' : '#374151',
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        color: darkMode ? '#E5E7EB' : '#374151',
                      },
                      grid: {
                        color: darkMode ? 'rgba(229, 231, 235, 0.1)' : 'rgba(55, 65, 81, 0.1)',
                      },
                    },
                    x: {
                      ticks: {
                        color: darkMode ? '#E5E7EB' : '#374151',
                      },
                      grid: {
                        color: darkMode ? 'rgba(229, 231, 235, 0.1)' : 'rgba(55, 65, 81, 0.1)',
                      },
                    },
                  },
                }}
              />
            )}
          </div>

          {/* Books by Category (Pie Chart) */}
          <div className="bg-[#f3f4f6] dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
            {chartData && (
              <Pie
                key={Date.now()} // Forces re-render on data update
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        color: darkMode ? '#E5E7EB' : '#374151',
                      },
                    },
                  },
                }}
              />
            )}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-gray-500 dark:text-gray-400">Loading activities...</p>
            ) : error ? (
              <p className="text-center text-red-600 dark:text-red-400">{error}</p>
            ) : activities.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">No recent activities.</p>
            ) : (
              activities.map((activity) => {
                const style = activityStyles[activity.type] || {
                  icon: <FiPieChart className="text-gray-600 dark:text-gray-300" />,
                  bg: 'bg-gray-100 dark:bg-gray-700',
                };
                return (
                  <div
                    key={activity.id}
                    className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <div className={`${style.bg} p-2 rounded-full mr-4`}>{style.icon}</div>
                    <div>
                      <p className="font-medium">{activity.message}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {getTimeAgo(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}