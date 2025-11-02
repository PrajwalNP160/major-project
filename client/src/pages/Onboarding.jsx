import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { axiosInstance } from "../lib/axiosInstance";

const Onboarding = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
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

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const extractProjectObjects = (input) => {
    const urls = input
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean);
    return urls.map((url) => {
      const parts = url.split("/");
      const name = parts[parts.length - 1] || "Unnamed Project";
      return { name, gitHubUrl: url };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = await getToken();
    const data = new FormData();

    for (let key in formData) {
      if (key === "projects") {
        const projectObjects = extractProjectObjects(formData.projects);
        data.append("projects", JSON.stringify(projectObjects));
      } else {
        data.append(key, formData[key]);
      }
    }

    try {
      await axiosInstance.put("/user/onboard-user", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      navigate("/profile");
    } catch (err) {
      console.error("Onboarding failed", err);
      alert("Onboarding failed. Check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to SkillSwap! 🎉
          </h1>
          <p className="text-lg text-gray-600">
            Let's set up your profile to connect you with the perfect learning partners
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                📍 Personal Information
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="e.g., John"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 rounded-lg text-gray-900 placeholder-gray-400 transition-all duration-200"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="e.g., Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 rounded-lg text-gray-900 placeholder-gray-400 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    placeholder="e.g., New York, NY"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 rounded-lg text-gray-900 placeholder-gray-400 transition-all duration-200"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Professional Role *
                  </label>
                  <input
                    type="text"
                    name="role"
                    placeholder="e.g., Frontend Developer, Designer"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 rounded-lg text-gray-900 placeholder-gray-400 transition-all duration-200"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Skills Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                🎯 Skills & Learning
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Skills You Can Teach *
                  </label>
                  <input
                    type="text"
                    name="skills"
                    placeholder="e.g., React, JavaScript, Python, UI/UX Design"
                    value={formData.skills}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 p-3 rounded-lg text-gray-900 placeholder-gray-400 transition-all duration-200"
                    required
                  />
                  <p className="text-xs text-gray-500">Separate multiple skills with commas</p>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Skills You Want to Learn *
                  </label>
                  <input
                    type="text"
                    name="skillsToLearn"
                    placeholder="e.g., Machine Learning, Node.js, Figma"
                    value={formData.skillsToLearn}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg text-gray-900 placeholder-gray-400 transition-all duration-200"
                    required
                  />
                  <p className="text-xs text-gray-500">Separate multiple skills with commas</p>
                </div>
              </div>
            </div>

            {/* Experience Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                💼 Experience
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Years of Experience
                  </label>
                  <input
                    type="text"
                    name="experience"
                    placeholder="e.g., 2 years, 6 months, Beginner"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 p-3 rounded-lg text-gray-900 placeholder-gray-400 transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Experience Type
                  </label>
                  <select
                    name="experienceType"
                    value={formData.experienceType}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 p-3 rounded-lg text-gray-900 transition-all duration-200"
                  >
                    <option value="">Select experience type</option>
                    <option value="Professional">Professional</option>
                    <option value="Academic">Academic</option>
                    <option value="Personal Projects">Personal Projects</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Projects & Availability Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                🚀 Projects & Availability
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    GitHub Repositories *
                  </label>
                  <textarea
                    name="projects"
                    placeholder="https://github.com/username/project1, https://github.com/username/project2"
                    value={formData.projects}
                    onChange={handleChange}
                    rows="3"
                    className="w-full border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 rounded-lg text-gray-900 placeholder-gray-400 transition-all duration-200 resize-none"
                    required
                  />
                  <p className="text-xs text-gray-500">Separate multiple URLs with commas</p>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Available Days to Teach *
                  </label>
                  <input
                    type="text"
                    name="availability"
                    placeholder="e.g., Monday, Wednesday, Friday evenings"
                    value={formData.availability}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 p-3 rounded-lg text-gray-900 placeholder-gray-400 transition-all duration-200"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Your Profile...
                  </div>
                ) : (
                  "Complete Onboarding & Start Learning! 🚀"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
