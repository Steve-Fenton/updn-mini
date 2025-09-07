# UpDn Mini

![UpDn](updn.png)

A Node.js CLI that runs uptime and certificate checks.

## Quick start

Run the command, passing the address of your configuration, which can be local or a publicly accessible URL.

Example with local configuration:

```bash
updn -config ./config.json
```

Example with remote configuration:

```bash
updn -config https://example.com/config.json
```

## Configuration

The configuration only needs to be available when the process starts. If you change the config, you need to restart the process.

### Throttling

There are two throttling levers you can pull to make sure you don't DDoS yourself with UpDn. There is a pause between individual checks, and then a longer pause between runs.

For example, you have 5 uptime checks. The `delay` (typically 1s) will be used in between each of these checks. Once all 5 are complete, the `delayAfter.uptime` wait (typically 60s) occurs.

Example configuration:

```json
{
    "delay": 1000,
    "delayAfter": {
        "uptime": 60000,
        "certificate": 28800000
    }
}
```

- 1000 (1 second) between checks
- 60000 (1 minute) between uptime runs
- 28800000 (8 hours) between certificate checks

### Certificate checks

- `type`: Always `certificate`
- `url`: The url of the website, such as `https://example.com`
- `minDaysRemaining` (optional, default `30`): The minimum time left on the certificate in days, such as `30`

```json
{
    "checks": [
        {
            "type": ["certificate"],
            "url": "https://example.com",
            "minDaysRemaining": 30
        }
    ]
}
```

### Uptime checks

- `type`: Always `uptime`
- `url`: The exact page you want to check, like `https://example.com` or `https://example.com/your-page.html`

```json
{
    "checks": [
        {
            "type": ["uptime"],
            "url": "https://example.com"
        }
    ]
}
```

### Combined checks

You can combine check types by specifying them all in the `type` configuration.

```json
{
    "checks": [
        {
            "type": ["certificate", "uptime"],
            "url": "https://example.com"
        }
    ]
}
```

## Reporters

### Datadog

Before starting UpDn, you can set up environment variables for your Datadog configuration.

```bash
export DD_API_KEY="your-api-key-here"
export DD_SITE="datadoghq.com"  # or datadoghq.eu, us3.datadoghq.com, etc.
```

You can then pass `"datadog"` as the reporter in your JSON configuration.

```json
{
    "reporter": "datadog"
}
```

## Local testing

Set up using the following command (you may need to `sudo`)

```bash
npm link
```

Now you can use the command globally, there's a test config file in the repo that checks against example domains.

```bash
updn -config ./config.json
```

You can clean up using:

```bash
npm unlink -g updn
```
