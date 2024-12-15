"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { channelStore } from "@/lib/store";

interface SubjectSelectorProps {
  onSelect: (subject: string) => void;
}

export function SubjectSelector({ onSelect }: SubjectSelectorProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadSubjects = () => {
      try {
        channelStore.loadFromStorage();
        const availableSubjects = channelStore.getAllSubjects();
        console.log('Loading subjects:', availableSubjects);
        setSubjects(availableSubjects || []);
        
        if (value && !availableSubjects.includes(value)) {
          setValue("");
        }
      } catch (error) {
        console.error('Error loading subjects:', error);
        setSubjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubjects();

    const handleStorageChange = () => {
      loadSubjects();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('channelsUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('channelsUpdated', handleStorageChange);
    };
  }, [value]);

  const filteredSubjects = subjects.filter((subject) =>
    subject.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        Loading subjects...
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
          disabled={subjects.length === 0}
        >
          {value || "Select subject..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      {subjects.length > 0 && (
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search subject..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No subject found.</CommandEmpty>
              <CommandGroup>
                {filteredSubjects.map((subject) => (
                  <CommandItem
                    key={subject}
                    value={subject}
                    onSelect={(currentValue) => {
                      setValue(currentValue);
                      onSelect(currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === subject ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {subject}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  );
} 