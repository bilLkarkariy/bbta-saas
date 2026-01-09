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

interface BookingFiltersProps {
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  paymentStatusFilter?: string;
  setPaymentStatusFilter?: (status: string) => void;
  dateFrom: string;
  setDateFrom: (date: string) => void;
  dateTo: string;
  setDateTo: (date: string) => void;
  search: string;
  setSearch: (search: string) => void;
}

export function BookingFilters({
  statusFilter,
  setStatusFilter,
  paymentStatusFilter = "all",
  setPaymentStatusFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  search,
  setSearch,
}: BookingFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full sm:w-[180px] glass">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="pending">En attente</SelectItem>
          <SelectItem value="confirmed">Confirmé</SelectItem>
          <SelectItem value="cancelled">Annulé</SelectItem>
          <SelectItem value="completed">Terminé</SelectItem>
          <SelectItem value="no_show">No-show</SelectItem>
        </SelectContent>
      </Select>

      {/* Payment Status Filter */}
      {setPaymentStatusFilter && (
        <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] glass">
            <SelectValue placeholder="Paiement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les paiements</SelectItem>
            <SelectItem value="unpaid">Non payé</SelectItem>
            <SelectItem value="deposit">Acompte versé</SelectItem>
            <SelectItem value="paid">Payé</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Date From */}
      <Input
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        placeholder="Date début"
        className="w-full sm:w-[180px] glass"
      />

      {/* Date To */}
      <Input
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        placeholder="Date fin"
        className="w-full sm:w-[180px] glass"
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
