export const timeToMinutes = (timeStr: string): number => {
    const [time, period] = timeStr.trim().split(/\s+/);
    let [hours, minutes] = time.split(':').map(Number);

    if (period) {
        if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }
    return hours * 60 + minutes;
};

export const isClassActive = (dayOfWeek: string, startTimeStr: string, endTimeStr: string): boolean => {
    const now = new Date();
    // Use local time for the check, or consider that the server should operate in the same timezone as the college.
    // Assuming the college operations are in the system's local timezone.
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (days[now.getDay()] !== dayOfWeek) return false;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMins = timeToMinutes(startTimeStr);
    const endMins = timeToMinutes(endTimeStr);

    return currentMinutes >= startMins && currentMinutes < endMins;
};
