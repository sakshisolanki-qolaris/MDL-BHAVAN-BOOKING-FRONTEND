import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Clock, Plus, X } from "lucide-react";
import api from "../../../../api/axios";
import { toast } from "react-toastify";

export default function FacilityFormModal({
  facility,
  allFacilities,
  onClose,
  onSuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    facilityType: "ROOM",
    capacity: 0,
    inventoryCount: 1,
    baseRate: 0,
    securityDeposit: 0,
    pricingType: "FIXED",
    isActive: true,
  });

  const [pricingDetails, setPricingDetails] = useState({
    slotType: "FIXED",
    durationHours: 1,
    slots: [],
    included_facilities: [],
  });

  useEffect(() => {
    if (facility) {
      setFormData({
        name: facility.name || "",
        description: facility.description || "",
        facilityType: facility.facilityType || "ROOM",
        capacity: facility.capacity || 0,
        inventoryCount: facility.inventoryCount ?? 1,
        baseRate: facility.baseRate || 0,
        securityDeposit: facility.securityDeposit || 0,
        pricingType: facility.pricingType || "FIXED",
        isActive: facility.isActive ?? true,
      });

      if (facility.pricingDetails) {
        setPricingDetails({
          slotType: facility.pricingDetails.slotType || "FIXED",
          durationHours: facility.pricingDetails.durationHours || 1,
          slots: facility.pricingDetails.slots || [],
          included_facilities:
            facility.pricingDetails.included_facilities || [],
        });
      }
      setImagePreviews(Array.isArray(facility.images) ? facility.images : []);
    }
  }, [facility]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImageFiles(files);
      setImagePreviews(files.map((file) => URL.createObjectURL(file)));
    }
  };

  const addSlot = () =>
    setPricingDetails((prev) => ({
      ...prev,
      slots: [
        ...prev.slots,
        {
          id: crypto.randomUUID(),
          label: "",
          startTime: "08:00",
          endTime: "15:00",
          price: formData.baseRate,
        },
      ],
    }));

  const removeSlot = (id) =>
    setPricingDetails((prev) => ({
      ...prev,
      slots: prev.slots.filter((s) => s.id !== id),
    }));

  const updateSlot = (id, field, value) =>
    setPricingDetails((prev) => ({
      ...prev,
      slots: prev.slots.map((s) =>
        s.id === id ? { ...s, [field]: value } : s,
      ),
    }));

  const handleFacilityIncludeToggle = (isChecked, facName) => {
    setPricingDetails((prev) => {
      const current = prev.included_facilities || [];
      if (isChecked)
        return { ...prev, included_facilities: [...current, facName] };
      return {
        ...prev,
        included_facilities: current.filter((n) => n !== facName),
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));

      if (imageFiles.length > 0) {
        imageFiles.forEach((file) => data.append("images", file));
      } else if (imagePreviews.length > 0) {
        data.append("existingImages", JSON.stringify(imagePreviews));
      }

      const payloadPricingDetails = {};
      if (
        formData.facilityType === "PACKAGE" ||
        formData.facilityType === "COMPLEX"
      ) {
        payloadPricingDetails.included_facilities =
          pricingDetails.included_facilities || [];
      }
      if (formData.pricingType === "SLOT") {
        payloadPricingDetails.slotType = pricingDetails.slotType;
        if (pricingDetails.slotType === "FLEXIBLE") {
          payloadPricingDetails.durationHours = Number(
            pricingDetails.durationHours,
          );
        } else {
          payloadPricingDetails.slots = pricingDetails.slots.map((s) => ({
            id: s.id,
            label: s.label,
            startTime: s.startTime,
            endTime: s.endTime,
            price: Number(s.price),
          }));
        }
      }
      if (Object.keys(payloadPricingDetails).length > 0) {
        data.append("pricingDetails", JSON.stringify(payloadPricingDetails));
      }

      if (facility?.id) {
        await api.patch(`/facilities/${facility.id}`, data);
        toast.success("Facility updated successfully!");
      } else {
        await api.post("/facilities", data);
        toast.success("Facility created successfully!");
      }
      onSuccess();
    } catch (err) {
      console.error("Error saving facility:", err);
      toast.error(err.response?.data?.message || "Error saving facility");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h2 className="text-2xl font-bold text-gray-800">
            {facility ? "Edit Facility" : "Add New Facility"}
          </h2>
          <label className="flex items-center gap-2 cursor-pointer bg-gray-100 px-3 py-1.5 rounded-full border">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-4 h-4 text-green-600 focus:ring-green-500 rounded cursor-pointer"
            />
            <span className="text-sm font-bold text-gray-700">
              Active (Visible)
            </span>
          </label>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="facilityName"
              className="block text-sm font-bold text-gray-700 mb-1"
            >
              Facility Name
            </label>
            <input
              id="facilityName"
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border p-2.5 rounded-md focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="facilityType"
                className="block text-sm font-bold text-gray-700 mb-1"
              >
                Facility Type
              </label>
              <select
                id="facilityType"
                value={formData.facilityType}
                onChange={(e) =>
                  setFormData({ ...formData, facilityType: e.target.value })
                }
                className="w-full border p-2.5 rounded-md bg-white"
              >
                <option value="ROOM">Room</option>
                <option value="HALL">Hall</option>
                <option value="LAWN">Lawn</option>
                <option value="PACKAGE">Package</option>
                <option value="COMPLEX">Complex (Full Bhavan)</option>
                <option value="ITEM">Item (Extra Bed, etc.)</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="maxCapacity"
                className="block text-sm font-bold text-gray-700 mb-1"
              >
                Max Capacity
              </label>
              <input
                id="maxCapacity"
                type="number"
                required
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacity:
                      e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                className="w-full border p-2.5 rounded-md focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="inventoryCount"
                className="block text-sm font-bold text-gray-700 mb-1"
              >
                Inventory Count
              </label>
              <input
                id="inventoryCount"
                type="number"
                min="1"
                required
                value={formData.inventoryCount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    inventoryCount:
                      e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                className="w-full border p-2.5 rounded-md focus:ring-indigo-500 bg-indigo-50 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
            <div>
              <label
                htmlFor="baseRate"
                className="block text-sm font-bold text-green-700 mb-1"
              >
                Standard Base Rate (₹)
              </label>
              <input
                id="baseRate"
                type="number"
                required
                value={formData.baseRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    baseRate:
                      e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                className="w-full border p-2.5 rounded-md font-bold focus:ring-green-500"
              />
            </div>
            <div>
              <label
                htmlFor="securityDeposit"
                className="block text-sm font-bold text-orange-700 mb-1"
              >
                Security Deposit (₹)
              </label>
              <input
                id="securityDeposit"
                type="number"
                required
                value={formData.securityDeposit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    securityDeposit:
                      e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                className="w-full border p-2.5 rounded-md font-bold focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="pricingType"
              className="block text-sm font-bold text-gray-700 mb-1"
            >
              Pricing Logic
            </label>
            <select
              id="pricingType"
              value={formData.pricingType}
              onChange={(e) =>
                setFormData({ ...formData, pricingType: e.target.value })
              }
              className="w-full border p-2.5 rounded-md bg-white"
            >
              <option value="FIXED">Fixed (Per Day)</option>
              <option value="HOURLY">Hourly</option>
              <option value="TIERED">Tiered</option>
              <option value="SLOT">Time Slots (Shifts)</option>
              <option value="PER_ITEM">
                Per Item (Multiplied by Quantity)
              </option>
            </select>
          </div>

          {(formData.facilityType === "PACKAGE" ||
            formData.facilityType === "COMPLEX") && (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="block text-sm font-bold text-orange-800 mb-2">
                Included Facilities in this Package
              </div>
              <p className="text-xs text-orange-700 mb-3">
                Select the individual facilities below. If someone books this
                package, the selected rooms/halls will be automatically blocked
                from being booked separately!
              </p>

              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {allFacilities
                  .filter(
                    (f) =>
                      f.id !== facility?.id &&
                      f.facilityType !== "PACKAGE" &&
                      f.facilityType !== "COMPLEX" &&
                      !f.name.toLowerCase().includes("mini hall"),
                  )
                  .map((fac) => {
                    const isChecked =
                      pricingDetails.included_facilities?.includes(fac.name);
                    return (
                      <label
                        key={fac.id}
                        className={`flex items-center gap-2 text-sm p-2 rounded border cursor-pointer transition ${isChecked ? "bg-orange-100 border-orange-400 font-bold text-orange-900 shadow-sm" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            handleFacilityIncludeToggle(
                              e.target.checked,
                              fac.name,
                            )
                          }
                          className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                        />
                        <span className="truncate">{fac.name}</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          )}

          {formData.pricingType === "SLOT" && (
            <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-blue-800 flex items-center gap-2">
                  <Clock size={18} /> Slot Configuration
                </h3>
                <select
                  value={pricingDetails.slotType}
                  onChange={(e) =>
                    setPricingDetails({
                      ...pricingDetails,
                      slotType: e.target.value,
                    })
                  }
                  className="text-sm border p-1 rounded"
                >
                  <option value="FIXED">
                    Fixed Shifts (e.g., Morning/Evening)
                  </option>
                  <option value="FLEXIBLE">Flexible Duration</option>
                </select>
              </div>

              {pricingDetails.slotType === "FLEXIBLE" ? (
                <div>
                  <label
                    htmlFor="reqDuration"
                    className="block text-sm font-bold text-gray-700 mb-1"
                  >
                    Required Duration (Hours)
                  </label>
                  <input
                    id="reqDuration"
                    type="number"
                    min="1"
                    value={pricingDetails.durationHours}
                    onChange={(e) =>
                      setPricingDetails({
                        ...pricingDetails,
                        durationHours: e.target.value,
                      })
                    }
                    className="w-full border p-2 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Users must book exactly this many continuous hours.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pricingDetails.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex gap-2 items-center bg-white p-2 rounded shadow-sm border"
                    >
                      <input
                        type="text"
                        placeholder="Label (e.g. Morning Shift)"
                        value={slot.label}
                        onChange={(e) =>
                          updateSlot(slot.id, "label", e.target.value)
                        }
                        className="w-1/3 border p-1 text-sm rounded"
                      />
                      <input
                        type="time"
                        required
                        value={slot.startTime}
                        onChange={(e) =>
                          updateSlot(slot.id, "startTime", e.target.value)
                        }
                        className="border p-1 text-sm rounded"
                      />
                      <span className="text-gray-400">to</span>
                      <input
                        type="time"
                        required
                        value={slot.endTime}
                        onChange={(e) =>
                          updateSlot(slot.id, "endTime", e.target.value)
                        }
                        className="border p-1 text-sm rounded"
                      />
                      <input
                        type="number"
                        placeholder="Price (₹)"
                        value={slot.price}
                        onChange={(e) =>
                          updateSlot(slot.id, "price", e.target.value)
                        }
                        className="w-1/4 border p-1 text-sm rounded font-bold text-green-700"
                      />
                      <button
                        type="button"
                        onClick={() => removeSlot(slot.id)}
                        className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSlot}
                    className="text-sm text-blue-700 font-bold flex items-center gap-1 hover:underline"
                  >
                    <Plus size={14} /> Add New Shift/Slot
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg p-5 text-center">
            <label
              htmlFor="facilityImage"
              className="block text-sm font-bold text-gray-700 mb-3"
            >
              Facility Images
            </label>
            {imagePreviews?.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-3 justify-center">
                {imagePreviews.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt="Preview"
                    className="h-24 w-24 object-cover rounded-md shadow-sm border border-gray-200"
                  />
                ))}
              </div>
            )}
            <input
              id="facilityImage"
              type="file"
              multiple
              accept="image/jpeg, image/png, image/webp"
              onChange={handleImageChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
            />
          </div>

          <div>
            <label
              htmlFor="facDescription"
              className="block text-sm font-bold text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="facDescription"
              rows="3"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full border p-3 rounded-md focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-200 text-gray-800 font-bold rounded-md hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition shadow-md"
            >
              {isSubmitting ? "Saving..." : "Save Facility"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

FacilityFormModal.propTypes = {
  facility: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    description: PropTypes.string,
    facilityType: PropTypes.string,
    capacity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    inventoryCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    baseRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    securityDeposit: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    pricingType: PropTypes.string,
    isActive: PropTypes.bool,
    images: PropTypes.arrayOf(PropTypes.string),
    pricingDetails: PropTypes.shape({
      slotType: PropTypes.string,
      durationHours: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      slots: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          label: PropTypes.string,
          startTime: PropTypes.string,
          endTime: PropTypes.string,
          price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        }),
      ),
      included_facilities: PropTypes.arrayOf(PropTypes.string),
    }),
  }),
  allFacilities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      facilityType: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
