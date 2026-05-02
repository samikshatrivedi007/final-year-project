/**
 * Converts a time string "HH:MM" to total minutes since midnight.
 */
export const timeToMinutes = (timeStr: string): number => {
    const [time, period] = timeStr.trim().split(/\s+/);
    let [hours, minutes] = time.split(':').map(Number);

    if (period) {
        if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }
    return hours * 60 + minutes;
};

/**
 * Checks if the current time matches the scheduled day and falls between startTime and endTime.
 */
export const isClassActive = (dayOfWeek: string, startTimeStr: string, endTimeStr: string): boolean => {
    const now = new Date();

    // Check day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (days[now.getDay()] !== dayOfWeek) return false;

    // Check time bounds
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMins = timeToMinutes(startTimeStr);
    const endMins = timeToMinutes(endTimeStr);

    return currentMinutes >= startMins && currentMinutes < endMins; // Exclusive of exact end minute
};

/**
 * Returns 'upcoming', 'active', or 'completed' based on current time.
 */
export const getClassStatus = (dayOfWeek: string, startTimeStr: string, endTimeStr: string): 'upcoming' | 'active' | 'completed' => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const dayIndex = days.indexOf(dayOfWeek);
    const todayIndex = now.getDay();

    // Timetable is weekly/recurring — if not today, treat as upcoming (not completed)
    if (dayIndex !== todayIndex) return 'upcoming';

    // Same day — check time window
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMins = timeToMinutes(startTimeStr);
    const endMins = timeToMinutes(endTimeStr);

    if (currentMinutes < startMins) return 'upcoming';
    if (currentMinutes >= endMins) return 'completed';
    return 'active';
};
