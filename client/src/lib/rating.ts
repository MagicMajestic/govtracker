// Unified rating system for all components
export function getRatingText(score: number): string {
  if (score >= 50) return "Великолепно";
  if (score >= 35) return "Хорошо";
  if (score >= 20) return "Нормально";
  if (score >= 10) return "Плохо";
  return "Ужасно";
}

export function getRatingColor(score: number): string {
  if (score >= 50) return "bg-green-500";
  if (score >= 35) return "bg-blue-500";
  if (score >= 20) return "bg-yellow-500";
  if (score >= 10) return "bg-orange-500";
  return "bg-red-500";
}

// Convert activity count to status for backward compatibility
export function getActivityStatusText(totalActivities: number): string {
  if (totalActivities >= 25) return "Отличная активность";
  if (totalActivities >= 15) return "Хорошая активность";
  if (totalActivities >= 5) return "Нормальная активность";
  return "Низкая активность";
}

export function getActivityStatusColor(totalActivities: number): string {
  if (totalActivities >= 25) return "bg-green-500";
  if (totalActivities >= 15) return "bg-blue-500";
  if (totalActivities >= 5) return "bg-yellow-500";
  return "bg-red-500";
}