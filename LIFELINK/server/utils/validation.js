const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePhone = (phone) => {
  const re = /^\d{10}$/;
  return re.test(phone);
};

const validateBloodGroup = (bloodGroup) => {
  const validGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  return validGroups.includes(bloodGroup);
};

const validateDonationEligibility = (age, weight, hasSurgery, hasIllness) => {
  if (age < 18 || age > 60) {
    return { eligible: false, reason: "Age must be between 18 and 60 years" };
  }
  if (weight < 50) {
    return { eligible: false, reason: "Weight must be greater than 50kg" };
  }
  if (hasSurgery) {
    return { eligible: false, reason: "Recent surgery detected" };
  }
  if (hasIllness) {
    return { eligible: false, reason: "Serious illness detected" };
  }
  return { eligible: true, reason: "Eligible to donate" };
};

module.exports = {
  validateEmail,
  validatePhone,
  validateBloodGroup,
  validateDonationEligibility,
};
