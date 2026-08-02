"use client";

import { useState, useRef, useEffect } from "react";
import { HiOutlineMagnifyingGlass, HiOutlineChevronDown } from "react-icons/hi2";

const COUNTRIES = [
  { code: "+20", country: "EG", name: "Egypt", flag: "\u{1F1EA}\u{1F1EC}" },
  { code: "+1", country: "US", name: "United States", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "+44", country: "GB", name: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "+966", country: "SA", name: "Saudi Arabia", flag: "\u{1F1F8}\u{1F1E6}" },
  { code: "+971", country: "AE", name: "UAE", flag: "\u{1F1E6}\u{1F1EA}" },
  { code: "+965", country: "KW", name: "Kuwait", flag: "\u{1F1F0}\u{1F1FC}" },
  { code: "+973", country: "BH", name: "Bahrain", flag: "\u{1F1E7}\u{1F1ED}" },
  { code: "+968", country: "OM", name: "Oman", flag: "\u{1F1F4}\u{1F1F2}" },
  { code: "+974", country: "QA", name: "Qatar", flag: "\u{1F1F6}\u{1F1E6}" },
  { code: "+962", country: "JO", name: "Jordan", flag: "\u{1F1EF}\u{1F1F4}" },
  { code: "+961", country: "LB", name: "Lebanon", flag: "\u{1F1F1}\u{1F1E7}" },
  { code: "+212", country: "MA", name: "Morocco", flag: "\u{1F1F2}\u{1F1E6}" },
  { code: "+216", country: "TN", name: "Tunisia", flag: "\u{1F1F9}\u{1F1F3}" },
  { code: "+213", country: "DZ", name: "Algeria", flag: "\u{1F1E9}\u{1F1FF}" },
  { code: "+218", country: "LY", name: "Libya", flag: "\u{1F1F1}\u{1F1FE}" },
  { code: "+249", country: "SD", name: "Sudan", flag: "\u{1F1F8}\u{1F1E9}" },
  { code: "+252", country: "SO", name: "Somalia", flag: "\u{1F1F8}\u{1F1F4}" },
  { code: "+254", country: "KE", name: "Kenya", flag: "\u{1F1F0}\u{1F1EA}" },
  { code: "+234", country: "NG", name: "Nigeria", flag: "\u{1F1F3}\u{1F1EC}" },
  { code: "+27", country: "ZA", name: "South Africa", flag: "\u{1F1FF}\u{1F1E6}" },
  { code: "+49", country: "DE", name: "Germany", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "+33", country: "FR", name: "France", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "+39", country: "IT", name: "Italy", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "+34", country: "ES", name: "Spain", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "+31", country: "NL", name: "Netherlands", flag: "\u{1F1F3}\u{1F1F1}" },
  { code: "+46", country: "SE", name: "Sweden", flag: "\u{1F1F8}\u{1F1EA}" },
  { code: "+47", country: "NO", name: "Norway", flag: "\u{1F1F3}\u{1F1F4}" },
  { code: "+48", country: "PL", name: "Poland", flag: "\u{1F1F5}\u{1F1F1}" },
  { code: "+7", country: "RU", name: "Russia", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "+86", country: "CN", name: "China", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "+81", country: "JP", name: "Japan", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "+82", country: "KR", name: "South Korea", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "+91", country: "IN", name: "India", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "+90", country: "TR", name: "Turkey", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "+55", country: "BR", name: "Brazil", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "+52", country: "MX", name: "Mexico", flag: "\u{1F1F2}\u{1F1FD}" },
  { code: "+61", country: "AU", name: "Australia", flag: "\u{1F1E6}\u{1F1FA}" },
  { code: "+64", country: "NZ", name: "New Zealand", flag: "\u{1F1F3}\u{1F1FF}" },
  { code: "+963", country: "SY", name: "Syria", flag: "\u{1F1F8}\u{1F1FE}" },
  { code: "+964", country: "IQ", name: "Iraq", flag: "\u{1F1EE}\u{1F1F6}" },
  { code: "+98", country: "IR", name: "Iran", flag: "\u{1F1EE}\u{1F1F7}" },
  { code: "+92", country: "PK", name: "Pakistan", flag: "\u{1F1F5}\u{1F1F0}" },
  { code: "+880", country: "BD", name: "Bangladesh", flag: "\u{1F1E7}\u{1F1E9}" },
  { code: "+94", country: "LK", name: "Sri Lanka", flag: "\u{1F1F1}\u{1F1F0}" },
  { code: "+66", country: "TH", name: "Thailand", flag: "\u{1F1F9}\u{1F1ED}" },
  { code: "+60", country: "MY", name: "Malaysia", flag: "\u{1F1F2}\u{1F1FE}" },
  { code: "+62", country: "ID", name: "Indonesia", flag: "\u{1F1EE}\u{1F1E9}" },
  { code: "+63", country: "PH", name: "Philippines", flag: "\u{1F1F5}\u{1F1ED}" },
  { code: "+84", country: "VN", name: "Vietnam", flag: "\u{1F1FB}\u{1F1F3}" },
].sort((a, b) => a.name.localeCompare(b.name));

interface CountryCodeSelectProps {
  value: string;
  onChange: (code: string) => void;
}

export default function CountryCodeSelect({ value, onChange }: CountryCodeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedCountry = COUNTRIES.find((c) => c.code === value) || COUNTRIES[0];

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search) ||
      c.country.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="cc-select" ref={containerRef}>
      <button
        type="button"
        className="cc-select-trigger"
        onClick={() => { setIsOpen(!isOpen); setSearch(""); }}
      >
        <span className="cc-flag">{selectedCountry.flag}</span>
        <span className="cc-code">{selectedCountry.code}</span>
        <HiOutlineChevronDown size={14} className={`cc-chevron ${isOpen ? "open" : ""}`} />
      </button>

      {isOpen && (
        <div className="cc-dropdown">
          <div className="cc-search-wrap">
            <HiOutlineMagnifyingGlass size={14} className="cc-search-icon" />
            <input
              ref={searchRef}
              type="text"
              className="cc-search"
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="cc-list">
            {filtered.length === 0 && (
              <div className="cc-empty">No countries found</div>
            )}
            {filtered.map((c) => (
              <button
                key={c.code + c.country}
                type="button"
                className={`cc-option ${c.code === value ? "active" : ""}`}
                onClick={() => {
                  onChange(c.code);
                  setIsOpen(false);
                  setSearch("");
                }}
              >
                <span className="cc-flag">{c.flag}</span>
                <span className="cc-name">{c.name}</span>
                <span className="cc-code">{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
