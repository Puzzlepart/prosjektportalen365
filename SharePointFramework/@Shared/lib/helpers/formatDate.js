export default function (dateStr) {
    return new Date(dateStr).toLocaleString("nb-NO", {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};
//# sourceMappingURL=formatDate.js.map