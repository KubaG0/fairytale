const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validatePassword = (password) => {
  // Minimum 8 znaków, co najmniej jedna litera i jedna cyfra
  const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  return regex.test(password);
};

const validateFairytaleInput = (data) => {
  const { description, characters, duration } = data;
  
  if (!description || description.trim() === '') {
    return { isValid: false, message: 'Opis bajki jest wymagany' };
  }
  
  if (!characters || characters.trim() === '') {
    return { isValid: false, message: 'Bohaterowie są wymagani' };
  }
  
  if (!duration || isNaN(duration) || duration < 10 || duration > 180) {
    return { isValid: false, message: 'Czas trwania musi wynosić od 10 do 180 sekund' };
  }
  
  return { isValid: true };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateFairytaleInput
};