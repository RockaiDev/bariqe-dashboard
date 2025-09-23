import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Check,
  Calendar as CalendarIcon,
  X,
  Settings,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { useIntl } from "react-intl";

interface Pagination {
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
}

interface DateFilter {
  from?: Date;
  to?: Date;
}

interface FilterGroup {
  label: string;
  key: string;
  options: { label: string; value: string }[];
}

interface TableProps {
  title?: string;
  linkApply?: boolean;
  linkText?: string;
  isEmpty?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  columnCount?: number;
  searchAble?: boolean;
  filterAble?: boolean;
  filters?: Array<{
    label: string;
    key: string;
    options: Array<{ label: string; value: string }>;
  }>;
  dateFilterAble?: boolean;
  pagination?: Pagination;
  filterGroups?: FilterGroup[];
  searchProps?: {
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    placeholder?: string;
  };

  onFilterChange?: (filterKey: string, filterValue: string) => void;
  onDateFilterChange?: (dateFilter: DateFilter | null) => void;
  onSearch?: (value: string) => void;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  onFiltersApply?: (filters: Record<string, string>, dateFilter: DateFilter | null) => void;

  // sorting
  sort?: { key?: string; direction?: "asc" | "desc" };
  onSortChange?: (key?: string, direction?: "asc" | "desc") => void;

  RenderHead: React.FC<{ sort?: { key?: string; direction?: "asc" | "desc" }; onSortChange?: (key?: string, direction?: "asc" | "desc") => void }>;
  RenderBody: React.FC<{ getRowColor: (i: number) => string }>;
}

// -------------------- Helpers --------------------
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// -------------------- Sortable TH --------------------

export function SortableTH({
  sortKey,
  label,
  sort,
  onSortChange,
  className = '',
  colSpan,
}: {
  sortKey: string;
  label: React.ReactNode;
  sort?: { key?: string; direction?: 'asc' | 'desc' };
  onSortChange?: (key?: string, dir?: 'asc' | 'desc') => void;
  className?: string;
  colSpan?: number;
}) {
  const isActive = sort?.key === sortKey;
  const direction = isActive ? sort?.direction : undefined;

  const handleClick = () => {
    if (!onSortChange) return;
    if (!isActive) {
      onSortChange(sortKey, 'asc');
    } else {
      // toggle
      onSortChange(sortKey, direction === 'asc' ? 'desc' : 'asc');
    }
  };

  return (
    <th
      colSpan={colSpan}
      className={cn(
        'px-3 py-2 text-left text-sm font-medium select-none cursor-pointer hover:bg-gray-100',
        className
      )}
      onClick={handleClick}
      role="button"
      aria-sort={isActive ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <div className="flex items-center gap-2">
        <span className="truncate">{label}</span>
        <span className="flex items-center justify-center w-4 h-4">
          {/* indicator */}
          {isActive ? (
            direction === 'asc' ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )
          ) : (
            <ChevronsUpDown className="w-4 h-4 opacity-40" />
          )}
        </span>
      </div>
    </th>
  );
}

// -------------------- DataTable --------------------

function DataTable({
  title,
  linkApply = false,
  linkText,
  isEmpty,
  loading,
  icon,
  searchAble = true,
  filterAble = true,
  dateFilterAble = true,
  pagination,
  filterGroups = [],
  columnCount = 6,
  searchProps,
  onFilterChange,
  onDateFilterChange,
  onSearch,
  onPageChange,
  onPerPageChange,
  onFiltersApply,
  RenderHead,
  RenderBody,
  sort,
  onSortChange,
}: TableProps) {
  const intl = useIntl();
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [dateFilter, setDateFilter] = useState<DateFilter | null>(null);
  const [tempFilters, setTempFilters] = useState<Record<string, string>>({});
  const [tempDateFilter, setTempDateFilter] = useState<DateFilter | null>(null);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  // per-page input local state
  const [perPageInput, setPerPageInput] = useState<string>(String(pagination?.perPage || 15));

  useEffect(() => {
    // sync local input when pagination prop changes
    setPerPageInput(String(pagination?.perPage || 15));
  }, [pagination?.perPage]);

  // improve touch scrolling and ensure smooth overflow on mobile
  useEffect(() => {
    // rely on CSS for touch/momentum scrolling (set in index.css)
    // kept lightweight and safe for SSR
  }, []);

  const applyPerPage = () => {
    const n = Number(perPageInput);
    if (!n || n < 1 || !Number.isFinite(n)) {
      toast.error(intl.formatMessage({ id: 'table.valid_number_error' }));
      return;
    }
    if (onPerPageChange) onPerPageChange(n);
  };

  const getRowColor = (i: number) => (i % 2 === 0 ? "bg-white" : "bg-gray-50");

  const openFilterPopover = () => {
    setTempFilters({ ...activeFilters });
    setTempDateFilter(dateFilter ? { ...dateFilter } : null);
    setFilterPopoverOpen(true);
  };

  const validateDateFilter = (dateFilterParam: DateFilter | null): DateFilter | null => {
    if (!dateFilterParam) return null;
    if ((dateFilterParam.from && !dateFilterParam.to) || (!dateFilterParam.from && dateFilterParam.to)) {
      toast.error(intl.formatMessage({ id: 'table.select_both_dates_error' }));
      return null;
    }
    if (dateFilterParam.from && dateFilterParam.to) {
      if (dateFilterParam.from > dateFilterParam.to) {
        toast.error(intl.formatMessage({ id: 'table.from_date_later_error' }));
        return null;
      }
      return dateFilterParam;
    }
    return null;
  };

  const applyFilters = () => {
    const validatedDateFilter = validateDateFilter(tempDateFilter);
    if (tempDateFilter && !validatedDateFilter) {
      return;
    }
    setActiveFilters({ ...tempFilters });
    setDateFilter(validatedDateFilter);

    if (onFiltersApply) {
      onFiltersApply(tempFilters, validatedDateFilter);
    } else {
      Object.entries(tempFilters).forEach(([key, value]) => {
        if (onFilterChange) onFilterChange(key, value || "all");
      });
      if (onDateFilterChange) onDateFilterChange(validatedDateFilter);
    }

    setFilterPopoverOpen(false);
    if (validatedDateFilter || Object.keys(tempFilters).some(key => tempFilters[key] && tempFilters[key] !== 'all')) {
      toast.success(intl.formatMessage({ id: 'table.filters_applied' }));
    }
  };

  const cancelFilters = () => {
    setTempFilters({ ...activeFilters });
    setTempDateFilter(dateFilter ? { ...dateFilter } : null);
    setFilterPopoverOpen(false);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setDateFilter(null);
    setTempFilters({});
    setTempDateFilter(null);
    if (onFiltersApply) onFiltersApply({}, null);
    else {
      if (onDateFilterChange) onDateFilterChange(null);
      filterGroups.forEach(group => {
        if (onFilterChange) onFilterChange(group.key, "all");
      });
    }
    toast.success(intl.formatMessage({ id: 'table.filters_cleared' }));
  };

  const clearSingleFilter = (filterKey: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[filterKey];
    setActiveFilters(newFilters);
    if (onFiltersApply) onFiltersApply(newFilters, dateFilter);
    else if (onFilterChange) onFilterChange(filterKey, "all");
  };

  const clearDateFilterOnly = () => {
    setDateFilter(null);
    if (onFiltersApply) onFiltersApply(activeFilters, null);
    else if (onDateFilterChange) onDateFilterChange(null);
  };

  const handleTempFilterChange = (filterKey: string, filterValue: string) => {
    setTempFilters(prev => ({ ...prev, [filterKey]: filterValue }));
  };

  const handleTempDateChange = (field: 'from' | 'to', date?: Date) => {
    setTempDateFilter(prev => ({ ...prev, [field]: date }));
  };

  // 🟢 NEW: Clear search function
// 🟢 NEW: Clear search function - Updated
const clearSearch = () => {
  // Clear search
  setSearch("");
  setAppliedSearch("");
  if (onSearch) onSearch("");
  
  // Clear all filters (same as clearAllFilters)
  setActiveFilters({});
  setDateFilter(null);
  setTempFilters({});
  setTempDateFilter(null);
  
  if (onFiltersApply) {
    onFiltersApply({}, null);
  } else {
    if (onDateFilterChange) onDateFilterChange(null);
    filterGroups.forEach(group => {
      if (onFilterChange) onFilterChange(group.key, "all");
    });
  }
  
  toast.success(intl.formatMessage({ id: 'table.search_cleared' }));
};

  // 🟢 NEW: Handle search change
  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const activeFiltersCount = Object.keys(activeFilters).filter(key => activeFilters[key] && activeFilters[key] !== 'all').length + (dateFilter ? 1 : 0);
  const hasActiveFilters = activeFiltersCount > 0;
  const hasChanges = JSON.stringify(tempFilters) !== JSON.stringify(activeFilters) || JSON.stringify(tempDateFilter) !== JSON.stringify(dateFilter);

  const hasDateError = tempDateFilter && ((tempDateFilter.from && !tempDateFilter.to) || (!tempDateFilter.from && tempDateFilter.to) || (tempDateFilter.from && tempDateFilter.to && tempDateFilter.from > tempDateFilter.to));

  const renderPaginationButtons = () => {
    if (!pagination || pagination.lastPage <= 1) return null;

    const { currentPage, lastPage } = pagination;
    const pages = [] as React.ReactNode[];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(lastPage, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(
        <Button key={1} variant="outline" size="sm" onClick={() => onPageChange && onPageChange(1)} className="h-8 w-8 p-0">1</Button>
      );
      if (startPage > 2) pages.push(<span key="ellipsis-start" className="px-2 text-gray-400 text-sm">...</span>);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button key={i} variant={i === currentPage ? "default" : "outline"} size="sm" onClick={() => onPageChange && onPageChange(i)} className={`h-8 w-8 p-0 ${i === currentPage ? "text-white" : "text-black"}`}>{i}</Button>
      );
    }

    if (endPage < lastPage) {
      if (endPage < lastPage - 1) pages.push(<span key="ellipsis-end" className="px-2 text-gray-400 text-sm">...</span>);
      pages.push(
        <Button key={lastPage} variant="outline" size="sm" onClick={() => onPageChange && onPageChange(lastPage)} className="h-8 w-8 p-0">{lastPage}</Button>
      );
    }

    return pages;
  };

  const startItem = pagination ? (pagination.currentPage - 1) * pagination.perPage + 1 : 0;
  const endItem = pagination ? Math.min(pagination.currentPage * pagination.perPage, pagination.total) : 0;

  return (
    <div className="relative max-w-full rounded-lg border shadow-sm bg-white mx-auto">
      {/* Header Controls */}
  <div className="flex flex-col md:flex-row gap-3 md:gap-2 justify-between items-start md:items-center p-4 border-b bg-gray-50">
        {title && (
          <div className="flex items-center gap-2 min-w-0">
            {icon && (
              <div className="flex items-center justify-center p-2 bg-[#021031] rounded-md shadow-md flex-shrink-0">
                {React.createElement(icon, { className: "h-5 w-5 text-white" })}
              </div>
            )}
            <h2 className="font-semibold text-lg truncate">{title}</h2>
          </div>
        )}

  <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end">
          {linkApply && (
            <Link to={linkText || ""} className="text-sm text-primary hover:underline">
              view Table
            </Link>
          )}
          
          {searchAble && (
            <div className="flex items-center bg-white border border-gray-300 rounded-md px-2 min-w-0 flex-1 md:flex-initial md:w-64 relative" dir={intl.locale === "ar" ? "rtl" : "ltr"}>
              <Search className="text-gray-400 mr-2 h-4 w-4 flex-shrink-0" />
              <Input
                placeholder={searchProps?.placeholder || "Search..."}
                className="!border-0 shadow-none h-8 p-0 pr-6 focus:!ring-0 focus-visible:!ring-0 text-sm"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setAppliedSearch(search);
                    if (onSearch) onSearch(search);
                  }
                  if (searchProps?.onKeyDown) searchProps.onKeyDown(e);
                }}
              />
              {/* 🟢 Clear Search Button */}
              {search && (
                <button
                  onClick={clearSearch}
                  className={`absolute ${intl.locale === "en" ? "right-2" : "left-2"}  top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors`}
                  title="Clear search"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {filterAble && (filterGroups.length > 0 || dateFilterAble) && (
            <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" onClick={openFilterPopover} className={cn("gap-2 text-sm font-normal relative", hasActiveFilters && "bg-primary/10 border-primary")}>
                  <Settings className="w-4 h-4" />
                  <span>{intl.formatMessage({ id: 'table.filters' })}</span>
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{activeFiltersCount}</span>
                  )}
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-gray-700">{intl.formatMessage({ id: 'table.filter_options' })}</h4>
                    <Button variant="ghost" size="sm" onClick={() => { setTempFilters({}); setTempDateFilter(null); }} className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2">{intl.formatMessage({ id: 'table.clear_all' })}</Button>
                  </div>

                  {dateFilterAble && (
                    <div className={cn("space-y-3 p-3 border rounded-lg", hasDateError ? "bg-red-50/50 border-red-200" : "bg-gray-50/50")}>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium text-gray-700">{intl.formatMessage({ id: 'table.date_range' })}</Label>
                        {hasDateError && (<AlertCircle className="w-4 h-4 text-red-500" />)}
                      </div>

                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-600">From Date</Label>
                          <Input type="date" value={tempDateFilter?.from ? formatDateForInput(tempDateFilter.from) : ""} onChange={(e) => { const fromDate = e.target.value ? new Date(e.target.value) : undefined; handleTempDateChange('from', fromDate); }} className={cn("w-full h-8", hasDateError && "border-red-300 focus:border-red-500")} />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-gray-600">To Date</Label>
                          <Input type="date" value={tempDateFilter?.to ? formatDateForInput(tempDateFilter.to) : ""} onChange={(e) => { const toDate = e.target.value ? new Date(e.target.value) : undefined; handleTempDateChange('to', toDate); }} className={cn("w-full h-8", hasDateError && "border-red-300 focus:border-red-500")} min={tempDateFilter?.from ? formatDateForInput(tempDateFilter.from) : ""} />
                        </div>

                        {hasDateError && (
                          <div className="p-2 bg-red-100 border border-red-200 rounded-md">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                              <div className="text-xs text-red-700">{(tempDateFilter?.from && !tempDateFilter?.to) || (!tempDateFilter?.from && tempDateFilter?.to) ? (<span>Please select both 'From' and 'To' dates</span>) : tempDateFilter?.from && tempDateFilter?.to && tempDateFilter.from > tempDateFilter.to ? (<span>'From' date cannot be later than 'To' date</span>) : null}</div>
                            </div>
                          </div>
                        )}

                        {tempDateFilter?.from && tempDateFilter?.to && !hasDateError && (
                          <div className="p-2 bg-blue-50 rounded-md border border-blue-200">
                            <p className="text-xs text-blue-800"><strong>Selected:</strong> {formatDate(tempDateFilter.from)} - {formatDate(tempDateFilter.to)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {filterGroups.map((group) => {
                    const selectedValue = tempFilters[group.key] || "all";
                    return (
                      <div key={group.key} className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{group.label}</Label>
                        <Select value={selectedValue} onValueChange={(value) => handleTempFilterChange(group.key, value)}>
                          <SelectTrigger className="w-full h-8">
                            <SelectValue placeholder={`Select ${group.label.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {group.options.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{option.label}</span>
                                  {selectedValue === option.value && (<Check className="w-4 h-4 text-primary ml-2" />)}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}

                  <div className="flex gap-2 p-4 border-t bg-gray-50/50">
                    <Button variant="outline" onClick={cancelFilters} className="flex-1 text-sm">Cancel</Button>
                    <Button onClick={applyFilters} className="flex-1 text-sm text-white" disabled={!hasChanges}>Apply Filters</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearAllFilters} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="px-4 py-2 bg-blue-50 border-b flex flex-wrap gap-2 items-center">
          <span className="text-sm text-blue-800 font-medium">Active Filters:</span>
          {Object.entries(activeFilters).map(([key, value]) => {
            if (value === 'all' || !value) return null;
            const group = filterGroups.find(g => g.key === key);
            const option = group?.options.find(opt => opt.value === value);
            if (!group || !option) return null;
            return (
              <div key={key} className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-md text-sm">
                <span className="text-blue-800 font-medium">{group.label}: {option.label}</span>
                <button onClick={() => clearSingleFilter(key)} className="ml-1 hover:bg-blue-200 rounded-full p-0.5"><X className="w-3 h-3 text-blue-800" /></button>
              </div>
            );
          })}

          {dateFilter && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-md text-sm">
              <CalendarIcon className="w-3 h-3 text-green-800" />
              <span className="text-green-800 font-medium">Date: {formatDate(dateFilter.from!)} - {formatDate(dateFilter.to!)}</span>
              <button onClick={clearDateFilterOnly} className="ml-1 hover:bg-green-200 rounded-full p-0.5"><X className="w-3 h-3 text-green-800" /></button>
            </div>
          )}
        </div>
      )}

      {/* 🟢 Active Search Display */}
      {appliedSearch && (
        <div className="px-4 py-2 bg-yellow-50 border-b flex flex-wrap gap-2 items-center">
          <span className="text-sm text-yellow-800 font-medium">Search:</span>
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-md text-sm">
            <Search className="w-3 h-3 text-yellow-800" />
            <span className="text-yellow-800 font-medium">"{appliedSearch}"</span>
            <button onClick={clearSearch} className="ml-1 hover:bg-yellow-200 rounded-full p-0.5">
              <X className="w-3 h-3 text-yellow-800" />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {/* Table */}
      <div className=" overflow-x-auto  w-full ">
        <Table className="border-collapse whitespace-nowrap max-w-full">
            <TableHeader>
              <TableRow>
                {/* Pass sort props to RenderHead */}
                <RenderHead sort={sort} onSortChange={onSortChange} />
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columnCount} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="text-gray-500 text-sm">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isEmpty ? (
                <TableRow>
                  <TableCell colSpan={columnCount} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Search className="w-6 h-6 text-gray-400" />
                      </div>
                      <span className="text-gray-500 text-sm font-medium">No data available</span>
                      <span className="text-gray-400 text-xs">Try adjusting your search or filter criteria</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <RenderBody getRowColor={getRowColor} />
              )}
            </TableBody>
        </Table>
      </div>
      {/* </div> */}

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t bg-gray-50/50">
          <div className="text-sm text-gray-600 order-2 sm:order-1">Showing <strong className="font-medium">{startItem}</strong> to <strong className="font-medium">{endItem}</strong> of <strong className="font-medium">{pagination.total}</strong> results</div>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            {/* Per-page numeric input (custom value) */}
            <div className="flex items-center gap-2 mr-2">
              <Label className="text-sm">Per page</Label>
              {/* local input to allow custom per-page value */}
              <div>
                <Input
                  type="number"
                  min={1}
                  className="w-20 h-8"
                  value={perPageInput}
                  onChange={(e) => setPerPageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      applyPerPage();
                    }
                  }}
                />
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => onPageChange && onPageChange(1)} disabled={pagination.currentPage === 1} className="h-8 w-8 p-0 hidden sm:flex" title="First page"><ChevronsLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange && onPageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="h-8 w-8 p-0" title="Previous page"><ChevronLeft className="w-4 h-4" /></Button>

            <div className="flex items-center gap-1">
              {renderPaginationButtons()}
            </div>

            <Button variant="outline" size="sm" onClick={() => onPageChange && onPageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.lastPage} className="h-8 w-8 p-0" title="Next page"><ChevronRight className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange && onPageChange(pagination.lastPage)} disabled={pagination.currentPage === pagination.lastPage} className="h-8 w-8 p-0 hidden sm:flex" title="Last page"><ChevronsRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
