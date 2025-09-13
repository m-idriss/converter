#!/bin/bash

# Deployment Troubleshooting Script
# This script helps diagnose FTP deployment issues

set -e

FTP_SERVER=${1:-$FTP_SERVER}

if [ -z "$FTP_SERVER" ]; then
    echo "❌ Usage: $0 <ftp-server-hostname>"
    echo "   or set FTP_SERVER environment variable"
    exit 1
fi

echo "🔍 Troubleshooting deployment to: $FTP_SERVER"
echo "================================================"

# Check if required tools are available
echo ""
echo "1. Checking required tools..."
for tool in nslookup dig host nc ping curl; do
    if command -v $tool >/dev/null 2>&1; then
        echo "   ✅ $tool available"
    else
        echo "   ❌ $tool not available"
    fi
done

# DNS Resolution Tests
echo ""
echo "2. DNS Resolution Tests"
echo "   Testing with system DNS..."
if timeout 10 nslookup $FTP_SERVER >/dev/null 2>&1; then
    echo "   ✅ System DNS resolution successful"
    nslookup $FTP_SERVER | grep -A 1 "Name:"
else
    echo "   ❌ System DNS resolution failed"
fi

echo "   Testing with Google DNS (8.8.8.8)..."
if timeout 10 nslookup $FTP_SERVER 8.8.8.8 >/dev/null 2>&1; then
    echo "   ✅ Google DNS resolution successful"
    nslookup $FTP_SERVER 8.8.8.8 | grep -A 1 "Name:"
else
    echo "   ❌ Google DNS resolution failed"
fi

echo "   Testing with Cloudflare DNS (1.1.1.1)..."
if timeout 10 nslookup $FTP_SERVER 1.1.1.1 >/dev/null 2>&1; then
    echo "   ✅ Cloudflare DNS resolution successful"
    nslookup $FTP_SERVER 1.1.1.1 | grep -A 1 "Name:"
else
    echo "   ❌ Cloudflare DNS resolution failed"
fi

# Network Connectivity Tests
echo ""
echo "3. Network Connectivity Tests"

# FTP Port 21
echo "   Testing FTP port 21..."
if timeout 15 nc -zv $FTP_SERVER 21 2>/dev/null; then
    echo "   ✅ FTP port 21 is accessible"
else
    echo "   ❌ FTP port 21 is not accessible"
fi

# SFTP Port 22 (alternative)
echo "   Testing SFTP port 22..."
if timeout 15 nc -zv $FTP_SERVER 22 2>/dev/null; then
    echo "   ✅ SFTP port 22 is accessible (consider using SFTP)"
else
    echo "   ❌ SFTP port 22 is not accessible"
fi

# HTTP Port 80
echo "   Testing HTTP port 80..."
if timeout 15 nc -zv $FTP_SERVER 80 2>/dev/null; then
    echo "   ✅ HTTP port 80 is accessible"
else
    echo "   ❌ HTTP port 80 is not accessible"
fi

# HTTPS Port 443
echo "   Testing HTTPS port 443..."
if timeout 15 nc -zv $FTP_SERVER 443 2>/dev/null; then
    echo "   ✅ HTTPS port 443 is accessible"
else
    echo "   ❌ HTTPS port 443 is not accessible"
fi

# Ping Test
echo ""
echo "4. Ping Test"
if timeout 15 ping -c 3 $FTP_SERVER >/dev/null 2>&1; then
    echo "   ✅ Server responds to ping"
    ping -c 3 $FTP_SERVER | tail -2
else
    echo "   ❌ Server does not respond to ping (may be normal if ICMP is blocked)"
fi

# IP Geolocation (if curl is available)
echo ""
echo "5. Network Information"
if command -v curl >/dev/null 2>&1; then
    echo "   Current public IP:"
    curl -s https://httpbin.org/ip 2>/dev/null | grep -o '"origin": "[^"]*"' | cut -d'"' -f4 || echo "   Could not determine public IP"
fi

# Recommendations
echo ""
echo "=== RECOMMENDATIONS ==="
echo ""

# Check if any connectivity worked
if timeout 10 nslookup $FTP_SERVER >/dev/null 2>&1; then
    if timeout 15 nc -zv $FTP_SERVER 21 2>/dev/null; then
        echo "✅ DNS and FTP connectivity appear to work."
        echo "   The issue might be:"
        echo "   - Authentication problems (wrong credentials)"
        echo "   - Server-side restrictions or firewall rules"
        echo "   - Temporary server issues"
        echo "   - GitHub Actions IP range restrictions"
    elif timeout 15 nc -zv $FTP_SERVER 22 2>/dev/null; then
        echo "💡 DNS works, but FTP port 21 is blocked. Consider SFTP (port 22)."
    else
        echo "❌ DNS works, but no standard ports are accessible."
        echo "   - Check firewall settings on the server"
        echo "   - Verify the server is running FTP service"
        echo "   - Check if GitHub Actions IPs are allowed"
    fi
else
    echo "❌ DNS resolution failed completely."
    echo "   - Verify the hostname is correct"
    echo "   - Check if the domain exists and DNS is configured"
    echo "   - Try using IP address instead of hostname"
fi

echo ""
echo "For GitHub Actions deployment issues:"
echo "- Ensure secrets are correctly set in repository settings"
echo "- Check GitHub Actions IP ranges: https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners#ip-addresses"
echo "- Consider using SFTP instead of FTP for better security and reliability"
echo "- Review server logs for connection attempts and error details"