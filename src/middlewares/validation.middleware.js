const validateOrder = (req, res, next) => {
  const { customer, items } = req.body;

  if (!customer) {
    return res.status(400).json({ success: false, message: 'Customer information is required.' });
  }

  const { name, phone, address, city } = customer;
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Please provide a valid full name.' });
  }

  if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
    return res.status(400).json({ success: false, message: 'Please provide a valid contact phone number.' });
  }

  if (!address || typeof address !== 'string' || address.trim().length < 5) {
    return res.status(400).json({ success: false, message: 'Please provide a valid street address.' });
  }

  if (!city || typeof city !== 'string' || city.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Please provide a delivery city or town.' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart items cannot be empty.' });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }
  next();
};

const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Please provide a valid name.' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }
  next();
};

module.exports = {
  validateOrder,
  validateLogin,
  validateRegister
};
