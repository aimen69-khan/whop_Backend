const services = new Set([
  "Roof inspection",
  "Roof repair",
  "Roof replacement",
  "Storm damage",
  "Other"
]);

function clean(value, max = 500) {
  return String(value ?? "").trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").slice(0, max);
}

function validateLead(body = {}) {
  const lead = {
    name: clean(body.name, 100),
    email: clean(body.email, 160).toLowerCase(),
    phone: clean(body.phone, 40),
    zip: clean(body.zip, 20),
    service: clean(body.service, 50),
    details: clean(body.details, 2000)
  };

  const errors = [];
  if (lead.name.length < 2) errors.push("Name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) errors.push("A valid email is required.");
  if (lead.phone.length < 7) errors.push("A valid phone number is required.");
  if (!/^[A-Za-z0-9 -]{3,20}$/.test(lead.zip)) errors.push("A valid ZIP/postal code is required.");
  if (!services.has(lead.service)) errors.push("Invalid service selected.");

  return { lead, errors };
}

module.exports = { validateLead, services };