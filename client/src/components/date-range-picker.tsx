import * as React from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerWithRangeProps {
  className?: string;
  date?: DateRange;
  onDateChange?: (date: DateRange | undefined) => void;
  showTime?: boolean;
  requireConfirmation?: boolean;
}

interface DateTimeRange extends DateRange {
  fromTime?: string;
  toTime?: string;
}

export function DatePickerWithRange({
  className,
  date,
  onDateChange,
  showTime = false,
  requireConfirmation = false,
}: DatePickerWithRangeProps) {
  const [selectedDate, setSelectedDate] = React.useState<DateRange | undefined>(date);
  const [fromTime, setFromTime] = React.useState<string>("00:00");
  const [toTime, setToTime] = React.useState<string>("23:59");
  const [tempDate, setTempDate] = React.useState<DateRange | undefined>(date);
  const [tempFromTime, setTempFromTime] = React.useState<string>("00:00");
  const [tempToTime, setTempToTime] = React.useState<string>("23:59");
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    setSelectedDate(date);
    setTempDate(date);
  }, [date]);

  const handleDateChange = (newDate: DateRange | undefined) => {
    if (requireConfirmation) {
      setTempDate(newDate);
    } else {
      if (newDate && showTime) {
        // Объединяем дату и время
        const dateWithTime = {
          from: newDate.from ? combineDateTime(newDate.from, fromTime) : undefined,
          to: newDate.to ? combineDateTime(newDate.to, toTime) : undefined,
        };
        setSelectedDate(dateWithTime);
        onDateChange?.(dateWithTime);
      } else {
        setSelectedDate(newDate);
        onDateChange?.(newDate);
      }
    }
  };

  const handleTimeChange = (timeType: 'from' | 'to', time: string) => {
    if (requireConfirmation) {
      if (timeType === 'from') {
        setTempFromTime(time);
      } else {
        setTempToTime(time);
      }
    } else {
      if (timeType === 'from') {
        setFromTime(time);
      } else {
        setToTime(time);
      }

      if (selectedDate) {
        const dateWithTime = {
          from: selectedDate.from ? combineDateTime(selectedDate.from, timeType === 'from' ? time : fromTime) : undefined,
          to: selectedDate.to ? combineDateTime(selectedDate.to, timeType === 'to' ? time : toTime) : undefined,
        };
        setSelectedDate(dateWithTime);
        onDateChange?.(dateWithTime);
      }
    }
  };

  const handleConfirm = () => {
    if (tempDate && showTime) {
      const dateWithTime = {
        from: tempDate.from ? combineDateTime(tempDate.from, tempFromTime) : undefined,
        to: tempDate.to ? combineDateTime(tempDate.to, tempToTime) : undefined,
      };
      setSelectedDate(dateWithTime);
      setFromTime(tempFromTime);
      setToTime(tempToTime);
      onDateChange?.(dateWithTime);
    } else {
      setSelectedDate(tempDate);
      onDateChange?.(tempDate);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempDate(selectedDate);
    setTempFromTime(fromTime);
    setTempToTime(toTime);
    setIsOpen(false);
  };

  const combineDateTime = (date: Date, time: string): Date => {
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={requireConfirmation ? isOpen : undefined} onOpenChange={requireConfirmation ? setIsOpen : undefined}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal bg-gray-800 border-gray-600 text-white hover:bg-gray-700",
              !selectedDate && "text-gray-400"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate?.from ? (
              selectedDate.to ? (
                <>
                  {format(selectedDate.from, showTime ? "dd.MM.yyyy HH:mm" : "dd.MM.yyyy", { locale: ru })} -{" "}
                  {format(selectedDate.to, showTime ? "dd.MM.yyyy HH:mm" : "dd.MM.yyyy", { locale: ru })}
                </>
              ) : (
                format(selectedDate.from, showTime ? "dd.MM.yyyy HH:mm" : "dd.MM.yyyy", { locale: ru })
              )
            ) : (
              <span>Выберите период</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600" align="start">
          <div className="p-4">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={requireConfirmation ? tempDate?.from : selectedDate?.from}
              selected={requireConfirmation ? tempDate : selectedDate}
              onSelect={handleDateChange}
              numberOfMonths={2}
              className="text-white"
            />
            
            {showTime && (
              <div className="border-t border-gray-600 pt-4 mt-4 space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <Label className="text-sm text-white">Время</Label>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">С</Label>
                    <Input
                      type="time"
                      value={requireConfirmation ? tempFromTime : fromTime}
                      onChange={(e) => handleTimeChange('from', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">До</Label>
                    <Input
                      type="time"
                      value={requireConfirmation ? tempToTime : toTime}
                      onChange={(e) => handleTimeChange('to', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {requireConfirmation && (
              <div className="border-t border-gray-600 pt-4 mt-4 flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  Отмена
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Применить
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Компонент для быстрого выбора периодов
export function QuickDateRanges({ onDateChange }: { onDateChange: (date: DateRange | undefined) => void }) {
  const getDateRange = (days: number): DateRange => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return { from: start, to: end };
  };

  const ranges = [
    { label: "Сегодня", days: 0 },
    { label: "Последние 7 дней", days: 7 },
    { label: "Последние 30 дней", days: 30 },
    { label: "Последние 90 дней", days: 90 },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {ranges.map((range) => (
        <Button
          key={range.label}
          variant="outline"
          size="sm"
          className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 text-xs"
          onClick={() => {
          if (range.days === 0) {
            // Сегодня: с 00:00 до 23:59
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
            onDateChange({ from: startOfDay, to: endOfDay });
          } else {
            onDateChange(getDateRange(range.days));
          }
        }}
        >
          {range.label}
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 text-xs"
        onClick={() => onDateChange(undefined)}
      >
        Сбросить
      </Button>
    </div>
  );
}

// Компонент для переключения между режимами выбора времени
export function DateTimeToggle({ 
  showTime, 
  onToggle 
}: { 
  showTime: boolean; 
  onToggle: (showTime: boolean) => void; 
}) {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={!showTime ? "default" : "outline"}
        size="sm"
        onClick={() => onToggle(false)}
        className={!showTime ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-800 border-gray-600 text-white hover:bg-gray-700"}
      >
        Только дата
      </Button>
      <Button
        variant={showTime ? "default" : "outline"}
        size="sm"
        onClick={() => onToggle(true)}
        className={showTime ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-800 border-gray-600 text-white hover:bg-gray-700"}
      >
        Дата и время
      </Button>
    </div>
  );
}
