# SafeWork Pro - Uptime Monitoring Configuration

**Last Updated**: September 30, 2025  
**Version**: 1.0  
**Owner**: Development Team  

## Overview

This document provides configuration instructions for setting up comprehensive uptime monitoring for the SafeWork Pro application using external monitoring services.

## Health Check Endpoints

### Primary Health Check
- **URL**: `https://your-domain.com/api/health`
- **Method**: GET
- **Expected Response**: HTTP 200 with JSON health status
- **Timeout**: 30 seconds
- **Check Interval**: 5 minutes

### Simple Ping Check
- **URL**: `https://your-domain.com/api/health`
- **Method**: HEAD
- **Expected Response**: HTTP 200
- **Timeout**: 10 seconds
- **Check Interval**: 1 minute

## Recommended Monitoring Services

### 1. UptimeRobot (Recommended - Free Tier Available)

**Setup Instructions:**
1. Create account at https://uptimerobot.com
2. Add monitors for the following endpoints:
   - **Main Health Check**: `https://your-domain.com/api/health`
   - **Homepage**: `https://your-domain.com/`
   - **Auth Login**: `https://your-domain.com/auth/login`
   - **API Base**: `https://your-domain.com/api/health` (HEAD request)

**Configuration:**
```json
{
  "monitors": [
    {
      "name": "SafeWork Pro - Health Check",
      "url": "https://your-domain.com/api/health",
      "type": "HTTP",
      "method": "GET",
      "interval": 300,
      "timeout": 30,
      "expected_status": 200,
      "keyword_monitoring": "healthy"
    },
    {
      "name": "SafeWork Pro - Homepage",
      "url": "https://your-domain.com/",
      "type": "HTTP",
      "method": "GET", 
      "interval": 300,
      "timeout": 30,
      "expected_status": 200,
      "keyword_monitoring": "SafeWork Pro"
    },
    {
      "name": "SafeWork Pro - Auth System",
      "url": "https://your-domain.com/auth/login",
      "type": "HTTP",
      "method": "GET",
      "interval": 600,
      "timeout": 30,
      "expected_status": 200
    }
  ]
}
```

### 2. Pingdom (Alternative)

**Setup Instructions:**
1. Create account at https://www.pingdom.com
2. Configure HTTP checks for critical endpoints
3. Set up SMS and email alerts

### 3. StatusCake (Alternative)

**Setup Instructions:**
1. Create account at https://www.statuscake.com
2. Add uptime tests for main endpoints
3. Configure alert notifications

## Monitoring Endpoints

### Critical Endpoints (Check every 5 minutes)
1. **Health Check API**: `/api/health`
   - Tests: Application health, database connectivity, service status
   - Expected: HTTP 200 with `"status": "healthy"`

2. **Homepage**: `/`
   - Tests: Frontend application availability
   - Expected: HTTP 200 with "SafeWork Pro" content

3. **Authentication System**: `/auth/login`
   - Tests: Auth system availability
   - Expected: HTTP 200 with login form

### Secondary Endpoints (Check every 10 minutes)
1. **TRA Dashboard**: `/tras`
   - Tests: Main application functionality
   - Expected: HTTP 200 (may require authentication)

2. **API Authentication**: `/api/auth/me`
   - Tests: API layer functionality
   - Expected: HTTP 401 (requires auth token)

## Alert Configuration

### Alert Conditions
- **Down**: Service unreachable for 2 consecutive checks (10 minutes)
- **Slow Response**: Response time > 5 seconds for 3 consecutive checks
- **High Error Rate**: >5% of requests returning 5xx errors over 15 minutes

### Notification Channels
1. **Email**: Primary notification method
   - **Recipients**: `alerts@safeworkpro.com`, `dev@safeworkpro.com`
   - **Immediate**: For critical service outages
   - **Digest**: Daily summary for performance issues

2. **SMS**: For critical outages only
   - **Recipients**: On-call developer phone
   - **Conditions**: Service down >15 minutes

3. **Slack** (Optional):
   - **Channel**: `#alerts` 
   - **Webhook**: To be configured
   - **All alerts**: Both up/down notifications

### Escalation Policy
1. **Immediate** (0-5 minutes): Email notification
2. **Escalation 1** (5-15 minutes): Additional email to team lead
3. **Escalation 2** (15+ minutes): SMS notification to on-call developer

## Health Check Response Format

### Healthy Response (HTTP 200)
```json
{
  "status": "healthy",
  "timestamp": "2025-09-30T14:19:35.000Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "authentication": "operational", 
    "storage": "available"
  },
  "uptime": 3600,
  "environment": "production"
}
```

### Unhealthy Response (HTTP 503)
```json
{
  "status": "unhealthy",
  "timestamp": "2025-09-30T14:19:35.000Z",
  "version": "1.0.0",
  "services": {
    "database": "error",
    "authentication": "down",
    "storage": "error"
  },
  "uptime": 3600,
  "environment": "production",
  "error": "Database connection failed"
}
```

## Monitoring Dashboard

### Key Metrics to Track
1. **Uptime Percentage**: Target >99.9% monthly
2. **Average Response Time**: Target <2 seconds
3. **Error Rate**: Target <0.1% of requests
4. **Geographic Performance**: Monitor from multiple locations

### Status Page (Future Enhancement)
- **Public Status Page**: Consider StatusPage.io or similar
- **Components**: 
  - Web Application
  - API Services  
  - Authentication System
  - File Storage
  - Database

## Implementation Checklist

### Immediate Setup (Free Tier)
- [ ] Create UptimeRobot account
- [ ] Configure health check monitor
- [ ] Configure homepage monitor  
- [ ] Set up email notifications
- [ ] Test alert system

### Production Setup
- [ ] Upgrade to paid tier if needed (for SMS alerts)
- [ ] Configure multiple geographic locations
- [ ] Set up SMS notifications for critical alerts
- [ ] Configure Slack integration
- [ ] Create monitoring dashboard

### Advanced Setup (Future)
- [ ] Implement public status page
- [ ] Add API endpoint monitoring
- [ ] Configure synthetic transaction monitoring
- [ ] Set up performance regression alerts

## Cost Considerations

### UptimeRobot Pricing
- **Free Tier**: 50 monitors, 5-minute intervals, email alerts
- **Pro Tier** ($7/month): 1-minute intervals, SMS alerts, more locations
- **Business Tier** ($30/month): Advanced features, priority support

### Recommended Tier
- **Start**: Free tier for initial setup
- **Production**: Pro tier for SMS alerts and faster check intervals

## Maintenance

### Weekly Tasks
- [ ] Review uptime statistics
- [ ] Check alert effectiveness
- [ ] Verify all monitors are functioning

### Monthly Tasks  
- [ ] Review and update alert thresholds
- [ ] Analyze performance trends
- [ ] Update monitor configurations if needed

### Quarterly Tasks
- [ ] Review monitoring service costs vs. value
- [ ] Evaluate alternative monitoring solutions
- [ ] Update escalation policies and contact information

## Integration with Other Systems

### Sentry Integration
- Uptime issues automatically create Sentry incidents
- Correlation between errors and uptime events

### Vercel Integration
- Vercel deployment status affects uptime monitoring
- Failed deployments trigger additional monitoring

### Team Communication
- Slack/Teams integration for real-time notifications
- Integration with incident management tools

## Security Considerations

### Monitoring Security
- Health check endpoint is public (no sensitive data)
- Authentication endpoints monitored but don't expose credentials
- Monitor configuration stored securely

### Access Control
- Monitoring dashboard access restricted to development team
- Alert configuration requires admin privileges
- API keys for monitoring services stored securely

---

## Quick Start Guide

1. **Create UptimeRobot Account**: Visit https://uptimerobot.com
2. **Add Health Check Monitor**:
   - URL: `https://your-domain.com/api/health`
   - Type: HTTP(s)
   - Monitoring interval: 5 minutes
   - Keyword monitoring: "healthy"
3. **Add Homepage Monitor**:
   - URL: `https://your-domain.com/`
   - Type: HTTP(s)  
   - Monitoring interval: 5 minutes
4. **Configure Alerts**:
   - Email: Your development team email
   - Down: After 2 failed attempts (10 minutes)
   - Up: Immediate notification when service recovers
5. **Test Configuration**: Use "Test Monitor" feature to verify setup

**Next Steps**: After production deployment, update URLs from localhost to production domain and enable SMS alerts for critical issues.