"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface WaitingListFiltersProps {
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  dateFilter: string;
  setDateFilter: (date: string) => void;
  search: string;
  setSearch: (search: string) => void;
}

export function WaitingListFilters({
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  search,
  setSearch,
}: WaitingListFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full sm:w-[200px] glass">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="waiting">En attente</SelectItem>
          <SelectItem value="notified">Notifié</SelectItem>
          <SelectItem value="converted">Converti</SelectItem>
          <SelectItem value="cancelled">Annulé</SelectItem>
        </SelectContent>
      </Select>

      {/* Date Filter */}
      <Input
        type="date"
        value={dateFilter}
        onChange={(e) => setDateFilter(e.target.value)}
        placeholder="Date souhaitée"
        className="w-full sm:w-[200px] glass"
      />

      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom/téléphone"
          className="pl-10 glass"
        />
      </div>
    </div>
  );
}
