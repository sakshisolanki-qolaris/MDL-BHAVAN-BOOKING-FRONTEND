import { useState, useEffect } from "react";
import api from "../../api/axios";
import { toast } from "react-toastify";

// Components
import TaxSettingsCard from "./components/facilities/TaxSettingsCard";
import FacilitiesTable from "./components/facilities/FacilitiesTable";
import FacilityFormModal from "./components/facilities/FacilityFormModal";

export default function AdminFacilitiesView() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tax State
  const [taxSettings, setTaxSettings] = useState({
    cgstPercentage: 2.5,
    sgstPercentage: 2.5,
  });
  const [isUpdatingTaxes, setIsUpdatingTaxes] = useState(false);

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [facRes, taxRes] = await Promise.all([
        api.get("/facilities"),
        api.get("/settings/taxes").catch(() => null),
      ]);

      setFacilities(facRes.data.data);

      if (taxRes?.data?.data) {
        setTaxSettings({
          cgstPercentage: Number(taxRes.data.data.cgstPercentage),
          sgstPercentage: Number(taxRes.data.data.sgstPercentage),
        });
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaxes = async (e) => {
    e.preventDefault();
    setIsUpdatingTaxes(true);
    try {
      await api.patch("/settings/taxes", taxSettings);
      toast.success("Tax settings updated successfully!");
    } catch (err) {
      console.error("Failed to update taxes:", err);
      toast.error(err.response?.data?.message || "Failed to update taxes");
    } finally {
      setIsUpdatingTaxes(false);
    }
  };

  const handleDelete = async (id) => {
    if (!globalThis.confirm("Are you sure you want to delete this facility?"))
      return;
    try {
      await api.delete(`/facilities/${id}`);
      toast.success("Facility deleted");
      fetchData();
    } catch (err) {
      console.error("Failed to delete facility:", err);
      toast.error("Failed to delete facility");
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">
        Loading settings and inventory...
      </div>
    );

  return (
    <div className="space-y-6">
      <TaxSettingsCard
        taxSettings={taxSettings}
        setTaxSettings={setTaxSettings}
        onSave={handleUpdateTaxes}
        isUpdating={isUpdatingTaxes}
      />

      <FacilitiesTable
        facilities={facilities}
        onAdd={() => {
          setEditingFacility(null);
          setIsModalOpen(true);
        }}
        onEdit={(fac) => {
          setEditingFacility(fac);
          setIsModalOpen(true);
        }}
        onDelete={handleDelete}
      />

      {isModalOpen && (
        <FacilityFormModal
          facility={editingFacility}
          allFacilities={facilities}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
