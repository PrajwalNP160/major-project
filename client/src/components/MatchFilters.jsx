import React, { useState } from "react";
import { Search, X } from "lucide-react";

const MatchFilters = ({ filters, onFilterChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFilters = { ...localFilters, [name]: value };
    setLocalFilters(updatedFilters);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      skillCategory: "",
      skillLevel: "",
      location: "",
      matchScore: 0,
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md border border-gray-200 p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            name="skillCategory"
            value={localFilters.skillCategory}
            onChange={handleChange}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
            placeholder="Search skills..."
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Search
          </button>
          {localFilters.skillCategory && (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default MatchFilters;
