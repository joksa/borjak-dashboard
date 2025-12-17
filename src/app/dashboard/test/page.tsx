'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronsUpDown, Check } from "lucide-react";

export default function TestPopoverDialog() {
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [comboboxValue, setComboboxValue] = useState("");

  // Fixed test data
  const types = [
    { id: 1, naziv: "Gorivo" },
    { id: 2, naziv: "Putarina" },
    { id: 3, naziv: "Održavanje" },
    { id: 4, naziv: "Parking" },
  ];

  return (
    <div className="p-10">
      <Button onClick={() => setIsDialogOpen(true)}>Open Dialog</Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] pointer-events-auto">
          <DialogHeader>
            <DialogTitle>Test Popover + Command</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2 flex flex-col">
              <Label>Tip Troška</Label>

              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-full justify-between"
                  >
                    {comboboxValue && types.find((t) => t.id.toString() === comboboxValue)
                      ? types.find((t) => t.id.toString() === comboboxValue)?.naziv
                      : "Izaberi ili unesi tip..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[300px] p-0 z-[9999] pointer-events-auto">
                  <Command
                    filter={(value, search) => {
                      if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                      return 0;
                    }}
                  >
                    <CommandInput placeholder="Pretraži tip..." />
                    <CommandList className="pointer-events-auto">
                      <CommandEmpty>Nema rezultata.</CommandEmpty>

                      <CommandGroup>
                        {types.map((type) => (
                          <CommandItem
                            key={type.id}
                            value={type.naziv}
                            onSelect={() => {
                              setComboboxValue(type.id.toString());
                              setOpenCombobox(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${comboboxValue === type.id.toString() ? "opacity-100" : "opacity-0"}`}
                            />
                            {type.naziv}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs text-muted-foreground">Ili unesite novi:</span>
                <Input
                  placeholder="Novi tip troška..."
                  value={types.find((t) => t.id.toString() === comboboxValue) ? "" : comboboxValue}
                  onChange={(e) => setComboboxValue(e.target.value)}
                  className="h-8"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Zatvori
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}