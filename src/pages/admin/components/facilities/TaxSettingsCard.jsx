import React from "react";
import PropTypes from "prop-types";
import { Percent, Save } from "lucide-react";

export default function TaxSettingsCard({
  taxSettings,
  setTaxSettings,
  onSave,
  isUpdating,
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Percent size={20} className="text-blue-600" /> Global Tax Settings
        (GST)
      </h2>
      <form
        onSubmit={onSave}
        className="flex flex-col md:flex-row gap-4 items-end"
      >
        <div className="flex-1">
          <label
            htmlFor="cgstInput"
            className="block text-sm font-bold text-gray-700 mb-1"
          >
            CGST Percentage (%)
          </label>
          <input
            id="cgstInput"
            type="number"
            step="0.01"
            required
            value={taxSettings.cgstPercentage}
            onChange={(e) =>
              setTaxSettings({
                ...taxSettings,
                cgstPercentage: Number(e.target.value),
              })
            }
            className="w-full border p-2 rounded-md bg-gray-50 focus:bg-white focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="sgstInput"
            className="block text-sm font-bold text-gray-700 mb-1"
          >
            SGST Percentage (%)
          </label>
          <input
            id="sgstInput"
            type="number"
            step="0.01"
            required
            value={taxSettings.sgstPercentage}
            onChange={(e) =>
              setTaxSettings({
                ...taxSettings,
                sgstPercentage: Number(e.target.value),
              })
            }
            className="w-full border p-2 rounded-md bg-gray-50 focus:bg-white focus:ring-blue-500"
          />
        </div>
        <div className="flex-none">
          <button
            type="submit"
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center gap-2 font-semibold transition disabled:opacity-50"
          >
            <Save size={16} /> {isUpdating ? "Saving..." : "Update Taxes"}
          </button>
        </div>
      </form>
    </div>
  );
}

TaxSettingsCard.propTypes = {
  taxSettings: PropTypes.shape({
    cgstPercentage: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    sgstPercentage: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
  }).isRequired,
  setTaxSettings: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  isUpdating: PropTypes.bool.isRequired,
};
