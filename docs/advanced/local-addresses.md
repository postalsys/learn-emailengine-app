---
title: Local IP Address Binding
sidebar_position: 9
description: Configure EmailEngine to use multiple local IP addresses for outbound IMAP and SMTP connections
keywords:
  - local addresses
  - IP binding
  - multiple IPs
  - IP rotation
  - rate limiting
  - connection distribution
---

<!--
SOURCE: docs/usage/local-addresses.md
This guide covers configuring EmailEngine to bind outbound connections to specific local IP addresses.
-->

# Local IP Address Binding

If your server has multiple IP addresses or network interfaces, configure EmailEngine to use specific local addresses for outbound IMAP and SMTP connections. This helps distribute connections across IPs and avoid rate limiting.

## Overview

**Use cases:**

- **Rate limiting avoidance** - Distribute connections across multiple IPs to avoid per-IP rate limits
- **Dedicated IPs per account** - Assign specific IPs to specific accounts
- **IP reputation management** - Use clean IPs for important accounts
- **Load distribution** - Spread connection load across network interfaces
- **Compliance requirements** - Use specific IPs for regulatory compliance

EmailEngine can bind to specific local IP addresses when making outbound connections to email servers.

## Prerequisites

### 1. Multiple IP Addresses

Your server must have multiple IP addresses configured:

```bash
# Check available IP addresses
ip addr show

# Example output:
# eth0: inet 192.168.1.100/24
# eth0:0: inet 192.168.1.101/24
# eth0:1: inet 192.168.1.102/24
```

### 2. Network Configuration

Ensure IPs are properly configured and routable:

```bash
# Test connectivity from specific IP
curl --interface 192.168.1.101 https://www.google.com
```

### 3. Firewall Rules

Allow outbound connections from all configured IPs:

```bash
# Example iptables rules
iptables -A OUTPUT -s 192.168.1.100 -j ACCEPT
iptables -A OUTPUT -s 192.168.1.101 -j ACCEPT
iptables -A OUTPUT -s 192.168.1.102 -j ACCEPT
```

## Configuration Methods

### Method 1: Account-Level Configuration

Specify local address per account:

```bash
curl -XPOST "http://localhost:3000/v1/account" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "account": "john@example.com",
    "name": "John Doe",
    "email": "john@example.com",
    "imap": {
      "host": "imap.example.com",
      "port": 993,
      "secure": true,
      "auth": {
        "user": "john@example.com",
        "pass": "password123"
      },
      "localAddress": "192.168.1.101"
    },
    "smtp": {
      "host": "smtp.example.com",
      "port": 587,
      "secure": false,
      "auth": {
        "user": "john@example.com",
        "pass": "password123"
      },
      "localAddress": "192.168.1.101"
    }
  }'
```

**Key fields:**
- `imap.localAddress` - IP for IMAP connections
- `smtp.localAddress` - IP for SMTP connections

### Method 2: Global Default

Set default local address for all accounts:

```bash
# Environment variable
EENGINE_LOCAL_ADDRESS=192.168.1.100 node server.js
```

Accounts without explicit `localAddress` will use this default.

### Method 3: Multiple IPs with Round-Robin

Distribute accounts across multiple IPs:

```javascript
const localAddresses = [
  '192.168.1.100',
  '192.168.1.101',
  '192.168.1.102'
];

let currentIndex = 0;

async function registerAccount(email, password) {
  // Round-robin IP selection
  const localAddress = localAddresses[currentIndex];
  currentIndex = (currentIndex + 1) % localAddresses.length;

  const response = await fetch('http://localhost:3000/v1/account', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      account: email,
      name: email,
      email,
      imap: {
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: { user: email, pass: password },
        localAddress  // Assign IP
      },
      smtp: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: email, pass: password },
        localAddress  // Assign IP
      }
    })
  });

  return response.json();
}
```

### Method 4: Provider-Specific IPs

Assign IPs based on email provider:

```javascript
function getLocalAddressForProvider(email) {
  const domain = email.split('@')[1].toLowerCase();

  const ipMap = {
    'gmail.com': '192.168.1.100',
    'outlook.com': '192.168.1.101',
    'yahoo.com': '192.168.1.102'
  };

  return ipMap[domain] || '192.168.1.100'; // Default IP
}

async function registerAccountWithProviderIP(email, password) {
  const localAddress = getLocalAddressForProvider(email);

  // Register account with assigned IP
  await registerAccount(email, password, localAddress);
}
```

## Use Cases

### 1. Avoiding Gmail Rate Limits

Gmail limits IMAP connections per IP (typically 15 concurrent connections). Distribute accounts across IPs:

```javascript
// Split 100 Gmail accounts across 10 IPs (10 accounts per IP)
const IPS_PER_ACCOUNT_COUNT = 10;

function assignIP(accountIndex) {
  const ipSuffix = 100 + Math.floor(accountIndex / IPS_PER_ACCOUNT_COUNT);
  return `192.168.1.${ipSuffix}`;
}

for (let i = 0; i < gmailAccounts.length; i++) {
  const account = gmailAccounts[i];
  const localAddress = assignIP(i);

  await registerAccount(account.email, account.password, localAddress);
}
```

### 2. Dedicated IPs for VIP Accounts

Assign clean, dedicated IPs to important accounts:

```javascript
const vipAccounts = [
  'ceo@company.com',
  'sales@company.com'
];

const vipIP = '192.168.1.200'; // Dedicated clean IP
const regularIP = '192.168.1.100'; // Shared IP

function getIPForAccount(email) {
  return vipAccounts.includes(email) ? vipIP : regularIP;
}
```

### 3. IP Rotation for High Volume

Rotate IPs for accounts sending high volumes:

```javascript
class IPRotator {
  constructor(ipPool) {
    this.ipPool = ipPool;
    this.usageCount = new Map();

    // Initialize usage tracking
    ipPool.forEach(ip => this.usageCount.set(ip, 0));
  }

  // Get least-used IP
  getLeastUsedIP() {
    let minIP = this.ipPool[0];
    let minCount = this.usageCount.get(minIP);

    for (const ip of this.ipPool) {
      const count = this.usageCount.get(ip);
      if (count < minCount) {
        minIP = ip;
        minCount = count;
      }
    }

    this.usageCount.set(minIP, minCount + 1);
    return minIP;
  }

  // Release IP (when account disconnects)
  releaseIP(ip) {
    const count = this.usageCount.get(ip) || 0;
    this.usageCount.set(ip, Math.max(0, count - 1));
  }
}

const rotator = new IPRotator([
  '192.168.1.100',
  '192.168.1.101',
  '192.168.1.102',
  '192.168.1.103'
]);

// Assign IP to new account
const localAddress = rotator.getLeastUsedIP();
```

### 4. Separate IPs for Sending and Receiving

Use different IPs for IMAP vs SMTP:

```javascript
const RECEIVING_IP = '192.168.1.100'; // For IMAP
const SENDING_IP = '192.168.1.200';   // For SMTP

async function registerAccount(email, password) {
  await fetch('http://localhost:3000/v1/account', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      account: email,
      email,
      imap: {
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: { user: email, pass: password },
        localAddress: RECEIVING_IP
      },
      smtp: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: email, pass: password },
        localAddress: SENDING_IP
      }
    })
  });
}
```

## Verifying Configuration

### Check Account Configuration

Verify local address is set:

```bash
curl "http://localhost:3000/v1/account/john@example.com" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq '.imap.localAddress, .smtp.localAddress'
```

Expected output:

```json
"192.168.1.101"
"192.168.1.101"
```

### Test Connectivity

Verify EmailEngine can connect using the specified IP:

```bash
# Check IMAP connection
telnet --bind-address 192.168.1.101 imap.gmail.com 993

# Check SMTP connection
telnet --bind-address 192.168.1.101 smtp.gmail.com 587
```

### Monitor Active Connections

Check which IPs are being used:

```bash
# View active connections
netstat -an | grep ESTABLISHED | grep 993  # IMAP
netstat -an | grep ESTABLISHED | grep 587  # SMTP

# Count connections per local IP
netstat -an | grep ESTABLISHED | grep 993 | awk '{print $4}' | cut -d: -f1 | sort | uniq -c
```

### EmailEngine Logs

Check logs for connection info:

```bash
# View connection logs
tail -f logs/emailengine.log | grep "localAddress"

# Check for connection errors
tail -f logs/emailengine.log | grep -i "bind\|connect"
```

## Updating Local Address

Update local address for existing account:

```bash
curl -XPUT "http://localhost:3000/v1/account/john@example.com" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "imap": {
      "localAddress": "192.168.1.102"
    },
    "smtp": {
      "localAddress": "192.168.1.102"
    }
  }'
```

EmailEngine will reconnect using the new IP address.

## Advanced: Dynamic IP Assignment

Automatically assign IPs based on current load:

```javascript
class DynamicIPAssigner {
  constructor(ipPool) {
    this.ipPool = ipPool;
    this.activeConnections = new Map();

    ipPool.forEach(ip => this.activeConnections.set(ip, 0));
  }

  async getOptimalIP(provider) {
    // Get connection limits for provider
    const limits = {
      'gmail.com': 15,
      'outlook.com': 10,
      'yahoo.com': 10
    };

    const maxConnections = limits[provider] || 10;

    // Find IP with room for more connections
    for (const ip of this.ipPool) {
      const connections = this.activeConnections.get(ip);

      if (connections < maxConnections) {
        this.activeConnections.set(ip, connections + 1);
        return ip;
      }
    }

    // All IPs at capacity, use least loaded
    const [ip] = [...this.activeConnections.entries()]
      .sort((a, b) => a[1] - b[1])[0];

    this.activeConnections.set(ip, this.activeConnections.get(ip) + 1);
    return ip;
  }

  releaseIP(ip) {
    const count = this.activeConnections.get(ip) || 0;
    this.activeConnections.set(ip, Math.max(0, count - 1));
  }

  getStats() {
    return Object.fromEntries(this.activeConnections);
  }
}

const assigner = new DynamicIPAssigner([
  '192.168.1.100',
  '192.168.1.101',
  '192.168.1.102'
]);

async function registerAccountDynamic(email, password) {
  const provider = email.split('@')[1];
  const localAddress = await assigner.getOptimalIP(provider);

  console.log(`Assigning ${email} to ${localAddress}`);
  console.log('Current IP stats:', assigner.getStats());

  await registerAccount(email, password, localAddress);
}
```

## Best Practices

### 1. Monitor IP Usage

Track connections per IP to avoid overloading:

```javascript
async function getIPUsageStats() {
  const accounts = await fetchAllAccounts();

  const ipStats = {};

  for (const account of accounts) {
    const ip = account.imap.localAddress || 'default';
    ipStats[ip] = (ipStats[ip] || 0) + 1;
  }

  return ipStats;
}

// Alert if IP overloaded
const stats = await getIPUsageStats();
for (const [ip, count] of Object.entries(stats)) {
  if (count > 15) {  // Gmail limit
    console.warn(`IP ${ip} has ${count} accounts (limit: 15)`);
  }
}
```

### 2. Test IP Reachability

Verify IPs can reach email servers:

```javascript
const net = require('net');

function testIPConnectivity(localAddress, host, port) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({
      host,
      port,
      localAddress
    });

    socket.on('connect', () => {
      socket.end();
      resolve(true);
    });

    socket.on('error', (err) => {
      reject(err);
    });

    setTimeout(() => {
      socket.destroy();
      reject(new Error('Timeout'));
    }, 5000);
  });
}

// Test before assigning
try {
  await testIPConnectivity('192.168.1.101', 'imap.gmail.com', 993);
  console.log('IP is reachable');
} catch (err) {
  console.error('IP cannot reach Gmail:', err.message);
}
```

### 3. Document IP Assignments

Keep track of which IPs are used for what:

```javascript
const ipRegistry = {
  '192.168.1.100': {
    purpose: 'Gmail accounts - batch 1',
    accounts: [],
    limit: 15
  },
  '192.168.1.101': {
    purpose: 'Gmail accounts - batch 2',
    accounts: [],
    limit: 15
  },
  '192.168.1.102': {
    purpose: 'Outlook/Yahoo accounts',
    accounts: [],
    limit: 10
  }
};
```

### 4. Handle IP Failures

Implement fallback logic:

```javascript
async function registerAccountWithFallback(email, password, preferredIP) {
  try {
    await registerAccount(email, password, preferredIP);
  } catch (err) {
    console.error(`Failed with IP ${preferredIP}, trying fallback`);

    // Try without local address binding
    await registerAccount(email, password, null);
  }
}
```

### 5. Rotate IPs Periodically

Change IPs occasionally to maintain clean reputation:

```javascript
// Monthly IP rotation
cron.schedule('0 0 1 * *', async () => {
  const accounts = await fetchAllAccounts();

  for (const account of accounts) {
    const newIP = getNextAvailableIP();

    await updateAccountIP(account.id, newIP);

    console.log(`Rotated ${account.email} to ${newIP}`);

    // Delay between updates
    await sleep(1000);
  }
});
```

## Troubleshooting

### Connection Fails with Local Address

**Check IP is configured:**

```bash
ip addr show | grep 192.168.1.101
```

**Test connectivity:**

```bash
curl --interface 192.168.1.101 https://imap.gmail.com
```

**Check routing:**

```bash
ip route get 8.8.8.8 from 192.168.1.101
```

### "Address already in use" Error

Too many connections from same IP:

```bash
# Check connection count
netstat -an | grep 192.168.1.101 | grep ESTABLISHED | wc -l
```

**Solution:** Use additional IPs or reduce accounts per IP.

### IP Blocked by Provider

Provider may have blocked the IP:

```bash
# Test from command line
telnet --bind-address 192.168.1.101 imap.gmail.com 993
```

**Solution:** Use different IP or contact provider.

### Firewall Blocking Outbound

Check firewall rules:

```bash
# Check iptables
iptables -L OUTPUT -n -v | grep 192.168.1.101

# Test with firewall temporarily disabled (careful!)
# iptables -F OUTPUT  # Flush rules (TESTING ONLY)
```

## Performance Considerations

### Connection Overhead

Each IP adds slight overhead:

- DNS lookups
- TCP handshakes
- TLS negotiations

**Impact:** Minimal (less than 100ms per connection)

### Memory Usage

Multiple IPs don't significantly increase memory:

- ~1MB per account regardless of IP
- IP binding is just a socket option

### Throughput

Properly distributed IPs can improve throughput:

- Avoid per-IP rate limits
- Parallel connections across IPs
- Better load distribution

## Security Considerations

### IP Reputation

- **Clean IPs** - Don't use IPs previously used for spam
- **Monitor blacklists** - Check IPs aren't listed
- **Separate sending IPs** - Use different IPs for bulk sending

### Access Control

Restrict which applications can bind to IPs:

```bash
# Firewall rules
iptables -A OUTPUT -m owner --uid-owner emailengine -s 192.168.1.101 -j ACCEPT
iptables -A OUTPUT -s 192.168.1.101 -j REJECT
```

### Logging

Log IP assignments for audit trails:

```javascript
console.log(`Account ${email} assigned to IP ${localAddress}`);
```

## Next Steps

- Configure [Performance Tuning](/docs/advanced/performance-tuning) to optimize connection handling
- Set up [Monitoring](/docs/advanced/monitoring) to track IP usage
- Implement [Delivery Testing](/docs/advanced/delivery-testing) with different IPs
- Review [Security Best Practices](/docs/deployment/security)

## Related Resources

- [Node.js net.Socket localAddress](https://nodejs.org/api/net.html#socketlocaladdress)
- [Linux IP Configuration](https://linux.die.net/man/8/ip)
- [IMAP Connection Limits by Provider](https://support.google.com/mail/answer/7126229)
