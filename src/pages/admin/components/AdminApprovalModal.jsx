import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import { toast } from "react-toastify";

export default function AdminApprovalModal({
  booking,
  onClose,
  onApprove,
  isSubmitting,
}) {
  const [totalAmount, setTotalAmount] = useState("");
  const [overrideSecurityDeposit, setOverrideSecurityDeposit] = useState("");
  const [isHoldingAllowed, setIsHoldingAllowed] = useState(false);
  const [holdingPercentage, setHoldingPercentage] = useState(20);
  const [holdingValidityDays, setHoldingValidityDays] = useState(7);

  useEffect(() => {
    if (booking) {
      const financials = booking.financials || {};
      setTotalAmount((Number(financials.calculatedAmount) || 0).toString());
      setOverrideSecurityDeposit(
        (Number(financials.securityDeposit) || 0).toString(),
      );
      setIsHoldingAllowed(financials.isHoldingAllowed || false);
      setHoldingPercentage(financials.holdingPercentage || 20);
      setHoldingValidityDays(financials.holdingValidityDays || 7);
    }
  }, [booking]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (Number(totalAmount) < 0) {
      toast.warn("Total amount cannot be negative.");
      return;
    }

    if (Number(overrideSecurityDeposit) < 0) {
      toast.warn("Security deposit cannot be negative.");
      return;
    }

    if (isHoldingAllowed) {
      if (Number(holdingPercentage) <= 0 || Number(holdingPercentage) > 100) {
        toast.warn("Holding percentage must be between 1 and 100.");
        return;
      }
      if (Number(holdingValidityDays) <= 0) {
        toast.warn("Holding validity days must be greater than 0.");
        return;
      }
    }

    const payload = {
      revisedTotalAmount: Number(totalAmount),
      overrideSecurityDeposit: Number(overrideSecurityDeposit),
      isHoldingAllowed,
      ...(isHoldingAllowed && {
        holdingPercentage: Number(holdingPercentage),
        holdingValidityDays: Number(holdingValidityDays),
      }),
    };

    onApprove(booking.id, payload);
  };

  if (!booking) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Approval</h2>
        <p className="text-sm text-gray-500 mb-6 border-b pb-4">
          Adjust pricing and define payment holding rules.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="baseAmount"
              className="block text-sm font-bold text-gray-700 mb-1"
            >
              Revised Base Amount (₹)
            </label>
            <input
              id="baseAmount"
              type="number"
              required
              min="0"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="w-full px-4 py-2 border rounded-md text-lg font-semibold focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label
              htmlFor="securityDeposit"
              className="block text-sm font-bold text-gray-700 mb-1"
            >
              Security Deposit (₹)
            </label>
            <input
              id="securityDeposit"
              type="number"
              required
              min="0"
              value={overrideSecurityDeposit}
              onChange={(e) => setOverrideSecurityDeposit(e.target.value)}
              className="w-full px-4 py-2 border rounded-md text-lg font-semibold focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-2 mt-4 border-t pt-4">
            <input
              id="isHolding"
              type="checkbox"
              checked={isHoldingAllowed}
              onChange={(e) => setIsHoldingAllowed(e.target.checked)}
              className="w-5 h-5 text-red-600 rounded focus:ring-red-500 cursor-pointer"
            />
            <label
              htmlFor="isHolding"
              className="font-bold text-gray-800 cursor-pointer"
            >
              Allow user to pay a partial amount to HOLD dates?
            </label>
          </div>

          {isHoldingAllowed && (
            <div className="grid grid-cols-2 gap-4 mt-3 bg-red-50 p-3 rounded-lg border border-red-100">
              <div>
                <label
                  htmlFor="holdPercentage"
                  className="block text-xs font-bold text-gray-700 mb-1"
                >
                  Hold Percentage (%)
                </label>
                <input
                  id="holdPercentage"
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={holdingPercentage}
                  onChange={(e) => setHoldingPercentage(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-md"
                />
              </div>
              <div>
                <label
                  htmlFor="validity"
                  className="block text-xs font-bold text-gray-700 mb-1"
                >
                  Validity (Days)
                </label>
                <input
                  id="validity"
                  type="number"
                  required
                  min="1"
                  value={holdingValidityDays}
                  onChange={(e) => setHoldingValidityDays(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-md"
                />
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition disabled:opacity-50"
            >
              {isSubmitting ? "Approving..." : "Confirm Approval"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

AdminApprovalModal.propTypes = {
  booking: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    financials: PropTypes.shape({
      calculatedAmount: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      securityDeposit: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      isHoldingAllowed: PropTypes.bool,
      holdingPercentage: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      holdingValidityDays: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
    }),
  }),
  onClose: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
};
