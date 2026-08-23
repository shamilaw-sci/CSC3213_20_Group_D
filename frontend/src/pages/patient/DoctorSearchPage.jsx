/**
 * @file    DoctorSearchPage.jsx
 * @module  Patient
 * @desc    Patient-facing page to search and filter doctors by specialty or hospital.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Stethoscope, User, CalendarPlus, AlertCircle } from 'lucide-react';
import { searchDoctors } from '../../services/doctor.service';

export default function DoctorSearchPage() {
  const navigate = useNavigate();
  
  // Controlled inputs for the search form
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [hospitalInput, setHospitalInput] = useState('');
  
  // State that actually triggers the API fetch when "Search" is clicked
  const [searchParams, setSearchParams] = useState({ specialty: '', hospital: '' });

  // Fetch doctors using React Query
  const { data: doctors = [], isLoading, isError, error } = useQuery({
    queryKey: ['searchDoctors', searchParams.specialty, searchParams.hospital],
    queryFn: () => searchDoctors(searchParams.specialty, searchParams.hospital),
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ specialty: specialtyInput, hospital: hospitalInput });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Find a Doctor</h1>
        <p className="text-gray-500 mt-1">Search for specialists and book your next appointment.</p>
      </div>

      {/* Search Filter Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Stethoscope className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="e.g. Cardiologist, General Physician"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-[#2E75B6] focus:border-[#2E75B6] outline-none transition-colors"
                value={specialtyInput}
                onChange={(e) => setSpecialtyInput(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital / Clinic</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="e.g. General Hospital, Asiri"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-[#2E75B6] focus:border-[#2E75B6] outline-none transition-colors"
                value={hospitalInput}
                onChange={(e) => setHospitalInput(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-6 py-2 bg-[#2E75B6] hover:bg-[#1E3A5F] text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Search className="h-5 w-5" />
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* Results Section */}
      <div className="mt-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2E75B6] mb-4"></div>
            <p>Searching for doctors...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load doctors: {error?.message || 'Unknown error occurred'}. Please try again.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && doctors.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-sm">
            <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No doctors found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your search filters to find what you're looking for.</p>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && !isError && doctors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#EBF5FF] p-3 rounded-full text-[#2E75B6]">
                      <User className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#1E3A5F]">Dr. {doctor.full_name}</h3>
                      <p className="text-[#2E75B6] font-medium text-sm flex items-center gap-1 mt-1">
                        <Stethoscope className="h-4 w-4" />
                        {doctor.specialization || 'General Physician'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="truncate">{doctor.hospital_name || 'Independent Clinic'}</span>
                    </div>
                    {doctor.qualifications && (
                      <div className="text-sm text-gray-500 border-t border-gray-100 pt-3 mt-3">
                        <span className="font-medium text-gray-700">Qualifications:</span> {doctor.qualifications}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/patient/book-appointment/${doctor.id}`)}
                    className="w-full py-2 bg-white border border-[#2E75B6] text-[#2E75B6] hover:bg-[#2E75B6] hover:text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    Book Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}