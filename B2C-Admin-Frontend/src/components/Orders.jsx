import { useCallback, useEffect, useState } from "react";
import { FaSearch, FaSort, FaSortDown, FaSortUp, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
    clearSuccessMessage,
    deleteOrder,
    fetchOrders,
    setSuccessMessage,
} from "../redux/ordersSlice.js";

const Orders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orders, loading, error, successMessage, totalCount } = useSelector(
    (state) => state.orders
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "descending" });
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(fetchOrders({ page: 1, limit: totalCount }));
  }, [dispatch, totalCount]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      setTimeout(() => dispatch(clearSuccessMessage()), 3000);
    }
  }, [successMessage, dispatch]);

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = (id) => {
    dispatch(deleteOrder(id))
      .then(() => {
        dispatch(setSuccessMessage("Order has been successfully deleted"));
      })
      .catch((err) => {
        console.log(err);
        toast.error("Order cannot be deleted");
      });
  };

  const getOrderDate = (order) => {
    return order.createdAt?.['_seconds'] ? new Date(order.createdAt._seconds * 1000) : new Date(0);
  };

  const sortedOrders = [...orders].sort((a, b) => {
    if (sortConfig.key === "createdAt") {
      return sortConfig.direction === "ascending"
        ? getOrderDate(a) - getOrderDate(b)
        : getOrderDate(b) - getOrderDate(a);
    } else {
      return sortConfig.direction === "ascending"
        ? a[sortConfig.key] < b[sortConfig.key] ? -1 : 1
        : a[sortConfig.key] > b[sortConfig.key] ? -1 : 1;
    }
  });

  const filteredOrders = sortedOrders.filter((order) =>
    order.id.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedOrders = filteredOrders.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const productDisplayNameMap = {
    "12pc_tray": "E12",
    "6pc_tray": "E6",
    "26pc_tray": "E6",
    "30pc_tray": "E30",
    "E6": "E6",
    "E12": "E12",
    "E30": "E30",
  };

  const getStatusBadgeClass = (status) => {
    const s = status.toLowerCase();
    if (s === "pending") return "bg-yellow-200 border-2 text-yellow-800 border-yellow-300";
    if (s === "delivered") return "bg-green-400 border-2 text-green-800 border-green-300";
    if (s === "canceled" || s === "cancelled") return "bg-red-300 border-2 text-red-800 border-red-300";
    if (s === "processing") return "bg-blue-300 text-blue-800 border-blue-300";
    if (s === "shipped") return "bg-purple-300 text-purple-800 border-purple-300";
    return "bg-gray-100 text-gray-800 border-gray-300";
  };

  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <FaSort className="ml-1 inline text-gray-400" />;
    return sortConfig.direction === "ascending"
      ? <FaSortUp className="ml-1 inline text-gray-700" />
      : <FaSortDown className="ml-1 inline text-gray-700" />;
  };

  const renderProducts = useCallback((products) => {
    if (!products) return null;
    const rows = [];

    const createRow = (name, quantity, key) => (
      <div key={key} className="flex justify-between items-center text-sm text-gray-700 border px-2 py-1 rounded bg-gray-50">
        <span className="font-medium">{name}</span>
        <span className="ml-2">x{quantity}</span>
      </div>
    );

    if (Array.isArray(products)) {
      for (let p of products) {
        const name = productDisplayNameMap[p.name] || p.name;
        rows.push(createRow(name, p.quantity, p.productId));
      }
    } else if (typeof products === 'object') {
      for (let [id, p] of Object.entries(products)) {
        const name = productDisplayNameMap[p?.name] || productDisplayNameMap[id] || id;
        const quantity = p?.quantity ?? p;
        rows.push(createRow(name, quantity, id));
      }
    }

    return <div className="flex flex-col gap-1 w-full">{rows}</div>;
  }, []);

  const formatOrderDate = (order) => {
    if (order.createdAt?.['_seconds']) {
      const d = new Date(order.createdAt._seconds * 1000);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return "";
  };

  const renderPagination = () => {
    const pageCount = Math.ceil(filteredOrders.length / itemsPerPage);
    if (pageCount <= 1) return null;
    return (
      <div className="flex justify-center mt-4 space-x-2">
        <button
          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className={`px-3 py-1 rounded border ${currentPage === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
        >Previous</button>

        {[...Array(pageCount).keys()].map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 hover:bg-blue-50 border'}`}
          >{page + 1}</button>
        ))}

        <button
          onClick={() => setCurrentPage(Math.min(pageCount - 1, currentPage + 1))}
          disabled={currentPage >= pageCount - 1}
          className={`px-3 py-1 rounded border ${currentPage >= pageCount - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
        >Next</button>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 shadow rounded mb-6 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-400">
      <h3 className="text-lg font-semibold ml-4 mb-4">All orders</h3>

      <div className="mb-4 relative">
        <div className="flex items-center border ml-2 rounded-lg overflow-hidden shadow-sm">
          <div className="px-4 py-2 bg-gray-50">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 focus:outline-none"
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          <p className="font-medium">Orders not found</p>
        </div>
      )}

      <div className="overflow-x-auto rounded-md m-2">
        {!loading && !error && (
          <>
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
              <thead>
                <tr className="bg-gray-50">
                  {["id", "products", "amount", "status", "createdAt"].map((key) => (
                    <th
                      key={key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort(key)}
                    >
                      <div className="flex items-center capitalize">{key === "createdAt" ? "Order Date" : key} {renderSortIcon(key)}</div>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition duration-200 cursor-pointer"
                      onClick={() => navigate(`/order/${order.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 w-48">{renderProducts(order.products)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Rs {Math.round(order.amount).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full border ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatOrderDate(order)}</td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(order.id);
                          }}
                          className="text-red-500 hover:text-red-700 transition duration-150 focus:outline-none"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">No orders found</td>
                  </tr>
                )}
              </tbody>
            </table>

            {renderPagination()}

            {filteredOrders.length > 0 && (
              <div className="mt-4 text-sm text-gray-500">
                Showing {currentPage * itemsPerPage + 1} to {Math.min((currentPage + 1) * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Orders;
