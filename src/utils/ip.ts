export const getCurrentIp = async (): Promise<string> => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get current IP:', error);
    return '';
  }
};
