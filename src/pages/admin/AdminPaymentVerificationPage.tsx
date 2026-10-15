import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Eye,
  AlertCircle,
  FileCheck,
  Search,
  Sparkles,
  Phone,
  MessageCircle,
  QrCode,
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useToast } from '../../context/ToastContext';
import { Order } from '../../types';

export const AdminPaymentVerificationPage: React.FC = () => {
  const { orders, verifyPayment, stats } = useOrders();
  const { settings } = useStoreSettings();
  const { showToast } = useToast();

  // Filter manual transfer / UPI orders (Strictly exclude Cash on Delivery)
  const manualOrders = orders.filter(
    (o) =>
      o.paymentMethod !== 'Cash on Delivery' &&
      (o.paymentMethod === 'Manual Transfer (Screenshot)' ||
        o.paymentMethod === 'UPI / QR Code' ||
        o.paymentScreenshot !== undefined ||
        o.paymentUtr !== undefined)
  );

  const [filterMode, setFilterMode] = useState<'All' | 'Pending' | 'Verified' | 'Failed'>('Pending');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(
    manualOrders.find((o) => o.paymentStatus === 'Pending') || manualOrders[0] || null
  );

  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const filteredOrders = manualOrders.filter((o) => {
    if (filterMode === 'All') return true;
    return o.paymentStatus === filterMode;
  });

  const handleApprove = (orderId: string) => {
    verifyPayment(orderId, 'Verified');
    showToast('Payment verified successfully! Order moved to Accepted.', 'success');
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, paymentStatus: 'Verified', orderStatus: 'Accepted' });
    }
  };

  const handleReject = (orderId: string) => {
    verifyPayment(orderId, 'Failed');
    showToast('Payment marked as Failed / Rejected.', 'info');
    setIsRejectModalOpen(false);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, paymentStatus: 'Failed' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-extrabold">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>{stats.pendingPaymentVerification} Receipts Awaiting Review</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#075B2A] font-serif-title mt-1">
            Manual Payment Receipt Verification
          </h1>
          <p className="text-xs text-[#667267]">
            Inspect customer-submitted UPI screenshots and bank UTR numbers against your merchant account (<strong>{settings.upiId}</strong>).
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          {(['Pending', 'Verified', 'Failed', 'All'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterMode === mode
                  ? 'bg-[#075B2A] text-white shadow-xs'
                  : 'bg-white border border-[#E1E9DC] text-gray-700 hover:bg-[#EFF7E9]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* 2-COLUMN VERIFICATION DESK: Left Queue & Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT: QUEUE LIST (5 Cols) ================= */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E1E9DC] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E1E9DC]">
            <h2 className="text-sm font-bold text-[#075B2A] uppercase tracking-wider">
              Verification Queue ({filteredOrders.length})
            </h2>
            <span className="text-[11px] text-gray-500 font-medium">Select to inspect</span>
          </div>

          {filteredOrders.length > 0 ? (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-[#EFF7E9] border-[#8CCB55] shadow-xs ring-2 ring-[#8CCB55]/40'
                        : 'bg-[#FBF8EF] border-[#E1E9DC] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#075B2A] text-xs">
                        #{order.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.paymentStatus === 'Verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.paymentStatus === 'Failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-900 animate-pulse'
                        }`}
                      >
                        {order.paymentStatus === 'Verified' ? '✓ Verified' : '⏳ Pending'}
                      </span>
                    </div>

                    <div className="text-xs space-y-0.5">
                      <p className="font-bold text-[#18251B]">{order.customerName}</p>
                      <p className="text-[11px] text-gray-500">
                        Total Amount: <strong className="text-[#075B2A]">₹{order.grandTotal}</strong> • {(order.items || []).length} item(s)
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#E1E9DC]/60 flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 truncate max-w-[170px]">
                        UTR: <strong>{order.paymentUtr || 'Screenshot attached'}</strong>
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-[#18251B]">Queue is All Caught Up!</p>
              <p className="text-[11px] text-gray-500">No manual payment orders match this filter.</p>
            </div>
          )}
        </div>

        {/* ================= RIGHT: INSPECTOR & APPROVAL (7 Cols) ================= */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E1E9DC] p-6 sm:p-8 shadow-sm space-y-6">
          {selectedOrder ? (
            <div className="space-y-6">
              {/* Top Inspection Summary */}
              <div className="flex items-start justify-between pb-4 border-b border-[#E1E9DC]">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">
                    Order Verification
                  </span>
                  <h2 className="text-xl font-bold text-[#075B2A] font-serif-title">
                    #{selectedOrder.orderNumber}
                  </h2>
                  <p className="text-xs text-gray-500">
                    Customer: <strong>{selectedOrder.customerName}</strong> ({selectedOrder.customerPhone})
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Bill Total</p>
                  <p className="text-2xl font-black text-[#075B2A]">₹{selectedOrder.grandTotal}</p>
                </div>
              </div>

              {/* UTR & Payment Method Card */}
              <div className="p-4 bg-[#FBF8EF] rounded-2xl border border-[#E1E9DC] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#075B2A] uppercase">Payment Instrument</span>
                  <span className="font-bold text-[#18251B]">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                  <span className="text-gray-500">Reported Bank UTR Number:</span>
                  <span className="font-black text-[#075B2A] font-mono text-sm bg-white px-2 py-0.5 rounded border border-gray-200">
                    {selectedOrder.paymentUtr || 'N/A (Refer to Screenshot)'}
                  </span>
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-gray-500">Store UPI Coordinates:</span>
                  <span className="font-mono font-bold text-gray-700">{settings.upiId}</span>
                </div>
              </div>

              {/* Payment Screenshot Preview Card */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#18251B] uppercase tracking-wider">
                  Payment Receipt Screenshot
                </h3>

                {selectedOrder.paymentScreenshot ? (
                  <div className="relative rounded-2xl overflow-hidden border border-[#E1E9DC] bg-black/5 max-h-[350px] flex items-center justify-center">
                    <img
                      src={selectedOrder.paymentScreenshot}
                      alt="Payment Receipt"
                      className="max-h-[350px] w-auto object-contain rounded-2xl"
                    />
                    <a
                      href={selectedOrder.paymentScreenshot}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-3 right-3 bg-black/70 hover:bg-black text-white text-[11px] font-bold px-3 py-1.5 rounded-xl backdrop-blur-xs flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Full Image</span>
                    </a>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl border-2 border-dashed border-[#E1E9DC] text-center text-xs text-gray-400 space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                    <p className="font-bold text-gray-700">No Screenshot File Attached</p>
                    <p className="text-[11px]">
                      Customer provided Bank UTR only. Verify directly against your merchant bank feed.
                    </p>
                  </div>
                )}
              </div>

              {/* Items in this Order */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-[#075B2A] uppercase tracking-wider">
                  Items Purchased ({(selectedOrder.items || []).length})
                </h3>
                <div className="divide-y divide-[#E1E9DC] border border-[#E1E9DC] rounded-2xl p-3 text-xs bg-[#FBF8EF]/30 max-h-36 overflow-y-auto">
                  {(selectedOrder.items || []).map((it, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between">
                      <span className="font-bold text-[#18251B]">
                        {it.product?.name || 'Unknown Product'} ({it.selectedPackSize} × {it.quantity})
                      </span>
                      <span className="font-black text-[#075B2A]">
                        ₹{it.unitPrice * it.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct WhatsApp Contact CTA */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-700" />
                  <span className="text-emerald-900 font-bold">
                    WhatsApp Customer ({selectedOrder.customerPhone})
                  </span>
                </div>
                <a
                  href={`https://wa.me/${(selectedOrder.customerPhone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Namaskaram ${selectedOrder.customerName}! Regarding your Graminum Order #${selectedOrder.orderNumber} for ₹${selectedOrder.grandTotal}: We have received your payment receipt.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#25D366] hover:bg-[#20ba59] text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Open WhatsApp</span>
                </a>
              </div>

              {/* ACTION BUTTONS: APPROVE / REJECT */}
              <div className="pt-4 border-t border-[#E1E9DC] flex flex-col sm:flex-row items-center gap-3">
                {selectedOrder.paymentStatus !== 'Verified' ? (
                  <>
                    <button
                      onClick={() => handleApprove(selectedOrder.id)}
                      className="w-full sm:flex-1 bg-[#075B2A] hover:bg-[#06451F] text-white text-xs sm:text-sm font-bold py-3.5 rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#8CCB55]" />
                      <span>Approve Payment & Confirm Order</span>
                    </button>

                    <button
                      onClick={() => setIsRejectModalOpen(true)}
                      className="w-full sm:w-auto bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold py-3.5 px-6 rounded-2xl border border-red-200 transition-colors cursor-pointer"
                    >
                      <span>Reject Receipt</span>
                    </button>
                  </>
                ) : (
                  <div className="w-full bg-emerald-50 border border-emerald-300 p-3 rounded-2xl text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>This payment has been verified by the administrator.</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400 space-y-2">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="font-bold text-gray-600">Select an order from the queue to verify</p>
            </div>
          )}
        </div>
      </div>

      {/* REJECT CONFIRMATION MODAL */}
      {isRejectModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsRejectModalOpen(false)}
          ></div>

          <div className="relative bg-white rounded-3xl p-6 max-w-md w-full z-10 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-red-700 font-serif-title">
              Reject Payment for #{selectedOrder.orderNumber}
            </h3>
            <p className="text-xs text-gray-600">
              Are you sure the payment amount or UTR did not match your bank feed? This will flag the order for customer resolution.
            </p>

            <textarea
              rows={3}
              placeholder="Reason for rejection (e.g. UTR not reflected in bank account / partial amount)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-[#FBF8EF] text-xs p-3 rounded-xl border border-[#E1E9DC]"
            ></textarea>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedOrder.id)}
                className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
