import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axiosInstance";
import FileUpload from "../components/FileUpload";
import { X, User, MapPin, Briefcase, Clock, Code, Target, Award, Calendar } from "lucide-react";

const UpdateProfilePage = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [updateData, setUpdateData] = useState({
    firstName: "",
    lastName: "",
    skills: "",
    projects: "",
    location: "",
    role: "",
    availability: "",
    skillsToLearn: "",
    experience: "",
    experienceType: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load profile into form
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getToken();
        const res = await axiosInstance.get("/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const u = res.data.user;
        setUpdateData({
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          skills: u.skills?.join(", ") || "",
          projects:
            u.projects
              ?.map((p) => (typeof p === "string" ? p : (p.name || p.gitHubUrl)))
              .join(", ") || "",
          location: u.location || "",
          role: u.role || "",
          availability: u.availability?.join(", ") || "",
          skillsToLearn: u.skillsToLearn?.join(", ") || "",
          experience: u.experience || "",
          experienceType: u.experienceType || "",
        });
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [getToken]);

  const handleChange = (e) => {
    setUpdateData({ ...updateData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setSaving(true);
    const token = await getToken();

    // ✅ Convert comma-separated strings into arrays
    const payload = {
      ...updateData,
      skills: updateData.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      projects: updateData.projects
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
        .map((projectName) => ({
          name: projectName,
          gitHubUrl: "", // Default empty URL, user can edit later
        })),
      availability: updateData.availability
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      skillsToLearn: updateData.skillsToLearn
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      await axiosInstance.put("/user/update-profile", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/profile"); // back to profile page
    } catch (err) {
      console.error("Update error:", err.response?.data || err.message);
      alert("Profile update failed.");
    } finally {
      setSaving(false);
    }
  };

  // Field configurations with icons and labels
  const fieldConfig = {
    firstName: { icon: User, label: "First Name", placeholder: "e.g., John" },
    lastName: { icon: User, label: "Last Name", placeholder: "e.g., Doe" },
    location: { icon: MapPin, label: "Location", placeholder: "e.g., New York, NY" },
    role: { icon: Briefcase, label: "Professional Role", placeholder: "e.g., Frontend Developer" },
    skills: { icon: Code, label: "Skills You Can Teach", placeholder: "e.g., React, JavaScript, Python", isTextArea: true },
    skillsToLearn: { icon: Target, label: "Skills You Want to Learn", placeholder: "e.g., Machine Learning, Node.js", isTextArea: true },
    experience: { icon: Calendar, label: "Years of Experience", placeholder: "e.g., 2 years, 6 months" },
    experienceType: { icon: Award, label: "Experience Type", isSelect: true },
    projects: { icon: Code, label: "GitHub Projects", placeholder: "e.g., https://github.com/user/project1", isTextArea: true },
    availability: { icon: Clock, label: "Availability", placeholder: "e.g., Monday, Wednesday, Friday", isTextArea: true },
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
            <User size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Update Your Profile</h1>
          <p className="text-lg text-gray-600">Keep your information current to find the best learning matches</p>
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 right-4 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-gray-800"
          >
            <X size={24} />
          </button>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Progress Bar */}
          <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

          {/* Content */}
          <div className="p-8">
            <div className="grid lg:grid-cols-2 gap-8">
              
              {/* Personal Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User size={20} className="text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Personal Information</h3>
                </div>
                
                {['firstName', 'lastName', 'location', 'role', 'experience', 'experienceType'].map((key) => {
                  const config = fieldConfig[key];
                  const Icon = config.icon;
                  
                  return (
                    <div key={key} className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Icon size={16} className="text-blue-500" />
                        {config.label}
                      </label>
                      
                      {config.isSelect ? (
                        <select
                          name={key}
                          value={updateData[key]}
                          onChange={handleChange}
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white shadow-sm hover:shadow-md"
                        >
                          <option value="">Select experience type</option>
                          <option value="Professional">Professional</option>
                          <option value="Academic">Academic</option>
                          <option value="Personal Projects">Personal Projects</option>
                          <option value="Freelance">Freelance</option>
                          <option value="Internship">Internship</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          name={key}
                          value={updateData[key]}
                          onChange={handleChange}
                          placeholder={config.placeholder}
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow-md"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Skills & Learning */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target size={20} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Skills & Learning</h3>
                </div>
                
                {['skills', 'skillsToLearn', 'projects', 'availability'].map((key) => {
                  const config = fieldConfig[key];
                  const Icon = config.icon;
                  
                  return (
                    <div key={key} className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Icon size={16} className="text-green-500" />
                        {config.label}
                      </label>
                      
                      <textarea
                        name={key}
                        value={updateData[key]}
                        onChange={handleChange}
                        placeholder={config.placeholder}
                        rows="4"
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 text-gray-900 placeholder-gray-400 resize-none shadow-sm hover:shadow-md"
                      />
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        💡 Separate multiple items with commas
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-12 pt-8 border-t-2 border-gray-100">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 bg-gray-100 text-gray-700 py-4 px-8 rounded-2xl font-semibold hover:bg-gray-200 focus:ring-4 focus:ring-gray-200 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Cancel Changes
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
              >
                {saving ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Award size={20} />
                    Save Profile Updates
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfilePage;
