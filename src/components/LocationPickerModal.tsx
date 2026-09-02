import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Search,
  X,
  Check,
  Trash2,
  Building2,
  Navigation,
  ShieldCheck,
  Sparkles,
  Info,
  Compass,
} from 'lucide-react';
import { LocationMemory } from '../types';
import { PlaceSuggestion, searchPlaces } from '../lib/placesService';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation?: LocationMemory | null;
  onSelectLocation: (location: LocationMemory | null) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<LocationMemory | null>(currentLocation || null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedPlace(currentLocation || null);
      setSearchQuery(currentLocation?.name || '');
      performSearch(currentLocation?.name || '');
    }
  }, [isOpen, currentLocation]);

  const performSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const results = await searchPlaces(query);
      setSuggestions(results);
    } catch (err) {
      console.error('Error fetching places suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce Google Places autocomplete queries (300ms) for cost safety & performance
    debounceTimerRef.current = setTimeout(() => {
      performSearch(val);
    }, 300);
  };

  const handleSelectSuggestion = (place: PlaceSuggestion) => {
    const newLoc: LocationMemory = {
      placeId: place.placeId,
      name: place.name,
      formattedAddress: place.formattedAddress,
      city: place.city,
      locality: place.locality,
      country: place.country,
      lat: place.lat,
      lng: place.lng,
      taggedAt: Date.now(),
    };
    setSelectedPlace(newLoc);
    onSelectLocation(newLoc);
    onClose();
  };

  const handleRemoveLocation = () => {
    setSelectedPlace(null);
    onSelectLocation(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-lg rounded-2xl theme-bg-surface theme-border border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          id="location-picker-modal"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b theme-border bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-1 ring-emerald-500/20">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-gemini-display theme-text-primary flex items-center gap-1.5">
                  Attach Location Memory
                </h3>
                <p className="text-xs theme-text-secondary">
                  Connect a real place or city with this reflection
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg theme-text-secondary hover:theme-text-primary theme-bg-subtle hover:theme-bg-hover transition-colors"
              aria-label="Close"
              id="btn-close-location-modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Privacy Transparency Notice */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div className="space-y-0.5">
                <span className="font-semibold block">Privacy Transparency</span>
                <p className="text-[11px] leading-relaxed opacity-90">
                  Location data is strictly private to your vault, stored securely in your owner-isolated Firestore record, and only attached when you explicitly choose to tag a place.
                </p>
              </div>
            </div>

            {/* Currently Selected Location Badge */}
            {currentLocation && (
              <div className="p-3 rounded-xl border theme-border theme-bg-subtle flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold theme-text-primary truncate">
                      {currentLocation.name}
                    </div>
                    <div className="text-[11px] theme-text-secondary truncate">
                      {currentLocation.city ? `${currentLocation.city} • ` : ''}{currentLocation.formattedAddress}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleRemoveLocation}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg text-rose-600 hover:bg-rose-500/10 border border-rose-500/20 transition-colors shrink-0 flex items-center gap-1"
                  title="Remove location from this entry"
                  id="btn-remove-attached-location"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            )}

            {/* Search Input Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold theme-text-secondary uppercase tracking-wider flex items-center gap-1">
                <Search className="w-3.5 h-3.5" />
                Search Google Places
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleInputChange}
                  placeholder="e.g. Absolute Barbecues, Coimbatore or Central Park..."
                  className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl theme-bg-subtle theme-text-primary border theme-border focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 transition-all"
                  autoFocus
                  id="input-places-search"
                />
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted" />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      performSearch('');
                    }}
                    className="absolute right-2.5 top-2.5 p-1 rounded-md text-muted hover:theme-text-primary"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Suggestions List */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs theme-text-secondary font-medium">
                <span>Places & Suggestions</span>
                {isLoading && <span className="text-[11px] animate-pulse">Searching Google Places...</span>}
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {suggestions.map((suggestion) => {
                  const isCurrent = currentLocation?.placeId === suggestion.placeId;
                  return (
                    <button
                      key={suggestion.placeId}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 group ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'theme-border theme-bg-surface hover:theme-bg-subtle'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg theme-bg-subtle group-hover:bg-emerald-500/15 flex items-center justify-center theme-text-secondary group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0 mt-0.5 transition-colors">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold theme-text-primary group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                            {suggestion.name}
                          </div>
                          <div className="text-[11px] theme-text-secondary line-clamp-1 mt-0.5">
                            {suggestion.formattedAddress}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-center">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          {suggestion.city}
                        </span>
                        {isCurrent && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t theme-border theme-bg-subtle flex items-center justify-between text-xs theme-text-secondary">
            <span className="flex items-center gap-1 text-[11px]">
              <Compass className="w-3.5 h-3.5 text-emerald-500" />
              Powered by Google Places API
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg theme-bg-surface hover:theme-bg-hover border theme-border font-medium theme-text-primary transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
