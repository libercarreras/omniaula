import { useState, useCallback } from "react";

export function useDateSelector() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const todayISO = new Date().toISOString().split("T")[0];
  const selectedDateISO = selectedDate.toISOString().split("T")[0];
  const daysDiff = Math.floor((Date.now() - selectedDate.getTime()) / 86400000);
  const isReadonly = daysDiff > 7;
  const isPastDate = selectedDateISO !== todayISO;

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  return { selectedDate, selectedDateISO, todayISO, isReadonly, isPastDate, handleDateChange };
}
