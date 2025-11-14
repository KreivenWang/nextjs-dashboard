// 日志记录函数，包含时间戳前缀，支持多个参数
function log(...messages: any[]): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...messages);
}

// 可选：不同级别的日志函数
function info(...messages: any[]): void {
  const timestamp = new Date().toISOString();
  console.log(`[INFO ${timestamp}]`, ...messages);
}

function warn(...messages: any[]): void {
  const timestamp = new Date().toISOString();
  console.warn(`[WARN ${timestamp}]`, ...messages);
}

function error(...messages: any[]): void {
  const timestamp = new Date().toISOString();
  console.error(`[ERROR ${timestamp}]`, ...messages);
}

const logger = {
  log,
  info,
  warn,
  error,
};

export default logger;
