import React, { useState } from "react";
import PropTypes from "prop-types";
import { X, CheckCircle, Plus, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../../api/axios";

// IMPORTANT: Ensure this path matches where you saved the utility file!
import { generateAndUploadFrontendPDF } from "../../../utils/generateUploadPdf";

export default function AdminInvoiceModal({
  modalData,
  onClose,
  onAction,
  isSubmitting,
}) {
  const [invoiceRemarks, setInvoiceRemarks] = useState("");

  if (!modalData) return null;
  const { booking, invoice } = modalData;

  const handleActionClick = async (status) => {
    if (status === "REJECTED" && !invoiceRemarks.trim()) {
      toast.warn(
        "Remarks are required when rejecting an invoice back to the clerk.",
      );
      return;
    }

    try {
      await onAction(invoice.id, {
        approvalStatus: status,
        adminRemarks: invoiceRemarks,
      });

      if (status === "APPROVED") {
        try {
          console.log("🔄 Fetching final approved invoice data...");

          const freshResponse = await api.get(`/billing/${booking.id}/invoice`);

          const officiallyApprovedInvoice =
            freshResponse?.data?.data?.invoice ||
            freshResponse?.data?.invoice ||
            freshResponse?.invoice;

          if (!officiallyApprovedInvoice) {
            console.error("Unexpected API Response:", freshResponse);
            throw new Error("Could not find the invoice object in the response.");
          }

          generateAndUploadFrontendPDF(officiallyApprovedInvoice, booking)
            .then(() => console.log("✅ Invoice PDF saved to MinIO!"))
            .catch((err) => console.error("❌ MinIO upload failed", err));
        } catch (error_) {
          console.error(
            "Failed to fetch fresh invoice for PDF generation:",
            error_,
          );
        }
      }
    } catch (error) {
      console.error("Action failed:", error);
    }
  };

  // Calculations
  const base = Number(invoice.baseAmount) || 0;
  const extras = Number(invoice.totalAdditionalAmount) || 0;
  const discount = Number(invoice.discountAmount) || 0;
  const totalDeductions = Number(invoice.totalDeductions) || 0;
  const taxable = Math.max(0, base + extras + totalDeductions - discount);

  const cgst = Number(invoice.cgstAmount || 0);
  const sgst = Number(invoice.sgstAmount || 0);
  const taxes = cgst + sgst;
  const totalGstRate =
    taxable > 0 ? Number((((cgst + sgst) / taxable) * 100).toFixed(1)) : 0;

  const grandTotalCost = Number(invoice.totalAmount) || 0;
  const paid = base + Number(invoice.securityDepositHeld || 0);
  const refundDue = Number(invoice.finalRefundAmount) || 0;
  const balanceDue = Number(invoice.additionalBalanceDue) || 0;

  const isWalkin = booking?.bookingSource === "WALK_IN";
  const modeLabel = `${invoice.settlementMode || "ONLINE"}${isWalkin ? " (Walk-in)" : ""}`;

  const renderSettlementStatus = () => {
    if (refundDue > 0) {
      return (
        <div className="bg-green-900/40 text-green-400 p-4 rounded-xl border border-green-700/50 shadow-inner flex flex-col items-center">
          <span className="block text-xs uppercase tracking-wider mb-1 font-bold text-green-500">
            To be refunded
          </span>
          <span className="text-3xl font-extrabold">
            ₹{refundDue.toLocaleString("en-IN")}
          </span>
          <span className="mt-2 text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-green-800/50 text-green-200 border border-green-600/50">
            Mode: {modeLabel}
          </span>
        </div>
      );
    }

    if (balanceDue > 0) {
      return (
        <div className="bg-red-900/40 text-red-400 p-4 rounded-xl border border-red-700/50 shadow-inner flex flex-col items-center">
          <span className="block text-xs uppercase tracking-wider mb-1 font-bold text-red-500">
            Balance Due (User Pays)
          </span>
          <span className="text-3xl font-extrabold">
            ₹{balanceDue.toLocaleString("en-IN")}
          </span>
          <span className="mt-2 text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-red-800/50 text-red-200 border border-red-600/50">
            Mode: {modeLabel}
          </span>
        </div>
      );
    }

    return (
      <div className="bg-gray-800 text-gray-300 p-4 rounded-xl border border-gray-600 shadow-inner flex flex-col items-center">
        <span className="block text-xs uppercase tracking-wider mb-1 font-bold">
          Settlement
        </span>
        <span className="text-2xl font-bold">Fully Settled (₹0)</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Review Draft Invoice
        </h2>
        <p className="text-sm text-gray-500 mb-6 border-b pb-4">
          Verify clerk's check-out deductions and final bill before approving.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border space-y-3 text-sm">
              <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                <CheckCircle size={16} className="text-blue-600" /> Clerk's Data
                Entry
              </h3>

              <div className="flex justify-between">
                <span className="text-gray-600">Electricity Consumed:</span>
                <span className="font-semibold">
                  {invoice.electricityUnitsConsumed || 0} units (₹
                  {invoice.electricityCharges || 0})
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Cleaning Charges:</span>
                <span className="font-semibold">
                  ₹{invoice.cleaningCharges || 0}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Generator Charges:</span>
                <span className="font-semibold">
                  ₹{invoice.generatorCharges || 0}
                </span>
              </div>

              {invoice.additionalItems?.length > 0 && (
                <div className="pt-2 mt-2 border-t">
                  <span className="font-bold text-blue-700 flex items-center gap-1">
                    <Plus size={14} /> Extra Items Added:
                  </span>
                  <ul className="mt-1 space-y-1">
                    {invoice.additionalItems.map((item) => (
                      <li
                        key={item.name}
                        className="flex justify-between text-blue-600 bg-blue-50 px-2 py-1 rounded"
                      >
                        <span>{item.name}</span>
                        <span>₹{item.amount}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {invoice.damagesAndPenalties?.length > 0 && (
                <div className="pt-2 mt-2 border-t">
                  <span className="font-bold text-red-700 flex items-center gap-1">
                    <AlertTriangle size={14} /> Damages/Penalties:
                  </span>
                  <ul className="mt-1 space-y-1">
                    {invoice.damagesAndPenalties.map((p) => (
                      <li
                        key={p.reason}
                        className="flex justify-between text-red-600 bg-red-50 px-2 py-1 rounded"
                      >
                        <span>{p.reason}</span>
                        <span>₹{p.amount}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {invoice.discountAmount > 0 && (
                <div className="pt-2 mt-2 border-t flex justify-between font-bold text-green-700">
                  <span>Discount Applied:</span>
                  <span>- ₹{invoice.discountAmount}</span>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="adminRemarks"
                className="block text-sm font-bold text-gray-700 mb-1"
              >
                Admin Remarks / Notes
              </label>
              <textarea
                id="adminRemarks"
                rows="3"
                value={invoiceRemarks}
                onChange={(e) => setInvoiceRemarks(e.target.value)}
                placeholder="Required if rejecting back to clerk. Otherwise optional."
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              ></textarea>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => handleActionClick("REJECTED")}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-red-100 text-red-700 font-bold rounded-md hover:bg-red-200 transition disabled:opacity-50 shadow-sm"
              >
                Reject to Clerk
              </button>
              <button
                onClick={() => handleActionClick("APPROVED")}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition disabled:opacity-50 shadow-md"
              >
                {isSubmitting ? "Processing..." : "Approve Check-Out"}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="bg-gray-900 text-white p-6 rounded-xl shadow-inner flex flex-col justify-between h-full">
            <div>
              <h3 className="font-bold text-xl border-b border-gray-700 pb-3 mb-5 text-blue-300">
                Final Bill Preview
              </h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Base Booking:</span>
                  <span>₹{base.toLocaleString("en-IN")}</span>
                </div>
                {extras > 0 && (
                  <div className="flex justify-between text-blue-200">
                    <span>Extra Items Added:</span>
                    <span>+ ₹{extras.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {totalDeductions > 0 && (
                  <div className="flex justify-between text-orange-300">
                    <span>Utilities & Penalties:</span>
                    <span>+ ₹{totalDeductions.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-green-400 font-bold">
                    <span>Discount Applied:</span>
                    <span>- ₹{discount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex justify-between font-semibold text-white pt-2 border-t border-gray-700 mt-2">
                  <span>Total Taxable Amount:</span>
                  <span>₹{taxable.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes ({totalGstRate}% GST):</span>
                  <span>+ ₹{taxes.toLocaleString("en-IN")}</span>
                </div>

                <div className="border-t border-gray-700 my-4"></div>

                <div className="flex justify-between font-bold text-lg text-white">
                  <span>Grand Total Event Cost:</span>
                  <span>₹{grandTotalCost.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold text-green-400 mt-2">
                  <span>Total Paid Upfront:</span>
                  <span>₹{paid.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t-2 border-gray-700 text-center">
              {renderSettlementStatus()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

AdminInvoiceModal.propTypes = {
  modalData: PropTypes.shape({
    booking: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      bookingSource: PropTypes.string,
    }),
    invoice: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      baseAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      totalAdditionalAmount: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      discountAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      totalDeductions: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      cgstAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      sgstAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      totalAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      securityDepositHeld: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      finalRefundAmount: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      additionalBalanceDue: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      settlementMode: PropTypes.string,
      electricityUnitsConsumed: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      electricityCharges: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      cleaningCharges: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      generatorCharges: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      additionalItems: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired,
          amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
        }),
      ),
      damagesAndPenalties: PropTypes.arrayOf(
        PropTypes.shape({
          reason: PropTypes.string.isRequired,
          amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
        }),
      ),
    }).isRequired,
  }),
  onClose: PropTypes.func.isRequired,
  onAction: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
};