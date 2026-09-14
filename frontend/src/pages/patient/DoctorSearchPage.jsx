/**
 * @file    DoctorSearchPage.jsx
 * @module  Patient
 * @desc    Patient-facing page to search and filter doctors
 *          by specialty or hospital.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import {
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useQuery,
} from '@tanstack/react-query';

import {
  CalendarPlus,
  MapPin,
  Search,
  Stethoscope,
  User,
} from 'lucide-react';

import {
  searchDoctors,
} from '../../services/doctor.service';

import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Spinner from '../../components/common/Spinner';

export default function DoctorSearchPage() {
  const navigate =
    useNavigate();

  const [
    specialtyInput,
    setSpecialtyInput,
  ] = useState('');

  const [
    hospitalInput,
    setHospitalInput,
  ] = useState('');

  const [
    searchParams,
    setSearchParams,
  ] = useState({
    specialty: '',
    hospital: '',
  });

  const {
    data:
      doctors = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'searchDoctors',
      searchParams.specialty,
      searchParams.hospital,
    ],

    queryFn: () =>
      searchDoctors(
        searchParams.specialty,
        searchParams.hospital
      ),
  });

  const handleSearch =
    event => {
      event.preventDefault();

      setSearchParams({
        specialty:
          specialtyInput.trim(),
        hospital:
          hospitalInput.trim(),
      });
    };

  const clearSearch =
    () => {
      setSpecialtyInput('');
      setHospitalInput('');

      setSearchParams({
        specialty: '',
        hospital: '',
      });
    };

  const hasActiveFilters =
    searchParams.specialty ||
    searchParams.hospital;

  return (
    <div className="space-y-7">

      <PageHeader
        eyebrow="Patient Portal"
        icon={
          Stethoscope
        }
        title="Find a Doctor"
        description="Search Care4U doctors by specialty or hospital and book a suitable appointment."
        meta={
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">
              <Search
                size={19}
              />
            </div>

            <div>

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">
                Search Results
              </p>

              <p className="text-sm font-bold text-foreground mt-0.5">
                {isLoading
                  ? 'Searching...'
                  : `${doctors.length} doctor${
                      doctors.length === 1
                        ? ''
                        : 's'
                    } found`}
              </p>

            </div>

          </div>
        }
      />

      <Card title="Search Doctors">

        <form
          onSubmit={
            handleSearch
          }
          className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 items-end"
        >

          {/* Specialty */}
          <div className="w-full">

            <label
              htmlFor="doctor-specialty"
              className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5"
            >
              Specialty
            </label>

            <div className="relative">

              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">

                <Stethoscope className="h-4.5 w-4.5 text-muted-foreground" />

              </div>

              <input
                id="doctor-specialty"
                type="text"
                placeholder="e.g. Cardiologist"
                className="
                  block
                  w-full
                  pl-10 pr-3.5 py-2.5
                  text-sm
                  text-foreground
                  bg-card
                  border border-input
                  rounded-xl
                  transition-colors
                  placeholder:text-muted-foreground
                  hover:border-muted-foreground
                  focus:outline-none
                  focus:ring-2
                  focus:ring-ring
                  focus:border-transparent
                "
                value={
                  specialtyInput
                }
                onChange={
                  event =>
                    setSpecialtyInput(
                      event.target.value
                    )
                }
              />

            </div>

          </div>

          {/* Hospital */}
          <div className="w-full">

            <label
              htmlFor="doctor-hospital"
              className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5"
            >
              Hospital / Clinic
            </label>

            <div className="relative">

              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">

                <MapPin className="h-4.5 w-4.5 text-muted-foreground" />

              </div>

              <input
                id="doctor-hospital"
                type="text"
                placeholder="e.g. Teaching Hospital"
                className="
                  block
                  w-full
                  pl-10 pr-3.5 py-2.5
                  text-sm
                  text-foreground
                  bg-card
                  border border-input
                  rounded-xl
                  transition-colors
                  placeholder:text-muted-foreground
                  hover:border-muted-foreground
                  focus:outline-none
                  focus:ring-2
                  focus:ring-ring
                  focus:border-transparent
                "
                value={
                  hospitalInput
                }
                onChange={
                  event =>
                    setHospitalInput(
                      event.target.value
                    )
                }
              />

            </div>

          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2">

            {hasActiveFilters && (
              <Button
                type="button"
                variant="secondary"
                onClick={
                  clearSearch
                }
                className="w-full sm:w-auto"
              >
                Clear
              </Button>
            )}

            <Button
              type="submit"
              icon={
                <Search className="h-4 w-4" />
              }
              className="w-full sm:w-auto"
            >
              Search
            </Button>

          </div>

        </form>

      </Card>

      {/* Results */}
      <section>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">

          <div>

            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              Available Doctors
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-1">
              Search Results
            </h2>

            {!isLoading &&
              !isError && (
              <p className="text-sm text-muted-foreground mt-1">
                {doctors.length === 0
                  ? 'No matching doctors found.'
                  : `${doctors.length} doctor${
                      doctors.length === 1
                        ? ''
                        : 's'
                    } available`}
              </p>
            )}

          </div>

        </div>

        {/* Loading */}
        {isLoading && (
          <Card>

            <div className="flex flex-col items-center justify-center py-12">

              <Spinner
                size="lg"
              />

              <p className="mt-4 text-sm text-muted-foreground">
                Searching for doctors...
              </p>

            </div>

          </Card>
        )}

        {/* Error */}
        {isError && (
          <Alert
            type="error"
            message={`Failed to load doctors: ${
              error?.message ||
              'Unknown error occurred'
            }. Please try again.`}
          />
        )}

        {/* Empty */}
        {!isLoading &&
          !isError &&
          doctors.length ===
            0 && (

          <Card>

            <div className="flex flex-col items-center justify-center text-center py-12 px-4">

              <div className="w-16 h-16 rounded-2xl bg-module-soft text-primary flex items-center justify-center mb-4">

                <Search
                  className="w-7 h-7"
                  strokeWidth={
                    1.8
                  }
                />

              </div>

              <h3 className="text-lg font-bold text-foreground">
                No doctors found
              </h3>

              <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
                Try changing the specialty or hospital name, or clear the filters to view more doctors.
              </p>

              {hasActiveFilters && (
                <div className="mt-5">

                  <Button
                    variant="secondary"
                    onClick={
                      clearSearch
                    }
                  >
                    Clear Search
                  </Button>

                </div>
              )}

            </div>

          </Card>
        )}

        {/* Results */}
        {!isLoading &&
          !isError &&
          doctors.length >
            0 && (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            {doctors.map(
              doctor => (

                <article
                  key={
                    doctor.id
                  }
                  className="
                    group
                    relative
                    overflow-hidden
                    rounded-2xl
                    bg-card
                    border border-border/70
                    shadow-[0_8px_26px_rgba(15,23,42,0.05)]
                    hover:shadow-[0_16px_38px_rgba(15,23,42,0.09)]
                    hover:-translate-y-0.5
                    transition-all duration-200
                    flex flex-col
                  "
                >
                  {/* Module accent */}
                  <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />

                  <div className="p-5 sm:p-6 flex-1">

                    <div className="flex items-start gap-4">

                      <div className="
                        w-12 h-12
                        rounded-2xl
                        bg-module-soft
                        text-primary
                        flex items-center justify-center
                        shrink-0
                      ">
                        <User
                          className="w-6 h-6"
                          strokeWidth={
                            1.9
                          }
                        />
                      </div>

                      <div className="min-w-0">

                        <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                          Dr. {
                            doctor.full_name
                          }
                        </h3>

                        <div className="flex items-center gap-1.5 mt-1.5 text-primary">

                          <Stethoscope className="w-4 h-4 shrink-0" />

                          <p className="text-sm font-semibold truncate">
                            {doctor.specialization ||
                              'General Physician'}
                          </p>

                        </div>

                      </div>

                    </div>

                    <div className="mt-5 space-y-3">

                      <div className="rounded-xl bg-secondary/50 p-3.5">

                        <div className="flex items-start gap-3">

                          <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />

                          <div className="min-w-0">

                            <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                              Hospital / Clinic
                            </p>

                            <p className="text-sm font-medium text-foreground mt-1 break-words">
                              {doctor.hospital_name ||
                                'Independent Clinic'}
                            </p>

                          </div>

                        </div>

                      </div>

                      {doctor.qualifications && (
                        <div className="px-1">

                          <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                            Qualifications
                          </p>

                          <p className="text-sm text-foreground mt-1 leading-relaxed">
                            {
                              doctor.qualifications
                            }
                          </p>

                        </div>
                      )}

                    </div>

                  </div>

                  <div className="px-5 sm:px-6 pb-5 sm:pb-6">

                    <Button
                      variant="primary"
                      icon={
                        <CalendarPlus className="h-4 w-4" />
                      }
                      onClick={() =>
                        navigate(
                          `/patient/book-appointment/${doctor.id}`
                        )
                      }
                      className="w-full"
                    >
                      Book Appointment
                    </Button>

                  </div>

                </article>

              )
            )}

          </div>

        )}

      </section>

    </div>
  );
}