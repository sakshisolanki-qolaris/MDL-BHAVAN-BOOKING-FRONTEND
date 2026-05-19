import { useState, useEffect } from "react";
import {
  Shield,
  LogOut,
  Eye,
  FileText,
  Settings,
  CreditCard,
  Ban,
} from "lucide-react";
import api from "../../api/axios";
import { toast } from "react-toastify";
import useAuthStore from "../../store/useAuthStore";
import { useNavigate } from "react-router-dom";

import CreateClerk from "./CreateClerk";
import InvoicePrintView from "../../components/InvoicePrintView";
import AdminProfileModal from "./AdminProfileModal";
import ReportsView from "./ReportsView";
import AdminFacilitiesView from "./AdminFacilitiesView";
import socket from "../../api/socket";
import BookingDetailsModal from "../../components/booking/BookingDetailsModal";

// --- IMPORTED COMPONENTS ---
import AdminApprovalModal from "./components/AdminApprovalModal";
import AdminInvoiceModal from "./components/AdminInvoiceModal";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("PENDING_ADMIN_APPROVAL");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal States
  const [approvingBooking, setApprovingBooking] = useState(null);
  const [invoiceModal, setInvoiceModal] = useState(null);
  const [viewingDetails, setViewingDetails] = useState(null);
  const [printModal, setPrintModal] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
    const autoRefresh = () => fetchBookings();

    socket.on("new_booking_request", autoRefresh);
    socket.on("new_walkin_booking", autoRefresh);
    socket.on("booking_status_updated", autoRefresh);
    socket.on("new_invoice_draft", autoRefresh);

    return () => {
      socket.off("new_booking_request", autoRefresh);
      socket.off("new_walkin_booking", autoRefresh);
      socket.off("booking_status_updated", autoRefresh);
      socket.off("new_invoice_draft", autoRefresh);
    };
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get("/auth/admin/bookings");
      setBookings(response.data.data);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      toast.error("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async (booking) => {
    const amount = booking.financials?.refundAmount || 0;

    // If amount is 0, we are just approving the cancellation without a refund
    if (amount <= 0) {
      if (
        !globalThis.confirm(
          `Approve cancellation? (No refund will be issued as amount is ₹0)`,
        )
      )
        return;
    } else {
      const isOnline = booking.financials?.razorpayPaymentIds?.length > 0;
      const mode = isOnline ? "Online" : "Manual";
      if (!globalThis.confirm(`Process a refund of ₹${amount} via ${mode}?`))
        return;
    }

    try {
      await api.patch(`/bookings/${booking.id}/process-refund`);
      toast.success(
        amount > 0
          ? "Refund processed and cancellation approved!"
          : "Cancellation approved successfully!",
      );
      fetchBookings();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          "Failed to process cancellation/refund",
      );
    }
  };

  const handleConfirmApproval = async (bookingId, payload) => {
    setIsSubmitting(true);
    try {
      await api.patch(`/auth/admin/bookings/${bookingId}/approve`, payload);
      toast.success("Booking approved! User notified to pay.");
      setApprovingBooking(null);
      fetchBookings();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to approve booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    if (!globalThis.confirm("Reject this booking? This cannot be undone."))
      return;
    try {
      await api.patch(`/bookings/${bookingId}/reject`);
      toast.success("Booking rejected successfully.");
      fetchBookings();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to reject booking");
    }
  };

  const handleOpenInvoiceModal = async (booking) => {
    try {
      const response = await api.get(`/billing/${booking.id}/invoice`);
      const invoice = response.data.data.invoice;
      if (invoice.approvalStatus !== "PENDING_ADMIN_APPROVAL")
        return toast.info(
          `This invoice is currently: ${invoice.approvalStatus}`,
        );
      setInvoiceModal({ booking, invoice });
    } catch (error) {
      console.error(error);
      toast.info("No pending draft invoice found.");
    }
  };

  const handleInvoiceAction = async (invoiceId, payload) => {
    setIsSubmitting(true);
    try {
      const response = await api.patch(
        `/billing/invoice/${invoiceId}/approve`,
        payload,
      );
      toast.success(response.data.message || `Invoice processed successfully.`);
      setInvoiceModal(null);
      fetchBookings();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to process invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/user/logout");
    } catch (err) {
      console.error(err);
    }
    logout();
    navigate("/admin/login");
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "CHECKED_IN")
      return b.status === "CHECKED_IN" || b.status === "CHECKED_OUT";
    if (activeTab === "PENDING_REFUNDS")
      return (
        b.status === "PENDING_CANCELLATION" ||
        (b.status === "CANCELLED" &&
          b.financials?.refundAmount > 0 &&
          b.financials?.paymentStatus !== "REFUNDED")
      );
    return b.status === activeTab;
  });

  const renderMainContent = () => {
    if (activeTab === "STAFF") return <CreateClerk />;
    if (activeTab === "REPORTS") return <ReportsView />;
    if (activeTab === "FACILITIES") return <AdminFacilitiesView />;

    return (
      <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider border-b">
                <th className="p-4 font-medium">Ref ID</th>
                <th className="p-4 font-medium">Dates</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    No bookings found in this category.
                  </td>
                </tr>
              )}
              {filteredBookings.map((booking) => {
                const schedule = booking.schedule || {};
                // Calculate refund amount
                const refundAmt = booking.financials?.refundAmount || 0;

                return (
                  <tr key={booking.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 text-gray-900 font-mono text-xs font-bold">
                      {booking.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="text-green-700 font-medium block">
                        In: {formatDate(schedule.startTime)}
                      </span>
                      <span className="text-red-700 font-medium block mt-1">
                        Out: {formatDate(schedule.endTime)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800">
                        {booking.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 flex flex-wrap gap-2 items-center">
                      {/* Booking Approval Actions */}
                      {booking.status === "PENDING_ADMIN_APPROVAL" && (
                        <>
                          <button
                            onClick={() => setApprovingBooking(booking)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectBooking(booking.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs transition"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* Check-Out / Invoice Action */}
                      {booking.status === "CHECKED_IN" && (
                        <button
                          onClick={() => handleOpenInvoiceModal(booking)}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded text-xs transition flex items-center gap-1"
                        >
                          <FileText size={14} /> Review Check-Out
                        </button>
                      )}

                      {/* Refund / Cancellation Actions */}
                      {(booking.status === "PENDING_CANCELLATION" ||
                        (booking.status === "CANCELLED" &&
                          refundAmt > 0 &&
                          booking.financials?.paymentStatus !== "REFUNDED")) &&
                        (refundAmt > 0 ? (
                          <button
                            onClick={() => handleProcessRefund(booking)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs transition flex items-center gap-1"
                          >
                            <CreditCard size={14} /> Process Refund (₹
                            {refundAmt})
                          </button>
                        ) : (
                          // For cases where status is PENDING_CANCELLATION but amount is 0
                          booking.status === "PENDING_CANCELLATION" && (
                            <button
                              onClick={() => handleProcessRefund(booking)}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-xs transition flex items-center gap-1"
                            >
                              <Ban size={14} /> Approve Cancellation (₹0 Refund)
                            </button>
                          )
                        ))}
{/* View Bill Action for Checked-Out Bookings */}
                      {booking.status === "CHECKED_OUT" && (
                        <button
                          onClick={async () => {
                            try {
                              const response = await api.get(`/billing/${booking.id}/invoice`);
                              setPrintModal({ invoice: response.data.data.invoice, booking });
                            } catch(err) { 
                              console.error(err);
                              toast.error("Invoice not found."); 
                            }
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs transition flex items-center gap-1 whitespace-nowrap h-fit"
                        >
                          <FileText size={14} /> View Bill
                        </button>
                      )}

                      {/* View Details Action */}
                      <button
                        onClick={() => setViewingDetails(booking)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded text-xs transition flex items-center gap-1 whitespace-nowrap h-fit"
                      >
                        <Eye size={14} /> Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading)
    return (
      <div className="p-20 text-center text-xl text-gray-500">
        Loading Admin workspace...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-red-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-2 font-bold text-xl tracking-wider">
            <Shield size={24} className="text-red-300" /> BhavanBook{" "}
            <span className="text-red-300">| Admin</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm hidden sm:inline">
              Admin: {user?.fullName}
            </span>
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-1 hover:text-red-200 transition"
            >
              <Settings size={18} /> Profile
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 hover:text-red-200 transition"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Manage bookings, facilities, and staff.
            </p>
          </div>

          <div className="flex bg-white rounded-lg shadow-sm p-1.5 border overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab("PENDING_ADMIN_APPROVAL")}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition ${activeTab === "PENDING_ADMIN_APPROVAL" ? "bg-red-100 text-red-800" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Pending Approval
            </button>
            <button
              onClick={() => setActiveTab("CHECKED_IN")}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition ${activeTab === "CHECKED_IN" ? "bg-blue-100 text-blue-800" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Checked In/Out
            </button>
            <button
              onClick={() => setActiveTab("PENDING_REFUNDS")}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition ${activeTab === "PENDING_REFUNDS" ? "bg-orange-100 text-orange-800" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Refunds
            </button>
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition ${activeTab === "ALL" ? "bg-gray-200 text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}
            >
              All Bookings
            </button>

            <div className="w-px bg-gray-300 mx-1 hidden sm:block"></div>

            <button
              onClick={() => setActiveTab("FACILITIES")}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition ${activeTab === "FACILITIES" ? "bg-indigo-100 text-indigo-800" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Facilities
            </button>
            <button
              onClick={() => setActiveTab("REPORTS")}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition ${activeTab === "REPORTS" ? "bg-green-100 text-green-800" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Reports
            </button>
            <button
              onClick={() => setActiveTab("STAFF")}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition ${activeTab === "STAFF" ? "bg-purple-100 text-purple-800" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Staff Control
            </button>
          </div>
        </div>

        {renderMainContent()}
      </div>

      <AdminProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {viewingDetails && (
        <BookingDetailsModal
          booking={viewingDetails}
          onClose={() => setViewingDetails(null)}
        />
      )}

      {/* EXTRACTED MODALS IN ACTION */}
      <AdminApprovalModal
        key={approvingBooking?.id || "none"}
        booking={approvingBooking}
        onClose={() => setApprovingBooking(null)}
        onApprove={handleConfirmApproval}
        isSubmitting={isSubmitting}
      />

      <AdminInvoiceModal
        modalData={invoiceModal}
        onClose={() => setInvoiceModal(null)}
        onAction={handleInvoiceAction}
        isSubmitting={isSubmitting}
      />

      {printModal && (
        <InvoicePrintView
          invoice={printModal.invoice}
          booking={printModal.booking}
          onClose={() => setPrintModal(null)}
        />
      )}
    </div>
  );
}
