/**
 * @component Spinner
 * @desc      Loading indicator used during data fetch states.
 *            Displayed while React Query is fetching from the API.
 * @author    Wasana Karunanayaka (S/21/081)
 * @param {string} size - sm | md | lg
 */
const Spinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizes[size]} rounded-full border-slate-200 border-t-[#1E3A5F] animate-spin`}
      />
    </div>
  );
};

export default Spinner;