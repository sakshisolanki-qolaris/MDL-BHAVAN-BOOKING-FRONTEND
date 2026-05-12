import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { toast } from "react-toastify";
import useAuthStore from "../store/useAuthStore";
import {
  MapPin,
  UserCircle,
  Check,
  ChevronDown,
  Calendar,
  Layers,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const getPlaceholderImage = (type, index) => {
  const images = {
    COMPLEX: [
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800",
    ],
    ROOM: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=800",
    ],
    HALL: [
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=800",
    ],
    LAWN: [
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=800",
    ],
    PACKAGE: ["/images/hall.jpg"],
    ITEM: [
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=800",
    ],
  };
  const typeImages = images[type] || images["ROOM"];
  return typeImages[index % typeImages.length];
};

const FacilityCard = ({ facility, index, navigate, isAuthenticated }) => {
  const [imgIdx, setImgIdx] = useState(0);
  const isAvailable = facility.isAvailableForDates !== false;

  const images =
    Array.isArray(facility.images) && facility.images.length > 0
      ? facility.images
      : [getPlaceholderImage(facility.facilityType, index)];

  const nextImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIdx((prev) => (prev + 1) % images.length);
  };

  const prevImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleCardClick = () => {
    if (!isAvailable) {
      toast.error("This package is sold out for the selected dates.");
      return;
    }
    if (!isAuthenticated) {
      toast.info("Please log in or create an account to book this facility.");
      navigate("/user/login");
      return;
    }
    navigate(`/book/${facility.id}`);
  };

  const getPriceSuffix = (pricingType) => {
    if (pricingType === "HOURLY") return "per hour";
    if (pricingType === "TIERED") return "per day";
    return "per slot";
  };

  return (
    <button
      type="button"
      onClick={handleCardClick}
      className={`w-full text-left flex flex-col md:flex-row bg-white rounded-xl border shadow-sm transition overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        isAvailable
          ? "hover:shadow-md cursor-pointer"
          : "opacity-60 cursor-not-allowed grayscale-[0.5]"
      }`}
    >
      <div className="md:w-1/3 relative h-48 md:h-auto group shrink-0">
        <img
          src={images[imgIdx] || images[0]}
          alt={facility.name}
          className="object-cover w-full h-full transition-opacity duration-300"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getPlaceholderImage(facility.facilityType, index);
          }}
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImg}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={nextImg}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight size={16} />
            </button>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((img, i) => (
                <div
                  // FIX: Use image URL as key to prevent array index warnings
                  key={typeof img === "string" ? img : `img-dot-${i}`}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i === imgIdx ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded pointer-events-none">
          {facility.facilityType}
        </div>

        {!isAvailable && (
          <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center pointer-events-none">
            <div className="bg-red-600 text-white font-extrabold px-4 py-2 rounded shadow-lg transform -rotate-12 border-2 border-red-800 tracking-wider">
              BOOKED
            </div>
          </div>
        )}
      </div>

      <div className="md:w-2/3 p-4 flex flex-col justify-between flex-1">
        <div>
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-gray-900">{facility.name}</h2>
          </div>
          <p className="text-gray-500 text-sm mt-2 line-clamp-2">
            {facility.description}
          </p>

          {facility.pricingDetails?.included_facilities && (
            <div className="flex flex-wrap gap-2 mt-4">
              {facility.pricingDetails.included_facilities
                .slice(0, 3)
                .map((inc) => {
                  const itemName = typeof inc === "object" ? inc.name : inc;
                  const itemQty =
                    typeof inc === "object" && inc.quantity > 1
                      ? ` (x${inc.quantity})`
                      : "";

                  return (
                    <span
                      key={itemName}
                      className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded"
                    >
                      <Check size={12} className="text-green-600" /> {itemName}
                      {itemQty}
                    </span>
                  );
                })}
              {facility.pricingDetails.included_facilities.length > 3 && (
                <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded">
                  +{facility.pricingDetails.included_facilities.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-between items-end border-t border-gray-100 pt-4">
          <div>
            {!isAvailable && (
              <span className="flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded border border-red-100">
                <AlertCircle size={14} /> Unavailable for selected dates
              </span>
            )}
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">
              Price {getPriceSuffix(facility.pricingType)}
            </p>
            <p
              className={`text-2xl font-extrabold ${
                isAvailable ? "text-gray-900" : "text-gray-400 line-through"
              }`}
            >
              ₹{Number.parseInt(facility.baseRate, 10).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
};

FacilityCard.propTypes = {
  facility: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    facilityType: PropTypes.string.isRequired,
    isAvailableForDates: PropTypes.bool,
    images: PropTypes.arrayOf(PropTypes.string),
    baseRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    pricingType: PropTypes.string,
    pricingDetails: PropTypes.shape({
      included_facilities: PropTypes.arrayOf(
        PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.shape({
            name: PropTypes.string.isRequired,
            quantity: PropTypes.number,
          }),
        ]),
      ),
    }),
  }).isRequired,
  index: PropTypes.number.isRequired,
  navigate: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool.isRequired,
};

export default function Facilities() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [searchDates, setSearchDates] = useState({
    startDate: "",
    endDate: "",
  });

  const [appliedDates, setAppliedDates] = useState({
    startDate: "",
    endDate: "",
  });

  const fetchFacilitiesFn = async ({ queryKey }) => {
    const [, { start, end }] = queryKey;

    let url = "/facilities";
    if (start && end) {
      url += `?startDate=${start}&endDate=${end}`;
    }

    const response = await api.get(url);
    return response.data.data.filter(
      (f) => f.facilityType === "PACKAGE" || f.facilityType === "COMPLEX",
    );
  };

  const {
    data: facilities = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "facilities",
      { start: appliedDates.startDate, end: appliedDates.endDate },
    ],
    queryFn: fetchFacilitiesFn,
  });

  const handleSearch = () => {
    if (
      (searchDates.startDate && !searchDates.endDate) ||
      (!searchDates.startDate && searchDates.endDate)
    ) {
      toast.warn("Please select both Start and End dates.");
      return;
    }
    setAppliedDates(searchDates);
  };

  const handleClearSearch = () => {
    setSearchDates({ startDate: "", endDate: "" });
    setAppliedDates({ startDate: "", endDate: "" });
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/user/logout");
    } catch (error) {
      console.error("Failed to clear cookie on backend", error);
    } finally {
      logout();
      navigate("/user/login");
    }
  };

  const handleCustomBookingClick = () => {
    if (!isAuthenticated) {
      toast.info(
        "Please log in or create an account to make a custom booking.",
      );
      navigate("/user/login");
      return;
    }
    navigate("/book/custom");
  };

  if (isError) {
    toast.error("Failed to load facilities");
  }

  const renderFacilitiesContent = () => {
    if (isLoading) {
      return (
        <div className="text-center p-10 text-gray-500">
          Loading facilities...
        </div>
      );
    }

    if (facilities.length === 0) {
      return (
        <div className="text-center p-10 text-gray-500 font-medium text-lg border rounded-xl bg-white shadow-sm">
          No packages match your search criteria.
        </div>
      );
    }

    return facilities.map((facility, index) => (
      <FacilityCard
        key={facility.id}
        facility={facility}
        index={index}
        navigate={navigate}
        isAuthenticated={isAuthenticated}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navbar */}
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              type="button"
              className="flex items-center cursor-pointer outline-none hover:opacity-80 transition bg-transparent border-none p-0"
              onClick={() => navigate("/facilities")}
            >
              <span className="text-blue-600 font-extrabold text-2xl tracking-tighter">
                Bhavan<span className="text-orange-500">Book</span>
              </span>
            </button>

            <div className="flex items-center gap-4 relative group">
              {isAuthenticated ? (
                <div className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-gray-50">
                  <UserCircle size={28} className="text-gray-600" />
                  <span className="text-sm font-semibold">
                    {user?.fullName}
                  </span>
                  <ChevronDown size={16} />

                  <div className="absolute right-0 top-12 w-48 bg-white border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <button
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm cursor-pointer outline-none bg-transparent border-none block"
                      onClick={() => navigate("/my-bookings")}
                    >
                      My Bookings
                    </button>

                    <button
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-red-600 cursor-pointer outline-none bg-transparent border-none block"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/user/login")}
                  className="text-sm font-bold text-white bg-blue-600 px-5 py-2 rounded-full hover:bg-blue-700 transition"
                >
                  Login / Signup
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Search Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 pb-12 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-white text-3xl font-bold mb-6">
            Find available spaces for your dates
          </h1>

          <div className="bg-white rounded-xl p-2 flex flex-col md:flex-row shadow-lg gap-2">
            <div className="flex-1 flex items-center px-4 py-3 border-b md:border-b-0 md:border-r border-gray-200">
              <MapPin className="text-gray-400 mr-3" />
              <div className="flex flex-col w-full">
                <span className="text-xs text-gray-500 font-semibold uppercase">
                  Location / Bhavan
                </span>
                <input
                  type="text"
                  value="Raipur, Chhattisgarh"
                  className="outline-none text-gray-900 font-bold w-full truncate bg-transparent"
                  readOnly
                />
              </div>
            </div>

            <div className="flex-1 flex items-center px-4 py-3 border-b md:border-b-0 md:border-r border-gray-200 hover:bg-blue-50 transition rounded-md">
              <Calendar className="text-blue-500 mr-3 shrink-0" />
              <div className="flex flex-col w-full">
                <span className="text-xs text-gray-500 font-semibold uppercase">
                  Check-in
                </span>
                <input
                  type="datetime-local"
                  value={searchDates.startDate}
                  onChange={(e) =>
                    setSearchDates({
                      ...searchDates,
                      startDate: e.target.value,
                    })
                  }
                  className="outline-none text-gray-900 font-bold bg-transparent text-sm w-full cursor-pointer"
                />
              </div>
            </div>

            <div className="flex-1 flex items-center px-4 py-3 hover:bg-blue-50 transition rounded-md">
              <Calendar className="text-orange-500 mr-3 shrink-0" />
              <div className="flex flex-col w-full">
                <span className="text-xs text-gray-500 font-semibold uppercase">
                  Check-out
                </span>
                <input
                  type="datetime-local"
                  value={searchDates.endDate}
                  onChange={(e) =>
                    setSearchDates({ ...searchDates, endDate: e.target.value })
                  }
                  className="outline-none text-gray-900 font-bold bg-transparent text-sm w-full cursor-pointer"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-2">
              <button
                type="button"
                onClick={handleSearch}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-3 rounded-lg md:rounded-r-lg transition"
              >
                SEARCH
              </button>

              {(searchDates.startDate || searchDates.endDate) && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-sm px-4 py-3 rounded-lg transition"
                >
                  CLEAR
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-3/4 space-y-6 mx-auto">
          <button
            type="button"
            onClick={handleCustomBookingClick}
            className="w-full text-left flex flex-col md:flex-row bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl border border-blue-200 shadow-md hover:shadow-lg transition-all overflow-hidden cursor-pointer transform hover:-translate-y-1 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="md:w-1/3 bg-blue-600 flex flex-col items-center justify-center text-white p-6 shrink-0">
              <Layers size={48} className="mb-2 opacity-80" />
              <span className="text-xl font-extrabold text-center">
                Custom Booking
              </span>
            </div>
            <div className="md:w-2/3 p-6 flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Build Your Own Booking
              </h2>
              <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                Don't want a pre-made package? Mix and match individual Halls,
                Lawns, Rooms, and specific catering items here.
              </p>
              <div className="mt-4">
                <span className="inline-block bg-blue-600 text-white font-bold text-sm px-6 py-2 rounded-full transition shadow-sm">
                  Start Customizing
                </span>
              </div>
            </div>
          </button>

          <h2 className="text-xl font-bold text-gray-800 pt-4 border-t flex justify-between items-center">
            Standard Packages
            {appliedDates.startDate && (
              <span className="text-sm font-normal text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                Filtered by your dates
              </span>
            )}
          </h2>

          {renderFacilitiesContent()}
        </div>
      </main>
    </div>
  );
}
