import React, { useState } from "react";
import { Check, ChevronsUpDown, Plus, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Artist {
  id: string;
  name: string;
}

interface ArtistComboboxProps {
  artists: Artist[];
  value: string;
  onValueChange: (value: string) => void;
  onNewArtist: (artistName: string) => void;
  placeholder?: string;
  className?: string;
}

export function ArtistCombobox({
  artists,
  value,
  onValueChange,
  onNewArtist,
  placeholder = "Select or type a name...",
  className,
}: ArtistComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedArtist = artists.find((artist) => artist.id === value);

  const filteredArtists = artists.filter((artist) =>
    artist.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const isNewArtist =
    searchValue &&
    !artists.some(
      (artist) => artist.name.toLowerCase() === searchValue.toLowerCase()
    ) &&
    searchValue.length > 0;

  const handleSelect = (artistId: string) => {
    onValueChange(artistId === value ? "" : artistId);
    setOpen(false);
    setSearchValue("");
  };

  const handleCreateNew = () => {
    if (searchValue.trim()) {
      onNewArtist(searchValue.trim());
      setOpen(false);
      setSearchValue("");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-expanded={open}
          className={cn(
            "w-full flex items-center justify-between bg-background border border-border text-ivory hover:border-champagne/50 transition-colors px-4 py-3 text-left",
            !value && "text-muted-foreground/70",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-champagne" />
            <span className="font-display text-base">
              {selectedArtist ? selectedArtist.name : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="h-4 w-4 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border-border">
        <Command className="bg-transparent">
          <CommandInput
            placeholder="Search or type a new name..."
            value={searchValue}
            onValueChange={setSearchValue}
            className="text-ivory placeholder:text-muted-foreground/60 border-none"
          />
          <div className="max-h-60 overflow-y-auto">
            {isNewArtist && (
              <div className="p-1">
                <div
                  onClick={handleCreateNew}
                  className="flex items-center px-3 py-2.5 text-sm text-ivory hover:bg-secondary cursor-pointer transition-colors group"
                >
                  <Plus className="mr-2 h-4 w-4 text-champagne" />
                  <span>
                    Create new artist:{" "}
                    <span className="text-champagne font-display italic">
                      "{searchValue}"
                    </span>
                  </span>
                </div>
              </div>
            )}

            {filteredArtists.length > 0 ? (
              <CommandGroup
                heading="Roster"
                className="text-muted-foreground border-t border-border"
              >
                {filteredArtists.map((artist) => (
                  <CommandItem
                    key={artist.id}
                    value={artist.id}
                    onSelect={() => handleSelect(artist.id)}
                    className="text-ivory hover:bg-secondary cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-champagne",
                        value === artist.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <UserPlus className="mr-2 h-4 w-4 text-muted-foreground" />
                    {artist.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              !isNewArtist && (
                <CommandEmpty className="text-muted-foreground py-6 text-center font-display italic">
                  No artists found — type a name to create one.
                </CommandEmpty>
              )
            )}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
