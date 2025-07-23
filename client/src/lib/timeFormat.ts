// Utility functions for formatting time in Russian

export function formatTimeRussian(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} сек`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes} ${getMinuteWord(minutes)}`;
    }
    return `${minutes} ${getMinuteWord(minutes)} ${remainingSeconds} сек`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    if (remainingMinutes === 0) {
      return `${hours} ${getHourWord(hours)}`;
    }
    return `${hours} ${getHourWord(hours)} ${remainingMinutes} ${getMinuteWord(remainingMinutes)}`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (remainingHours === 0) {
    return `${days} ${getDayWord(days)}`;
  }
  return `${days} ${getDayWord(days)} ${remainingHours} ${getHourWord(remainingHours)}`;
}

export function formatShortTimeRussian(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} сек`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} ${getMinuteWord(minutes)}`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${getHourWord(hours)}`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days} ${getDayWord(days)}`;
}

function getMinuteWord(minutes: number): string {
  const lastDigit = minutes % 10;
  const lastTwoDigits = minutes % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return "минут";
  }
  
  switch (lastDigit) {
    case 1:
      return "минута";
    case 2:
    case 3:
    case 4:
      return "минуты";
    default:
      return "минут";
  }
}

function getHourWord(hours: number): string {
  const lastDigit = hours % 10;
  const lastTwoDigits = hours % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return "часов";
  }
  
  switch (lastDigit) {
    case 1:
      return "час";
    case 2:
    case 3:
    case 4:
      return "часа";
    default:
      return "часов";
  }
}

function getDayWord(days: number): string {
  const lastDigit = days % 10;
  const lastTwoDigits = days % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return "дней";
  }
  
  switch (lastDigit) {
    case 1:
      return "день";
    case 2:
    case 3:
    case 4:
      return "дня";
    default:
      return "дней";
  }
}