import React from "react";
import PropTypes from "prop-types";
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from "lucide-react";

export default function FacilitiesTable({
  facilities,
  onAdd,
  onEdit,
  onDelete,
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-xl font-bold text-gray-800">
          Manage Inventory & Pricing
        </h2>
        <button
          onClick={onAdd}
          className="bg-green-600 hover:bg-green-700 transition text-white px-4 py-2 rounded-md flex items-center gap-2 font-semibold"
        >
          <Plus size={16} /> Add Facility
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-600 text-sm">
              <th className="p-3 font-semibold">Name</th>
              <th className="p-3 font-semibold">Type</th>
              <th className="p-3 font-semibold">Inventory</th>
              <th className="p-3 font-semibold">Price Calc</th>
              <th className="p-3 font-semibold">Base Rate (₹)</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((fac) => (
              <tr key={fac.id} className="border-b hover:bg-gray-50 transition">
                <td className="p-3 font-bold text-gray-800">{fac.name}</td>
                <td className="p-3 text-sm text-gray-600">
                  <span className="bg-gray-200 px-2 py-1 rounded text-xs font-bold">
                    {fac.facilityType}
                  </span>
                </td>
                <td className="p-3 text-sm font-bold text-indigo-600">
                  {fac.inventoryCount || 1} Total
                </td>
                <td className="p-3 text-sm font-semibold text-blue-600">
                  {fac.pricingType}
                </td>
                <td className="p-3 font-bold text-green-700">
                  ₹{fac.baseRate}
                </td>
                <td className="p-3">
                  {fac.isActive ? (
                    <CheckCircle size={18} className="text-green-500" />
                  ) : (
                    <XCircle size={18} className="text-red-500" />
                  )}
                </td>
                <td className="p-3 flex gap-3">
                  <button
                    onClick={() => onEdit(fac)}
                    className="text-blue-600 hover:text-blue-800 bg-blue-50 p-2 rounded transition"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(fac.id)}
                    className="text-red-600 hover:text-red-800 bg-red-50 p-2 rounded transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {facilities.length === 0 && (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500">
                  No facilities found. Click "Add Facility" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

FacilitiesTable.propTypes = {
  facilities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      facilityType: PropTypes.string,
      inventoryCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      pricingType: PropTypes.string,
      baseRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      isActive: PropTypes.bool,
    }),
  ).isRequired,
  onAdd: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
