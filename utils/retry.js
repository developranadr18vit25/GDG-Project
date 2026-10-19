function nextBackoff(attempts) {

  const seconds = Math.min(60, Math.pow(2, attempts));
  
  return new Date(Date.now() + seconds * 1000);
}

module.exports = { nextBackoff };