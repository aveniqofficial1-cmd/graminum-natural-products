import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  Eye,
  Filter,
  ArrowRight,
  MessageCircle,
  FileText,
  X,
  Phone,
  MapPin,
  Calendar,
  IndianRupee,
  ShieldCheck,
  AlertCircle,
  QrCode,
  ExternalLink,
  Banknote,
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { Order, OrderStatus } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminOrdersPage: React.FC = () => {
  const { orders, updateOrderStatus, verifyPayment, addOrderNote } = useOrders();
  const { settings } = useStoreSettings();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');

  const statusTabs = [
    'All',
    'Order Placed',
    'Accepted',
    'Preparing',
    'Preparing at Store',
    'Out for Delivery',
    'Ready for Pickup',
    'Delivered',
    'Picked Up',
    'Cancelled',
  ];

  const filteredOrders = orders.filter((o) => {
    const matchesTab = selectedStatusTab === 'All' || o.orderStatus === selectedStatusTab;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (o.orderNumber || '').toLowerCase().includes(q) ||
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.customerPhone || '').includes(searchQuery) ||
      (o.shippingAddress?.city || '').toLowerCase().includes(q) ||
      (o.deliveryMethod || '').toLowerCase().includes(q) ||
      (o.paymentMethod || '').toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const handleOpenOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setAdminNoteInput(order.notes || '');
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
    }
  };

  const handleApprovePayment = (orderId: string) => {
    verifyPayment(orderId, 'Verified');
    showToast('Payment verified & order approved!', 'success');
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({
        ...selectedOrder,
        paymentStatus: 'Verified',
        orderStatus: 'Accepted',
      });
    }
  };

  const handleSaveNote = () => {
    if (selectedOrder) {
      addOrderNote(selectedOrder.id, adminNoteInput);
      setSelectedOrder({ ...selectedOrder, notes: adminNoteInput });
    }
  };

  const getNextStage = (order: Order): OrderStatus | null => {
    const isHome = order.deliveryMethod === 'Home Delivery';
    if (isHome) {
      switch (order.orderStatus) {
        case 'Order Placed':
          return 'Accepted';
        case 'Accepted':
          return 'Preparing';
        case 'Preparing':
          return 'Out for Delivery';
        case 'Out for Delivery':
          return 'Delivered';
        default:
          return null;
      }
    } else {
      switch (order.orderStatus) {
        case 'Order Placed':
          return 'Accepted';
        case 'Accepted':
          return 'Preparing at Store';
        case 'Preparing at Store':
        case 'Preparing':
          return 'Ready for Pickup';
        case 'Ready for Pickup':
        case 'Out for Delivery':
          return 'Picked Up';
        default:
          return null;
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold text-[#4D963C] uppercase tracking-wider">
            Fulfillment Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#075B2A] font-serif-title">
            Customer Orders & Dispatch
          </h1>
          <p className="text-xs text-[#667267] mt-0.5">
            Monitor real-time fulfillment pipelines, verify UPI scanner receipts, and advance delivery stages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-white border border-[#E1E9DC] px-4 py-2 rounded-2xl text-xs font-bold text-[#075B2A] shadow-2xs">
            Total Orders: {orders.length}
          </span>
        </div>
      </div>

      {/* Filter Toolbar & Status Tabs */}
      <div className="bg-white rounded-3xl border border-[#E1E9DC] p-4 sm:p-5 shadow-sm space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Order ID (e.g. GRM-89241), Customer Name, Phone, or City..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FBF8EF] text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#E1E9DC] focus:outline-none focus:border-[#075B2A]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {statusTabs.map((tab) => {
            const count =
              tab === 'All' ? orders.length : orders.filter((o) => o.orderStatus === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setSelectedStatusTab(tab)}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  selectedStatusTab === tab
                    ? 'bg-[#075B2A] text-white shadow-xs'
                    : 'bg-[#FBF8EF] text-gray-600 hover:bg-[#EFF7E9] hover:text-[#075B2A]'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    selectedStatusTab === tab
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="bg-white rounded-3xl border border-[#E1E9DC] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E1E9DC] bg-[#EFF7E9]/40 text-[#075B2A] font-extrabold uppercase text-[10px]">
                <th className="py-3.5 px-4">Order ID & Date</th>
                <th className="py-3.5 px-3">Customer Details</th>
                <th className="py-3.5 px-3">Delivery Type</th>
                <th className="py-3.5 px-3">Items Summary</th>
                <th className="py-3.5 px-3">Grand Total</th>
                <th className="py-3.5 px-3">Payment Receipt</th>
                <th className="py-3.5 px-3">Stage Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E9DC]">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FBF8EF]/60 transition-colors">
                    {/* Order ID & Date */}
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-[#075B2A] block">
                        #{order.orderNumber}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-[#18251B]">{order.customerName}</p>
                      <p className="text-[10px] text-gray-500">
                        {order.customerPhone || ''} • {order.shippingAddress?.city || ''}
                      </p>
                    </td>

                    {/* Delivery & Payment Method */}
                    <td className="py-3.5 px-3">
                      <p className="text-[#075B2A] font-bold">
                        {order.deliveryMethod}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {order.paymentMethod}
                      </p>
                    </td>

                    {/* Items */}
                    <td className="py-3.5 px-3">
                      <span className="text-gray-600 font-medium">
                        {(order.items || []).length} item(s) (
                        {(order.items || []).map((i) => (i.product?.name || '').split(' ')[0]).join(', ')})
                      </span>
                    </td>

                    {/* Grand Total */}
                    <td className="py-3.5 px-3">
                      <span className="font-extrabold text-[#075B2A] text-sm">
                        ₹{order.grandTotal}
                      </span>
                    </td>

                    {/* Payment Status & Receipt */}
                    <td className="py-3.5 px-3">
                      {order.paymentMethod === 'Cash on Delivery' ? (
                        <span
                          className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            order.paymentStatus === 'Verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {order.paymentStatus === 'Verified' ? '✓ Cash Collected' : '💵 Cash on Delivery'}
                        </span>
                      ) : (
                        <>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              order.paymentStatus === 'Verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.paymentStatus === 'Failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-900 animate-pulse'
                            }`}
                          >
                            {order.paymentStatus === 'Verified'
                              ? '✓ Verified'
                              : order.paymentStatus === 'Failed'
                              ? '✗ Rejected'
                              : '⏳ Review Pending'}
                          </span>
                          {order.paymentUtr && (
                            <p className="text-[9px] text-gray-500 font-mono mt-0.5 truncate max-w-[100px]">
                              UTR: {order.paymentUtr}
                            </p>
                          )}
                        </>
                      )}
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-3">
                      <select
                        value={order.orderStatus}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value as OrderStatus)
                        }
                        className={`text-[11px] font-bold rounded-lg px-2.5 py-1 focus:outline-none border cursor-pointer ${
                          order.orderStatus === 'Picked Up' || order.orderStatus === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : order.orderStatus === 'Cancelled'
                            ? 'bg-red-50 text-red-800 border-red-300'
                            : 'bg-[#EFF7E9] text-[#075B2A] border-[#8CCB55]'
                        }`}
                      >
                        <option value="Order Placed">Order Placed</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Preparing">Preparing (Doorstep)</option>
                        <option value="Preparing at Store">Preparing at Store</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Ready for Pickup">Ready for Pickup</option>
                        <option value="Delivered">Delivered (Doorstep)</option>
                        <option value="Picked Up">Picked Up (Store)</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenOrderDetail(order)}
                        className="inline-flex items-center gap-1 bg-[#EFF7E9] hover:bg-[#8CCB55] text-[#075B2A] hover:text-[#06451F] font-bold text-[11px] px-3 py-1.5 rounded-xl border border-[#8CCB55] transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    No orders match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ORDER DETAILS MODAL ================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setSelectedOrder(null)}
          ></div>

          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full z-10 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E1E9DC]">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">
                  Order Management
                </span>
                <h2 className="text-xl font-bold text-[#075B2A] font-serif-title">
                  #{selectedOrder.orderNumber}
                </h2>
                <p className="text-xs text-gray-500">
                  Placed on{' '}
                  {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    selectedOrder.orderStatus === 'Delivered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedOrder.orderStatus}
                </span>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Payment Panel */}
            {selectedOrder.paymentMethod === 'Cash on Delivery' ? (
              <div className="p-4 rounded-2xl bg-[#EFF7E9] border border-[#8CCB55] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-[#075B2A]" />
                    <span className="text-xs font-bold text-[#075B2A]">
                      Cash on Delivery (Doorstep Cash Collection)
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      selectedOrder.paymentStatus === 'Verified'
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-blue-200 text-blue-900'
                    }`}
                  >
                    {selectedOrder.paymentStatus === 'Verified' ? '✓ Cash Collected' : '💵 Pay on Delivery'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500 text-[11px]">Payment Mode:</p>
                    <p className="font-bold text-[#18251B]">Cash on Delivery (Zero Advance)</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[11px]">Cash to Collect at Doorstep:</p>
                    <p className="font-black text-[#075B2A] text-sm">₹{selectedOrder.grandTotal}</p>
                  </div>
                </div>

                <p className="text-[11px] text-[#4D963C] bg-white/70 p-2.5 rounded-xl border border-[#8CCB55]/40 font-medium">
                  ℹ️ This is a Cash on Delivery order. Customer will pay cash upon receiving the parcel. No advance online payment receipt verification is required.
                </p>

                {selectedOrder.orderStatus === 'Order Placed' && (
                  <div className="pt-2 border-t border-[#8CCB55]/50 flex items-center justify-between">
                    <span className="text-[11px] text-gray-600">
                      Ready to confirm and pack this COD order?
                    </span>
                    <button
                      onClick={() => {
                        handleStatusChange(selectedOrder.id, 'Accepted');
                        showToast('COD Order accepted & queued for packaging!', 'success');
                      }}
                      className="bg-[#075B2A] hover:bg-[#06451F] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#8CCB55]" />
                      <span>Accept Order & Start Packing</span>
                    </button>
                  </div>
                )}

                {selectedOrder.paymentStatus !== 'Verified' &&
                  (selectedOrder.orderStatus === 'Delivered' || selectedOrder.orderStatus === 'Picked Up') && (
                    <div className="pt-2 border-t border-[#8CCB55]/50 flex items-center justify-between">
                      <span className="text-[11px] text-gray-600">
                        Cash collected from customer?
                      </span>
                      <button
                        onClick={() => handleApprovePayment(selectedOrder.id)}
                        className="bg-[#075B2A] hover:bg-[#06451F] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#8CCB55]" />
                        <span>Mark ₹{selectedOrder.grandTotal} Cash as Collected</span>
                      </button>
                    </div>
                  )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#EFF7E9] border border-[#8CCB55] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-[#075B2A]" />
                    <span className="text-xs font-bold text-[#075B2A]">
                      Payment Verification (UPI QR Scanner)
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      selectedOrder.paymentStatus === 'Verified'
                        ? 'bg-emerald-200 text-emerald-900'
                        : selectedOrder.paymentStatus === 'Failed'
                        ? 'bg-red-200 text-red-900'
                        : 'bg-amber-200 text-amber-900'
                    }`}
                  >
                    {selectedOrder.paymentStatus === 'Verified'
                      ? '✓ Verified'
                      : selectedOrder.paymentStatus === 'Failed'
                      ? '✗ Rejected'
                      : '⏳ Review Pending'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500 text-[11px]">UTR / Ref Number:</p>
                    <p className="font-mono font-bold text-[#18251B]">
                      {selectedOrder.paymentUtr || 'Screenshot attached by customer'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[11px]">Total Paid:</p>
                    <p className="font-black text-[#075B2A] text-sm">₹{selectedOrder.grandTotal}</p>
                  </div>
                </div>

                {selectedOrder.paymentScreenshot && (
                  <div className="pt-2">
                    <p className="text-[11px] font-bold text-gray-700 mb-1.5">Attached Receipt:</p>
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedOrder.paymentScreenshot}
                        alt="Receipt"
                        className="w-16 h-16 object-cover rounded-xl border bg-white shadow-xs"
                      />
                      <a
                        href={selectedOrder.paymentScreenshot}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-[#075B2A] hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Full Screenshot</span>
                      </a>
                    </div>
                  </div>
                )}

                {selectedOrder.paymentStatus !== 'Verified' && (
                  <div className="pt-2 border-t border-[#8CCB55]/50 flex items-center justify-between">
                    <span className="text-[11px] text-gray-600">
                      Checked bank account / WhatsApp receipt?
                    </span>
                    <button
                      onClick={() => handleApprovePayment(selectedOrder.id)}
                      className="bg-[#075B2A] hover:bg-[#06451F] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#8CCB55]" />
                      <span>Approve Payment & Confirm Order</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick Stage Progression Banner */}
            {getNextStage(selectedOrder) && (
              <div className="bg-[#EFF7E9] border border-[#8CCB55] p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="font-bold text-[#075B2A]">Next Fulfillment Milestone: </span>
                  <span className="text-gray-700">
                    Advance this package to{' '}
                    <strong>"{getNextStage(selectedOrder)}"</strong>
                  </span>
                </div>
                <button
                  onClick={() =>
                    handleStatusChange(
                      selectedOrder.id,
                      getNextStage(selectedOrder)!
                    )
                  }
                  className="bg-[#075B2A] hover:bg-[#06451F] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Advance Status →</span>
                </button>
              </div>
            )}

            {/* Items Breakdown Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#075B2A] uppercase tracking-wider">
                Harvest Items in this Package
              </h3>
              <div className="border border-[#E1E9DC] rounded-2xl overflow-hidden divide-y divide-[#E1E9DC]">
                {(selectedOrder.items || []).map((it, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between text-xs bg-[#FBF8EF]/40">
                    <div className="flex items-center gap-3">
                      <img
                        src={it.product?.image || ''}
                        alt={it.product?.name || ''}
                        className="w-10 h-10 object-cover rounded-xl border shrink-0 bg-[#EFF7E9]"
                      />
                      <div>
                        <p className="font-bold text-[#18251B]">{it.product?.name || 'Unknown Product'}</p>
                        <p className="text-[11px] text-gray-500">
                          Pack: <strong className="text-[#075B2A]">{it.selectedPackSize}</strong> × {it.quantity} units
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-[#075B2A]">
                      ₹{it.unitPrice * it.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="text-right text-xs space-y-1 pt-1 pr-2">
                <p className="text-gray-500">
                  Subtotal: <strong>₹{selectedOrder.subtotal}</strong>
                </p>
                <p className="text-gray-500">
                  Delivery Fee: <strong>{selectedOrder.deliveryFee === 0 ? 'FREE' : `₹${selectedOrder.deliveryFee}`}</strong>
                </p>
                <p className="text-sm font-black text-[#075B2A]">
                  Grand Total: ₹{selectedOrder.grandTotal}
                </p>
              </div>
            </div>

            {/* Customer & Address Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-[#FBF8EF] rounded-2xl border border-[#E1E9DC] space-y-2 text-xs">
                <h4 className="font-bold text-[#075B2A] uppercase tracking-wider">
                  Customer Information
                </h4>
                <p className="font-bold text-[#18251B]">{selectedOrder.customerName}</p>
                <p className="text-gray-600">📞 {selectedOrder.customerPhone}</p>
                <p className="text-gray-600">✉️ {selectedOrder.customerEmail}</p>
                <div className="pt-2">
                  <a
                    href={`https://wa.me/${(selectedOrder.customerPhone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Namaskaram ${selectedOrder.customerName}! Regarding your Graminum Order #${selectedOrder.orderNumber} (₹${selectedOrder.grandTotal}): `
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#075B2A] bg-white border border-[#8CCB55] px-3 py-1 rounded-lg hover:bg-[#EFF7E9]"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="p-4 bg-[#FBF8EF] rounded-2xl border border-[#E1E9DC] space-y-2 text-xs">
                <h4 className="font-bold text-[#075B2A] uppercase tracking-wider">
                  Fulfillment & Store Location
                </h4>
                <p className="font-bold text-[#18251B]">
                  {selectedOrder.shippingAddress?.fullName || ''}
                </p>
                <p className="text-gray-600">{selectedOrder.shippingAddress?.addressLine || ''}</p>
                <p className="text-gray-600">
                  {selectedOrder.shippingAddress?.city || ''}, {selectedOrder.shippingAddress?.state || ''} —{' '}
                  {selectedOrder.shippingAddress?.pincode || ''}
                </p>
                <p className="text-[11px] font-bold text-[#4D963C] pt-1">
                  Fulfillment: {selectedOrder.deliveryMethod} (Kashibugga Warangal Counter)
                </p>
              </div>
            </div>

            {/* Internal Admin Dispatch Notes */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-[#18251B]">
                Internal Fulfillment Notes
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Packed at Kashibugga store counter, customer notified"
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  className="flex-1 bg-[#FBF8EF] text-xs px-3.5 py-2.5 rounded-xl border border-[#E1E9DC] focus:outline-none focus:border-[#075B2A]"
                />
                <button
                  onClick={handleSaveNote}
                  className="bg-[#075B2A] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E1E9DC]">
              <Link
                to={`/track-order/${selectedOrder.orderNumber}`}
                target="_blank"
                className="text-xs font-bold text-[#075B2A] hover:underline"
              >
                View Customer Live Tracking Page ↗
              </Link>
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-5 py-2 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
