import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  CreditCard,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Truck,
  ArrowUpRight,
  Eye,
  Plus,
  ShieldAlert,
  ShoppingBag,
  IndianRupee,
  Calendar,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { useProducts } from '../../context/ProductContext';
import { OrderStatus, Product } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const { orders, stats, updateOrderStatus } = useOrders();
  const { products } = useProducts();

  // Low stock products filter (< 15 units)
  const lowStockItems = products.filter((p: Product) => p.stock < 15);

  // Dynamic Weekly Revenue and Orders Data (Last 7 days ending today)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return {
      dateStr: `${yyyy}-${mm}-${dd}`,
      dayName: daysOfWeek[d.getDay()],
      fullDateStr: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
    };
  });

  const weeklyData = last7Days.map(({ dateStr, dayName }) => {
    const dayOrders = orders.filter((o) => {
      const orderDate = (o.createdAt || '').split('T')[0];
      return orderDate === dateStr && o.orderStatus !== 'Cancelled';
    });
    const dayRevenue = dayOrders
      .filter(
        (o) =>
          o.paymentStatus === 'Verified' ||
          (o.paymentMethod === 'Cash on Delivery' &&
            (o.orderStatus === 'Delivered' || o.orderStatus === 'Picked Up'))
      )
      .reduce((sum, o) => sum + o.grandTotal, 0);
    return {
      day: dayName,
      revenue: dayRevenue,
      orders: dayOrders.length,
    };
  });

  const maxRevenue = Math.max(...weeklyData.map((d) => d.revenue), 1000);

  // Peak day calculation
  const peakDayObj = [...weeklyData].sort((a, b) => b.revenue - a.revenue)[0];
  const peakDayText =
    peakDayObj && peakDayObj.revenue > 0
      ? `${peakDayObj.day} (₹${peakDayObj.revenue.toLocaleString('en-IN')})`
      : 'No verified sales yet';

  const averageOrderValue =
    stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold text-[#4D963C] uppercase tracking-wider">
            Operational Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#075B2A] font-serif-title">
            Executive Operations Dashboard
          </h1>
          <p className="text-xs text-[#667267] mt-0.5">
            Real-time analytics for natural products dispatches, revenue, and customer fulfillments.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-2 bg-[#075B2A] hover:bg-[#06451F] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Manage Catalog</span>
          </Link>
          <Link
            to="/admin/payments"
            className="inline-flex items-center gap-2 bg-[#EFF7E9] hover:bg-[#8CCB55] text-[#075B2A] hover:text-[#06451F] text-xs font-bold px-4 py-2.5 rounded-xl border border-[#8CCB55] transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            <span>Verify Receipts</span>
            {stats.pendingPaymentVerification > 0 && (
              <span className="bg-[#D92D20] text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                {stats.pendingPaymentVerification}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Pending Payment Verification Alert Card (if any pending) */}
      {stats.pendingPaymentVerification > 0 && (
        <div className="bg-amber-50 rounded-2xl border border-amber-300 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-amber-900">
                Action Required: {stats.pendingPaymentVerification} Manual Payment Receipt(s) Awaiting Review
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Customers have uploaded UPI / Bank transfer receipts. Please verify against your bank feed to approve fulfillment.
              </p>
            </div>
          </div>
          <Link
            to="/admin/payments"
            className="bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0 shadow-xs"
          >
            Open Verification Queue →
          </Link>
        </div>
      )}

      {/* 4 PRIMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-[#E1E9DC] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Gross Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#EFF7E9] text-[#075B2A] flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-[#075B2A]" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#075B2A]">₹{stats.totalRevenue.toLocaleString('en-IN')}</span>
            <span className="text-[11px] font-bold text-[#4D963C] flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> Live
            </span>
          </div>
          <p className="text-[10px] text-gray-400">Calculated across all verified orders</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-3xl border border-[#E1E9DC] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Placed Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#EFF7E9] text-[#075B2A] flex items-center justify-center">
              <Package className="w-4 h-4 text-[#075B2A]" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#075B2A]">{stats.totalOrders}</span>
            <span className="text-[11px] font-bold text-[#4D963C] flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> {stats.totalOrders} total
            </span>
          </div>
          <p className="text-[10px] text-gray-400">{stats.pickedUpOrders || stats.deliveredOrders} picked up at store</p>
        </div>

        {/* Active Fulfillment Queue */}
        <div className="bg-white p-5 rounded-3xl border border-[#E1E9DC] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              In-Store Fulfillment Queue
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-900">
              {stats.pendingFulfillment + (stats.readyForPickup || stats.outForDelivery)}
            </span>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              {stats.readyForPickup || stats.outForDelivery} ready at counter
            </span>
          </div>
          <p className="text-[10px] text-gray-400">Orders preparing at Kashibugga store</p>
        </div>

        {/* Active Catalog SKUs */}
        <div className="bg-white p-5 rounded-3xl border border-[#E1E9DC] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Active Catalog SKUs
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#EFF7E9] text-[#075B2A] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-[#075B2A]" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#075B2A]">{products.length}</span>
            {lowStockItems.length > 0 ? (
              <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                {lowStockItems.length} low stock
              </span>
            ) : (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                All healthy
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-400">Native grains, flours, cold-pressed oils</p>
        </div>
      </div>

      {/* 2-COLUMN SECTION: REVENUE PERFORMANCE CHART & LOW STOCK INVENTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Revenue Trend Bar Visualization (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E1E9DC] p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E1E9DC]">
            <div>
              <h2 className="text-base font-bold text-[#075B2A] font-serif-title">
                Weekly Revenue & Order Momentum
              </h2>
              <p className="text-xs text-[#667267]">Last 7 days store pickup sales at Kashibugga, Warangal</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="inline-block w-3 h-3 rounded-md bg-[#075B2A]"></span>
              <span className="text-gray-600">Daily Revenue (₹)</span>
            </div>
          </div>

          {/* Bar Chart Mock Container */}
          <div className="h-56 flex items-end justify-between gap-3 pt-4 px-2">
            {weeklyData.map((d, i) => {
              const heightPercent = maxRevenue > 0 ? Math.round((d.revenue / maxRevenue) * 100) : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-[#18251B] text-white px-2 py-1 rounded-md text-center pointer-events-none whitespace-nowrap shadow-md">
                    ₹{d.revenue.toLocaleString('en-IN')} ({d.orders} orders)
                  </div>
                  {/* Bar */}
                  <div className="w-full bg-[#EFF7E9] rounded-t-xl h-full flex items-end p-1">
                    <div
                      className="w-full bg-[#075B2A] group-hover:bg-[#4D963C] transition-all rounded-t-lg min-h-[4px]"
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    ></div>
                  </div>
                  {/* Day Label */}
                  <span className="text-xs font-bold text-gray-600">{d.day}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#E1E9DC] flex items-center justify-between text-xs text-[#667267]">
            <span>Average Order Value: <strong>₹{averageOrderValue.toLocaleString('en-IN')}</strong></span>
            <span>Peak Day: <strong>{peakDayText}</strong></span>
          </div>
        </div>

        {/* Right: Low Stock Alert Card (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E1E9DC] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E1E9DC]">
            <h2 className="text-sm font-bold text-[#075B2A] uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Low Stock Alerts</span>
            </h2>
            <Link to="/admin/products" className="text-xs font-bold text-[#075B2A] hover:underline">
              View All →
            </Link>
          </div>

          {lowStockItems.length > 0 ? (
            <div className="divide-y divide-[#E1E9DC]">
              {lowStockItems.map((prod: Product) => (
                <div key={prod.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-10 h-10 object-cover rounded-xl border shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-[#18251B] truncate">{prod.name}</p>
                      <span className="text-[10px] text-red-600 font-extrabold">
                        Only {prod.stock} units left
                      </span>
                    </div>
                  </div>
                  <Link
                    to="/admin/products"
                    className="bg-[#EFF7E9] hover:bg-[#8CCB55] text-[#075B2A] px-2.5 py-1 rounded-lg font-bold text-[11px] border border-[#8CCB55] shrink-0"
                  >
                    Restock
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-gray-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
              <p className="font-bold text-gray-700">All SKUs Fully Stocked</p>
              <p className="text-[10px]">No items below threshold.</p>
            </div>
          )}
        </div>
      </div>

      {/* RECENT ORDERS TABLE */}
      <div className="bg-white rounded-3xl border border-[#E1E9DC] p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E1E9DC]">
          <div>
            <h2 className="text-base font-bold text-[#075B2A] font-serif-title">
              Recent Customer Orders
            </h2>
            <p className="text-xs text-[#667267]">
              Manage live fulfillment states and dispatch updates.
            </p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-bold text-[#075B2A] hover:underline flex items-center gap-1"
          >
            <span>View All Orders ({orders.length})</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E1E9DC] text-gray-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-3">Order ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Items</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E9DC]">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">
                    <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="font-bold text-gray-700">No Orders Placed Yet</p>
                    <p className="text-[11px] text-gray-400">
                      Live orders placed by customers at checkout will appear here instantly.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-[#FBF8EF]/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-[#075B2A]">
                      #{order.orderNumber}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-[#18251B]">{order.customerName}</p>
                      <p className="text-[10px] text-gray-500">{order.customerPhone}</p>
                    </td>
                    <td className="py-3 px-3 text-gray-600 font-medium">
                      {(order.items || []).length} item(s)
                    </td>
                    <td className="py-3 px-3 font-bold text-[#075B2A]">
                      ₹{order.grandTotal}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.paymentStatus === 'Verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.paymentMethod} ({order.paymentStatus})
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={order.orderStatus}
                        onChange={(e) =>
                          updateOrderStatus(order.id, e.target.value as OrderStatus)
                        }
                        className="bg-[#EFF7E9] text-[#075B2A] border border-[#8CCB55] text-[11px] font-bold rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                      >
                        <option value="Order Placed">Order Placed</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Preparing at Store">Preparing at Store</option>
                        <option value="Ready for Pickup">Ready for Pickup</option>
                        <option value="Picked Up">Picked Up</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/track-order/${order.orderNumber}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#075B2A] hover:underline bg-[#EFF7E9] px-2.5 py-1 rounded-lg"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Track</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
