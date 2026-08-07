"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-white h-auto py-2">
          <Globe className="h-4 w-4 text-secondary" />
          <span className="uppercase text-xs font-black tracking-widest">{language}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage("en")}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("hi")}>
          हिन्दी (Hindi)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("mr")}>
          Marathi
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("ta")}>
          Tamil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("te")}>
          Telugu
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("kn")}>
          Kannada
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("gu")}>
          Gujarati
        </DropdownMenuItem>   
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
