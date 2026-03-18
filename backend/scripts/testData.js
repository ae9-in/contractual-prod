function makeTestPhone(seed = Date.now()) {
  const suffix = String(Math.abs(Number(seed) || Date.now())).slice(-9).padStart(9, '0');
  return `9${suffix}`;
}

function makeRegisterPayload({ name, email, password, role, seed = Date.now() }) {
  return {
    name,
    email,
    password,
    role,
    contactPhone: makeTestPhone(seed),
  };
}

module.exports = {
  makeTestPhone,
  makeRegisterPayload,
};

