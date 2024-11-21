export const formatDateForMySQL = (date: string | Date): string => {
  return new Date(date)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');
};

export const formatDateForInput = (date: string | Date): string => {
  return new Date(date).toISOString().slice(0, 16);
};