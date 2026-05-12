import React from "react";
import PropTypes from "prop-types";
import {
  Clock,
  Plus,
  Minus,
  Package,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";

// --- EXTRACTED HELPER FUNCTIONS TO REDUCE COGNITIVE COMPLEXITY ---

const getTimingText = (item, isMiniHall) => {
  if (item?.facilityType === "ROOM") return "10:00 AM - 08:00 AM (Next Day)";
  if (isMiniHall) return "06:00 PM - 11:00 PM (₹3000/extra hr)";
  if (item?.pricingType === "PER_ITEM") return "Valid for duration of booking";
  return "08:00 AM - 11:00 PM (Full Day)";
};

const getCardClass = (isDisabled, isSelected) => {
  const baseClass =
    "border rounded-lg p-4 flex flex-col justify-between transition shadow-sm ";
  if (isDisabled)
    return baseClass + "bg-gray-100 opacity-60 cursor-not-allowed grayscale";
  if (isSelected)
    return baseClass + "bg-blue-50 border-blue-300 ring-1 ring-blue-300";
  return baseClass + "bg-white hover:shadow-md hover:border-blue-200";
};

const getLabelClass = (isDisabled, isMiniHall) => {
  const baseClass = "font-semibold block truncate cursor-pointer ";
  if (isDisabled) return baseClass + "text-gray-500 line-through";
  if (isMiniHall) return baseClass + "text-orange-800";
  return baseClass + "text-gray-800";
};

// --- COMPONENT ---

const FacilityExtraCard = ({
  item,
  isSelected,
  isSoldOut,
  isMutuallyExclusiveDisabled,
  exclusivityMessage,
  isMiniHall,
  handleCheckboxChange,
  handleQuantityChange,
  selectedCount,
}) => {
  const isDisabled = isSoldOut || isMutuallyExclusiveDisabled;
  const coverImage =
    Array.isArray(item?.images) && item.images.length > 0
      ? item.images[0]
      : null;

  const timingText = getTimingText(item, isMiniHall);
  const cardClass = getCardClass(isDisabled, isSelected);
  const labelClass = getLabelClass(isDisabled, isMiniHall);

  const showQuantityControls =
    isSelected &&
    (item.pricingType === "PER_ITEM" ||
      item.facilityType === "ROOM" ||
      item.inventoryCount > 1);

  return (
    <div className={cardClass}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id={`facility-${item.id}`}
          checked={isSelected}
          onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
          disabled={isDisabled}
          className="w-5 h-5 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed shrink-0"
        />

        {/* --- THUMBNAIL --- */}
        <div className="w-16 h-16 shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
          {coverImage ? (
            <img
              src={coverImage}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ImageIcon size={20} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <label htmlFor={`facility-${item.id}`} className={labelClass}>
            {item.name}
          </label>

          {isMiniHall && !isSoldOut && (
            <span className="inline-block mt-0.5 text-[10px] uppercase font-bold bg-orange-200 text-orange-800 px-2 py-0.5 rounded">
              Premium Add-on
            </span>
          )}

          <p className="text-sm text-gray-500 mt-1">
            ₹{Number.parseInt(item.baseRate || 0, 10).toLocaleString("en-IN")}{" "}
            {item.pricingType === "HOURLY" ? "/ hr" : ""}
          </p>

          <p
            className={`text-xs mt-1 flex items-center gap-1 ${isSelected ? "text-blue-700 font-semibold" : "text-gray-500"}`}
          >
            <Clock size={12} className="shrink-0" />{" "}
            <span className="truncate">{timingText}</span>
          </p>

          {/* Warning Messages */}
          {isSoldOut && (
            <p className="text-xs font-bold text-red-600 mt-1">
              Booked for these dates
            </p>
          )}

          {isMutuallyExclusiveDisabled && !isSoldOut && (
            <p className="text-xs font-bold text-orange-600 mt-1">
              {exclusivityMessage}
            </p>
          )}
        </div>
      </div>

      {showQuantityControls && (
        <div className="flex flex-col gap-1 self-start ml-8 mt-3">
          <div className="flex items-center gap-2 border rounded-md px-2 py-1 bg-white shadow-sm">
            {/* Minus Button */}
            <button
              type="button"
              onClick={() =>
                handleQuantityChange(item.id, -1, item.inventoryCount || 1)
              }
              disabled={selectedCount <= 1}
              className="text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Minus size={14} />
            </button>

            {/* Number */}
            <span className="font-bold w-6 text-center text-sm">
              {selectedCount}
            </span>

            {/* Plus Button */}
            <button
              type="button"
              onClick={() =>
                handleQuantityChange(item.id, 1, item.inventoryCount || 1)
              }
              disabled={selectedCount >= (item.inventoryCount || 1)}
              className="text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus size={14} />
            </button>
          </div>
          <span className="text-[10px] text-gray-500 font-medium">
            Max: {item.inventoryCount || 1} available
          </span>
        </div>
      )}
    </div>
  );
};

FacilityExtraCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(PropTypes.string),
    facilityType: PropTypes.string,
    pricingType: PropTypes.string,
    baseRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    inventoryCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isAvailableForDates: PropTypes.bool,
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  isSoldOut: PropTypes.bool.isRequired,
  isMutuallyExclusiveDisabled: PropTypes.bool.isRequired,
  exclusivityMessage: PropTypes.string.isRequired,
  isMiniHall: PropTypes.bool.isRequired,
  handleCheckboxChange: PropTypes.func.isRequired,
  handleQuantityChange: PropTypes.func.isRequired,
  selectedCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default function FacilityExtrasList({
  extraItems,
  selectedExtras,
  isCustomMode,
  handleCheckboxChange,
  handleQuantityChange,
}) {
  if (!isCustomMode && (!extraItems || extraItems.length === 0)) {
    return (
      <div className="p-4 bg-blue-50 text-blue-800 rounded-lg flex items-start gap-3 shadow-sm border border-blue-100">
        <Package className="shrink-0 mt-1" />
        <div>
          <h3 className="font-bold">Standard Package</h3>
          <p className="text-sm mt-1">
            This is a fixed package. The items included cannot be customized or
            removed.
          </p>
        </div>
      </div>
    );
  }

  if (!extraItems || extraItems.length === 0) return null;

  // --- MUTUAL EXCLUSIVITY LOGIC ---
  const selectedItemIds = Object.keys(selectedExtras);
  let isMiniHallSelected = false;
  let isOtherItemSelected = false;

  selectedItemIds.forEach((id) => {
    const item = extraItems.find(
      (i) => i.id === id || i.id.toString() === id.toString(),
    );
    if (item) {
      if (item.name.toLowerCase().includes("mini hall")) {
        isMiniHallSelected = true;
      } else {
        isOtherItemSelected = true;
      }
    }
  });

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {isCustomMode ? "Select your facilities" : "Add Extras to your booking"}
      </h2>

      {isCustomMode && (
        <div className="mb-4 text-xs text-blue-700 bg-blue-50 p-3 rounded border border-blue-100 flex items-center gap-2">
          <AlertCircle size={16} />
          The Mini Hall must be booked separately. It cannot be combined with
          other facilities like Lawns or Rooms in a single custom booking.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {extraItems.map((item) => {
          const isMiniHall = item?.name?.toLowerCase().includes("mini hall");
          const isSoldOut = item?.isAvailableForDates === false;
          const isSelected = !!selectedExtras[item.id];
          const selectedCount = selectedExtras[item.id] || 1;

          let isMutuallyExclusiveDisabled = false;
          let exclusivityMessage = "";

          if (isCustomMode && !isSelected) {
            if (isMiniHall && isOtherItemSelected) {
              isMutuallyExclusiveDisabled = true;
              exclusivityMessage = "Book separately from other items";
            } else if (!isMiniHall && isMiniHallSelected) {
              isMutuallyExclusiveDisabled = true;
              exclusivityMessage = "Cannot combine with Mini Hall";
            }
          }

          return (
            <FacilityExtraCard
              key={item.id}
              item={item}
              isSelected={isSelected}
              isSoldOut={isSoldOut}
              isMutuallyExclusiveDisabled={isMutuallyExclusiveDisabled}
              exclusivityMessage={exclusivityMessage}
              isMiniHall={isMiniHall}
              handleCheckboxChange={handleCheckboxChange}
              handleQuantityChange={handleQuantityChange}
              selectedCount={selectedCount}
            />
          );
        })}
      </div>
    </div>
  );
}

FacilityExtrasList.propTypes = {
  extraItems: PropTypes.arrayOf(PropTypes.object),
  selectedExtras: PropTypes.object.isRequired,
  isCustomMode: PropTypes.bool.isRequired,
  handleCheckboxChange: PropTypes.func.isRequired,
  handleQuantityChange: PropTypes.func.isRequired,
};
