const log = (...messages) => {
    const timestamp = new Date().toISOString(); // Gets ISO string (YYYY-MM-DDTHH:MM:SS.sssZ)
    const timezoneOffset = new Date().getTimezoneOffset() * -1; // Get timezone offset in minutes

    const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
    const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
    const offsetSign = timezoneOffset >= 0 ? '+' : '-';

    const formattedOffset = `${offsetSign}${offsetHours}:${offsetMinutes}`;
    const formattedTimestamp = timestamp.replace('Z', formattedOffset);

    // Join all messages into a single string
    console.log(`${formattedTimestamp} ${messages.join(' ')}`);
};

module.exports = { log };

