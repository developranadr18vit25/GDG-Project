function nextBackoff(attempts) {
  // 1s, 2s, 4s, 8s, ... capped at 60s
  const seconds = Math.min(60, Math.pow(2, attempts));
  return new Date(Date.now() + seconds * 1000);
}

module.exports = { nextBackoff };