import { useState, useEffect, useRef } from "react";

const SearchIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z"
    />
  </svg>
);

const SpinnerIcon = () => (
  <svg
    className="w-4 h-4 animate-spin text-indigo-500"
    fill="none"
    viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

const XIcon = () => (
  <svg
    className="w-3.5 h-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

// SearchBar — controlled input with 300ms debounce
// onChange fires with the debounced value; the parent owns the actual filter state.
const SearchBar = ({
  value = "",
  onChange,
  placeholder = "Search auctions…",
  onClear,
  isLoading = false,
  className = "",
}) => {
  // Local "typed" value shown in the input
  const [inputVal, setInputVal] = useState(value);
  const [debouncing, setDebouncing] = useState(false);
  const timerRef = useRef(null);

  // Sync if parent resets value (e.g. resetFilters)
  useEffect(() => {
    setInputVal(value);
  }, [value]);

  const handleChange = (e) => {
    const next = e.target.value;
    setInputVal(next);
    setDebouncing(true);

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncing(false);
      onChange?.(next);
    }, 300);
  };

  const handleClear = () => {
    clearTimeout(timerRef.current);
    setInputVal("");
    setDebouncing(false);
    onClear?.();
    onChange?.("");
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const showSpinner = isLoading || debouncing;
  const showClear = inputVal.length > 0 && !showSpinner;

  return (
    <div className={`relative flex-1 min-w-0 ${className}`}>
      {/* Left icon */}
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        <SearchIcon />
      </span>

      <input
        type="text"
        value={inputVal}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          transition"
        aria-label="Search"
      />

      {/* Right icon — spinner or clear button */}
      <span className="absolute right-3 top-1/2 -translate-y-1/2">
        {showSpinner && <SpinnerIcon />}
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
            aria-label="Clear search">
            <XIcon />
          </button>
        )}
      </span>
    </div>
  );
};

export default SearchBar;
