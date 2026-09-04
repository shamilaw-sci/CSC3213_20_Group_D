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
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Spinner from '../../components/common/Spinner';

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
        <h1 className="text-2xl font-bold text-foreground">Find a Doctor</h1>
        <p className="text-muted-foreground mt-1">Search for specialists and book your next appointment.</p>
      </div>

      {/* Search Filter Card */}
      <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Specialty</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Stethoscope className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="e.g. Cardiologist, General Physician"
                className="block w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-muted-foreground transition-colors"
                value={specialtyInput}
                onChange={(e) => setSpecialtyInput(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Hospital / Clinic</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="e.g. General Hospital, Asiri"
                className="block w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-muted-foreground transition-colors"
                value={hospitalInput}
                onChange={(e) => setHospitalInput(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" icon={<Search className="h-5 w-5" />} className="w-full md:w-auto">
            Search
          </Button>
        </form>
      </div>

      {/* Results Section */}
      <div className="mt-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner size="lg" />
            <p className="mt-4 text-sm text-muted-foreground">Searching for doctors...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Alert type="error" message={`Failed to load doctors: ${error?.message || 'Unknown error occurred'}. Please try again.`} />
        )}

        {/* Empty State */}
        {!isLoading && !isError && doctors.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
            <div className="bg-secondary h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No doctors found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your search filters to find what you're looking for.</p>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && !isError && doctors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-full text-primary">
                      <User className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Dr. {doctor.full_name}</h3>
                      <p className="text-primary font-medium text-sm flex items-center gap-1 mt-1">
                        <Stethoscope className="h-4 w-4" />
                        {doctor.specialization || 'General Physician'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{doctor.hospital_name || 'Independent Clinic'}</span>
                    </div>
                    {doctor.qualifications && (
                      <div className="text-sm text-muted-foreground border-t border-border pt-3 mt-3">
                        <span className="font-medium text-foreground">Qualifications:</span> {doctor.qualifications}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 bg-secondary border-t border-border">
                  <Button
                    variant="secondary"
                    icon={<CalendarPlus className="h-4 w-4" />}
                    onClick={() => navigate(`/patient/book-appointment/${doctor.id}`)}
                    className="w-full"
                  >
                    Book Appointment
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}