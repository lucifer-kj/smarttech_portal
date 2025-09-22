'use client';

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: Date | string;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  format?: string;
  showTime?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  locale?: string;
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ 
    className, 
    value, 
    onChange, 
    placeholder = "Select date",
    format = "MM/dd/yyyy",
    showTime = false,
    minDate,
    maxDate,
    disabledDates = [],
    locale = "en-US",
    ...props 
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(
      value ? new Date(value) : null
    );
    const [currentMonth, setCurrentMonth] = React.useState(new Date());

    const formatDate = (date: Date) => {
      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        ...(showTime && {
          hour: '2-digit',
          minute: '2-digit',
        })
      });
    };

    const handleDateSelect = (date: Date) => {
      setSelectedDate(date);
      onChange?.(date);
      setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      if (inputValue) {
        const parsedDate = new Date(inputValue);
        if (!isNaN(parsedDate.getTime())) {
          setSelectedDate(parsedDate);
          onChange?.(parsedDate);
        }
      } else {
        setSelectedDate(null);
        onChange?.(null);
      }
    };

    const isDateDisabled = (date: Date) => {
      if (minDate && date < minDate) return true;
      if (maxDate && date > maxDate) return true;
      return disabledDates.some(disabledDate => 
        date.toDateString() === disabledDate.toDateString()
      );
    };

    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const days = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(year, month, day));
      }
      
      return days;
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
      setCurrentMonth(prev => {
        const newMonth = new Date(prev);
        if (direction === 'prev') {
          newMonth.setMonth(prev.getMonth() - 1);
        } else {
          newMonth.setMonth(prev.getMonth() + 1);
        }
        return newMonth;
      });
    };

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="relative">
        <div className="relative">
          <Input
            ref={ref}
            value={selectedDate ? formatDate(selectedDate) : ''}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={cn("pr-10", className)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
          >
            <Calendar className="h-4 w-4" />
          </button>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 p-4 min-w-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1 hover:bg-surface-100 rounded transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h3 className="text-sm font-medium text-surface-900">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                onClick={() => navigateMonth('next')}
                className="p-1 hover:bg-surface-100 rounded transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-xs font-medium text-surface-500 text-center py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentMonth).map((date, index) => {
                if (!date) {
                  return <div key={index} className="h-8" />;
                }

                const isSelected = selectedDate && 
                  date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                const isDisabled = isDateDisabled(date);

                return (
                  <button
                    key={index}
                    onClick={() => !isDisabled && handleDateSelect(date)}
                    disabled={isDisabled}
                    className={cn(
                      "h-8 w-8 text-sm rounded transition-colors",
                      isSelected && "bg-primary-600 text-white",
                      !isSelected && !isDisabled && "hover:bg-surface-100",
                      isToday && !isSelected && "bg-primary-100 text-primary-700",
                      isDisabled && "text-surface-300 cursor-not-allowed"
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Time picker */}
            {showTime && selectedDate && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-surface-500" />
                  <input
                    type="time"
                    value={selectedDate.toTimeString().slice(0, 5)}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':').map(Number);
                      const newDate = new Date(selectedDate);
                      newDate.setHours(hours, minutes);
                      setSelectedDate(newDate);
                      onChange?.(newDate);
                    }}
                    className="text-sm border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedDate(null);
                  onChange?.(null);
                  setIsOpen(false);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
);
DatePicker.displayName = "DatePicker";

// Date Range Picker Component
export interface DateRangePickerProps {
  startDate?: Date | string;
  endDate?: Date | string;
  onChange?: (startDate: Date | null, endDate: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  className?: string;
}

const DateRangePicker = React.forwardRef<HTMLDivElement, DateRangePickerProps>(
  ({ 
    startDate, 
    endDate, 
    onChange, 
    placeholder = "Select date range",
    minDate,
    maxDate,
    disabledDates = [],
    className,
    ...props 
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedStartDate, setSelectedStartDate] = React.useState<Date | null>(
      startDate ? new Date(startDate) : null
    );
    const [selectedEndDate, setSelectedEndDate] = React.useState<Date | null>(
      endDate ? new Date(endDate) : null
    );
    const [currentMonth, setCurrentMonth] = React.useState(new Date());

    const formatDateRange = () => {
      if (selectedStartDate && selectedEndDate) {
        return `${selectedStartDate.toLocaleDateString()} - ${selectedEndDate.toLocaleDateString()}`;
      } else if (selectedStartDate) {
        return `${selectedStartDate.toLocaleDateString()} - ...`;
      }
      return '';
    };

    const handleDateSelect = (date: Date) => {
      if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
        setSelectedStartDate(date);
        setSelectedEndDate(null);
      } else if (selectedStartDate && !selectedEndDate) {
        if (date >= selectedStartDate) {
          setSelectedEndDate(date);
          onChange?.(selectedStartDate, date);
          setIsOpen(false);
        } else {
          setSelectedStartDate(date);
          setSelectedEndDate(null);
        }
      }
    };

    const isDateInRange = (date: Date) => {
      if (!selectedStartDate) return false;
      if (!selectedEndDate) return date.toDateString() === selectedStartDate.toDateString();
      return date >= selectedStartDate && date <= selectedEndDate;
    };

    const isDateDisabled = (date: Date) => {
      if (minDate && date < minDate) return true;
      if (maxDate && date > maxDate) return true;
      return disabledDates.some(disabledDate => 
        date.toDateString() === disabledDate.toDateString()
      );
    };

    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const days = [];
      
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }
      
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(year, month, day));
      }
      
      return days;
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
      setCurrentMonth(prev => {
        const newMonth = new Date(prev);
        if (direction === 'prev') {
          newMonth.setMonth(prev.getMonth() - 1);
        } else {
          newMonth.setMonth(prev.getMonth() + 1);
        }
        return newMonth;
      });
    };

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <div className="relative">
          <Input
            value={formatDateRange()}
            placeholder={placeholder}
            readOnly
            className="pr-10"
            onClick={() => setIsOpen(!isOpen)}
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
          >
            <Calendar className="h-4 w-4" />
          </button>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 p-4 min-w-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1 hover:bg-surface-100 rounded transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h3 className="text-sm font-medium text-surface-900">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                onClick={() => navigateMonth('next')}
                className="p-1 hover:bg-surface-100 rounded transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-xs font-medium text-surface-500 text-center py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentMonth).map((date, index) => {
                if (!date) {
                  return <div key={index} className="h-8" />;
                }

                const isStartDate = selectedStartDate && 
                  date.toDateString() === selectedStartDate.toDateString();
                const isEndDate = selectedEndDate && 
                  date.toDateString() === selectedEndDate.toDateString();
                const isInRange = isDateInRange(date);
                const isToday = date.toDateString() === new Date().toDateString();
                const isDisabled = isDateDisabled(date);

                return (
                  <button
                    key={index}
                    onClick={() => !isDisabled && handleDateSelect(date)}
                    disabled={isDisabled}
                    className={cn(
                      "h-8 w-8 text-sm rounded transition-colors relative",
                      isStartDate && "bg-primary-600 text-white rounded-l-full",
                      isEndDate && "bg-primary-600 text-white rounded-r-full",
                      isInRange && !isStartDate && !isEndDate && "bg-primary-100 text-primary-700",
                      !isInRange && !isDisabled && "hover:bg-surface-100",
                      isToday && !isInRange && "bg-primary-50 text-primary-700",
                      isDisabled && "text-surface-300 cursor-not-allowed"
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedStartDate(null);
                  setSelectedEndDate(null);
                  onChange?.(null, null);
                  setIsOpen(false);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
);
DateRangePicker.displayName = "DateRangePicker";

export { DatePicker, DateRangePicker };
