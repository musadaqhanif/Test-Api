"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Country = {
  uuid: string;
  name: string;
};

type StateItem = {
  uuid: string;
  name: string;
};

type City = {
  uuid: string;
  name: string;
};

type SelectOption = {
  value: string;
  label: string;
};

type CustomSelectProps = {
  id: string;
  label: string;
  placeholder: string;
  options: SelectOption[];
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  isLoading?: boolean;
  loadingLabel?: string;
  emptyLabel?: string;
  isOpen: boolean;
  onToggleOpen: () => void;
  enableSearch?: boolean;
  canClear?: boolean;
  onClear?: () => void;
  isDefaultSelected?: boolean;
};

type ApiListResponse<T> = {
  success: boolean;
  status: number;
  count: number;
  results: T[];
};

const API_BASE_URL = "https://api-dev.autoby24.ch/api/core";
const STORAGE_KEY = "location-selector-selection-v1";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => {
      window.clearTimeout(handle);
    };
  }, [value, delayMs]);

  return debounced;
}

async function fetchList<T>(url: string): Promise<T[]> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = (await response.json()) as ApiListResponse<T>;

  if (!data.success) {
    throw new Error("API responded with an error status");
  }

  return data.results;
}

function CustomSelect({
  id,
  label,
  placeholder,
  options,
  value,
  disabled,
  onChange,
  isLoading,
  loadingLabel,
  emptyLabel,
  isOpen,
  onToggleOpen,
  enableSearch,
  canClear,
  onClear,
  isDefaultSelected,
}: CustomSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 150);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen && searchTerm !== "") {
      const timeoutId = window.setTimeout(() => {
        setSearchTerm("");
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }
    return undefined;
  }, [isOpen, searchTerm]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) {
        return;
      }

      if (!containerRef.current.contains(event.target as Node)) {
        onToggleOpen();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onToggleOpen]);

  const filteredOptions = useMemo(
    () =>
      enableSearch && debouncedSearchTerm.trim().length > 0
        ? options.filter((option) =>
            option.label.toLowerCase().includes(
              debouncedSearchTerm.toLowerCase(),
            ),
          )
        : options,
    [enableSearch, options, debouncedSearchTerm],
  );

  const hasOptions = filteredOptions.length > 0;

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    onToggleOpen();
  };

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? "";

  return (
    <div ref={containerRef} className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
      >
        {label}
      </label>
      <div className="relative">
        <button
          id={id}
          type="button"
          disabled={disabled}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={`${id}-listbox`}
          onClick={() => {
            if (!disabled) {
              onToggleOpen();
            }
          }}
          className="flex w-full items-center justify-between rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-left text-sm text-zinc-900 shadow-sm transition focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-100"
        >
          <span className="truncate">
            {isLoading && loadingLabel
              ? loadingLabel
              : !hasOptions && emptyLabel
                ? emptyLabel
                : selectedLabel || placeholder}
            {isDefaultSelected && selectedLabel && (
              <span className="ml-1 text-xs italic text-zinc-500">
                (default)
              </span>
            )}
          </span>
          <div className="ml-2 flex items-center gap-1 text-zinc-500">
            {canClear && value && (
              <span
                role="button"
                aria-label="Clear selection"
                tabIndex={0}
                className="rounded-full px-1 text-xs hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:hover:bg-zinc-700 dark:focus:ring-zinc-600"
                onClick={(event) => {
                  event.stopPropagation();
                  onClear?.();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    onClear?.();
                  }
                }}
              >
                ×
              </span>
            )}
            <span>▾</span>
          </div>
        </button>
        {isOpen && (
          <div
            id={`${id}-listbox`}
            role="listbox"
            className="absolute left-0 top-full z-20 mt-1 w-full origin-top rounded-lg border border-zinc-200 bg-white text-sm shadow-lg ring-1 ring-black/5 transition-transform transition-opacity duration-150 ease-out dark:border-zinc-700 dark:bg-zinc-900 dark:ring-white/10"
          >
            {enableSearch && (
              <div className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-700">
                <input
                  type="text"
                  autoFocus
                  placeholder="Type to search…"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                  }}
                  className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 outline-none ring-0 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>
            )}
            <div className="max-h-60 overflow-y-auto py-1">
              {filteredOptions.map((option) => {
                const label = option.label;
                const term = enableSearch ? debouncedSearchTerm.trim() : "";

                let highlighted: React.ReactNode = label;

                if (term.length > 0) {
                  const lowerLabel = label.toLowerCase();
                  const lowerTerm = term.toLowerCase();
                  const index = lowerLabel.indexOf(lowerTerm);

                  if (index >= 0) {
                    const before = label.slice(0, index);
                    const match = label.slice(index, index + term.length);
                    const after = label.slice(index + term.length);

                    highlighted = (
                      <>
                        {before}
                        <span className="bg-yellow-100 text-zinc-900 dark:bg-yellow-900/60 dark:text-yellow-100">
                          {match}
                        </span>
                        {after}
                      </>
                    );
                  }
                }

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    onClick={() => {
                      handleOptionClick(option.value);
                    }}
                    className={`flex w-full items-center px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                      option.value === value
                        ? "bg-zinc-100 font-medium dark:bg-zinc-800"
                        : ""
                    }`}
                  >
                    <span className="truncate">{highlighted}</span>
                  </button>
                );
              })}
              {!hasOptions && !isLoading && (
                <div className="px-3 py-2 text-zinc-500">
                  {emptyLabel ?? "No options available"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function LocationSelector() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateItem[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [selectedCountryId, setSelectedCountryId] = useState<string>("");
  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [selectedCityId, setSelectedCityId] = useState<string>("");

  const [isStateDefault, setIsStateDefault] = useState(false);
  const [isCityDefault, setIsCityDefault] = useState(false);

  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const selectedCountry = useMemo(
    () => countries.find((country) => country.uuid === selectedCountryId),
    [countries, selectedCountryId],
  );

  const selectedState = useMemo(
    () => states.find((state) => state.uuid === selectedStateId),
    [states, selectedStateId],
  );

  useEffect(() => {
    let isMounted = true;

    const loadCountries = async () => {
      try {
        setIsLoadingCountries(true);
        setError(null);

        const list = await fetchList<Country>(
          `${API_BASE_URL}/country?limit=all&format=json`,
        );

        if (!isMounted) return;

        setCountries(list);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load countries");
      } finally {
        if (isMounted) {
          setIsLoadingCountries(false);
        }
      }
    };

    loadCountries();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (countries.length === 0) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      if (!selectedCountryId && countries.length > 0) {
        setSelectedCountryId(countries[0].uuid);
      }
      return;
    }

    try {
      const parsed = JSON.parse(raw) as {
        countryId?: string;
        stateId?: string;
        cityId?: string;
      };

      if (
        parsed.countryId &&
        countries.some((country) => country.uuid === parsed.countryId)
      ) {
        setSelectedCountryId(parsed.countryId);
        if (parsed.stateId) {
          setSelectedStateId(parsed.stateId);
        }
        if (parsed.cityId) {
          setSelectedCityId(parsed.cityId);
        }
      } else if (!selectedCountryId && countries.length > 0) {
        setSelectedCountryId(countries[0].uuid);
      }
    } catch {
      if (!selectedCountryId && countries.length > 0) {
        setSelectedCountryId(countries[0].uuid);
      }
    }
  }, [countries, selectedCountryId]);

  useEffect(() => {
    if (!selectedCountry) {
      setStates([]);
      setSelectedStateId("");
      return;
    }

    let isMounted = true;

    const loadStates = async () => {
      try {
        setIsLoadingStates(true);
        setError(null);
        setStates([]);
        setSelectedStateId("");
        setCities([]);
        setSelectedCityId("");
        setIsStateDefault(false);
        setIsCityDefault(false);

        const list = await fetchList<StateItem>(
          `${API_BASE_URL}/state?country=${encodeURIComponent(selectedCountry.name)}&limit=all&format=json`,
        );

        if (!isMounted) return;

        setStates(list);

        if (list.length > 0) {
          setSelectedStateId(list[0].uuid);
          setIsStateDefault(true);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load states");
      } finally {
        if (isMounted) {
          setIsLoadingStates(false);
        }
      }
    };

    loadStates();

    return () => {
      isMounted = false;
    };
  }, [selectedCountry]);

  useEffect(() => {
    if (!selectedState) {
      setCities([]);
      setSelectedCityId("");
      return;
    }

    let isMounted = true;

    const loadCities = async () => {
      try {
        setIsLoadingCities(true);
        setError(null);
        setCities([]);
        setSelectedCityId("");
        setIsCityDefault(false);

        const list = await fetchList<City>(
          `${API_BASE_URL}/city?state=${encodeURIComponent(selectedState.name)}&limit=all&format=json`,
        );

        if (!isMounted) return;

        setCities(list);

        if (list.length > 0) {
          setSelectedCityId(list[0].uuid);
          setIsCityDefault(true);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load cities");
      } finally {
        if (isMounted) {
          setIsLoadingCities(false);
        }
      }
    };

    loadCities();

    return () => {
      isMounted = false;
    };
  }, [selectedState]);

  const selectedCity = useMemo(
    () => cities.find((city) => city.uuid === selectedCityId),
    [cities, selectedCityId],
  );

  const [openSelectId, setOpenSelectId] = useState<
    "country" | "state" | "city" | null
  >(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const payload = JSON.stringify({
      countryId: selectedCountryId || undefined,
      stateId: selectedStateId || undefined,
      cityId: selectedCityId || undefined,
    });

    window.localStorage.setItem(STORAGE_KEY, payload);
  }, [selectedCountryId, selectedStateId, selectedCityId]);

  return (
    <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white/80 p-8 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Location picker
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Choose a country, then a state, and finally a city. Each step is loaded
        on demand from the remote APIs.
      </p>

      <div className="mt-6 space-y-4">
        <CustomSelect
          id="country"
          label="Country"
          placeholder="Select a country"
          options={countries.map((country) => ({
            value: country.uuid,
            label: country.name,
          }))}
          value={selectedCountryId}
          disabled={isLoadingCountries || countries.length === 0}
          onChange={(newValue) => {
            setSelectedCountryId(newValue);
          }}
          isLoading={isLoadingCountries}
          loadingLabel="Loading countries…"
          emptyLabel="No countries available"
          isOpen={openSelectId === "country"}
          onToggleOpen={() => {
            setOpenSelectId((current) =>
              current === "country" ? null : "country",
            );
          }}
        />

        <CustomSelect
          id="state"
          label="State"
          placeholder="Select a state"
          options={states.map((state) => ({
            value: state.uuid,
            label: state.name,
          }))}
          value={selectedStateId}
          disabled={
            !selectedCountry ||
            isLoadingStates ||
            isLoadingCountries ||
            states.length === 0
          }
          onChange={(newValue) => {
            setSelectedStateId(newValue);
            setIsStateDefault(false);
            setIsCityDefault(false);
          }}
          isLoading={!!selectedCountry && isLoadingStates}
          loadingLabel="Loading states…"
          emptyLabel={
            selectedCountry ? "No states available" : "Select a country first"
          }
          isOpen={openSelectId === "state"}
          onToggleOpen={() => {
            setOpenSelectId((current) => (current === "state" ? null : "state"));
          }}
          enableSearch
          canClear
          onClear={() => {
            setSelectedStateId("");
            setIsStateDefault(false);
            setCities([]);
            setSelectedCityId("");
            setIsCityDefault(false);
          }}
          isDefaultSelected={isStateDefault}
        />

        <CustomSelect
          id="city"
          label="City"
          placeholder="Select a city"
          options={cities.map((city) => ({
            value: city.uuid,
            label: city.name,
          }))}
          value={selectedCityId}
          disabled={
            !selectedState ||
            isLoadingCities ||
            isLoadingStates ||
            cities.length === 0
          }
          onChange={(newValue) => {
            setSelectedCityId(newValue);
            setIsCityDefault(false);
          }}
          isLoading={!!selectedState && isLoadingCities}
          loadingLabel="Loading cities…"
          emptyLabel={
            selectedState ? "No cities available" : "Select a state first"
          }
          isOpen={openSelectId === "city"}
          onToggleOpen={() => {
            setOpenSelectId((current) => (current === "city" ? null : "city"));
          }}
          enableSearch
          canClear
          onClear={() => {
            setSelectedCityId("");
            setIsCityDefault(false);
          }}
          isDefaultSelected={isCityDefault}
        />
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mt-6 rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-800">
        <p className="font-medium">Current selection</p>
        <p className="mt-1">
          Country:{" "}
          <span className="font-semibold">
            {selectedCountry ? selectedCountry.name : "—"}
          </span>
        </p>
        <p>
          State:{" "}
          <span className="font-semibold">
            {selectedState ? selectedState.name : "—"}
          </span>
        </p>
        <p>
          City:{" "}
          <span className="font-semibold">
            {selectedCity ? selectedCity.name : "—"}
          </span>
        </p>
      </div>
    </div>
  );
}

