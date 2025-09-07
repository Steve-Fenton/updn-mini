let StatsD = null;
let isDataDogEnabled = false;

async function initializeDataDog() {
  try {
    // Check for required environment variables
    if (!process.env.DD_API_KEY) {
      console.warn('⚠️  DD_API_KEY not set - DataDog metrics disabled')
      return false
    }

    const { default: tracer } = await import('dd-trace');
    
    // Initialize with error handling
    const tracerInstance = tracer.init({
      service: 'updn',
      env: 'production'
    });

    StatsD = tracerInstance.dogstatsd

    // Test the connection with a simple metric
    StatsD.increment('datadog.initialization', 1, ['status:success']);
    
    console.log('✅ DataDog initialized successfully');
    return true

  } catch (error) {
    console.error('❌ Failed to initialize DataDog:', error.message);
    return false
  }
}

// Initialize and store the result
isDataDogEnabled = await initializeDataDog();

/**
 * 
 * @param {string} url 
 * @param {number} daysRemaining 
 * @param {'healthy' | 'warning' | 'critical'} health 
 */
function reportCertificate(url, daysRemaining, health) {
    if (!isDataDogEnabled || !StatsD) {
      return;
    }

    const tags = [
        `domain:${url}`,
        `cert_status:${health}`
    ]

    // Stats
    StatsD.gauge('updn.certificate.days_remaining', daysRemaining, tags)
    
    // Event
    if (['warning', 'critical'].includes(health)) {
        StatsD.event(
            'Certificate Expiring Soon', 
            `Certificate for ${url} expires in ${daysRemaining} days`, 
            { alert_type: health, tags })
    }
}

/**
 * 
 * @param {string} url 
 * @param {number} responseTime 
 * @param {'healthy' | 'warning' | 'critical'} health 
 */
function reportUptime(url, responseTime, health) {
    if (!isDataDogEnabled || !StatsD) {
      return;
    }

    const tags = [
        `domain:${url}`,
        `uptime_status:${health}`
    ]

    // Stats
    StatsD.gauge('updn.uptime.response_time', responseTime, tags)
    
    // Event
    if (['warning', 'critical'].includes(health)) {
        StatsD.event(
            'Uptime Issue Detected', 
            `The website ${url} has problems ${responseTime} ms`, 
            { alert_type: health, tags })
    }
}

export { reportCertificate, reportUptime }