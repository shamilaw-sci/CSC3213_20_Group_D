/**
 * @file    DoctorSearchPage.jsx
 * @module  Patient
 * @desc    Search doctors by specialty or hospital and open appointment booking.
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
  BadgeCheck,
  BriefcaseMedical,
  Building2,
  CalendarPlus,
  GraduationCap,
  MapPin,
  Search,
  Stethoscope,
  UserRound,
  X,
} from 'lucide-react';

import {
  searchDoctors,
} from '../../services/doctor.service';

import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Spinner from '../../components/common/Spinner';



/**
 * Returns doctor initials for the photo fallback.
 */
const getInitials = (
  name
) => {
  if (!name) {
    return 'DR';
  }

  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(
      part =>
        part[0]
          .toUpperCase()
    )
    .join('');
};

/**
 * Returns readable doctor experience text.
 */
const formatExperience = (
  value
) => {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 'Not listed';
  }

  const years =
    Number(value);

  return `${value} ${
    years === 1
      ? 'year'
      : 'years'
  }`;
};



/**
 * @component DoctorPhoto
 * @desc      Large circular doctor portrait with fallback initials.
 */
const DoctorPhoto = ({
  doctor,
}) => {
  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  const hasPhoto =
    Boolean(
      doctor?.photo_url
    ) &&
    !imageFailed;

  return (
    <div
      className="
        relative
        w-36 h-36
        sm:w-40 sm:h-40
        rounded-full
        bg-card
        p-1.5
        shadow-[0_16px_36px_rgba(15,23,42,0.18)]
      "
    >

      <div
        className="
          w-full
          h-full
          rounded-full
          overflow-hidden
          bg-brand-deep
          border
          border-border/40
        "
      >

        {hasPhoto ? (

          <img
            src={
              doctor.photo_url
            }
            alt={`Dr. ${
              doctor.full_name ||
              'Care4U doctor'
            }`}
            className="
              w-full
              h-full
              object-cover
              object-top
            "
            onError={() =>
              setImageFailed(
                true
              )
            }
          />

        ) : (

          <div
            className="
              w-full
              h-full
              flex
              flex-col
              items-center
              justify-center
              bg-linear-to-br
              from-brand-deep
              to-primary
              text-white
            "
          >

            <UserRound
              className="
                w-10 h-10
                text-white/75
              "
              strokeWidth={
                1.5
              }
            />

            <span
              className="
                text-xl
                font-black
                mt-2
              "
            >
              {getInitials(
                doctor?.full_name
              )}
            </span>

          </div>

        )}

      </div>

    </div>
  );
};



/**
 * @component DoctorCard
 * @desc      doctor card with large circular portrait.
 */
const DoctorCard = ({
  doctor,
  onBook,
}) => {
  return (
    <article
      className="
        group
        relative
        overflow-hidden
        rounded-[2rem]
        bg-card
        border
        border-border/70
        shadow-[0_10px_30px_rgba(15,23,42,0.06)]
        hover:shadow-[0_22px_50px_rgba(15,23,42,0.11)]
        hover:-translate-y-1
        transition-all
        duration-300
        flex
        flex-col
      "
    >



      <div
        className="
          relative
          h-32
          bg-linear-to-br
          from-brand-deep
          via-primary
          to-primary/55
        "
      >

        <div
          className="
            absolute
            -right-7
            -top-7
            w-24 h-24
            rounded-full
            border
            border-white/20
            bg-white/10
          "
        />

        <div
          className="
            absolute
            left-8
            top-5
            w-10 h-10
            rounded-full
            border
            border-white/15
            bg-white/5
          "
        />

        {doctor?.is_verified && (

          <div
            className="
              absolute
              top-4
              right-4
              inline-flex
              items-center
              gap-1.5
              rounded-full
              bg-white/15
              border
              border-white/20
              backdrop-blur-md
              px-3
              py-1.5
              text-white
            "
          >

            <BadgeCheck
              className="w-3.5 h-3.5"
            />

            <span
              className="
                text-[9px]
                font-bold
                uppercase
                tracking-wide
              "
            >
              Verified
            </span>

          </div>

        )}

      </div>



      <div
        className="
          relative
          flex
          flex-col
          flex-1
          px-5
          sm:px-6
          pb-6
          pt-20
        "
      >

        {/* Circular portrait overlaps header */}
        <div
          className="
            absolute
            left-1/2
            -translate-x-1/2
            -top-20
          "
        >

          <DoctorPhoto
            doctor={
              doctor
            }
          />

        </div>



        <div className="text-center">

          <p
            className="
              text-[9px]
              uppercase
              tracking-[0.18em]
              font-bold
              text-primary
            "
          >
            Care4U Doctor
          </p>

          <h3
            className="
              text-xl
              font-bold
              text-foreground
              mt-1.5
              leading-tight
              tracking-tight
            "
          >
            Dr. {
              doctor.full_name
            }
          </h3>

          <div
            className="
              flex
              justify-center
              mt-3
            "
          >

            <div
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                bg-module-soft
                text-primary
                px-3.5
                py-1.5
              "
            >

              <Stethoscope
                className="w-3.5 h-3.5"
              />

              <span
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wide
                "
              >
                {doctor.specialization ||
                  'General Physician'}
              </span>

            </div>

          </div>

        </div>



        <div
          className="
            mt-6
            rounded-2xl
            bg-secondary/50
            border
            border-border/60
            p-4
          "
        >

          <div
            className="
              flex
              items-start
              gap-3
            "
          >

            <div
              className="
                w-10 h-10
                rounded-xl
                bg-card
                flex
                items-center
                justify-center
                border
                border-border/60
                shrink-0
              "
            >

              <Building2
                className="
                  w-4.5 h-4.5
                  text-primary
                "
              />

            </div>

            <div className="min-w-0">

              <p
                className="
                  text-[9px]
                  uppercase
                  tracking-[0.13em]
                  font-bold
                  text-muted-foreground
                "
              >
                Hospital / Clinic
              </p>

              <p
                className="
                  text-sm
                  font-semibold
                  text-foreground
                  mt-1
                  leading-relaxed
                "
              >
                {doctor.hospital_name ||
                  'Independent Clinic'}
              </p>

            </div>

          </div>

        </div>



        <div
          className="
            grid
            grid-cols-1
            gap-3
            mt-4
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
              px-1
            "
          >

            <div
              className="
                w-9 h-9
                rounded-xl
                bg-module-soft
                text-primary
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <BriefcaseMedical
                className="w-4 h-4"
              />

            </div>

            <div>

              <p
                className="
                  text-[9px]
                  uppercase
                  tracking-[0.12em]
                  font-bold
                  text-muted-foreground
                "
              >
                Experience
              </p>

              <p
                className="
                  text-sm
                  font-semibold
                  text-foreground
                  mt-0.5
                "
              >
                {formatExperience(
                  doctor
                    .years_experience
                )}
              </p>

            </div>

          </div>

          {doctor
              .qualifications && (

            <div
              className="
                flex
                items-start
                gap-3
                px-1
              "
            >

              <div
                className="
                  w-9 h-9
                  rounded-xl
                  bg-module-soft
                  text-primary
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >

                <GraduationCap
                  className="w-4 h-4"
                />

              </div>

              <div className="min-w-0">

                <p
                  className="
                    text-[9px]
                    uppercase
                    tracking-[0.12em]
                    font-bold
                    text-muted-foreground
                  "
                >
                  Qualifications
                </p>

                <p
                  className="
                    text-sm
                    font-medium
                    text-foreground
                    mt-0.5
                    leading-relaxed
                  "
                >
                  {
                    doctor
                      .qualifications
                  }
                </p>

              </div>

            </div>

          )}

          {doctor
              .slmc_reg_number && (

            <div
              className="
                flex
                items-center
                gap-3
                px-1
              "
            >

              <div
                className="
                  w-9 h-9
                  rounded-xl
                  bg-module-soft
                  text-primary
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >

                <BadgeCheck
                  className="w-4 h-4"
                />

              </div>

              <div>

                <p
                  className="
                    text-[9px]
                    uppercase
                    tracking-[0.12em]
                    font-bold
                    text-muted-foreground
                  "
                >
                  SLMC Registration
                </p>

                <p
                  className="
                    text-sm
                    font-semibold
                    text-foreground
                    mt-0.5
                  "
                >
                  {
                    doctor
                      .slmc_reg_number
                  }
                </p>

              </div>

            </div>

          )}

        </div>

        <div className="flex-1" />



        <div
          className="
            mt-6
            pt-5
            border-t
            border-border
          "
        >

          <div
            className="
              flex
              items-center
              justify-center
              gap-2
              mb-4
            "
          >

            <span
              className="
                w-2 h-2
                rounded-full
                bg-primary
              "
            />

            <p
              className="
                text-xs
                text-muted-foreground
                font-medium
              "
            >
              View available appointment times
            </p>

          </div>

          {/* Book Appointment Button */}
          <Button
            variant="primary"
            icon={
              <CalendarPlus className="h-4 w-4" />
            }
            onClick={
              onBook
            }
            className="
              w-full
              min-h-11
              rounded-xl
              font-bold
            "
          >
            Book Appointment
          </Button>

        </div>

      </div>

    </article>
  );
};



/**
 * FEATURE: Find a Doctor
 * LOGIC: Load doctors using the chosen specialty and hospital filters.
 */
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


  /**
   * FEATURE: Search Doctors
   * LOGIC: Trim and apply both filters only on form submission; typing alone leaves the current query unchanged.
   * The query key separates each filter pair, and API failures appear above the results.
   */
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


  /**
   * FEATURE: Clear Search
   * LOGIC: Reset typed and applied filters; the unfiltered query can reuse cached results.
   */
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
    Boolean(
      searchParams.specialty ||
      searchParams.hospital
    );

  return (
    <div className="space-y-7">

      {/* Find a Doctor Heading */}
      <PageHeader
        eyebrow="Patient Portal"
        icon={
          Stethoscope
        }
        title="Find a Doctor"
        description="Explore Care4U doctors by specialty or hospital and choose the right clinician for your care."
        meta={
          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                w-10 h-10
                rounded-xl
                bg-module-soft
                text-primary
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <Search
                size={19}
              />

            </div>

            <div>

              <p
                className="
                  text-[10px]
                  uppercase
                  tracking-[0.12em]
                  font-bold
                  text-primary
                "
              >
                Search Results
              </p>

              <p
                className="
                  text-sm
                  font-bold
                  text-foreground
                  mt-0.5
                "
              >
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

        {/* Search Doctors Form */}
        <form
          onSubmit={
            handleSearch
          }
          className="
            grid
            grid-cols-1
            lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]
            gap-4
            items-end
          "
        >

          <div className="w-full">

            <label
              htmlFor="doctor-specialty"
              className="
                block
                text-xs
                font-semibold
                text-muted-foreground
                uppercase
                tracking-wide
                mb-1.5
              "
            >
              Specialty
            </label>

            <div className="relative">

              <div
                className="
                  absolute
                  inset-y-0
                  left-0
                  pl-3.5
                  flex
                  items-center
                  pointer-events-none
                "
              >

                <Stethoscope
                  className="
                    h-4.5 w-4.5
                    text-muted-foreground
                  "
                />

              </div>

              <input
                id="doctor-specialty"
                type="text"
                placeholder="e.g. Cardiologist"
                className="
                  block
                  w-full
                  pl-10
                  pr-10
                  py-2.5
                  text-sm
                  text-foreground
                  bg-card
                  border
                  border-input
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

              {specialtyInput && (

                <button
                  type="button"
                  onClick={() =>
                    setSpecialtyInput(
                      ''
                    )
                  }
                  title="Clear specialty"
                  className="
                    absolute
                    inset-y-0
                    right-3
                    flex
                    items-center
                    text-muted-foreground
                    hover:text-foreground
                  "
                >
                  <X className="w-4 h-4" />
                </button>

              )}

            </div>

          </div>

          <div className="w-full">

            <label
              htmlFor="doctor-hospital"
              className="
                block
                text-xs
                font-semibold
                text-muted-foreground
                uppercase
                tracking-wide
                mb-1.5
              "
            >
              Hospital / Clinic
            </label>

            <div className="relative">

              <div
                className="
                  absolute
                  inset-y-0
                  left-0
                  pl-3.5
                  flex
                  items-center
                  pointer-events-none
                "
              >

                <MapPin
                  className="
                    h-4.5 w-4.5
                    text-muted-foreground
                  "
                />

              </div>

              <input
                id="doctor-hospital"
                type="text"
                placeholder="e.g. Teaching Hospital"
                className="
                  block
                  w-full
                  pl-10
                  pr-10
                  py-2.5
                  text-sm
                  text-foreground
                  bg-card
                  border
                  border-input
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

              {hospitalInput && (

                <button
                  type="button"
                  onClick={() =>
                    setHospitalInput(
                      ''
                    )
                  }
                  title="Clear hospital"
                  className="
                    absolute
                    inset-y-0
                    right-3
                    flex
                    items-center
                    text-muted-foreground
                    hover:text-foreground
                  "
                >
                  <X className="w-4 h-4" />
                </button>

              )}

            </div>

          </div>

          <div
            className="
              flex
              flex-col
              sm:flex-row
              lg:flex-col
              xl:flex-row
              gap-2
            "
          >

            {hasActiveFilters && (

              /* Clear Search Button */
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

            {/* Search Doctors Button */}
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



      <section>

        <div
          className="
            flex
            flex-col
            sm:flex-row
            sm:items-end
            sm:justify-between
            gap-3
            mb-5
          "
        >

          <div>

            <p
              className="
                text-[11px]
                font-bold
                uppercase
                tracking-[0.16em]
                text-primary
              "
            >
              Available Doctors
            </p>

            <h2
              className="
                text-xl
                sm:text-2xl
                font-bold
                text-foreground
                mt-1
              "
            >
              Meet your care team
            </h2>

            {!isLoading &&
              !isError && (

              <p
                className="
                  text-sm
                  text-muted-foreground
                  mt-1
                "
              >
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

        {isLoading && (

          <Card>

            <div
              className="
                flex
                flex-col
                items-center
                justify-center
                py-12
              "
            >

              <Spinner
                size="lg"
              />

              <p
                className="
                  mt-4
                  text-sm
                  text-muted-foreground
                "
              >
                Searching for doctors...
              </p>

            </div>

          </Card>

        )}

        {isError && (

          <Alert
            type="error"
            message={`Failed to load doctors: ${
              error?.message ||
              'Unknown error occurred'
            }. Please try again.`}
          />

        )}

        {!isLoading &&
          !isError &&
          doctors.length ===
            0 && (

          <Card>

            <div
              className="
                flex
                flex-col
                items-center
                justify-center
                text-center
                py-12
                px-4
              "
            >

              <div
                className="
                  w-16 h-16
                  rounded-2xl
                  bg-module-soft
                  text-primary
                  flex
                  items-center
                  justify-center
                  mb-4
                "
              >

                <Search
                  className="w-7 h-7"
                  strokeWidth={
                    1.8
                  }
                />

              </div>

              <h3
                className="
                  text-lg
                  font-bold
                  text-foreground
                "
              >
                No doctors found
              </h3>

              <p
                className="
                  text-sm
                  text-muted-foreground
                  mt-2
                  max-w-md
                  leading-relaxed
                "
              >
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

        {!isLoading &&
          !isError &&
          doctors.length >
            0 && (

          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              2xl:grid-cols-3
              gap-6
            "
          >

            {doctors.map(
              doctor => (

                /* Doctor Result Card and Booking Navigation */ <DoctorCard
                  key={
                    doctor.id
                  }
                  doctor={
                    doctor
                  }
                  onBook={() =>
                    navigate(
                      `/patient/book-appointment/${doctor.id}`
                    )
                  }
                />

              )
            )}

          </div>

        )}

      </section>

    </div>
  );
}
