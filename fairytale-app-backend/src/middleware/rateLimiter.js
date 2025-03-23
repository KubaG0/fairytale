const rateLimit = (maxRequests, timeWindow) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    // Usuń stare requesty
    if (requests.has(ip)) {
      const userRequests = requests.get(ip);
      const filteredRequests = userRequests.filter(timestamp => {
        return now - timestamp < timeWindow * 1000;
      });
      
      requests.set(ip, filteredRequests);
      
      if (filteredRequests.length >= maxRequests) {
        return res.status(429).json({
          success: false,
          message: 'Zbyt wiele żądań, proszę spróbować ponownie później'
        });
      }
      
      userRequests.push(now);
    } else {
      requests.set(ip, [now]);
    }
    
    next();
  };
};

module.exports = {
  apiLimiter: rateLimit(100, 60 * 15), // 100 requestów na 15 minut
  authLimiter: rateLimit(10, 60 * 10) // 10 prób na 10 minut dla endpointów autoryzacji
};